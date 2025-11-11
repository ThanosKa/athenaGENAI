import {
  ExtractionRecord,
  ExtractionStatus,
  ExtractionStatistics,
  SourceType,
} from '@/types/data';

class StorageService {
  private records: Map<string, ExtractionRecord> = new Map();

  addRecord(record: ExtractionRecord): void {
    this.records.set(record.id, record);
  }

  getRecord(id: string): ExtractionRecord | undefined {
    return this.records.get(id);
  }

  getRecords({
    status,
    sourceType,
    search,
  }: {
    status?: ExtractionStatus;
    sourceType?: SourceType;
    search?: string;
  }   = {}): ExtractionRecord[] {
    let records = Array.from(this.records.values());

    if (status) {
      records = records.filter(r => r.status === status);
    }

    if (sourceType) {
      records = records.filter(r => r.sourceType === sourceType);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter(r => {
        const sourceFileLower = r.sourceFile.toLowerCase();
        const dataStr = JSON.stringify(r.data).toLowerCase();
        return sourceFileLower.includes(searchLower) || dataStr.includes(searchLower);
      });
    }

    records.sort((a, b) => b.extractedAt.getTime() - a.extractedAt.getTime());

    return records;
  }

  updateRecord(id: string, updates: Partial<ExtractionRecord>): boolean {
    const record = this.records.get(id);
    if (!record) {
      return false;
    }

    const updated = { ...record, ...updates };
    this.records.set(id, updated);
    return true;
  }

  deleteRecord(id: string): boolean {
    return this.records.delete(id);
  }

  getStatistics(): ExtractionStatistics {
    const records = Array.from(this.records.values());

    const stats: ExtractionStatistics = {
      total: records.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      exported: 0,
      failed: 0,
      bySource: {
        forms: 0,
        emails: 0,
        invoices: 0,
      },
    };

    for (const record of records) {
      switch (record.status) {
        case ExtractionStatus.PENDING:
          stats.pending++;
          break;
        case ExtractionStatus.APPROVED:
          stats.approved++;
          break;
        case ExtractionStatus.REJECTED:
          stats.rejected++;
          break;
        case ExtractionStatus.EXPORTED:
          stats.exported++;
          break;
        case ExtractionStatus.FAILED:
          stats.failed++;
          break;
      }

      switch (record.sourceType) {
        case SourceType.FORM:
          stats.bySource.forms++;
          break;
        case SourceType.EMAIL:
          stats.bySource.emails++;
          break;
        case SourceType.INVOICE:
          stats.bySource.invoices++;
          break;
      }
    }

    return stats;
  }

  clear(): void {
    this.records.clear();
  }
}

export const storageService = new StorageService();

