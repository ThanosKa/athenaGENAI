import {
  ExtractionStatus,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from '@/types/data';
import { storageService } from '@/lib/services/storage';

type EditableData = ExtractedFormData | ExtractedEmailData | ExtractedInvoiceData;

/**
 * Service for editing extracted data before approval
 */
export class EditService {
  /**
   * Edit an extraction record
   */
  edit({
    id,
    updatedData,
    editedBy,
  }: {
    id: string;
    updatedData: Partial<EditableData>;
    editedBy?: string;
  }): { success: boolean; error?: string } {
    const record = storageService.getRecord(id);
    if (!record) {
      return { success: false, error: 'Record not found' };
    }

    // Can only edit pending, edited, or approved records (before export)
    if (
      record.status !== ExtractionStatus.PENDING &&
      record.status !== ExtractionStatus.EDITED &&
      record.status !== ExtractionStatus.APPROVED
    ) {
      return {
        success: false,
        error: `Cannot edit record with status: ${record.status}`,
      };
    }

    // Validate the updated data based on record type
    const validationError = validateData(updatedData, record.data);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Merge the updated data with existing data
    const mergedData = { ...record.data, ...updatedData };

    // Update the record
    const updated = storageService.updateRecord(id, {
      data: mergedData,
      status: ExtractionStatus.EDITED,
      editedBy: editedBy || 'system',
      editedAt: new Date(),
    });

    if (!updated) {
      return { success: false, error: 'Failed to update record' };
    }

    return { success: true };
  }

  /**
   * Validate field value
   */
  validateField({
    fieldName,
    value,
    recordId,
  }: {
    fieldName: string;
    value: unknown;
    recordId: string;
  }): { valid: boolean; error?: string } {
    const record = storageService.getRecord(recordId);
    if (!record) {
      return { valid: false, error: 'Record not found' };
    }

    // Email validation
    if (fieldName === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, error: 'Invalid email format' };
      }
    }

    // Phone validation (basic)
    if (fieldName === 'phone' && typeof value === 'string') {
      if (value.length < 5) {
        return { valid: false, error: 'Phone number too short' };
      }
    }

    // Numeric fields validation
    if (
      (fieldName === 'netAmount' ||
        fieldName === 'vatAmount' ||
        fieldName === 'totalAmount') &&
      typeof value === 'number'
    ) {
      if (value < 0) {
        return { valid: false, error: 'Amount cannot be negative' };
      }
    }

    return { valid: true };
  }
}

/**
 * Validate updated data structure
 */
function validateData(
  updatedData: Partial<EditableData>,
  originalData: EditableData
): string | undefined {
  // Basic type checking - ensure we're not changing types
  for (const [key, value] of Object.entries(updatedData)) {
    const originalValue = (originalData as unknown as Record<string, unknown>)[key];
    if (originalValue !== undefined && typeof originalValue !== typeof value) {
      return `Type mismatch for field ${key}: expected ${typeof originalValue}, got ${typeof value}`;
    }
  }

  // Email validation
  if ('email' in updatedData && updatedData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updatedData.email as string)) {
      return 'Invalid email format';
    }
  }

  // Numeric validations for invoice data
  if ('netAmount' in updatedData && typeof updatedData.netAmount === 'number') {
    if (updatedData.netAmount < 0) {
      return 'Net amount cannot be negative';
    }
  }

  if ('vatAmount' in updatedData && typeof updatedData.vatAmount === 'number') {
    if (updatedData.vatAmount < 0) {
      return 'VAT amount cannot be negative';
    }
  }

  if ('totalAmount' in updatedData && typeof updatedData.totalAmount === 'number') {
    if (updatedData.totalAmount < 0) {
      return 'Total amount cannot be negative';
    }
  }

  return undefined;
}

// Singleton instance
export const editService = new EditService();

