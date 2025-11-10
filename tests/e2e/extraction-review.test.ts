import { test, expect } from '@playwright/test';
import { ExtractionStatus, SourceType } from '@/types/data';

test.describe('Extraction Review Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    const mockRecord = {
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
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            records: [mockRecord],
            statistics: {
              total: 1,
              pending: 1,
              approved: 0,
              rejected: 0,
              exported: 0,
              failed: 0,
              bySource: { forms: 1, emails: 0, invoices: 0 },
            },
          },
        }),
      });
    });

    await page.route('/api/approvals', async (route) => {
      const body = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: `${body.action} successful`,
        }),
      });
    });

    await page.goto('/');
    
    // Process data and open dialog
    await page.locator('[data-testid="process-data-btn"]').click();
    await expect(page.locator('[data-testid="extraction-list"]')).toBeVisible();
    await page.locator('[data-testid="actions-menu-record-1"]').click();
    await page.locator('[data-testid="view-record-btn-record-1"]').click();
    await expect(page.locator('[data-testid="extraction-dialog"]')).toBeVisible();
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
    await expect(page.locator('[role="status"]').filter({ hasText: /updated successfully/i })).toBeVisible({ timeout: 5000 });
    
    // Verify field still shows updated value
    await expect(nameInput).toHaveValue('Jane Smith');
    
    // Verify edit mode is disabled after save
    await expect(nameInput).toBeDisabled();
  });

  test('should approve from dialog and update status', async ({ page }) => {
    // Click approve button
    await page.locator('[data-testid="approve-btn"]').click();
    
    // Wait for success message
    await expect(page.locator('[role="status"]').filter({ hasText: /approved successfully/i })).toBeVisible({ timeout: 5000 });
    
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

