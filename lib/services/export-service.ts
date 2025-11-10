import {
  ExtractionRecord,
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from '@/types/data';
import { storageService } from '@/lib/services/storage';
import { approvalService } from '@/lib/services/approval-service';
import { googleSheetsClient } from '@/lib/integrations/google-sheets';
import { logger } from '@/lib/utils/logger';
import { errorHandler, ErrorCategory } from '@/lib/utils/error-handler';

/**
 * Export service handles data export to Google Sheets
 */
export class ExportService {
  private isInitialized = false;

  /**
   * Initialize the export service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await googleSheetsClient.initialize();
      this.isInitialized = true;
      logger.info('Export service initialized', undefined, 'ExportService');
    } catch (error) {
      logger.error('Failed to initialize export service', error, 'ExportService');
      throw errorHandler.handle({
        error,
        category: ErrorCategory.EXPORT,
        context: 'ExportService initialization',
      });
    }
  }

  /**
   * Export all approved records to Google Sheets
   */
  async exportApprovedRecords({
    spreadsheetId,
    createNew,
  }: {
    spreadsheetId?: string;
    createNew?: boolean;
  } = {}): Promise<{ success: boolean; spreadsheetId?: string; error?: string }> {
    try {
      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Create new spreadsheet or use existing
      let targetSpreadsheetId = spreadsheetId;
      if (createNew || !targetSpreadsheetId) {
        targetSpreadsheetId = await googleSheetsClient.createSpreadsheet({
          title: `TechFlow Data Export - ${new Date().toISOString().split('T')[0]}`,
        });
      } else {
        googleSheetsClient.setSpreadsheetId(targetSpreadsheetId);
      }

      // Get all approved records
      const approvedRecords = storageService.getRecords({
        status: ExtractionStatus.APPROVED,
      });

      if (approvedRecords.length === 0) {
        return {
          success: false,
          error: 'No approved records to export',
        };
      }

      // Separate records by type
      const forms: ExtractedFormData[] = [];
      const emails: ExtractedEmailData[] = [];
      const invoices: ExtractedInvoiceData[] = [];

      for (const record of approvedRecords) {
        switch (record.sourceType) {
          case SourceType.FORM:
            forms.push(record.data as ExtractedFormData);
            break;
          case SourceType.EMAIL:
            emails.push(record.data as ExtractedEmailData);
            break;
          case SourceType.INVOICE:
            invoices.push(record.data as ExtractedInvoiceData);
            break;
        }
      }

      // Export to Google Sheets
      if (forms.length > 0) {
        await googleSheetsClient.exportForms(forms);
        logger.info(`Exported ${forms.length} forms`, undefined, 'ExportService');
      }

      if (emails.length > 0) {
        await googleSheetsClient.exportEmails(emails);
        logger.info(`Exported ${emails.length} emails`, undefined, 'ExportService');
      }

      if (invoices.length > 0) {
        await googleSheetsClient.exportInvoices(invoices);
        logger.info(`Exported ${invoices.length} invoices`, undefined, 'ExportService');
      }

      // Mark all records as exported
      for (const record of approvedRecords) {
        approvalService.markAsExported({ id: record.id });
      }

      logger.info(
        `Successfully exported ${approvedRecords.length} records`,
        { spreadsheetId: targetSpreadsheetId },
        'ExportService'
      );

      return {
        success: true,
        spreadsheetId: targetSpreadsheetId,
      };
    } catch (error) {
      logger.error('Export failed', error, 'ExportService');
      const appError = errorHandler.handle({
        error,
        category: ErrorCategory.EXPORT,
        context: 'Export to Google Sheets',
      });
      return {
        success: false,
        error: appError.userMessage,
      };
    }
  }

  /**
   * Export specific records by IDs
   */
  async exportRecordsByIds({
    ids,
    spreadsheetId,
    createNew,
  }: {
    ids: string[];
    spreadsheetId?: string;
    createNew?: boolean;
  }): Promise<{ success: boolean; spreadsheetId?: string; error?: string }> {
    try {
      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get records
      const records = ids
        .map(id => storageService.getRecord(id))
        .filter((r): r is ExtractionRecord => r !== undefined);

      if (records.length === 0) {
        return {
          success: false,
          error: 'No valid records found',
        };
      }

      // Create new spreadsheet or use existing
      let targetSpreadsheetId = spreadsheetId;
      if (createNew || !targetSpreadsheetId) {
        targetSpreadsheetId = await googleSheetsClient.createSpreadsheet({
          title: `TechFlow Data Export - ${new Date().toISOString().split('T')[0]}`,
        });
      } else {
        googleSheetsClient.setSpreadsheetId(targetSpreadsheetId);
      }

      // Separate records by type
      const forms: ExtractedFormData[] = [];
      const emails: ExtractedEmailData[] = [];
      const invoices: ExtractedInvoiceData[] = [];

      for (const record of records) {
        // Only export approved or edited records
        if (
          record.status !== ExtractionStatus.APPROVED &&
          record.status !== ExtractionStatus.EDITED
        ) {
          continue;
        }

        switch (record.sourceType) {
          case SourceType.FORM:
            forms.push(record.data as ExtractedFormData);
            break;
          case SourceType.EMAIL:
            emails.push(record.data as ExtractedEmailData);
            break;
          case SourceType.INVOICE:
            invoices.push(record.data as ExtractedInvoiceData);
            break;
        }
      }

      // Export to Google Sheets
      if (forms.length > 0) {
        await googleSheetsClient.exportForms(forms);
      }
      if (emails.length > 0) {
        await googleSheetsClient.exportEmails(emails);
      }
      if (invoices.length > 0) {
        await googleSheetsClient.exportInvoices(invoices);
      }

      // Mark as exported
      for (const record of records) {
        if (
          record.status === ExtractionStatus.APPROVED ||
          record.status === ExtractionStatus.EDITED
        ) {
          approvalService.markAsExported({ id: record.id });
        }
      }

      const totalExported = forms.length + emails.length + invoices.length;
      logger.info(
        `Exported ${totalExported} records`,
        { spreadsheetId: targetSpreadsheetId },
        'ExportService'
      );

      return {
        success: true,
        spreadsheetId: targetSpreadsheetId,
      };
    } catch (error) {
      logger.error('Export by IDs failed', error, 'ExportService');
      const appError = errorHandler.handle({
        error,
        category: ErrorCategory.EXPORT,
        context: 'Export selected records',
      });
      return {
        success: false,
        error: appError.userMessage,
      };
    }
  }
}

// Singleton instance
export const exportService = new ExportService();

