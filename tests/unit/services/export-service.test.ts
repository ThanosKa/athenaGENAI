import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportService } from '@/lib/services/export-service';
import { storageService } from '@/lib/services/storage';
import { approvalService } from '@/lib/services/approval-service';
import {
  ExtractionRecord,
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
} from '@/types/data';

// Mock Google Sheets client
vi.mock('@/lib/integrations/google-sheets', () => ({
  googleSheetsClient: {
    initialize: vi.fn().mockResolvedValue(undefined),
    createSpreadsheet: vi.fn().mockResolvedValue('spreadsheet-id-123'),
    setSpreadsheetId: vi.fn(),
    exportForms: vi.fn().mockResolvedValue(undefined),
    exportEmails: vi.fn().mockResolvedValue(undefined),
    exportInvoices: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock error handler
vi.mock('@/lib/utils/error-handler', () => ({
  errorHandler: {
    handle: vi.fn().mockReturnValue({
      userMessage: 'Error message',
    }),
  },
  ErrorCategory: {
    EXPORT: 'export',
  },
}));

describe('ExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageService.clear();
  });

  it('should export approved records to Google Sheets', async () => {
    const approvedRecord: ExtractionRecord = {
      id: 'export-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        company: 'Test Company',
        service: 'Service 1',
        message: 'Test',
        submissionDate: '2024-01-15',
        priority: 'high',
      } as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(approvedRecord);

    const result = await exportService.exportApprovedRecords({ createNew: true });

    expect(result.success).toBe(true);
    expect(result.spreadsheetId).toBeDefined();
    const updated = storageService.getRecord('export-1');
    expect(updated?.status).toBe(ExtractionStatus.EXPORTED);
  });

  it('should return error when no approved records exist', async () => {
    const result = await exportService.exportApprovedRecords();

    expect(result.success).toBe(false);
    expect(result.error).toContain('No approved records');
  });

  it('should filter by status before export', async () => {
    const pendingRecord: ExtractionRecord = {
      id: 'pending-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    const approvedRecord: ExtractionRecord = {
      id: 'approved-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_2.html',
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(pendingRecord);
    storageService.addRecord(approvedRecord);

    const result = await exportService.exportApprovedRecords();

    expect(result.success).toBe(true);
    // Only approved record should be exported
    const exported = storageService.getRecord('approved-1');
    expect(exported?.status).toBe(ExtractionStatus.EXPORTED);
  });

  it('should handle empty record sets', async () => {
    const result = await exportService.exportApprovedRecords();

    expect(result.success).toBe(false);
    expect(result.error).toContain('No approved records');
  });

  it('should export records by IDs', async () => {
    const record1: ExtractionRecord = {
      id: 'id-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    const record2: ExtractionRecord = {
      id: 'id-2',
      sourceType: SourceType.EMAIL,
      sourceFile: 'email_1.eml',
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record1);
    storageService.addRecord(record2);

    const result = await exportService.exportRecordsByIds({
      ids: ['id-1', 'id-2'],
      createNew: true,
    });

    expect(result.success).toBe(true);
    expect(result.spreadsheetId).toBeDefined();
  });

  it('should skip non-approved records when exporting by IDs', async () => {
    const approvedRecord: ExtractionRecord = {
      id: 'approved-id',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    const pendingRecord: ExtractionRecord = {
      id: 'pending-id',
      sourceType: SourceType.FORM,
      sourceFile: 'form_2.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(approvedRecord);
    storageService.addRecord(pendingRecord);

    const result = await exportService.exportRecordsByIds({
      ids: ['approved-id', 'pending-id'],
      createNew: true,
    });

    expect(result.success).toBe(true);
    // Only approved record should be exported
    const exported = storageService.getRecord('approved-id');
    expect(exported?.status).toBe(ExtractionStatus.EXPORTED);
  });

  it('should return error when no valid records found for export by IDs', async () => {
    const result = await exportService.exportRecordsByIds({
      ids: ['non-existent-1', 'non-existent-2'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No valid records');
  });
});

