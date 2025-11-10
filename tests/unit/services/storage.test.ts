import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '@/lib/services/storage';
import {
  ExtractionRecord,
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
} from '@/types/data';

describe('StorageService', () => {
  beforeEach(() => {
    storageService.clear();
  });

  it('should add new extraction record', () => {
    const record: ExtractionRecord = {
      id: 'test-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        company: 'Test Company',
        service: 'Service 1',
        message: 'Test message',
        submissionDate: '2024-01-15',
        priority: 'high',
      } as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const retrieved = storageService.getRecord('test-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test-1');
    expect(retrieved?.sourceType).toBe(SourceType.FORM);
  });

  it('should get records filtered by status', () => {
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
      sourceType: SourceType.EMAIL,
      sourceFile: 'email_1.eml',
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(pendingRecord);
    storageService.addRecord(approvedRecord);

    const pendingRecords = storageService.getRecords({ status: ExtractionStatus.PENDING });
    expect(pendingRecords.length).toBe(1);
    expect(pendingRecords[0].id).toBe('pending-1');

    const approvedRecords = storageService.getRecords({ status: ExtractionStatus.APPROVED });
    expect(approvedRecords.length).toBe(1);
    expect(approvedRecords[0].id).toBe('approved-1');
  });

  it('should get records filtered by sourceType', () => {
    const formRecord: ExtractionRecord = {
      id: 'form-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    const emailRecord: ExtractionRecord = {
      id: 'email-1',
      sourceType: SourceType.EMAIL,
      sourceFile: 'email_1.eml',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(formRecord);
    storageService.addRecord(emailRecord);

    const formRecords = storageService.getRecords({ sourceType: SourceType.FORM });
    expect(formRecords.length).toBe(1);
    expect(formRecords[0].id).toBe('form-1');
  });

  it('should search records by query', () => {
    const record1: ExtractionRecord = {
      id: 'search-1',
      sourceType: SourceType.FORM,
      sourceFile: 'contact_form.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        company: 'Test Company',
        service: 'Service',
        message: '',
        submissionDate: '',
        priority: '',
      } as ExtractedFormData,
      warnings: [],
    };

    const record2: ExtractionRecord = {
      id: 'search-2',
      sourceType: SourceType.EMAIL,
      sourceFile: 'email_test.eml',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record1);
    storageService.addRecord(record2);

    const results = storageService.getRecords({ search: 'John' });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('search-1');

    const fileResults = storageService.getRecords({ search: 'contact' });
    expect(fileResults.length).toBe(1);
  });

  it('should update record status', () => {
    const record: ExtractionRecord = {
      id: 'update-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const updated = storageService.updateRecord('update-1', {
      status: ExtractionStatus.APPROVED,
      approvedBy: 'admin',
      approvedAt: new Date(),
    });

    expect(updated).toBe(true);
    const retrieved = storageService.getRecord('update-1');
    expect(retrieved?.status).toBe(ExtractionStatus.APPROVED);
    expect(retrieved?.approvedBy).toBe('admin');
  });

  it('should return false when updating non-existent record', () => {
    const updated = storageService.updateRecord('non-existent', {
      status: ExtractionStatus.APPROVED,
    });

    expect(updated).toBe(false);
  });

  it('should get statistics correctly', () => {
    const records: ExtractionRecord[] = [
      {
        id: 'stat-1',
        sourceType: SourceType.FORM,
        sourceFile: 'form_1.html',
        status: ExtractionStatus.PENDING,
        extractedAt: new Date(),
        data: {} as ExtractedFormData,
        warnings: [],
      },
      {
        id: 'stat-2',
        sourceType: SourceType.EMAIL,
        sourceFile: 'email_1.eml',
        status: ExtractionStatus.APPROVED,
        extractedAt: new Date(),
        data: {} as ExtractedFormData,
        warnings: [],
      },
      {
        id: 'stat-3',
        sourceType: SourceType.INVOICE,
        sourceFile: 'invoice_1.html',
        status: ExtractionStatus.REJECTED,
        extractedAt: new Date(),
        data: {} as ExtractedFormData,
        warnings: [],
      },
    ];

    records.forEach(r => storageService.addRecord(r));

    const stats = storageService.getStatistics();
    expect(stats.total).toBe(3);
    expect(stats.pending).toBe(1);
    expect(stats.approved).toBe(1);
    expect(stats.rejected).toBe(1);
    expect(stats.bySource.forms).toBe(1);
    expect(stats.bySource.emails).toBe(1);
    expect(stats.bySource.invoices).toBe(1);
  });

  it('should return undefined for non-existent record', () => {
    const record = storageService.getRecord('non-existent');
    expect(record).toBeUndefined();
  });

  it('should delete record', () => {
    const record: ExtractionRecord = {
      id: 'delete-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const deleted = storageService.deleteRecord('delete-1');
    expect(deleted).toBe(true);

    const retrieved = storageService.getRecord('delete-1');
    expect(retrieved).toBeUndefined();
  });

  it('should return false when deleting non-existent record', () => {
    const deleted = storageService.deleteRecord('non-existent');
    expect(deleted).toBe(false);
  });

  it('should sort records by extraction date (newest first)', () => {
    const oldDate = new Date('2024-01-01');
    const newDate = new Date('2024-01-02');

    const oldRecord: ExtractionRecord = {
      id: 'old-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: oldDate,
      data: {} as ExtractedFormData,
      warnings: [],
    };

    const newRecord: ExtractionRecord = {
      id: 'new-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_2.html',
      status: ExtractionStatus.PENDING,
      extractedAt: newDate,
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(oldRecord);
    storageService.addRecord(newRecord);

    const allRecords = storageService.getRecords();
    expect(allRecords[0].id).toBe('new-1');
    expect(allRecords[1].id).toBe('old-1');
  });
});

