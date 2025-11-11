import { describe, it, expect, beforeEach } from "vitest";
import { editService } from "@/lib/services/edit-service";
import { storageService } from "@/lib/services/storage";
import {
  ExtractionRecord,
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from "@/types/data";

describe("EditService", () => {
  beforeEach(() => {
    storageService.clear();
  });

  it("should update extraction data fields", () => {
    const record: ExtractionRecord = {
      id: "edit-1",
      sourceType: SourceType.FORM,
      sourceFile: "form_1.html",
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {
        fullName: "Original Name",
        email: "original@example.com",
        phone: "1234567890",
        company: "Original Company",
        service: "Service 1",
        message: "Original message",
        submissionDate: "2024-01-15",
        priority: "low",
      } as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);

    const result = editService.edit({
      id: "edit-1",
      updatedData: {
        fullName: "Updated Name",
        email: "updated@example.com",
      },
      editedBy: "admin",
    });

    expect(result.success).toBe(true);
    const updated = storageService.getRecord("edit-1");
    expect((updated?.data as ExtractedFormData).fullName).toBe("Updated Name");
    expect((updated?.data as ExtractedFormData).email).toBe(
      "updated@example.com"
    );
    expect(updated?.status).toBe(ExtractionStatus.EDITED);
    expect(updated?.editedBy).toBe("admin");
    expect(updated?.editedAt).toBeDefined();
  });

  it("should validate required fields", () => {
    const record: ExtractionRecord = {
      id: "validate-1",
      sourceType: SourceType.FORM,
      sourceFile: "form_1.html",
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {
        fullName: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        company: "Company",
        service: "Service",
        message: "",
        submissionDate: "",
        priority: "",
      } as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);

    const result = editService.edit({
      id: "validate-1",
      updatedData: {
        email: "invalid-email-format",
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid email format");
  });

  it("should handle partial updates", () => {
    const record: ExtractionRecord = {
      id: "partial-1",
      sourceType: SourceType.FORM,
      sourceFile: "form_1.html",
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {
        fullName: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        company: "Original Company",
        service: "Service",
        message: "",
        submissionDate: "",
        priority: "",
      } as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);

    const result = editService.edit({
      id: "partial-1",
      updatedData: {
        company: "Updated Company",
      },
    });

    expect(result.success).toBe(true);
    const updated = storageService.getRecord("partial-1");
    expect((updated?.data as ExtractedFormData).company).toBe(
      "Updated Company"
    );
    expect((updated?.data as ExtractedFormData).fullName).toBe("Test User");
    expect((updated?.data as ExtractedFormData).email).toBe("test@example.com");
  });

  it("should return error for record not found", () => {
    const result = editService.edit({
      id: "non-existent",
      updatedData: { fullName: "Test" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Record not found");
  });

  it("should not edit exported records", () => {
    const record: ExtractionRecord = {
      id: "exported-1",
      sourceType: SourceType.FORM,
      sourceFile: "form_1.html",
      status: ExtractionStatus.EXPORTED,
      extractedAt: new Date(),
      data: {} as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);

    const result = editService.edit({
      id: "exported-1",
      updatedData: { fullName: "Test" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot edit record with status");
  });

  it("should validate email field format", () => {
    const record: ExtractionRecord = {
      id: "email-validate",
      sourceType: SourceType.FORM,
      sourceFile: "form_1.html",
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {
        fullName: "Test",
        email: "test@example.com",
        phone: "123",
        company: "Company",
        service: "Service",
        message: "",
        submissionDate: "",
        priority: "",
      } as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);

    const result = editService.validateField({
      fieldName: "email",
      value: "invalid-email",
      recordId: "email-validate",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid email format");
  });

  it("should validate phone field length", () => {
    const record: ExtractionRecord = {
      id: "phone-validate",
      sourceType: SourceType.FORM,
      sourceFile: "form_1.html",
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {
        fullName: "Test",
        email: "test@example.com",
        phone: "1234567890",
        company: "Company",
        service: "Service",
        message: "",
        submissionDate: "",
        priority: "",
      } as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);

    const result = editService.validateField({
      fieldName: "phone",
      value: "123",
      recordId: "phone-validate",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Phone number too short");
  });

  it("should validate numeric fields for invoice data", () => {
    const record: ExtractionRecord = {
      id: "invoice-validate",
      sourceType: SourceType.INVOICE,
      sourceFile: "invoice_1.html",
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
      data: {
        invoiceNumber: "TF-2024-001",
        date: "21/01/2024",
        customerName: "Customer",
        netAmount: 1000,
        vatRate: 24,
        vatAmount: 240,
        totalAmount: 1240,
        items: [],
      } as ExtractedInvoiceData,
      warnings: [],
    };

    storageService.addRecord(record);

    const result = editService.validateField({
      fieldName: "netAmount",
      value: -100,
      recordId: "invoice-validate",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Amount cannot be negative");
  });

  it("should allow editing approved records", () => {
    const record: ExtractionRecord = {
      id: "approved-edit",
      sourceType: SourceType.FORM,
      sourceFile: "form_1.html",
      status: ExtractionStatus.APPROVED,
      extractedAt: new Date(),
      data: {
        fullName: "Test",
        email: "test@example.com",
        phone: "1234567890",
        company: "Company",
        service: "Service",
        message: "",
        submissionDate: "",
        priority: "",
      } as ExtractedFormData,
      warnings: [],
    };

    storageService.addRecord(record);

    const result = editService.edit({
      id: "approved-edit",
      updatedData: { fullName: "Updated Name" },
    });

    expect(result.success).toBe(true);
    const updated = storageService.getRecord("approved-edit");
    expect(updated?.status).toBe(ExtractionStatus.EDITED);
  });
});
