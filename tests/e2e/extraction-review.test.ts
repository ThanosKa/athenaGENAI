import { test, expect } from '@playwright/test';
import { ExtractionStatus, SourceType } from '@/types/data';

test.describe('Extraction Review Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Track state and record - use objects to ensure state persists across route handler calls
    const state = { hasProcessedData: false };
    const mockRecord: any = {
      id: 'record-1',
      sourceType: SourceType.FORM,
      sourceFile: 'contact_form_1.html',
      status: ExtractionStatus.PENDING,
      extractedAt: new Date().toISOString(),
      data: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        company: 'Test Company',
        service: 'Web Development',
        message: 'Test message',
        submissionDate: '2024-01-15',
        priority: 'high',
      },
      warnings: ['Missing phone validation'],
    };

    await page.route('/api/extractions', async (route) => {
      if (route.request().method() === 'POST') {
        state.hasProcessedData = true;
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
        // GET request - return current state of mockRecord
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              records: state.hasProcessedData ? [{ ...mockRecord }] : [],
              statistics: {
                total: state.hasProcessedData ? 1 : 0,
                pending: state.hasProcessedData && mockRecord.status === ExtractionStatus.PENDING ? 1 : 0,
                approved: state.hasProcessedData && mockRecord.status === ExtractionStatus.APPROVED ? 1 : 0,
                rejected: state.hasProcessedData && mockRecord.status === ExtractionStatus.REJECTED ? 1 : 0,
                exported: 0,
                failed: 0,
                bySource: { forms: state.hasProcessedData ? 1 : 0, emails: 0, invoices: 0 },
              },
            },
          }),
        });
      }
    });

    await page.route('/api/approvals', async (route) => {
      const body = await route.request().postDataJSON();
      if (body.action === 'edit') {
        // Update the mock record with edited data
        mockRecord.data = { ...mockRecord.data, ...body.updatedData };
        mockRecord.status = ExtractionStatus.EDITED;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: { ...mockRecord },
            message: 'edit successful',
          }),
        });
      } else if (body.action === 'approve') {
        // Update status to approved
        mockRecord.status = ExtractionStatus.APPROVED;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'approve successful',
          }),
        });
      } else if (body.action === 'reject') {
        // Update status to rejected
        mockRecord.status = ExtractionStatus.REJECTED;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'reject successful',
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

    await page.goto('/');
    
    // Process data and open dialog
    await page.locator('[data-testid="process-data-btn"]').click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="actions-menu-record-1"]').click();
    await page.locator('[data-testid="view-record-btn-record-1"]').click();
    await expect(page.locator('[data-testid="extraction-dialog"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display record details with all fields populated', async ({ page }) => {
    // Verify dialog is visible
    await expect(page.locator('[data-testid="extraction-dialog"]')).toBeVisible();
    
    // Verify fields are populated
    await expect(page.locator('[data-testid="field-fullName"]')).toHaveValue('John Doe');
    await expect(page.locator('text=contact_form_1.html')).toBeVisible();
    
    // Verify warning badge is displayed
    await expect(page.locator('[data-testid="warnings-alert"]')).toBeVisible();
    await expect(page.locator('text=/Missing phone validation/i')).toBeVisible();
  });

  test('should enable edit mode, modify fields, save and verify updates', async ({ page }) => {
    // Enable edit mode
    await page.locator('[data-testid="enable-edit-btn"]').click();
    
    // Verify field is now editable
    const nameInput = page.locator('[data-testid="field-fullName"]');
    await expect(nameInput).not.toBeDisabled();
    
    // Modify field
    await nameInput.clear();
    await nameInput.fill('Jane Smith');
    
    // Save changes
    await page.locator('[data-testid="save-edit-btn"]').click();
    
    // Wait for success message
    await expect(page.getByText(/updated successfully/i)).toBeVisible({ timeout: 10000 });
    
    // Verify field still shows updated value
    await expect(nameInput).toHaveValue('Jane Smith');
    
    // Verify edit mode is disabled after save
    await expect(nameInput).toBeDisabled();
  });

  test('should approve from dialog and update status', async ({ page }) => {
    // Click approve button
    await page.locator('[data-testid="approve-btn"]').click();
    
    // Wait for success message
    await expect(page.getByText(/approved successfully/i)).toBeVisible({ timeout: 10000 });
    
    // Dialog should close
    await expect(page.locator('[data-testid="extraction-dialog"]')).not.toBeVisible();
    
    // Verify status badge updated in list
    await expect(page.locator('[data-testid="status-badge-record-1"]')).toContainText('Approved');
  });

  test('should display warning badges for incomplete data', async ({ page }) => {
    // Verify warnings alert is visible
    await expect(page.locator('[data-testid="warnings-alert"]')).toBeVisible();
    
    // Verify warning text is displayed
    await expect(page.locator('text=/Missing phone validation/i')).toBeVisible();
    
    // Verify warning badge in list (if we open it again)
    await page.locator('[data-testid="actions-menu-record-1"]').click();
    await page.locator('[data-testid="view-record-btn-record-1"]').click();
    
    // Warning should still be visible
    await expect(page.locator('[data-testid="warnings-alert"]')).toBeVisible();
  });
});

