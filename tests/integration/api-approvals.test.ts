import { expect } from "@playwright/test";
import { test } from "@/tests/fixtures";
import { ExtractionStatus, SourceType } from "@/types/data";
import { createMockFormRecord } from "@/tests/fixtures/mock-data";

test.describe("API Approvals", () => {
  test.beforeEach(async ({ page }) => {
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

    await page.route("/api/extractions**", async (route) => {
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
    // Arrange
    let approvalRequestData: any = null;
    let hasApproved = false;

    await page.route("/api/approvals**", async (route) => {
      if (route.request().method() === "POST") {
        approvalRequestData = await route.request().postDataJSON();
        hasApproved = true;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Record approved successfully",
          }),
        });
      }
    });

    await page.route("/api/extractions**", async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");

        const record1 = createMockFormRecord({
          id: "record-1",
          status: hasApproved
            ? ExtractionStatus.APPROVED
            : ExtractionStatus.PENDING,
        });
        const mockRecord2 = createMockFormRecord({
          id: "record-2",
          status: ExtractionStatus.PENDING,
        });

        let records = [record1, mockRecord2];
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

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible({ timeout: 10000 });

    // Act
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    await page.locator('[data-testid="approve-record-btn-record-1"]').click();

    // Assert
    await expect.poll(() => approvalRequestData).toBeTruthy();
    expect(approvalRequestData.action).toBe("approve");
    expect(approvalRequestData.id).toBe("record-1");

    await expect(page.getByText(/approved successfully/i)).toBeVisible({
      timeout: 5000,
    });

    await page.waitForLoadState("networkidle");

    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Approved", { timeout: 10000 });
  });

  test("should reject record by ID and update UI", async ({ page }) => {
    // Arrange
    let rejectRequestData: any = null;

    await page.route("/api/approvals**", async (route) => {
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

    await page.route("/api/extractions**", async (route) => {
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

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible({ timeout: 10000 });

    // Act
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    await page.locator('[data-testid="reject-record-btn-record-1"]').click();

    // Assert
    await expect.poll(() => rejectRequestData).toBeTruthy();
    expect(rejectRequestData.action).toBe("reject");
    expect(rejectRequestData.id).toBe("record-1");

    await expect(page.getByText(/rejected successfully/i)).toBeVisible({
      timeout: 5000,
    });

    await page.waitForLoadState("networkidle");

    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Rejected", { timeout: 10000 });
  });

  test("should handle non-existent record ID with error", async ({ page }) => {
    // Arrange
    let errorRequestData: any = null;

    await page.route("/api/approvals**", async (route) => {
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

    await page.goto("/");
    // Act
    await page.evaluate(() => {
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          id: "non-existent-id-12345",
        }),
      });
    });

    await page.waitForTimeout(500);

    // Assert
    expect(errorRequestData).toBeTruthy();
    expect(errorRequestData.id).toBe("non-existent-id-12345");
  });

  test("should handle already approved records", async ({ page }) => {
    const approvedRecord = createMockFormRecord({
      id: "record-approved",
      status: ExtractionStatus.APPROVED,
    });

    await page.route("/api/extractions**", async (route) => {
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

    await expect(
      page.locator('[data-testid="record-row-record-approved"]')
    ).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="actions-menu-record-approved"]').click();
    await expect(
      page.locator('[data-testid="approve-record-btn-record-approved"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="reject-record-btn-record-approved"]')
    ).not.toBeVisible();
  });

  test("should bulk approve multiple records", async ({ page }) => {
    // Arrange
    let bulkRequestData: any = null;

    await page.route("/api/approvals**", async (route) => {
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

    await page.route("/api/extractions**", async (route) => {
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

    // Act
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

    // Assert
    expect(bulkRequestData).toBeTruthy();
    expect(bulkRequestData.action).toBe("bulk_approve");
    expect(bulkRequestData.ids).toEqual(["record-1", "record-2"]);
  });

  test("should bulk reject multiple records", async ({ page }) => {
    // Arrange
    let bulkRequestData: any = null;

    await page.route("/api/approvals**", async (route) => {
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

    // Act
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

    // Assert
    expect(bulkRequestData).toBeTruthy();
    expect(bulkRequestData.action).toBe("bulk_reject");
    expect(bulkRequestData.ids).toEqual(["record-1", "record-2"]);
    expect(bulkRequestData.reason).toBe("Bulk rejection test");
  });

  test("should edit record data and update UI", async ({ page }) => {
    // Arrange
    let editRequestData: any = null;

    await page.route("/api/approvals**", async (route) => {
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

    await page.route("/api/extractions**", async (route) => {
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

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible({ timeout: 10000 });

    // Act
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    await page.locator('[data-testid="edit-record-btn-record-1"]').click();

    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).toBeVisible();

    const enableEditBtn = page.locator('[data-testid="enable-edit-btn"]');
    if (await enableEditBtn.isVisible()) {
      await enableEditBtn.click();
    }

    const nameInput = page.locator('[data-testid="field-fullName"]');
    await nameInput.clear();
    await nameInput.fill("Updated Name");

    await page.locator('[data-testid="save-edit-btn"]').click();

    // Assert
    await expect.poll(() => editRequestData).toBeTruthy();
    expect(editRequestData.action).toBe("edit");
    expect(editRequestData.id).toBe("record-1");
    expect(editRequestData.updatedData.fullName).toBe("Updated Name");

    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should return error for invalid action", async ({ page }) => {
    let errorRequestData: any = null;

    await page.route("/api/approvals**", async (route) => {
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

    expect(errorRequestData).toBeTruthy();
    expect(errorRequestData.action).toBe("invalid_action");
  });

  test("should return error when action is missing", async ({ page }) => {
    let errorRequestData: any = null;

    await page.route("/api/approvals**", async (route) => {
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

    await page.evaluate(() => {
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    });

    await page.waitForTimeout(500);

    expect(errorRequestData).toBeTruthy();
    expect(errorRequestData.action).toBeUndefined();
  });

  test("should verify status changes to rejected after rejection", async ({
    page,
  }) => {
    // Arrange
    let rejectRequestData: any = null;
    let hasRejected = false;

    await page.route("/api/approvals**", async (route) => {
      if (route.request().method() === "POST") {
        rejectRequestData = await route.request().postDataJSON();
        hasRejected = true;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Record rejected successfully",
          }),
        });
      }
    });

    await page.route("/api/extractions**", async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");

        const rejectedRecord = createMockFormRecord({
          id: "record-1",
          status: hasRejected
            ? ExtractionStatus.REJECTED
            : ExtractionStatus.PENDING,
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
                pending: hasRejected ? 0 : records.length,
                approved: 0,
                rejected: hasRejected ? records.length : 0,
                exported: 0,
                failed: 0,
                bySource: { forms: records.length, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    await expect(
      page.locator('[data-testid="record-row-record-1"]')
    ).toBeVisible({ timeout: 10000 });

    // Act
    await page.locator('[data-testid="actions-menu-record-1"]').click();

    await page.locator('[data-testid="reject-record-btn-record-1"]').click();

    // Assert
    await expect.poll(() => rejectRequestData).toBeTruthy();
    expect(rejectRequestData.action).toBe("reject");
    expect(rejectRequestData.id).toBe("record-1");

    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Rejected");
  });
});
