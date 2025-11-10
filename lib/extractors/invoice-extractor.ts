import * as cheerio from 'cheerio';
import { ExtractionResult, ExtractedInvoiceData, InvoiceItem } from '@/types/data';

/**
 * Extracts invoice data from HTML invoice files
 * Handles Greek characters (UTF-8) and calculates totals
 */
export function extractInvoiceData({
  htmlContent,
  sourceFile,
}: {
  htmlContent: string;
  sourceFile: string;
}): ExtractionResult<ExtractedInvoiceData> {
  const warnings: string[] = [];

  try {
    const $ = cheerio.load(htmlContent);

    // Extract invoice number
    const invoiceNumber = extractInvoiceNumber($);
    if (!invoiceNumber) {
      warnings.push('Invoice number not found');
    }

    // Extract date
    const date = extractInvoiceDate($);
    if (!date) {
      warnings.push('Invoice date not found');
    }

    // Extract customer information
    const customerInfo = extractCustomerInfo($);
    if (!customerInfo.customerName) {
      warnings.push('Customer name not found');
    }

    // Extract payment method
    const paymentMethod = extractPaymentMethod($);

    // Extract line items
    const items = extractLineItems($);
    if (items.length === 0) {
      warnings.push('No line items found in invoice');
    }

    // Extract financial totals
    const financials = extractFinancialTotals($);
    
    // Validate VAT calculation
    if (financials.netAmount && financials.vatAmount) {
      const expectedVat = financials.netAmount * (financials.vatRate / 100);
      const vatDifference = Math.abs(expectedVat - financials.vatAmount);
      if (vatDifference > 0.5) {
        warnings.push(`VAT calculation mismatch: expected €${expectedVat.toFixed(2)}, found €${financials.vatAmount.toFixed(2)}`);
      }
    }

    // Validate total calculation
    if (financials.netAmount && financials.vatAmount && financials.totalAmount) {
      const expectedTotal = financials.netAmount + financials.vatAmount;
      const totalDifference = Math.abs(expectedTotal - financials.totalAmount);
      if (totalDifference > 0.5) {
        warnings.push(`Total calculation mismatch: expected €${expectedTotal.toFixed(2)}, found €${financials.totalAmount.toFixed(2)}`);
      }
    }

    // Extract notes
    const notes = extractNotes($);

    const data: ExtractedInvoiceData = {
      invoiceNumber: invoiceNumber || '',
      date: date || '',
      customerName: customerInfo.customerName || '',
      customerAddress: customerInfo.customerAddress,
      customerTaxId: customerInfo.customerTaxId,
      netAmount: financials.netAmount || 0,
      vatRate: financials.vatRate || 24,
      vatAmount: financials.vatAmount || 0,
      totalAmount: financials.totalAmount || 0,
      items,
      paymentMethod,
      notes,
    };

    return {
      success: true,
      data,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse invoice from ${sourceFile}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Extract invoice number from document
 */
function extractInvoiceNumber($: cheerio.CheerioAPI): string | undefined {
  // Look for patterns like "Αριθμός: TF-2024-001" or "TF-2024-001"
  const invoiceNumberPattern = /TF-\d{4}-\d{3}/;
  
  // Try to find in invoice-details section
  const invoiceDetailsText = $('.invoice-details').text();
  const match = invoiceDetailsText.match(invoiceNumberPattern);
  if (match) {
    return match[0];
  }

  // Fallback: search entire document
  const bodyText = $('body').text();
  const bodyMatch = bodyText.match(invoiceNumberPattern);
  if (bodyMatch) {
    return bodyMatch[0];
  }

  return undefined;
}

/**
 * Extract invoice date
 */
function extractInvoiceDate($: cheerio.CheerioAPI): string | undefined {
  // Look for date pattern like "21/01/2024"
  const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/;
  
  // Search in invoice-details section
  const invoiceDetailsText = $('.invoice-details').text();
  const match = invoiceDetailsText.match(datePattern);
  if (match) {
    return match[0];
  }

  return undefined;
}

/**
 * Extract customer information
 */
function extractCustomerInfo($: cheerio.CheerioAPI): {
  customerName?: string;
  customerAddress?: string;
  customerTaxId?: string;
} {
  const result: {
    customerName?: string;
    customerAddress?: string;
    customerTaxId?: string;
  } = {};

  // Find the customer section in invoice-details
  const invoiceDetails = $('.invoice-details').html() || '';
  const customerSection = invoiceDetails.split('Πελάτης:')[1];
  
  if (customerSection) {
    const lines = cheerio.load(customerSection)('div').first().text()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length > 0) {
      // First line after "Πελάτης:" is the customer name
      result.customerName = lines[0].replace('Πελάτης:', '').trim();
      
      // Subsequent lines may contain address
      const addressLines: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].startsWith('ΑΦΜ:')) {
          result.customerTaxId = lines[i].replace('ΑΦΜ:', '').trim();
        } else if (!lines[i].includes(':')) {
          addressLines.push(lines[i]);
        }
      }
      if (addressLines.length > 0) {
        result.customerAddress = addressLines.join(', ');
      }
    }
  }

  return result;
}

