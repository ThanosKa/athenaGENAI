import { test, expect } from "@playwright/test";
import {
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from "@/types/data";

// Type guard helpers for safe property access
function isFormData(
  data: ExtractedFormData | ExtractedEmailData | ExtractedInvoiceData,
  sourceType: SourceType
): data is ExtractedFormData {
  return sourceType === SourceType.FORM;
}

function isEmailData(
  data: ExtractedFormData | ExtractedEmailData | ExtractedInvoiceData,
  sourceType: SourceType
): data is ExtractedEmailData {
  return sourceType === SourceType.EMAIL;
}

function isInvoiceData(
  data: ExtractedFormData | ExtractedEmailData | ExtractedInvoiceData,
  sourceType: SourceType
): data is ExtractedInvoiceData {
  return sourceType === SourceType.INVOICE;
}

test.describe("Filters and Search", () => {
  test.beforeEach(async ({ page }) => {
    // Create mock records with different statuses and source types
    // Use objects to ensure state persists across route handler calls
    const state = { hasProcessedData: false };
    const mockRecords = [
      {
        id: "record-1",
        sourceType: SourceType.FORM,
        sourceFile: "contact_form_1.html",
        status: ExtractionStatus.PENDING,
        extractedAt: new Date().toISOString(),
        data: {
          fullName: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          company: "Test Company",
          service: "Web Development",
          message: "Test message",
          submissionDate: "2024-01-15",
          priority: "high",
        },
        warnings: [],
      },
      {
        id: "record-2",
        sourceType: SourceType.EMAIL,
        sourceFile: "email_01.eml",
        status: ExtractionStatus.APPROVED,
        extractedAt: new Date().toISOString(),
        data: {
          from: "sender@example.com",
          fromEmail: "sender@example.com",
          to: "recipient@example.com",
          subject: "Test Email",
          date: "2024-01-15",
          fullName: "Jane Smith",
          email: "jane@example.com",
          phone: "0987654321",
          company: "Another Company",
          emailType: "client_inquiry" as const,
          bodyText: "Test email body",
        },
        warnings: [],
      },
      {
        id: "record-3",
        sourceType: SourceType.INVOICE,
        sourceFile: "invoice_TF-2024-001.html",
        status: ExtractionStatus.PENDING,
        extractedAt: new Date().toISOString(),
        data: {
          invoiceNumber: "TF-2024-001",
          date: "2024-01-15",
          customerName: "Invoice Customer",
          netAmount: 1000,
          vatRate: 24,
          vatAmount: 240,
          totalAmount: 1240,
          items: [],
        },
        warnings: [],
      },
    ];

    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "POST") {
        state.hasProcessedData = true;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              summary: { total: 3, forms: 1, emails: 1, invoices: 1 },
              records: {
                forms: [],
                emails: [],
                invoices: [],
              },
            },
          }),
        });
      } else {
        // GET request
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");
        const sourceFilter = url.searchParams.get("sourceType");
        const searchQuery = url.searchParams.get("search");

        let filteredRecords = state.hasProcessedData ? [...mockRecords] : [];

        // Apply status filter
        if (statusFilter && statusFilter !== "all") {
          filteredRecords = filteredRecords.filter(
            (r) => r.status === statusFilter
          );
        }

        // Apply source type filter
        if (sourceFilter && sourceFilter !== "all") {
          filteredRecords = filteredRecords.filter(
            (r) => r.sourceType === sourceFilter
          );
        }

        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredRecords = filteredRecords.filter((r) => {
            // Search in source file name
            if (r.sourceFile.toLowerCase().includes(query)) {
              return true;
            }

            // Search in form data (fullName, email)
            if (isFormData(r.data, r.sourceType)) {
              return (
                r.data.fullName.toLowerCase().includes(query) ||
                r.data.email.toLowerCase().includes(query)
              );
            }

            // Search in email data (fullName, email - both optional)
            if (isEmailData(r.data, r.sourceType)) {
              return (
                r.data.fullName?.toLowerCase().includes(query) ||
                r.data.email?.toLowerCase().includes(query)
              );
            }

            // Search in invoice data (invoiceNumber)
            if (isInvoiceData(r.data, r.sourceType)) {
              return r.data.invoiceNumber.toLowerCase().includes(query);
            }

            return false;
          });
        }

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: filteredRecords,
              statistics: {
                total: filteredRecords.length,
                pending: filteredRecords.filter(
                  (r) => r.status === ExtractionStatus.PENDING
                ).length,
                approved: filteredRecords.filter(
                  (r) => r.status === ExtractionStatus.APPROVED
                ).length,
                rejected: filteredRecords.filter(
                  (r) => r.status === ExtractionStatus.REJECTED
                ).length,
                exported: filteredRecords.filter(
                  (r) => r.status === ExtractionStatus.EXPORTED
                ).length,
                failed: filteredRecords.filter(
                  (r) => r.status === ExtractionStatus.FAILED
                ).length,
                bySource: {
                  forms: filteredRecords.filter(
                    (r) => r.sourceType === SourceType.FORM
                  ).length,
                  emails: filteredRecords.filter(
                    (r) => r.sourceType === SourceType.EMAIL
                  ).length,
                  invoices: filteredRecords.filter(
                    (r) => r.sourceType === SourceType.INVOICE
                  ).length,
                },
              },
            },
          }),
        });
      }
    });

    await page.goto("/");

    // Process data first
    await page.locator('[data-testid="process-data-btn"]').click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should filter records by status showing only pending records", async ({
    page,
  }) => {
    // Click status filter
    await page.locator('[data-testid="filter-status-select"]').click();

    // Select Pending
    await page.locator("text=Pending").click();

    // Wait for filtered results
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Verify only pending records are shown (2 records: record-1 and record-3)
    const rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(2);

    // Verify both have pending status
    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Pending");
    await expect(
      page.locator('[data-testid="status-badge-record-3"]')
    ).toContainText("Pending");
  });

  test("should filter records by source type showing only forms", async ({
    page,
  }) => {
    // Click source type filter
    await page.locator('[data-testid="filter-source-select"]').click();

    // Select Forms
    await page.locator("text=Forms").click();

    // Wait for filtered results
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Verify only form records are shown (1 record: record-1)
    const rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(1);

    // Verify it's the form record
    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible();
  });

  test("should search records by query and filter results", async ({
    page,
  }) => {
    // Type in search input
    await page.locator('[data-testid="search-input"]').fill("John");

    // Wait for filtered results
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Verify only matching record is shown
    const rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(1);

    // Verify it's the correct record
    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible();

    // Clear search and verify all records appear
    await page.locator('[data-testid="search-input"]').clear();
    await expect(rows).toHaveCount(3);
  });

  test("should combine filters and search to narrow results", async ({
    page,
  }) => {
    // Set status filter to Pending
    await page.locator('[data-testid="filter-status-select"]').click();
    await page.locator("text=Pending").click();

    // Set source filter to Form
    await page.locator('[data-testid="filter-source-select"]').click();
    await page.locator("text=Forms").click();

    // Add search query
    await page.locator('[data-testid="search-input"]').fill("John");

    // Wait for filtered results
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Should show only record-1 (pending form with "John")
    const rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(1);
    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible();
  });

  test('should reset filters when changing back to "All"', async ({ page }) => {
    // Apply filters
    await page.locator('[data-testid="filter-status-select"]').click();
    await page.locator("text=Pending").click();

    // Verify filtered results
    let rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(2);

    // Reset to "All"
    await page.locator('[data-testid="filter-status-select"]').click();
    await page.locator("text=All").click();

    // Verify all records are shown again
    await expect(rows).toHaveCount(3);
  });
});
