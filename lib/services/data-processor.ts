import { promises as fs } from 'fs';
import path from 'path';
import { extractFormData } from '@/lib/extractors/form-extractor';
import { extractEmailData } from '@/lib/extractors/email-extractor';
import { extractInvoiceData } from '@/lib/extractors/invoice-extractor';
import {
  ExtractionRecord,
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from '@/types/data';
import { storageService } from '@/lib/services/storage';

/**
 * Data processor orchestrates extraction from all sources
 */
export class DataProcessor {
  /**
   * Process a single form file
   */
  async processForm({
    filePath,
    fileName,
  }: {
    filePath: string;
    fileName: string;
  }): Promise<ExtractionRecord> {
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    const result = extractFormData({ htmlContent, sourceFile: fileName });

    const record: ExtractionRecord = {
      id: generateId(),
      sourceType: SourceType.FORM,
      sourceFile: fileName,
      status: result.success ? ExtractionStatus.PENDING : ExtractionStatus.FAILED,
      extractedAt: new Date(),
      data: result.data || ({} as ExtractedFormData),
      warnings: result.warnings || [],
      error: result.error,
    };

    storageService.addRecord(record);
    return record;
  }

  /**
   * Process a single email file
   */
  async processEmail({
    filePath,
    fileName,
  }: {
    filePath: string;
    fileName: string;
  }): Promise<ExtractionRecord> {
    const emlContent = await fs.readFile(filePath, 'utf-8');
    const result = await extractEmailData({ emlContent, sourceFile: fileName });

    const record: ExtractionRecord = {
      id: generateId(),
      sourceType: SourceType.EMAIL,
      sourceFile: fileName,
      status: result.success ? ExtractionStatus.PENDING : ExtractionStatus.FAILED,
      extractedAt: new Date(),
      data: result.data || ({} as ExtractedEmailData),
      warnings: result.warnings || [],
      error: result.error,
    };

    storageService.addRecord(record);
    return record;
  }

  /**
   * Process a single invoice file
   */
  async processInvoice({
    filePath,
    fileName,
  }: {
    filePath: string;
    fileName: string;
  }): Promise<ExtractionRecord> {
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    const result = extractInvoiceData({ htmlContent, sourceFile: fileName });

    const record: ExtractionRecord = {
      id: generateId(),
      sourceType: SourceType.INVOICE,
      sourceFile: fileName,
      status: result.success ? ExtractionStatus.PENDING : ExtractionStatus.FAILED,
      extractedAt: new Date(),
      data: result.data || ({} as ExtractedInvoiceData),
      warnings: result.warnings || [],
      error: result.error,
    };

    storageService.addRecord(record);
    return record;
  }

  /**
   * Process all files from dummy_data folder
   */
  async processAllDummyData(): Promise<{
    forms: ExtractionRecord[];
    emails: ExtractionRecord[];
    invoices: ExtractionRecord[];
  }> {
    const baseDir = path.join(process.cwd(), 'dummy_data');

    // Process all forms
    const formsDir = path.join(baseDir, 'forms');
    const formFiles = await fs.readdir(formsDir);
    const forms = await Promise.all(
      formFiles
        .filter(f => f.endsWith('.html'))
        .map(fileName =>
          this.processForm({
            filePath: path.join(formsDir, fileName),
            fileName,
          })
        )
    );

    // Process all emails
    const emailsDir = path.join(baseDir, 'emails');
    const emailFiles = await fs.readdir(emailsDir);
    const emails = await Promise.all(
      emailFiles
        .filter(f => f.endsWith('.eml'))
        .map(fileName =>
          this.processEmail({
            filePath: path.join(emailsDir, fileName),
            fileName,
          })
        )
    );

    // Process all invoices
    const invoicesDir = path.join(baseDir, 'invoices');
    const invoiceFiles = await fs.readdir(invoicesDir);
    const invoices = await Promise.all(
      invoiceFiles
        .filter(f => f.endsWith('.html'))
        .map(fileName =>
          this.processInvoice({
            filePath: path.join(invoicesDir, fileName),
            fileName,
          })
        )
    );

    return { forms, emails, invoices };
  }
}

/**
 * Generate unique ID for extraction records
 */
function generateId(): string {
  return `ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Singleton instance
export const dataProcessor = new DataProcessor();

