export interface ExtractionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export enum ExtractionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  EDITED = "edited",
  EXPORTED = "exported",
  FAILED = "failed",
}

export enum SourceType {
  FORM = "form",
  EMAIL = "email",
  INVOICE = "invoice",
}

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

export interface ExtractedEmailData {
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  date: string;
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  emailType: "client_inquiry" | "invoice_notification";
  invoiceReference?: string;
  bodyText: string;
}

export interface ExtractedInvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
  paymentMethod?: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ExtractionRecord {
  id: string;
  sourceType: SourceType;
  sourceFile: string;
  status: ExtractionStatus;
  extractedAt: Date;
  processedAt?: Date;
  data: ExtractedFormData | ExtractedEmailData | ExtractedInvoiceData;
  warnings: string[];
  error?: string;
  editedBy?: string;
  editedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  exportedAt?: Date;
}

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
