import { expect } from "@playwright/test";
import { test } from "@/tests/fixtures";
import { ExtractionStatus, SourceType, ExtractionRecord } from "@/types/data";

test.describe("Extraction Review Dialog", () => {
  test.beforeEach(async ({ page }) => {
    const mockRecord: ExtractionRecord = {
      id: "record-1",
      sourceType: SourceType.FORM,
      sourceFile: "contact_form_1.html",
      status: ExtractionStatus.PENDING,
      extractedAt: new Date(),
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
      warnings: ["Missing phone validation"],
    };

    await page.route("/api/extractions**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              summary: { total: 1, forms: 1, emails: 0, invoices: 0 },
              records: {
                forms: [],
                emails: [],
                invoices: [],
              },
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: [{ ...mockRecord }],
              statistics: {
                total: 1,
                pending: mockRecord.status === ExtractionStatus.PENDING ? 1 : 0,
                approved:
                  mockRecord.status === ExtractionStatus.APPROVED ? 1 : 0,
                rejected:
                  mockRecord.status === ExtractionStatus.REJECTED ? 1 : 0,
                exported: 0,
                failed: 0,
                bySource: { forms: 1, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    await page.route("/api/approvals**", async (route) => {
      const body = await route.request().postDataJSON();
      if (body.action === "edit") {
        mockRecord.data = { ...mockRecord.data, ...body.updatedData };
        mockRecord.status = ExtractionStatus.EDITED;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: { ...mockRecord },
            message: "edit successful",
          }),
        });
      } else if (body.action === "approve") {
        mockRecord.status = ExtractionStatus.APPROVED;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "approve successful",
          }),
        });
      } else if (body.action === "reject") {
        mockRecord.status = ExtractionStatus.REJECTED;
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

    await page.goto("/");

    await page.locator('[data-testid="process-data-btn"]').click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible({
      timeout: 10000,
    });
    await page.locator('[data-testid="actions-menu-record-1"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="view-record-btn-record-1"]').click();
    await expect(page.locator('[data-testid="extraction-dialog"]')).toBeVisible(
      { timeout: 10000 }
    );
  });

  test("should display record details with all fields populated", async ({
    page,
  }) => {
    // Arrange (setup in beforeEach - dialog already open)
    // Assert
    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).toBeVisible();

    await expect(page.locator('[data-testid="field-fullName"]')).toHaveValue(
      "John Doe"
    );
    await expect(
      page
        .locator('[data-testid="extraction-dialog"]')
        .getByText("contact_form_1.html")
    ).toBeVisible();

    await expect(page.locator('[data-testid="warnings-alert"]')).toBeVisible();
    await expect(
      page.locator("text=/Missing phone validation/i")
    ).toBeVisible();
  });

  test("should enable edit mode, modify fields, save and verify updates", async ({
    page,
  }) => {
    // Arrange (setup in beforeEach - dialog already open)
    // Act
    await page.locator('[data-testid="enable-edit-btn"]').click();

    const nameInput = page.locator('[data-testid="field-fullName"]');
    await expect(nameInput).not.toBeDisabled();

    await nameInput.clear();
    await nameInput.fill("Jane Smith");

    await page.locator('[data-testid="save-edit-btn"]').click();

    // Assert
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 10000,
    });

    await expect(nameInput).toHaveValue("Jane Smith");

    await expect(nameInput).toBeDisabled();
  });

  test("should approve from dialog and update status", async ({ page }) => {
    // Arrange (setup in beforeEach - dialog already open)
    // Act
    await page.locator('[data-testid="approve-btn"]').click();

    // Assert
    await expect(page.getByText(/approved successfully/i)).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.locator('[data-testid="extraction-dialog"]')
    ).not.toBeVisible();

    await expect(
      page.locator('[data-testid="status-badge-record-1"]')
    ).toContainText("Approved");
  });

  test("should display warning badges for incomplete data", async ({
    page,
  }) => {
    // Arrange (setup in beforeEach - dialog already open)
    // Assert
    await expect(page.locator('[data-testid="warnings-alert"]')).toBeVisible();

    await expect(
      page.locator("text=/Missing phone validation/i")
    ).toBeVisible();

    const dialogLocator = page.locator('[data-testid="extraction-dialog"]');
    const isDialogVisible = await dialogLocator.isVisible().catch(() => false);

    if (isDialogVisible) {
      const closeButton = page.locator(
        '[data-testid="close-dialog-btn"], button[aria-label*="close" i], button[aria-label*="Close" i]'
      );
      const closeButtonCount = await closeButton.count();

      if (closeButtonCount > 0) {
        await closeButton.first().click();
      } else {
        await page.keyboard.press("Escape");
      }

      await expect(dialogLocator).not.toBeVisible({ timeout: 5000 });

      await page
        .waitForFunction(
          () => {
            const overlays = document.querySelectorAll(
              'div[data-state="open"][class*="bg-black/80"]'
            );
            return overlays.length === 0;
          },
          { timeout: 5000 }
        )
        .catch(() => {});

      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
    }

    const actionsMenuButton = page.locator(
      '[data-testid="actions-menu-record-1"]'
    );
    await actionsMenuButton.click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="view-record-btn-record-1"]').click();

    await expect(page.locator('[data-testid="extraction-dialog"]')).toBeVisible(
      {
        timeout: 10000,
      }
    );

    await expect(page.locator('[data-testid="warnings-alert"]')).toBeVisible();
  });
});