/**
 * Extract payment method
 */
function extractPaymentMethod($: cheerio.CheerioAPI): string | undefined {
  const invoiceDetailsText = $('.invoice-details').text();
  const paymentMatch = invoiceDetailsText.match(/Τρόπος Πληρωμής:?\s*([Α-Ωα-ωΆ-ώA-Za-z\s]+)/);
  if (paymentMatch) {
    return paymentMatch[1].trim();
  }
  return undefined;
}

/**
 * Extract line items from invoice table
 */
function extractLineItems($: cheerio.CheerioAPI): InvoiceItem[] {
  const items: InvoiceItem[] = [];

  $('.invoice-table tbody tr').each((_, row) => {
    const cols = $(row).find('td');
    if (cols.length >= 4) {
      const description = $(cols[0]).text().trim();
      const quantityText = $(cols[1]).text().trim();
      const unitPriceText = $(cols[2]).text().trim();
      const totalText = $(cols[3]).text().trim();

      const quantity = parseFloat(quantityText) || 0;
      const unitPrice = parseCurrency(unitPriceText);
      const total = parseCurrency(totalText);

      if (description && quantity > 0) {
        items.push({
          description,
          quantity,
          unitPrice,
          total,
        });
      }
    }
  });

  return items;
}

/**
 * Extract financial totals
 */
function extractFinancialTotals($: cheerio.CheerioAPI): {
  netAmount?: number;
  vatRate: number;
  vatAmount?: number;
  totalAmount?: number;
} {
  const result = {
    vatRate: 24, // Default Greek VAT rate
  } as {
    netAmount?: number;
    vatRate: number;
    vatAmount?: number;
    totalAmount?: number;
  };

  // Find the summary section
  const summaryText = $('.summary').text();

  // Extract net amount (Καθαρή Αξία)
  const netMatch = summaryText.match(/Καθαρή Αξία:?\s*€?([\d,\.]+)/);
  if (netMatch) {
    result.netAmount = parseCurrency(netMatch[1]);
  }

  // Extract VAT amount and rate
  const vatMatch = summaryText.match(/ΦΠΑ\s+(\d+)%:?\s*€?([\d,\.]+)/);
  if (vatMatch) {
    result.vatRate = parseFloat(vatMatch[1]);
    result.vatAmount = parseCurrency(vatMatch[2]);
  }

  // Extract total amount
  const totalMatch = summaryText.match(/ΣΥΝΟΛΟ:?\s*€?([\d,\.]+)/);
  if (totalMatch) {
    result.totalAmount = parseCurrency(totalMatch[1]);
  }

  return result;
}

/**
 * Extract notes and additional information
 */
function extractNotes($: cheerio.CheerioAPI): string | undefined {
  const notes: string[] = [];

  // Look for notes section
  $('p').each((_, elem) => {
    const text = $(elem).text().trim();
    if (text.startsWith('Σημειώσεις:') || text.startsWith('Εγγύηση:')) {
      notes.push(text);
    }
  });

  return notes.length > 0 ? notes.join('\n') : undefined;
}

/**
 * Parse currency string to number
 * Handles formats like "€1,054.00", "1.054,00", "1054.00"
 */
function parseCurrency(value: string): number {
  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[€$\s]/g, '');
  
  // Handle different decimal separators
  // If there's a comma followed by exactly 2 digits at the end, it's likely a decimal separator
  if (/,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Otherwise, remove commas (they're thousand separators)
    cleaned = cleaned.replace(/,/g, '');
  }

  return parseFloat(cleaned) || 0;
}

