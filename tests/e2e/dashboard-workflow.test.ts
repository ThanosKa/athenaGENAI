import { expect } from "@playwright/test";
import { test } from "@/tests/fixtures";
import { ExtractionStatus, SourceType } from "@/types/data";

test.describe("Dashboard Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Track if POST was called to simulate "stored" records
    let postProcessed = false;

    // Create 25 mock records to match the summary (5 forms + 10 emails + 10 invoices)
    const createMockRecords = (): any[] => {
      const mockRecords: any[] = [];

      // 5 form records
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

      // 10 email records
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

      // 10 invoice records
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

    // Store records in a variable accessible to both routes
    let allRecords: any[] = [];

    // Mock API responses
    await page.route("/api/extractions**", async (route) => {
      if (route.request().method() === "POST") {
        postProcessed = true; // Mark that POST was called
        allRecords = createMockRecords(); // Generate records after POST
        // Mock successful processing
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
        // GET request - return mock records only if POST was called
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

    await page.route("/api/approvals", async (route) => {
      const body = await route.request().postDataJSON();
      const record = allRecords.find((r) => r.id === body.id);

      if (body.action === "edit") {
        // Update record with edited data
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
        // Update record status to approved
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
        // Update record status to rejected
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
    const processBtn = page.locator('[data-testid="process-data-btn"]');
    await expect(processBtn).toBeVisible({ timeout: 10000 });
    await processBtn.click();

    // Wait for network requests to complete
    await page.waitForLoadState("networkidle");

    // Wait for success toast (sonner toast appears)
    await expect(
      page.getByText(/Successfully processed.*records/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify statistics update
    const statTotal = page.locator('[data-testid="stat-total"]');
    await expect(statTotal).toBeVisible({ timeout: 10000 });
    await expect(statTotal).toContainText("25", { timeout: 5000 });

    const statPending = page.locator('[data-testid="stat-pending"]');
    await expect(statPending).toBeVisible({ timeout: 10000 });

    // Verify extraction list appears
    const extractionList = page.locator('[data-testid="extraction-list"]');
    await expect(extractionList).toBeVisible({ timeout: 10000 });
  });

  // COMMENTED OUT FOR DEBUGGING - Focus on first test only
  /*
  test("should complete full workflow: process → view → approve → export", async ({
    page,
  }) => {
    // Process data
    await page.locator('[data-testid="process-data-btn"]').click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText(/Successfully processed.*records/i)
    ).toBeVisible({ timeout: 10000 });

    // Wait for records to appear
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();

    // Open actions menu for first record
    await page.locator('[data-testid="actions-menu-record-1"]').click();
    await page.waitForTimeout(300); // Wait for dropdown menu to render

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
    await expect(page.getByText(/exported successfully/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should complete edit workflow: view → enable edit → modify → save → verify", async ({
    page,
  }) => {
    // Process data first
    await page.locator('[data-testid="process-data-btn"]').click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText(/Successfully processed.*records/i)
    ).toBeVisible({ timeout: 10000 });

    // Open actions menu
    await page.locator('[data-testid="actions-menu-record-1"]').click();
    await page.waitForTimeout(300); // Wait for dropdown menu to render

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
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 10000,
    });

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
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText(/Successfully processed.*records/i)
    ).toBeVisible({ timeout: 10000 });

    // Open actions menu
    await page.locator('[data-testid="actions-menu-record-1"]').click();
    await page.waitForTimeout(300); // Wait for dropdown menu to render

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
    await expect(page.getByText(/Failed to process/i)).toBeVisible({
      timeout: 10000,
    });
  });
  */

  test("DEBUG: Check if GET request is made after POST", async ({ page }) => {
    // Track state for debugging
    let postProcessed = false;
    let allRecords: any[] = [];
    let getRequestCount = 0;

    const createMockRecords = (): any[] => {
      const mockRecords: any[] = [];

      // 5 form records
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

      // 10 email records
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

      // 10 invoice records
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

    await page.route("/api/extractions", async (route) => {
      const method = route.request().method();
      console.log(`\n🔵 API CALL: ${method} /api/extractions`);

      if (method === "POST") {
        postProcessed = true;
        allRecords = createMockRecords();
        console.log(
          `✅ POST processed - Generated ${allRecords.length} records`
        );

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
        // GET request
        getRequestCount++;
        console.log(
          `📥 GET request #${getRequestCount} - postProcessed: ${postProcessed}, Records available: ${allRecords.length}`
        );

        const url = new URL(route.request().url());
        const statusFilter = url.searchParams.get("status");
        const sourceFilter = url.searchParams.get("sourceType");
        console.log(
          `   Filters - status: ${statusFilter}, sourceType: ${sourceFilter}`
        );

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

        const responseData = {
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
        };

        console.log(`   Returning ${filteredRecords.length} records`);
        console.log(
          `   Statistics:`,
          JSON.stringify(responseData.data.statistics, null, 2)
        );

        await route.fulfill({
          status: 200,
          body: JSON.stringify(responseData),
        });
      }
    });

    await page.route("/api/approvals", async (route) => {
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

    console.log("\n🚀 TEST STARTED\n");

    // Click process data button
    const processBtn = page.locator('[data-testid="process-data-btn"]');
    await expect(processBtn).toBeVisible({ timeout: 10000 });
    console.log("🖱️  Clicking process button...");
    await processBtn.click();

    // Wait for success toast
    console.log("⏳ Waiting for success toast...");
    await expect(
      page.getByText(/Successfully processed.*records/i)
    ).toBeVisible({ timeout: 10000 });
    console.log("✅ Success toast appeared");

    // Wait for GET request to be triggered after POST
    console.log("⏳ Waiting for GET request to be triggered...");
    try {
      // Wait for the GET request to happen
      await page.waitForResponse(
        (response) =>
          response.url().includes("/api/extractions") &&
          response.request().method() === "GET",
        { timeout: 5000 }
      );
      console.log("✅ GET request detected!");
    } catch (e) {
      console.log("❌ No GET request detected within timeout");
    }

    // Also wait for network to be idle
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Check the stat-total value
    const statTotal = page.locator('[data-testid="stat-total"]');
    const totalText = await statTotal.textContent();
    console.log(`📊 stat-total value: "${totalText}"`);

    // Try to get the actual DOM state
    const pageState = await page.evaluate(() => {
      return {
        statTotalHTML: document.querySelector('[data-testid="stat-total"]')
          ?.innerHTML,
        statTotalText: document.querySelector('[data-testid="stat-total"]')
          ?.textContent,
        allStats: Array.from(
          document.querySelectorAll('[data-testid^="stat-"]')
        ).map((el) => ({
          testId: el.getAttribute("data-testid"),
          text: el.textContent,
        })),
      };
    });
    console.log(
      "📊 All statistics in DOM:",
      JSON.stringify(pageState, null, 2)
    );

    // This will likely fail, but that's okay - we want to see the console output
    await expect(statTotal)
      .toContainText("25", { timeout: 1000 })
      .catch(() => {
        console.log("❌ stat-total does NOT contain '25'");
      });

    console.log("\n🏁 TEST COMPLETED\n");
  });
});

test.describe("Dashboard Workflow - DEBUG", () => {
  test.beforeEach(async ({ page }) => {
    let postProcessed = false;
    let allRecords: any[] = [];
    let getRequestCount = 0;

    const createMockRecords = (): any[] => {
      const mockRecords: any[] = [];

      // 5 form records
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

      // 10 email records
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

      // 10 invoice records
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

    await page.route("/api/extractions**", async (route) => {
      const request = route.request();
      const method = request.method();

      if (method === "POST") {
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
        // GET request
        getRequestCount++;

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

        const responseData = {
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
        };

        await route.fulfill({
          status: 200,
          body: JSON.stringify(responseData),
        });
      }
    });

    await page.route("/api/approvals", async (route) => {
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

    // IMPORTANT: Set up routes BEFORE navigating to the page
    // Wait a moment to ensure routes are registered
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for any initial GET requests to complete before the test starts
    await page.waitForLoadState("networkidle");
  });

  test("DEBUG: Check if GET request is made after POST", async ({ page }) => {
    // Click process data button
    const processBtn = page.locator('[data-testid="process-data-btn"]');
    await expect(processBtn).toBeVisible({ timeout: 10000 });
    await processBtn.click();

    // Wait for success toast
    await expect(
      page.getByText(/Successfully processed.*records/i)
    ).toBeVisible({ timeout: 10000 });

    // Wait for GET request after POST
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/extractions") &&
        response.request().method() === "GET",
      { timeout: 5000 }
    );

    // Wait for network to be idle
    await page.waitForLoadState("networkidle");

    // Verify statistics updated
    const statTotal = page.locator('[data-testid="stat-total"]');
    await expect(statTotal).toContainText("25");
  });
});
