import { describe, it, expect, beforeEach, vi } from "vitest";
import { dataProcessor } from "@/lib/services/data-processor";
import { storageService } from "@/lib/services/storage";
import { promises as fs, type PathLike } from "fs";
import path from "path";

// Mock extractors BEFORE importing
vi.mock("@/lib/extractors/form-extractor", () => ({
  extractFormData: vi.fn(),
}));

vi.mock("@/lib/extractors/email-extractor", () => ({
  extractEmailData: vi.fn(),
}));

vi.mock("@/lib/extractors/invoice-extractor", () => ({
  extractInvoiceData: vi.fn(),
}));

import { extractFormData } from "@/lib/extractors/form-extractor";
import { extractEmailData } from "@/lib/extractors/email-extractor";
import { extractInvoiceData } from "@/lib/extractors/invoice-extractor";
import { ExtractionStatus, SourceType } from "@/types/data";

// Mock fs module
vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
    readdir: vi.fn(),
  },
}));

describe("DataProcessor", () => {
  // Helper function to create readdir mock implementation
  // Matches the overload: readdir(path: PathLike): Promise<string[]>
  const createReaddirMock = (dir: PathLike): Promise<string[]> => {
    const dirStr = String(dir);
    if (dirStr.includes("forms")) {
      return Promise.resolve(["contact_form_1.html", "contact_form_2.html"]);
    }
    if (dirStr.includes("emails")) {
      return Promise.resolve(["email_01.eml", "email_02.eml"]);
    }
    if (dirStr.includes("invoices")) {
      return Promise.resolve([
        "invoice_TF-2024-001.html",
        "invoice_TF-2024-002.html",
      ]);
    }
    return Promise.resolve([]);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storageService.clear();
  });

  it("should process form file successfully", async () => {
    const mockFormData = {
      success: true,
      data: {
        fullName: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        company: "Test Company",
        service: "Service 1",
        message: "Test message",
        submissionDate: "2024-01-15",
        priority: "high",
      },
      warnings: [],
    };

    vi.mocked(extractFormData).mockReturnValue(mockFormData);
    vi.mocked(fs.readFile).mockResolvedValue("<html>form content</html>");

    const record = await dataProcessor.processForm({
      filePath: "/path/to/form.html",
      fileName: "form_1.html",
    });

    expect(record.sourceType).toBe(SourceType.FORM);
    expect(record.sourceFile).toBe("form_1.html");
    expect(record.status).toBe(ExtractionStatus.PENDING);
    expect(record.data).toBeDefined();
    expect(storageService.getRecord(record.id)).toBeDefined();
  });

  it("should process email file successfully", async () => {
    const mockEmailData = {
      success: true,
      data: {
        from: "sender@example.com",
        fromEmail: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        date: "2024-01-20T10:30:00Z",
        emailType: "client_inquiry" as const,
        bodyText: "Test body",
        fullName: "Test User",
        email: "test@example.com",
      },
      warnings: [],
    };

    vi.mocked(extractEmailData).mockResolvedValue(mockEmailData);
    vi.mocked(fs.readFile).mockResolvedValue("From: sender@example.com");

    const record = await dataProcessor.processEmail({
      filePath: "/path/to/email.eml",
      fileName: "email_1.eml",
    });

    expect(record.sourceType).toBe(SourceType.EMAIL);
    expect(record.sourceFile).toBe("email_1.eml");
    expect(record.status).toBe(ExtractionStatus.PENDING);
  });

  it("should process invoice file successfully", async () => {
    const mockInvoiceData = {
      success: true,
      data: {
        invoiceNumber: "TF-2024-001",
        date: "21/01/2024",
        customerName: "Test Customer",
        netAmount: 1000,
        vatRate: 24,
        vatAmount: 240,
        totalAmount: 1240,
        items: [],
      },
      warnings: [],
    };

    vi.mocked(extractInvoiceData).mockReturnValue(mockInvoiceData);
    vi.mocked(fs.readFile).mockResolvedValue("<html>invoice content</html>");

    const record = await dataProcessor.processInvoice({
      filePath: "/path/to/invoice.html",
      fileName: "invoice_1.html",
    });

    expect(record.sourceType).toBe(SourceType.INVOICE);
    expect(record.sourceFile).toBe("invoice_1.html");
    expect(record.status).toBe(ExtractionStatus.PENDING);
  });

  it("should mark record as failed when extraction fails", async () => {
    const mockFormData = {
      success: false,
      error: "Failed to parse form",
    };

    vi.mocked(extractFormData).mockReturnValue(mockFormData);
    vi.mocked(fs.readFile).mockResolvedValue("<html>invalid</html>");

    const record = await dataProcessor.processForm({
      filePath: "/path/to/form.html",
      fileName: "form_error.html",
    });

    expect(record.status).toBe(ExtractionStatus.FAILED);
    expect(record.error).toBe("Failed to parse form");
  });

  it("should process all dummy data files", async () => {
    // Mock file system - use the helper function
    // Access the mock directly since fs.readdir is already a vi.fn()
    (fs.readdir as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      createReaddirMock
    );

    vi.mocked(fs.readFile).mockResolvedValue("file content");

    // Mock extractors
    vi.mocked(extractFormData).mockReturnValue({
      success: true,
      data: {
        fullName: "Test",
        email: "test@example.com",
        phone: "123",
        company: "Company",
        service: "Service",
        message: "",
        submissionDate: "",
        priority: "",
      },
      warnings: [],
    });

    vi.mocked(extractEmailData).mockResolvedValue({
      success: true,
      data: {
        from: "sender@example.com",
        fromEmail: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test",
        date: "2024-01-20T10:30:00Z",
        emailType: "client_inquiry" as const,
        bodyText: "Test",
      },
      warnings: [],
    });

    vi.mocked(extractInvoiceData).mockReturnValue({
      success: true,
      data: {
        invoiceNumber: "TF-2024-001",
        date: "21/01/2024",
        customerName: "Customer",
        netAmount: 1000,
        vatRate: 24,
        vatAmount: 240,
        totalAmount: 1240,
        items: [],
      },
      warnings: [],
    });

    const result = await dataProcessor.processAllDummyData();

    expect(result.forms.length).toBe(2);
    expect(result.emails.length).toBe(2);
    expect(result.invoices.length).toBe(2);
    expect(storageService.getStatistics().total).toBe(6);
  });

  it("should handle mixed success/failure scenarios", async () => {
    // Mock file system to return only form files
    // Access the mock directly since fs.readdir is already a vi.fn()
    (fs.readdir as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (dir: PathLike): Promise<string[]> => {
        const dirStr = String(dir);
        if (dirStr.includes("forms")) {
          return Promise.resolve(["form_1.html", "form_2.html"]);
        }
        // Return empty arrays for emails and invoices
        return Promise.resolve([]);
      }
    );

    vi.mocked(extractFormData)
      .mockReturnValueOnce({
        success: true,
        data: {
          fullName: "Test",
          email: "test@example.com",
          phone: "123",
          company: "Company",
          service: "Service",
          message: "",
          submissionDate: "",
          priority: "",
        },
        warnings: [],
      })
      .mockReturnValueOnce({
        success: false,
        error: "Failed to parse",
      });

    vi.mocked(fs.readFile).mockResolvedValue("content");

    const result = await dataProcessor.processAllDummyData();

    expect(result.forms.length).toBe(2);
    expect(result.emails.length).toBe(0);
    expect(result.invoices.length).toBe(0);
    const records = storageService.getRecords();
    const successCount = records.filter(
      (r) => r.status === ExtractionStatus.PENDING
    ).length;
    const failCount = records.filter(
      (r) => r.status === ExtractionStatus.FAILED
    ).length;
    expect(successCount).toBe(1);
    expect(failCount).toBe(1);
  });
});
