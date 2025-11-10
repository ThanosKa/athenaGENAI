// Core extraction result pattern - used consistently across all extractors
export interface ExtractionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// Status enum for tracking extraction lifecycle
export enum ExtractionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EDITED = 'edited',
  EXPORTED = 'exported',
  FAILED = 'failed',
}

// Source type for identifying data origin
export enum SourceType {
  FORM = 'form',
  EMAIL = 'email',
  INVOICE = 'invoice',
}

// Form data structure
export interface ExtractedFormData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  submissionDate: string;
  priority: string;
}

// Email data structure - for client inquiry emails
export interface ExtractedEmailData {
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  date: string;
  // Extracted contact information
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  // Email classification
  emailType: 'client_inquiry' | 'invoice_notification';
  // For invoice notification emails
  invoiceReference?: string;
  // Full body text
  bodyText: string;
}

// Invoice data structure
export interface ExtractedInvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  // Financial data
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  // Line items
  items: InvoiceItem[];
  // Additional info
  paymentMethod?: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Unified extraction record for storage and display
export interface ExtractionRecord {
  id: string;
  sourceType: SourceType;
  sourceFile: string;
  status: ExtractionStatus;
  extractedAt: Date;
  processedAt?: Date;
  // The actual extracted data (one of the three types)
  data: ExtractedFormData | ExtractedEmailData | ExtractedInvoiceData;
  // Metadata
  warnings: string[];
  error?: string;
  // Audit trail
  editedBy?: string;
  editedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  exportedAt?: Date;
}

// Statistics for dashboard
export interface ExtractionStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  exported: number;
  failed: number;
  bySource: {
    forms: number;
    emails: number;
    invoices: number;
  };
}

