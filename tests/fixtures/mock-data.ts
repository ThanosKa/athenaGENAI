// Mock data helpers for tests
import {
  ExtractionRecord,
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from '@/types/data';

export function createMockFormRecord(
  overrides?: Partial<ExtractionRecord>
): ExtractionRecord {
  return {
    id: 'test-form-1',
    sourceType: SourceType.FORM,
    sourceFile: 'contact_form_1.html',
    status: ExtractionStatus.PENDING,
    extractedAt: new Date('2024-01-15T14:30:00Z'),
    data: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '210-1234567',
      company: 'Test Company',
      service: 'Web Development',
      message: 'Test message',
      submissionDate: '2024-01-15T14:30',
      priority: 'high',
    } as ExtractedFormData,
    warnings: [],
    ...overrides,
  };
}

export function createMockEmailRecord(
  overrides?: Partial<ExtractionRecord>
): ExtractionRecord {
  return {
    id: 'test-email-1',
    sourceType: SourceType.EMAIL,
    sourceFile: 'email_01.eml',
    status: ExtractionStatus.PENDING,
    extractedAt: new Date('2024-01-20T10:30:00Z'),
    data: {
      from: 'Test User <test@example.com>',
      fromEmail: 'test@example.com',
      to: 'info@techflow-solutions.gr',
      subject: 'Test Inquiry',
      date: '2024-01-20T10:30:00Z',
      emailType: 'client_inquiry',
      bodyText: 'Test email body',
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '210-1234567',
      company: 'Test Company',
    } as ExtractedEmailData,
    warnings: [],
    ...overrides,
  };
}

export function createMockInvoiceRecord(
  overrides?: Partial<ExtractionRecord>
): ExtractionRecord {
  return {
    id: 'test-invoice-1',
    sourceType: SourceType.INVOICE,
    sourceFile: 'invoice_TF-2024-001.html',
    status: ExtractionStatus.PENDING,
    extractedAt: new Date('2024-01-21T12:00:00Z'),
    data: {
      invoiceNumber: 'TF-2024-001',
      date: '21/01/2024',
      customerName: 'Test Customer',
      customerAddress: '123 Test St',
      customerTaxId: '123456789',
      netAmount: 1000,
      vatRate: 24,
      vatAmount: 240,
      totalAmount: 1240,
      items: [
        {
          description: 'Service 1',
          quantity: 2,
          unitPrice: 100,
          total: 200,
        },
      ],
      paymentMethod: 'Cash',
    } as ExtractedInvoiceData,
    warnings: [],
    ...overrides,
  };
}

