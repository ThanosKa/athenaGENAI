import { expect } from "@playwright/test";
import { test } from "@/tests/fixtures";
import {
  ExtractionStatus,
  SourceType,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from "@/types/data";

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

    await page.route("/api/extractions**", async (route) => {
      if (route.request().method() === "POST") {
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
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");
        const sourceFilter = url.searchParams.get("sourceType");
        const searchQuery = url.searchParams.get("search");

        let filteredRecords = [...mockRecords];

        if (statusFilter && statusFilter !== "all") {
          filteredRecords = filteredRecords.filter(
            (r) => r.status === statusFilter
          );
        }

        if (sourceFilter && sourceFilter !== "all") {
          filteredRecords = filteredRecords.filter(
            (r) => r.sourceType === sourceFilter
          );
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredRecords = filteredRecords.filter((r) => {
            if (r.sourceFile.toLowerCase().includes(query)) {
              return true;
            }

            if (isFormData(r.data, r.sourceType)) {
              return (
                r.data.fullName.toLowerCase().includes(query) ||
                r.data.email.toLowerCase().includes(query)
              );
            }

            if (isEmailData(r.data, r.sourceType)) {
              return (
                r.data.fullName?.toLowerCase().includes(query) ||
                r.data.email?.toLowerCase().includes(query)
              );
            }

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

    await page.locator('[data-testid="process-data-btn"]').click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should filter records by status showing only pending records", async ({
    page,
  }) => {
    await page.locator('[data-testid="filter-status-select"]').click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Pending' }).click();

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    const rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(2);

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
    await page.locator('[data-testid="filter-source-select"]').click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Forms' }).click();

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    const rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(1);

    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible();
  });

  test("should search records by query and filter results", async ({
    page,
  }) => {
    await page.locator('[data-testid="search-input"]').fill("John");

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    const rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(1);

    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible();

    await page.locator('[data-testid="search-input"]').clear();
    await expect(rows).toHaveCount(3);
  });

  test("should combine filters and search to narrow results", async ({
    page,
  }) => {
    await page.locator('[data-testid="filter-status-select"]').click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Pending' }).click();

    await page.locator('[data-testid="filter-source-select"]').click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Forms' }).click();

    await page.locator('[data-testid="search-input"]').fill("John");

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    const rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(1);
    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible();
  });

  test('should reset filters when changing back to "All"', async ({ page }) => {
    await page.locator('[data-testid="filter-status-select"]').click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Pending' }).click();

    let rows = page.locator('[data-testid^="record-row-"]');
    await expect(rows).toHaveCount(2);

    await page.locator('[data-testid="filter-status-select"]').click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'All' }).click();

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    await expect(rows).toHaveCount(3);
  });
});
