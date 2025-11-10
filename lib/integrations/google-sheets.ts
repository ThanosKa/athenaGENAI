import { google } from 'googleapis';
import {
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from '@/types/data';
import { logger } from '@/lib/utils/logger';

const sheets = google.sheets('v4');

/**
 * Google Sheets client for exporting data
 * Requires GOOGLE_SERVICE_ACCOUNT_KEY environment variable
 */
export class GoogleSheetsClient {
  private auth: unknown;
  private spreadsheetId?: string;

  /**
   * Initialize authentication
   */
  async initialize(): Promise<void> {
    try {
      // Check for credentials
      const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (!credentials) {
        logger.warn(
          'Google Sheets credentials not configured',
          undefined,
          'GoogleSheets'
        );
        return;
      }

      // Parse credentials
      const credentialsJson = JSON.parse(credentials);

      // Create JWT auth client
      const auth = new google.auth.JWT({
        email: credentialsJson.client_email,
        key: credentialsJson.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.auth = auth;
      logger.info('Google Sheets authentication initialized', undefined, 'GoogleSheets');
    } catch (error) {
      logger.error('Failed to initialize Google Sheets auth', error, 'GoogleSheets');
      throw error;
    }
  }

  /**
   * Create a new spreadsheet
   */
  async createSpreadsheet({
    title,
  }: {
    title: string;
  }): Promise<string> {
    if (!this.auth) {
      throw new Error('Google Sheets client not initialized');
    }

    try {
      const response = await sheets.spreadsheets.create({
        auth: this.auth as never,
        requestBody: {
          properties: {
            title,
          },
          sheets: [
            { properties: { title: 'Forms' } },
            { properties: { title: 'Emails' } },
            { properties: { title: 'Invoices' } },
          ],
        },
      });

      this.spreadsheetId = response.data.spreadsheetId || undefined;
      logger.info(
        `Created spreadsheet: ${this.spreadsheetId}`,
        undefined,
        'GoogleSheets'
      );
      return this.spreadsheetId!;
    } catch (error) {
      logger.error('Failed to create spreadsheet', error, 'GoogleSheets');
      throw error;
    }
  }

  /**
   * Set the spreadsheet ID to use
   */
  setSpreadsheetId(id: string): void {
    this.spreadsheetId = id;
  }

  /**
   * Export form data to spreadsheet
   */
  async exportForms(data: ExtractedFormData[]): Promise<void> {
    if (!this.spreadsheetId || !this.auth) {
      throw new Error('Google Sheets client not initialized');
    }

    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'Company',
      'Service',
      'Message',
      'Submission Date',
      'Priority',
    ];

    const rows = data.map(form => [
      form.fullName,
      form.email,
      form.phone,
      form.company,
      form.service,
      form.message,
      form.submissionDate,
      form.priority,
    ]);

    await this.writeToSheet({
      sheetName: 'Forms',
      headers,
      rows,
    });
  }

  /**
   * Export email data to spreadsheet
   */
  async exportEmails(data: ExtractedEmailData[]): Promise<void> {
    if (!this.spreadsheetId || !this.auth) {
      throw new Error('Google Sheets client not initialized');
    }

    const headers = [
      'From',
      'Email',
      'Subject',
      'Date',
      'Type',
      'Full Name',
      'Company',
      'Phone',
      'Position',
      'Invoice Ref',
    ];

    const rows = data.map(email => [
      email.from,
      email.fromEmail,
      email.subject,
      email.date,
      email.emailType,
      email.fullName || '',
      email.company || '',
      email.phone || '',
      email.position || '',
      email.invoiceReference || '',
    ]);

    await this.writeToSheet({
      sheetName: 'Emails',
      headers,
      rows,
    });
  }

  /**
   * Export invoice data to spreadsheet
   */
  async exportInvoices(data: ExtractedInvoiceData[]): Promise<void> {
    if (!this.spreadsheetId || !this.auth) {
      throw new Error('Google Sheets client not initialized');
    }

    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Customer Address',
      'Tax ID',
      'Net Amount',
      'VAT Rate',
      'VAT Amount',
      'Total Amount',
      'Payment Method',
      'Notes',
    ];

    const rows = data.map(invoice => [
      invoice.invoiceNumber,
      invoice.date,
      invoice.customerName,
      invoice.customerAddress || '',
      invoice.customerTaxId || '',
      invoice.netAmount.toFixed(2),
      `${invoice.vatRate}%`,
      invoice.vatAmount.toFixed(2),
      invoice.totalAmount.toFixed(2),
      invoice.paymentMethod || '',
      invoice.notes || '',
    ]);

    await this.writeToSheet({
      sheetName: 'Invoices',
      headers,
      rows,
    });
  }

  /**
   * Write data to a specific sheet
   */
  private async writeToSheet({
    sheetName,
    headers,
    rows,
  }: {
    sheetName: string;
    headers: string[];
    rows: (string | number)[][];
  }): Promise<void> {
    if (!this.spreadsheetId || !this.auth) {
      throw new Error('Google Sheets client not initialized');
    }

    try {
      // Clear existing data
      await sheets.spreadsheets.values.clear({
        auth: this.auth as never,
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      // Write headers and data
      const values = [headers, ...rows];
      await sheets.spreadsheets.values.update({
        auth: this.auth as never,
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });

      logger.info(
        `Exported ${rows.length} rows to ${sheetName}`,
        undefined,
        'GoogleSheets'
      );
    } catch (error) {
      logger.error(`Failed to write to sheet ${sheetName}`, error, 'GoogleSheets');
      throw error;
    }
  }
}

// Singleton instance
export const googleSheetsClient = new GoogleSheetsClient();

