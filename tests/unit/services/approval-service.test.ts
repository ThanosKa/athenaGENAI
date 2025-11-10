import { describe, it, expect, beforeEach } from 'vitest';
import { approvalService } from '@/lib/services/approval-service';
import { storageService } from '@/lib/services/storage';
import {
  ExtractionRecord,
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
} from '@/types/data';

describe('ApprovalService', () => {
  beforeEach(() => {
    storageService.clear();
  });

  it('should approve pending extraction', () => {
    const record: ExtractionRecord = {
      id: 'approve-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const success = approvalService.approve({ id: 'approve-1', approvedBy: 'admin' });

    expect(success).toBe(true);
    const updated = storageService.getRecord('approve-1');
    expect(updated?.status).toBe(ExtractionStatus.APPROVED);
    expect(updated?.approvedBy).toBe('admin');
    expect(updated?.approvedAt).toBeDefined();
  });

  it('should reject pending extraction', () => {
    const record: ExtractionRecord = {
      id: 'reject-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const success = approvalService.reject({
      id: 'reject-1',
      rejectedBy: 'admin',
      reason: 'Invalid data',
    });

    expect(success).toBe(true);
    const updated = storageService.getRecord('reject-1');
    expect(updated?.status).toBe(ExtractionStatus.REJECTED);
    expect(updated?.rejectedBy).toBe('admin');
    expect(updated?.rejectionReason).toBe('Invalid data');
  });

  it('should not approve already approved record', () => {
    const record: ExtractionRecord = {
      id: 'already-approved',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const success = approvalService.approve({ id: 'already-approved' });

    expect(success).toBe(false);
  });

  it('should not reject already rejected record', () => {
    const record: ExtractionRecord = {
      id: 'already-rejected',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.REJECTED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const success = approvalService.reject({ id: 'already-rejected' });

    expect(success).toBe(false);
  });

  it('should approve edited records', () => {
    const record: ExtractionRecord = {
      id: 'edited-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.EDITED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const success = approvalService.approve({ id: 'edited-1' });

    expect(success).toBe(true);
    const updated = storageService.getRecord('edited-1');
    expect(updated?.status).toBe(ExtractionStatus.APPROVED);
  });

  it('should return false for non-existent record', () => {
    const success = approvalService.approve({ id: 'non-existent' });
    expect(success).toBe(false);
  });

  it('should bulk approve multiple records', () => {
    const records: ExtractionRecord[] = [
      {
        id: 'bulk-1',
        sourceType: SourceType.FORM,
        sourceFile: 'form_1.html',
        status: ExtractionStatus.PENDING,
        extractedAt: new Date(),
        data: {} as ExtractedFormData,
        warnings: [],
      },
      {
        id: 'bulk-2',
        sourceType: SourceType.EMAIL,
        sourceFile: 'email_1.eml',
        status: ExtractionStatus.PENDING,
        extractedAt: new Date(),
        data: {} as ExtractedFormData,
        warnings: [],
      },
      {
        id: 'bulk-3',
        sourceType: SourceType.INVOICE,
        sourceFile: 'invoice_1.html',
        status: ExtractionStatus.APPROVED, // Already approved
        extractedAt: new Date(),
        data: {} as ExtractedFormData,
        warnings: [],
      },
    ];

    records.forEach(r => storageService.addRecord(r));

    const result = approvalService.bulkApprove({
      ids: ['bulk-1', 'bulk-2', 'bulk-3'],
      approvedBy: 'admin',
    });

    expect(result.succeeded.length).toBe(2);
    expect(result.failed.length).toBe(1);
    expect(result.succeeded).toContain('bulk-1');
    expect(result.succeeded).toContain('bulk-2');
    expect(result.failed).toContain('bulk-3');
  });

  it('should bulk reject multiple records', () => {
    const records: ExtractionRecord[] = [
      {
        id: 'bulk-reject-1',
        sourceType: SourceType.FORM,
        sourceFile: 'form_1.html',
        status: ExtractionStatus.PENDING,
        extractedAt: new Date(),
        data: {} as ExtractedFormData,
        warnings: [],
      },
      {
        id: 'bulk-reject-2',
        sourceType: SourceType.EMAIL,
        sourceFile: 'email_1.eml',
        status: ExtractionStatus.PENDING,
        extractedAt: new Date(),
        data: {} as ExtractedFormData,
        warnings: [],
      },
    ];

    records.forEach(r => storageService.addRecord(r));

    const result = approvalService.bulkReject({
      ids: ['bulk-reject-1', 'bulk-reject-2'],
      rejectedBy: 'admin',
      reason: 'Bulk rejection',
    });

    expect(result.succeeded.length).toBe(2);
    expect(result.failed.length).toBe(0);
  });

  it('should mark approved record as exported', () => {
    const record: ExtractionRecord = {
      id: 'export-1',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const success = approvalService.markAsExported({ id: 'export-1' });

    expect(success).toBe(true);
    const updated = storageService.getRecord('export-1');
    expect(updated?.status).toBe(ExtractionStatus.EXPORTED);
    expect(updated?.exportedAt).toBeDefined();
  });

  it('should not mark non-approved record as exported', () => {
    const record: ExtractionRecord = {
      id: 'pending-export',
      sourceType: SourceType.FORM,
      sourceFile: 'form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);
    const success = approvalService.markAsExported({ id: 'pending-export' });

    expect(success).toBe(false);
  });
});

