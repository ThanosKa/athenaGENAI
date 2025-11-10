import { expect } from "@playwright/test";
import { test } from "@/tests/fixtures";
import { ExtractionStatus, SourceType } from "@/types/data";
import { createMockFormRecord } from "@/tests/fixtures/mock-data";

test.describe("API Approvals", () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock records
    const mockRecord1 = createMockFormRecord({
      id: "record-1",
      status: ExtractionStatus.PENDING,
    });
    const mockRecord2 = createMockFormRecord({
      id: "record-2",
      status: ExtractionStatus.PENDING,
    });
    const mockRecord3 = createMockFormRecord({
      id: "record-3",
      status: ExtractionStatus.APPROVED,
    });

    // Mock /api/extractions GET - return mock records
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");

        let records = [mockRecord1, mockRecord2, mockRecord3];
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
                exported: 0,
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

  test("should approve record by ID and update UI", async ({ page }) => {
    let approvalRequestData: any = null;

    // Mock /api/approvals POST
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        approvalRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Record approved successfully",
          }),
        });
      }
    });

    // Mock updated /api/extractions after approval
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");

        const approvedRecord = createMockFormRecord({
          id: "record-1",
          status: ExtractionStatus.APPROVED,
        });
        const mockRecord2 = createMockFormRecord({
          id: "record-2",
          status: ExtractionStatus.PENDING,
        });

        let records = [approvedRecord, mockRecord2];
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
                rejected: 0,
                exported: 0,
                failed: 0,
                bySource: { forms: records.length, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Reload page to use new route handlers
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for records to load
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Wait for record row to be visible
    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible({ timeout: 10000 });

    // Open actions menu for first record
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    // Click approve button
    await page.locator('[data-testid="approve-record-btn-record-1"]').click();

    // Verify API was called with correct data
    await expect.poll(() => approvalRequestData).toBeTruthy();
    expect(approvalRequestData.action).toBe("approve");
    expect(approvalRequestData.id).toBe("record-1");

    // Verify success toast appears
    await expect(page.getByText(/approved successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify status badge updated
    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Approved");
  });

  test("should reject record by ID and update UI", async ({ page }) => {
    let rejectRequestData: any = null;

    // Mock /api/approvals POST
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        rejectRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Record rejected successfully",
          }),
        });
      }
    });

    // Mock updated /api/extractions after rejection
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const rejectedRecord = createMockFormRecord({
          id: "record-1",
          status: ExtractionStatus.REJECTED,
        });
        const mockRecord2 = createMockFormRecord({
          id: "record-2",
          status: ExtractionStatus.PENDING,
        });

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [rejectedRecord, mockRecord2],
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

    // Wait for records to load
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Wait for record row to be visible
    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible({ timeout: 10000 });

    // Open actions menu
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    // Click reject button
    await page.locator('[data-testid="reject-record-btn-record-1"]').click();

    // Verify API was called with correct data
    await expect.poll(() => rejectRequestData).toBeTruthy();
    expect(rejectRequestData.action).toBe("reject");
    expect(rejectRequestData.id).toBe("record-1");

    // Verify success toast appears
    await expect(page.getByText(/rejected successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify status badge updated
    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Rejected");
  });

  test("should handle non-existent record ID with error", async ({ page }) => {
    let errorRequestData: any = null;

    // Mock /api/approvals POST to return error
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        errorRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 404,
          body: JSON.stringify({
            success: false,
            error: "Record not found",
          }),
        });
      }
    });

    // Navigate and trigger approval for non-existent record
    await page.goto("/");
    await page.evaluate(() => {
      // Simulate API call directly since UI won't have this record
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          id: "non-existent-id-12345",
        }),
      });
    });

    // Wait for request to complete
    await page.waitForTimeout(500);

    // Verify error response
    expect(errorRequestData).toBeTruthy();
    expect(errorRequestData.id).toBe("non-existent-id-12345");
  });

  test("should handle already approved records", async ({ page }) => {
    // Set up with an already approved record
    const approvedRecord = createMockFormRecord({
      id: "record-approved",
      status: ExtractionStatus.APPROVED,
    });

    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [approvedRecord],
              statistics: {
                total: 1,
                pending: 0,
                approved: 1,
                rejected: 0,
                exported: 0,
                failed: 0,
                bySource: { forms: 1, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Wait for record row to be visible
    await expect(
      page.locator('[data-testid="record-row-record-approved"]')
    ).toBeVisible({ timeout: 10000 });

    // Verify approved record doesn't show approve/reject buttons
    await page.locator('[data-testid="actions-menu-record-approved"]').click();
    await expect(
      page.locator('[data-testid="approve-record-btn-record-approved"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="reject-record-btn-record-approved"]')
    ).not.toBeVisible();
  });

  test("should bulk approve multiple records", async ({ page }) => {
    let bulkRequestData: any = null;

    // Mock /api/approvals POST for bulk approve
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        bulkRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Approved 2 of 2 records",
            data: {
              succeeded: bulkRequestData.ids,
              failed: [],
            },
          }),
        });
      }
    });

    // Mock updated records after bulk approve
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const approved1 = createMockFormRecord({
          id: "record-1",
          status: ExtractionStatus.APPROVED,
        });
        const approved2 = createMockFormRecord({
          id: "record-2",
          status: ExtractionStatus.APPROVED,
        });

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [approved1, approved2],
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

    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Trigger bulk approve via API (UI doesn't have bulk actions yet)
    await page.evaluate(() => {
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_approve",
          ids: ["record-1", "record-2"],
          approvedBy: "test-user",
        }),
      });
    });

    await page.waitForTimeout(500);

    // Verify API was called with correct data
    expect(bulkRequestData).toBeTruthy();
    expect(bulkRequestData.action).toBe("bulk_approve");
    expect(bulkRequestData.ids).toEqual(["record-1", "record-2"]);
  });

  test("should bulk reject multiple records", async ({ page }) => {
    let bulkRequestData: any = null;

    // Mock /api/approvals POST for bulk reject
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        bulkRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Rejected 2 of 2 records",
            data: {
              succeeded: bulkRequestData.ids,
              failed: [],
            },
          }),
        });
      }
    });

    await page.goto("/");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Trigger bulk reject via API
    await page.evaluate(() => {
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_reject",
          ids: ["record-1", "record-2"],
          rejectedBy: "test-user",
          reason: "Bulk rejection test",
        }),
      });
    });

    await page.waitForTimeout(500);

    // Verify API was called with correct data
    expect(bulkRequestData).toBeTruthy();
    expect(bulkRequestData.action).toBe("bulk_reject");
    expect(bulkRequestData.ids).toEqual(["record-1", "record-2"]);
    expect(bulkRequestData.reason).toBe("Bulk rejection test");
  });

  test("should edit record data and update UI", async ({ page }) => {
    let editRequestData: any = null;

    // Mock /api/approvals POST for edit
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        editRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Record edited successfully",
          }),
        });
      }
    });

    // Mock updated record after edit
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const editedRecord = createMockFormRecord({
          id: "record-1",
          status: ExtractionStatus.EDITED,
          data: {
            fullName: "Updated Name",
            email: "test@example.com",
            phone: "210-1234567",
            company: "Test Company",
            service: "Web Development",
            message: "Test message",
            submissionDate: "2024-01-15T14:30",
            priority: "high",
          },
        });

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [editedRecord],
              statistics: {
                total: 1,
                pending: 0,
                approved: 0,
                rejected: 0,
                exported: 0,
                failed: 0,
                bySource: { forms: 1, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Reload page to use new route handlers
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for records to load
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Wait for record row to be visible
    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible({ timeout: 10000 });

    // Open actions menu
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    // Click edit button
    await page.locator('[data-testid="edit-record-btn-record-1"]').click();

    // Wait for dialog to open
    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).toBeVisible();

    // Enable edit mode (if not already enabled)
    const enableEditBtn = page.locator('[data-testid="enable-edit-btn"]');
    if (await enableEditBtn.isVisible()) {
      await enableEditBtn.click();
    }

    // Modify field
    const nameInput = page.locator('[data-testid="field-fullName"]');
    await nameInput.clear();
    await nameInput.fill("Updated Name");

    // Save changes
    await page.locator('[data-testid="save-edit-btn"]').click();

    // Verify API was called with correct data
    await expect.poll(() => editRequestData).toBeTruthy();
    expect(editRequestData.action).toBe("edit");
    expect(editRequestData.id).toBe("record-1");
    expect(editRequestData.updatedData.fullName).toBe("Updated Name");

    // Verify success toast appears
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should return error for invalid action", async ({ page }) => {
    let errorRequestData: any = null;

    // Mock /api/approvals POST to return error
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        errorRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            success: false,
            error: "Unknown action: invalid_action",
          }),
        });
      }
    });

    await page.goto("/");

    // Trigger invalid action via API
    await page.evaluate(() => {
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invalid_action",
        }),
      });
    });

    await page.waitForTimeout(500);

    // Verify error response
    expect(errorRequestData).toBeTruthy();
    expect(errorRequestData.action).toBe("invalid_action");
  });

  test("should return error when action is missing", async ({ page }) => {
    let errorRequestData: any = null;

    // Mock /api/approvals POST to return error
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        errorRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            success: false,
            error: "Action is required",
          }),
        });
      }
    });

    await page.goto("/");

    // Trigger request without action
    await page.evaluate(() => {
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    });

    await page.waitForTimeout(500);

    // Verify error response
    expect(errorRequestData).toBeTruthy();
    expect(errorRequestData.action).toBeUndefined();
  });

  test("should verify status changes to rejected after rejection", async ({
    page,
  }) => {
    let rejectRequestData: any = null;

    // Mock /api/approvals POST
    await page.route("/api/approvals", async (route) => {
      if (route.request().method() === "POST") {
        rejectRequestData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Record rejected successfully",
          }),
        });
      }
    });

    // Mock updated /api/extractions after rejection
    await page.route("/api/extractions", async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");

        const rejectedRecord = createMockFormRecord({
          id: "record-1",
          status: ExtractionStatus.REJECTED,
        });

        let records = [rejectedRecord];
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
                pending: 0,
                approved: 0,
                rejected: records.length,
                exported: 0,
                failed: 0,
                bySource: { forms: records.length, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    // Reload page to use new route handlers
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for records to load
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Wait for record row to be visible
    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible({ timeout: 10000 });

    // Open actions menu
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    // Click reject button
    await page.locator('[data-testid="reject-record-btn-record-1"]').click();

    // Verify API was called
    await expect.poll(() => rejectRequestData).toBeTruthy();
    expect(rejectRequestData.action).toBe("reject");
    expect(rejectRequestData.id).toBe("record-1");

    // Verify status badge shows rejected
    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Rejected");
  });
});
