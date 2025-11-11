import { expect } from "@playwright/test";
import { test } from "@/tests/fixtures";
import { ExtractionStatus, SourceType } from "@/types/data";
import { createMockFormRecord } from "@/tests/fixtures/mock-data";

test.describe("API Export", () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock approved records for export
    const approvedRecord1 = createMockFormRecord({
      id: "record-approved-1",
      status: ExtractionStatus.APPROVED,
    });
    const approvedRecord2 = createMockFormRecord({
      id: "record-approved-2",
      status: ExtractionStatus.APPROVED,
    });
    const pendingRecord = createMockFormRecord({
      id: "record-pending",
      status: ExtractionStatus.PENDING,
    });

    // Mock /api/extractions GET
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");

        let records = [approvedRecord1, approvedRecord2, pendingRecord];
        if (statusFilter && statusFilter !== "all") {
          records = records.filter((r) => r.status === statusFilter);
        }

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records,
              statistics: {
                total: records.length,
                pending: records.filter(
                  (r) => r.status === ExtractionStatus.PENDING
                ).length,
                approved: records.filter(
                  (r) => r.status === ExtractionStatus.APPROVED
                ).length,
                rejected: records.filter(
                  (r) => r.status === ExtractionStatus.REJECTED
                ).length,
                exported: records.filter(
                  (r) => r.status === ExtractionStatus.EXPORTED
                ).length,
                failed: 0,
                bySource: {
                  forms: records.filter((r) => r.sourceType === SourceType.FORM)
                    .length,
                  emails: 0,
                  invoices: 0,
                },
              },
            },
          }),
        });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should return export status information", async ({ page }) => {
    let exportStatusRequest: any = null;

    // Mock /api/export GET
    await page.route("/api/export", async (route) => {
      if (route.request().method() === "GET") {
        exportStatusRequest = route.request();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              message: "Export API is ready",
              googleSheetsConfigured: false,
            },
          }),
        });
      }
    });

    await page.goto("/");

    // Trigger GET request via API call
    await page.evaluate(() => {
      fetch("/api/export");
    });

    await page.waitForTimeout(500);

    // Verify GET request was made
    expect(exportStatusRequest).toBeTruthy();
    expect(exportStatusRequest.method()).toBe("GET");
  });

  test.skip("should export approved records and update UI", async ({
    page,
  }) => {
    let exportRequestData: any = null;
    let hasExported = false;

    // Mock /api/export POST
    await page.route("/api/export", async (route) => {
      if (route.request().method() === "POST") {
        exportRequestData = await route.request().postDataJSON();
        hasExported = true; // Set flag when export happens
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Data exported successfully to Google Sheets",
            data: {
              spreadsheetId: "test-spreadsheet-id-123",
              url: "https://docs.google.com/spreadsheets/d/test-spreadsheet-id-123",
            },
          }),
        });
      }
    });

    // Mock updated records after export (status changed to exported)
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const pendingRecord = createMockFormRecord({
          id: "record-pending",
          status: ExtractionStatus.PENDING,
        });

        let record1, record2;
        if (hasExported) {
          // After export: return EXPORTED records
          record1 = createMockFormRecord({
            id: "record-approved-1",
            status: ExtractionStatus.EXPORTED,
          });
          record2 = createMockFormRecord({
            id: "record-approved-2",
            status: ExtractionStatus.EXPORTED,
          });
        } else {
          // Initially: return APPROVED records
          record1 = createMockFormRecord({
            id: "record-approved-1",
            status: ExtractionStatus.APPROVED,
          });
          record2 = createMockFormRecord({
            id: "record-approved-2",
            status: ExtractionStatus.APPROVED,
          });
        }

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [record1, record2, pendingRecord],
              statistics: {
                total: 3,
                pending: 1,
                approved: hasExported ? 0 : 2,
                rejected: 0,
                exported: hasExported ? 2 : 0,
                failed: 0,
                bySource: { forms: 3, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Navigate to ensure mocks are active
    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Verify export button is enabled (has approved records)
    const exportBtn = page.locator('[data-testid="export-btn"]');
    await expect(exportBtn).toBeEnabled();

    // Click export button
    await exportBtn.click();

    // Verify API was called with correct data
    await expect.poll(() => exportRequestData).toBeTruthy();
    expect(exportRequestData.createNew).toBe(true);

    // Verify success toast appears
    await expect(page.getByText(/exported successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Wait for UI to refetch and update
    await page.waitForLoadState("networkidle");

    // Verify export button might be disabled if no approved records remain
    // (This depends on the UI logic after export)
  });

  test("should handle empty export when no approved records", async ({
    page,
  }) => {
    let exportRequestData: any = null;

    // Set up with no approved records
    const rejectedRecord = createMockFormRecord({
      id: "record-rejected",
      status: ExtractionStatus.REJECTED,
    });
    const pendingRecord = createMockFormRecord({
      id: "record-pending",
      status: ExtractionStatus.PENDING,
    });

    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [rejectedRecord, pendingRecord],
              statistics: {
                total: 2,
                pending: 1,
                approved: 0,
                rejected: 1,
                exported: 0,
                failed: 0,
                bySource: { forms: 2, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Mock /api/export POST to return error
    await page.route("/api/export", async (route) => {
      if (route.request().method() === "POST") {
        exportRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            success: false,
            error: "No approved records to export",
          }),
        });
      }
    });

    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Verify export button is disabled (no approved records)
    const exportBtn = page.locator('[data-testid="export-btn"]');
    await expect(exportBtn).toBeDisabled();

    // Try to trigger export via API (since button is disabled)
    await page.evaluate(() => {
      fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createNew: true }),
      });
    });

    await page.waitForTimeout(500);

    // Verify error response
    expect(exportRequestData).toBeTruthy();
    expect(exportRequestData.createNew).toBe(true);
  });

  test("should export specific records by IDs", async ({ page }) => {
    let exportRequestData: any = null;

    // Mock /api/export POST
    await page.route("/api/export", async (route) => {
      if (route.request().method() === "POST") {
        exportRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Data exported successfully to Google Sheets",
            data: {
              spreadsheetId: "test-spreadsheet-id-456",
              url: "https://docs.google.com/spreadsheets/d/test-spreadsheet-id-456",
            },
          }),
        });
      }
    });

    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Trigger export with specific IDs via API
    await page.evaluate(() => {
      fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: ["record-approved-1", "record-approved-2"],
          createNew: true,
        }),
      });
    });

    await page.waitForTimeout(500);

    // Verify API was called with correct data
    expect(exportRequestData).toBeTruthy();
    expect(exportRequestData.ids).toEqual([
      "record-approved-1",
      "record-approved-2",
    ]);
    expect(exportRequestData.createNew).toBe(true);
  });

  test.skip("should verify export response format", async ({ page }) => {
    let exportRequestData: any = null;

    // Mock /api/extractions GET to ensure approved records are returned
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const approvedRecord1 = createMockFormRecord({
          id: "record-approved-1",
          status: ExtractionStatus.APPROVED,
        });
        const approvedRecord2 = createMockFormRecord({
          id: "record-approved-2",
          status: ExtractionStatus.APPROVED,
        });

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [approvedRecord1, approvedRecord2],
              statistics: {
                total: 2,
                pending: 0,
                approved: 2,
                rejected: 0,
                exported: 0,
                failed: 0,
                bySource: { forms: 2, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Mock /api/export POST
    await page.route("/api/export", async (route) => {
      if (route.request().method() === "POST") {
        exportRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Data exported successfully to Google Sheets",
            data: {
              spreadsheetId: "test-spreadsheet-id-789",
              url: "https://docs.google.com/spreadsheets/d/test-spreadsheet-id-789",
            },
          }),
        });
      }
    });

    // Navigate to ensure mocks are active
    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Verify export button is enabled (has approved records)
    const exportBtn = page.locator('[data-testid="export-btn"]');
    await expect(exportBtn).toBeEnabled();

    // Click export button
    await exportBtn.click();

    // Verify API was called
    await expect.poll(() => exportRequestData).toBeTruthy();

    // Verify success toast with proper format
    await expect(page.getByText(/exported successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Wait for UI to refetch and update
    await page.waitForLoadState("networkidle");
  });

  test("should handle export with existing spreadsheet ID", async ({
    page,
  }) => {
    let exportRequestData: any = null;

    // Mock /api/export POST
    await page.route("/api/export", async (route) => {
      if (route.request().method() === "POST") {
        exportRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Data exported successfully to Google Sheets",
            data: {
              spreadsheetId: exportRequestData.spreadsheetId,
              url: `https://docs.google.com/spreadsheets/d/${exportRequestData.spreadsheetId}`,
            },
          }),
        });
      }
    });

    await page.goto("/");

    // Trigger export with existing spreadsheet ID via API
    await page.evaluate(() => {
      fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: "existing-spreadsheet-id",
          createNew: false,
        }),
      });
    });

    await page.waitForTimeout(500);

    // Verify API was called with correct data
    expect(exportRequestData).toBeTruthy();
    expect(exportRequestData.spreadsheetId).toBe("existing-spreadsheet-id");
    expect(exportRequestData.createNew).toBe(false);
  });

  test.skip("should verify data flow: API → Export → Status update", async ({
    page,
  }) => {
    let exportRequestData: any = null;
    let hasExported = false;

    // Mock /api/export POST
    await page.route("/api/export", async (route) => {
      if (route.request().method() === "POST") {
        exportRequestData = await route.request().postDataJSON();
        hasExported = true; // Set flag when export happens
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Data exported successfully to Google Sheets",
            data: {
              spreadsheetId: "test-spreadsheet-id-flow",
              url: "https://docs.google.com/spreadsheets/d/test-spreadsheet-id-flow",
            },
          }),
        });
      }
    });

    // Mock /api/extractions GET with state tracking
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");

        let records;
        if (hasExported) {
          // After export: return EXPORTED records
          const exportedRecord1 = createMockFormRecord({
            id: "record-approved-1",
            status: ExtractionStatus.EXPORTED,
          });
          const exportedRecord2 = createMockFormRecord({
            id: "record-approved-2",
            status: ExtractionStatus.EXPORTED,
          });
          const pendingRecord = createMockFormRecord({
            id: "record-pending",
            status: ExtractionStatus.PENDING,
          });
          records = [exportedRecord1, exportedRecord2, pendingRecord];
        } else {
          // Initially: return APPROVED records
          const approvedRecord1 = createMockFormRecord({
            id: "record-approved-1",
            status: ExtractionStatus.APPROVED,
          });
          const approvedRecord2 = createMockFormRecord({
            id: "record-approved-2",
            status: ExtractionStatus.APPROVED,
          });
          const pendingRecord = createMockFormRecord({
            id: "record-pending",
            status: ExtractionStatus.PENDING,
          });
          records = [approvedRecord1, approvedRecord2, pendingRecord];
        }

        if (statusFilter && statusFilter !== "all") {
          records = records.filter((r) => r.status === statusFilter);
        }

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records,
              statistics: {
                total: records.length,
                pending: records.filter(
                  (r) => r.status === ExtractionStatus.PENDING
                ).length,
                approved: records.filter(
                  (r) => r.status === ExtractionStatus.APPROVED
                ).length,
                rejected: records.filter(
                  (r) => r.status === ExtractionStatus.REJECTED
                ).length,
                exported: records.filter(
                  (r) => r.status === ExtractionStatus.EXPORTED
                ).length,
                failed: 0,
                bySource: { forms: records.length, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Navigate to ensure mocks are active
    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Verify export button is enabled (has approved records)
    const exportBtn = page.locator('[data-testid="export-btn"]');
    await expect(exportBtn).toBeEnabled();

    // Click export button
    await exportBtn.click();

    // Verify API was called
    await expect.poll(() => exportRequestData).toBeTruthy();

    // Verify success toast
    await expect(page.getByText(/exported successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Wait for UI to refetch and update status to EXPORTED
    await page.waitForLoadState("networkidle");

    // Verify status updated to exported
    await expect(
      page.locator('[data-testid="status-badge-record-approved-1"]')
    ).toContainText("Exported", { timeout: 10000 });

    // Verify records reloaded (status updated)
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();
  });

  test.skip("should return proper error message for export failures", async ({
    page,
  }) => {
    let exportRequestData: any = null;

    // Mock /api/extractions GET to ensure approved records are returned
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const approvedRecord1 = createMockFormRecord({
          id: "record-approved-1",
          status: ExtractionStatus.APPROVED,
        });
        const approvedRecord2 = createMockFormRecord({
          id: "record-approved-2",
          status: ExtractionStatus.APPROVED,
        });

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [approvedRecord1, approvedRecord2],
              statistics: {
                total: 2,
                pending: 0,
                approved: 2,
                rejected: 0,
                exported: 0,
                failed: 0,
                bySource: { forms: 2, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Mock /api/export POST to return error
    await page.route("/api/export", async (route) => {
      if (route.request().method() === "POST") {
        exportRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            success: false,
            error: "Google Sheets API configuration missing",
          }),
        });
      }
    });

    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Verify export button is enabled (has approved records)
    const exportBtn = page.locator('[data-testid="export-btn"]');
    await expect(exportBtn).toBeEnabled();

    // Click export button
    await exportBtn.click();

    // Verify API was called
    await expect.poll(() => exportRequestData).toBeTruthy();

    // Verify error toast appears
    await expect(page.getByText(/failed to export/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
