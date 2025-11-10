import { test, expect } from "@playwright/test";
import { ExtractionStatus, SourceType } from "@/types/data";

test.describe("Dashboard Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "POST") {
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
            status: ExtractionStatus.PENDING,
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
        ];

        const filteredRecords =
          statusFilter && statusFilter !== "all"
            ? mockRecords.filter((r) => r.status === statusFilter)
            : mockRecords;

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

    await page.route("/api/approvals", async (route) => {
      const body = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: `${body.action} successful`,
        }),
      });
    });

    await page.route("/api/export", async (route) => {
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
    // Click process data button
    await page.locator('[data-testid="process-data-btn"]').click();

    // Wait for success toast (sonner toast appears)
    await expect(
      page
        .locator('[role="status"]')
        .filter({ hasText: /Successfully processed/i })
    ).toBeVisible({ timeout: 5000 });

    // Verify statistics update
    await expect(page.locator('[data-testid="stat-total"]')).toContainText(
      "25"
    );
    await expect(page.locator('[data-testid="stat-pending"]')).toBeVisible();

    // Verify extraction list appears
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();
  });

  test("should complete full workflow: process → view → approve → export", async ({
    page,
  }) => {
    // Process data
    await page.locator('[data-testid="process-data-btn"]').click();
    await expect(
      page
        .locator('[role="status"]')
        .filter({ hasText: /Successfully processed/i })
    ).toBeVisible({ timeout: 5000 });

    // Wait for records to appear
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Open actions menu for first record
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    // View record
    await page.locator('[data-testid="view-record-btn-record-1"]').click();
    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).toBeVisible();

    // Approve from dialog
    await page.locator('[data-testid="approve-btn"]').click();

    // Dialog should close and record status should update
    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Approved");

    // Verify approved count increased
    await expect(page.locator('[data-testid="stat-approved"]')).toContainText(
      "1"
    );

    // Export
    await page.locator('[data-testid="export-btn"]').click();
    await expect(
      page
        .locator('[role="status"]')
        .filter({ hasText: /exported successfully/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("should complete edit workflow: view → enable edit → modify → save → verify", async ({
    page,
  }) => {
    // Process data first
    await page.locator('[data-testid="process-data-btn"]').click();
    await expect(page.locator("text=/Successfully processed/i")).toBeVisible({
      timeout: 5000,
    });

    // Open actions menu
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    // View record
    await page.locator('[data-testid="view-record-btn-record-1"]').click();
    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).toBeVisible();

    // Enable edit mode
    await page.locator('[data-testid="enable-edit-btn"]').click();

    // Modify a field
    const nameInput = page.locator('[data-testid="field-fullName"]');
    await nameInput.clear();
    await nameInput.fill("Updated Name");

    // Save changes
    await page.locator('[data-testid="save-edit-btn"]').click();

    // Wait for success message
    await expect(
      page
        .locator('[role="status"]')
        .filter({ hasText: /updated successfully/i })
    ).toBeVisible({ timeout: 5000 });

    // Dialog should still be open
    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).toBeVisible();

    // Verify field is updated (should be in view mode after save)
    await expect(nameInput).toHaveValue("Updated Name");
  });

  test("should complete reject workflow: view → reject → verify status change", async ({
    page,
  }) => {
    // Process data
    await page.locator('[data-testid="process-data-btn"]').click();
    await expect(
      page
        .locator('[role="status"]')
        .filter({ hasText: /Successfully processed/i })
    ).toBeVisible({ timeout: 5000 });

    // Open actions menu
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    // View record
    await page.locator('[data-testid="view-record-btn-record-1"]').click();
    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).toBeVisible();

    // Reject from dialog
    await page.locator('[data-testid="reject-btn"]').click();

    // Dialog should close
    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).not.toBeVisible();

    // Verify status changed to rejected
    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Rejected");

    // Verify rejected count increased
    await expect(page.locator('[data-testid="stat-pending"]')).toContainText(
      "1"
    ); // One less pending
  });

  test("should handle API failure during processing and display error toast", async ({
    page,
  }) => {
    // Override route to return error
    await page.route("/api/extractions", async (route) => {
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

    // Click process data button
    await page.locator('[data-testid="process-data-btn"]').click();

    // Verify error toast appears
    await expect(
      page.locator('[role="status"]').filter({ hasText: /Failed to process/i })
    ).toBeVisible({ timeout: 5000 });
  });
});
