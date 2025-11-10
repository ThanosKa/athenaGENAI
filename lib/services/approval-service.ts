import { ExtractionStatus } from '@/types/data';
import { storageService } from '@/lib/services/storage';

/**
 * Service for handling approval/rejection of extracted data
 */
export class ApprovalService {
  /**
   * Approve an extraction
   */
  approve({
    id,
    approvedBy,
  }: {
    id: string;
    approvedBy?: string;
  }): boolean {
    const record = storageService.getRecord(id);
    if (!record) {
      return false;
    }

    // Can only approve pending or edited records
    if (
      record.status !== ExtractionStatus.PENDING &&
      record.status !== ExtractionStatus.EDITED
    ) {
      return false;
    }

    return storageService.updateRecord(id, {
      status: ExtractionStatus.APPROVED,
      approvedBy: approvedBy || 'system',
      approvedAt: new Date(),
      processedAt: new Date(),
    });
  }

  /**
   * Reject an extraction
   */
  reject({
    id,
    rejectedBy,
    reason,
  }: {
    id: string;
    rejectedBy?: string;
    reason?: string;
  }): boolean {
    const record = storageService.getRecord(id);
    if (!record) {
      return false;
    }

    // Can only reject pending or edited records
    if (
      record.status !== ExtractionStatus.PENDING &&
      record.status !== ExtractionStatus.EDITED
    ) {
      return false;
    }

    return storageService.updateRecord(id, {
      status: ExtractionStatus.REJECTED,
      rejectedBy: rejectedBy || 'system',
      rejectedAt: new Date(),
      rejectionReason: reason,
      processedAt: new Date(),
    });
  }

  /**
   * Bulk approve multiple extractions
   */
  bulkApprove({
    ids,
    approvedBy,
  }: {
    ids: string[];
    approvedBy?: string;
  }): { succeeded: string[]; failed: string[] } {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      const success = this.approve({ id, approvedBy });
      if (success) {
        succeeded.push(id);
      } else {
        failed.push(id);
      }
    }

    return { succeeded, failed };
  }

  /**
   * Bulk reject multiple extractions
   */
  bulkReject({
    ids,
    rejectedBy,
    reason,
  }: {
    ids: string[];
    rejectedBy?: string;
    reason?: string;
  }): { succeeded: string[]; failed: string[] } {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      const success = this.reject({ id, rejectedBy, reason });
      if (success) {
        succeeded.push(id);
      } else {
        failed.push(id);
      }
    }

    return { succeeded, failed };
  }

  /**
   * Mark extraction as exported
   */
  markAsExported({
    id,
  }: {
    id: string;
  }): boolean {
    const record = storageService.getRecord(id);
    if (!record) {
      return false;
    }

    // Can only mark approved records as exported
    if (record.status !== ExtractionStatus.APPROVED) {
      return false;
    }

    return storageService.updateRecord(id, {
      status: ExtractionStatus.EXPORTED,
      exportedAt: new Date(),
    });
  }
}

// Singleton instance
export const approvalService = new ApprovalService();

