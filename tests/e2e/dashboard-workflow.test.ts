import { expect } from "@playwright/test";
import { test } from "@/tests/fixtures";
import { ExtractionStatus, SourceType } from "@/types/data";

test.describe("Dashboard Workflow", () => {
  test.beforeEach(async ({ page }) => {
    let postProcessed = false;

    const createMockRecords = (): any[] => {
      const mockRecords: any[] = [];

      for (let i = 1; i <= 5; i++) {
        mockRecords.push({
          id: `form-record-${i}`,
          sourceType: SourceType.FORM,
          sourceFile: `contact_form_${i}.html`,
          status: ExtractionStatus.PENDING,
          extractedAt: new Date().toISOString(),
          data: {
            fullName: `Form User ${i}`,
            email: `form${i}@example.com`,
            phone: `123456789${i}`,
            company: `Company ${i}`,
            service: "Web Development",
            message: "Test message",
            submissionDate: "2024-01-15",
            priority: "high",
          },
          warnings: [],
        });
      }

      for (let i = 1; i <= 10; i++) {
        mockRecords.push({
          id: `email-record-${i}`,
          sourceType: SourceType.EMAIL,
          sourceFile: `email_${i.toString().padStart(2, "0")}.eml`,
          status: ExtractionStatus.PENDING,
          extractedAt: new Date().toISOString(),
          data: {
            from: `sender${i}@example.com`,
            fromEmail: `sender${i}@example.com`,
            to: "recipient@example.com",
            subject: `Test Email ${i}`,
            date: "2024-01-15",
            fullName: `Email User ${i}`,
            email: `email${i}@example.com`,
            phone: `098765432${i}`,
            company: `Email Company ${i}`,
            emailType: "client_inquiry" as const,
            bodyText: "Test email body",
          },
          warnings: [],
        });
      }

      for (let i = 1; i <= 10; i++) {
        mockRecords.push({
          id: `invoice-record-${i}`,
          sourceType: SourceType.INVOICE,
          sourceFile: `invoice_TF-2024-${i.toString().padStart(3, "0")}.html`,
          status: ExtractionStatus.PENDING,
          extractedAt: new Date().toISOString(),
          data: {
            invoiceNumber: `TF-2024-${i.toString().padStart(3, "0")}`,
            date: "2024-01-15",
            customerName: `Invoice Customer ${i}`,
            netAmount: 1000 * i,
            vatRate: 24,
            vatAmount: 240 * i,
            totalAmount: 1240 * i,
            items: [],
          },
          warnings: [],
        });
      }

      return mockRecords;
    };

    let allRecords: any[] = [];

    await page.route("/api/extractions**", async (route) => {
      if (route.request().method() === "POST") {
        postProcessed = true;
        allRecords = createMockRecords();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              summary: { total: 25, forms: 5, emails: 10, invoices: 10 },
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

        let filteredRecords = allRecords;

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

        const pendingCount = filteredRecords.filter(
          (r) => r.status === ExtractionStatus.PENDING
        ).length;
        const approvedCount = filteredRecords.filter(
          (r) => r.status === ExtractionStatus.APPROVED
        ).length;
        const rejectedCount = filteredRecords.filter(
          (r) => r.status === ExtractionStatus.REJECTED
        ).length;
        const exportedCount = filteredRecords.filter(
          (r) => r.status === ExtractionStatus.EXPORTED
        ).length;
        const failedCount = filteredRecords.filter(
          (r) => r.status === ExtractionStatus.FAILED
        ).length;

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: filteredRecords,
              statistics: {
                total: filteredRecords.length,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                exported: exportedCount,
                failed: failedCount,
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

    await page.route("/api/approvals**", async (route) => {
      const body = await route.request().postDataJSON();
      const record = allRecords.find((r) => r.id === body.id);

      if (body.action === "edit") {
        if (record) {
          record.status = ExtractionStatus.EDITED;
          record.data = { ...record.data, ...body.updatedData };
        }
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: record,
            message: "edit successful",
          }),
        });
      } else if (body.action === "approve") {
        if (record) {
          record.status = ExtractionStatus.APPROVED;
        }
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "approve successful",
          }),
        });
      } else if (body.action === "reject") {
        if (record) {
          record.status = ExtractionStatus.REJECTED;
        }
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "reject successful",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: `${body.action} successful`,
          }),
        });
      }
    });

    await page.route("/api/export**", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            spreadsheetId: "test-spreadsheet-id",
            url: "https://docs.google.com/spreadsheets/d/test-spreadsheet-id",
          },
          message: "Export successful",
        }),
      });
    });

    await page.goto("/");
  });

  test("should process data and verify 25 records appear with correct statistics", async ({
    page,
  }) => {
    // Arrange (setup in beforeEach)
    // Act
    const processBtn = page.locator('[data-testid="process-data-btn"]');
    await expect(processBtn).toBeVisible({ timeout: 10000 });
    await processBtn.click();

    await page.waitForLoadState("networkidle");

    // Assert
    await expect(
      page.getByText(/Successfully processed.*records/i)
    ).toBeVisible({ timeout: 10000 });

    const statTotal = page.locator('[data-testid="stat-total"]');
    await expect(statTotal).toBeVisible({ timeout: 10000 });
    await expect(statTotal).toContainText("25", { timeout: 5000 });

    const statPending = page.locator('[data-testid="stat-pending"]');
    await expect(statPending).toBeVisible({ timeout: 10000 });

    const extractionList = page.locator('[data-testid="extraction-list"]');
    await expect(extractionList).toBeVisible({ timeout: 10000 });
  });

  test("should handle API failure during processing and display error toast", async ({
    page,
  }) => {
    // Arrange
    await page.route("/api/extractions**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({
            success: false,
            error: "Failed to process data",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [],
              statistics: {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                exported: 0,
                failed: 0,
                bySource: { forms: 0, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Act
    await page.locator('[data-testid="process-data-btn"]').click();

    // Assert
    await expect(page.getByText(/Failed to process/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
