import { simpleParser } from 'mailparser';
import { ExtractionResult, ExtractedEmailData } from '@/types/data';

/**
 * Extracts data from .eml email files
 * Distinguishes between client inquiry emails and invoice notification emails
 * Handles Greek characters (UTF-8)
 */
export async function extractEmailData({
  emlContent,
  sourceFile,
}: {
  emlContent: string;
  sourceFile: string;
}): Promise<ExtractionResult<ExtractedEmailData>> {
  const warnings: string[] = [];

  try {
    // Parse the email
    const parsed = await simpleParser(emlContent);

    const from = parsed.from?.text || '';
    const fromEmail = parsed.from?.value[0]?.address || '';
    const to = Array.isArray(parsed.to) 
      ? parsed.to.map(addr => addr.text || '').join(', ')
      : parsed.to?.text || '';
    const subject = parsed.subject || '';
    const date = parsed.date?.toISOString() || new Date().toISOString();
    const bodyText = parsed.text || '';

    // Determine email type and extract data
    const isInvoiceNotification = detectInvoiceNotification(subject, bodyText);
    
    let extractedData: ExtractedEmailData = {
      from,
      fromEmail,
      to,
      subject,
      date,
      emailType: isInvoiceNotification ? 'invoice_notification' : 'client_inquiry',
      bodyText,
    };

    if (isInvoiceNotification) {
      // Extract invoice reference
      const invoiceRef = extractInvoiceReference(subject, bodyText);
      if (invoiceRef) {
        extractedData.invoiceReference = invoiceRef;
      } else {
        warnings.push('Invoice notification detected but no invoice reference found');
      }
    } else {
      // Extract contact information from email body
      const contactInfo = extractContactInfo(bodyText, from);
      extractedData = { ...extractedData, ...contactInfo };

      // Validate extracted contact info
      if (!contactInfo.fullName) {
        warnings.push('Could not extract full name from email body');
      }
      if (!contactInfo.email) {
        warnings.push('Could not extract email address from email body');
      }
      if (!contactInfo.company) {
        warnings.push('Could not extract company name from email body');
      }
    }

    return {
      success: true,
      data: extractedData,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse email from ${sourceFile}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Detects if email is an invoice notification
 */
function detectInvoiceNotification(subject: string, body: string): boolean {
  const invoiceKeywords = [
    'τιμολόγιο',
    'invoice',
    'TF-2024-',
    'αριθμός τιμολογίου',
    'invoice number',
  ];

  const subjectLower = subject.toLowerCase();
  const bodyLower = body.toLowerCase();

  return invoiceKeywords.some(keyword => 
    subjectLower.includes(keyword.toLowerCase()) || 
    bodyLower.includes(keyword.toLowerCase())
  );
}

/**
 * Extracts invoice reference number from email
 */
function extractInvoiceReference(subject: string, body: string): string | undefined {
  // Pattern for invoice numbers like TF-2024-001, TF-2024-002, etc.
  const invoicePattern = /TF-\d{4}-\d{3}/g;
  
  const subjectMatch = subject.match(invoicePattern);
  if (subjectMatch) {
    return subjectMatch[0];
  }

  const bodyMatch = body.match(invoicePattern);
  if (bodyMatch) {
    return bodyMatch[0];
  }

  return undefined;
}

/**
 * Extracts contact information from email body
 * Handles structured contact info in Greek and English
 */
function extractContactInfo(
  bodyText: string,
  fromName: string
): Pick<ExtractedEmailData, 'fullName' | 'email' | 'phone' | 'company' | 'position'> {
  const result: Pick<ExtractedEmailData, 'fullName' | 'email' | 'phone' | 'company' | 'position'> = {};

  // Extract full name
  const namePattern = /(?:Όνομα|Name|Είμαι ο|Είμαι η|I am)[\s:]+([Α-Ωα-ωΆ-ώA-Za-z\s]+?)(?:\n|$|\.)/i;
  const nameMatch = bodyText.match(namePattern);
  if (nameMatch) {
    result.fullName = nameMatch[1].trim();
  } else {
    // Fallback to from name
    result.fullName = fromName.replace(/<.*?>/, '').trim();
  }

  // Extract email
  const emailPattern = /(?:Email|E-mail)[\s:]+([^\s@]+@[^\s@]+\.[^\s@]+)/i;
  const emailMatch = bodyText.match(emailPattern);
  if (emailMatch) {
    result.email = emailMatch[1].trim();
  }

  // Extract phone
  const phonePattern = /(?:Τηλέφωνο|Τηλ\.|Phone|Tel\.)[\s:]+([0-9\-\s\+\(\)]+)/i;
  const phoneMatch = bodyText.match(phonePattern);
  if (phoneMatch) {
    result.phone = phoneMatch[1].trim();
  }

  // Extract company
  const companyPattern = /(?:Εταιρεία|Εταιρία|Company)[\s:]+([Α-Ωα-ωΆ-ώA-Za-z0-9\s&\-\.]+?)(?:\n|$)/i;
  const companyMatch = bodyText.match(companyPattern);
  if (companyMatch) {
    result.company = companyMatch[1].trim();
  }

  // Extract position/title
  const positionPattern = /(?:Θέση|Position|Title)[\s:]+([Α-Ωα-ωΆ-ώA-Za-z\s]+?)(?:\n|$)/i;
  const positionMatch = bodyText.match(positionPattern);
  if (positionMatch) {
    result.position = positionMatch[1].trim();
  }

  return result;
}

