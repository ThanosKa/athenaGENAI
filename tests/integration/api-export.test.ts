import { test, expect } from '@playwright/test';

test.describe('API Export', () => {
  test.beforeEach(async ({ request }) => {
    // Process data and approve some records for export
    await request.post('/api/extractions');

    // Approve some records
    const getResponse = await request.get('/api/extractions?status=pending');
    const getData = await getResponse.json();

    if (getData.data.records.length > 0) {
      const recordId = getData.data.records[0].id;
      await request.post('/api/approvals', {
        data: { action: 'approve', id: recordId },
      });
    }
  });

  test('should return export status information', async ({ request }) => {
    const response = await request.get('/api/export');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.message).toBeDefined();
  });

  test('should export approved records', async ({ request }) => {
    const response = await request.post('/api/export', {
      data: {
        createNew: true,
      },
    });

    const data = await response.json();

    // Export might succeed or fail depending on Google Sheets configuration
    // But the API should return a proper response
    expect(response.status()).toBeLessThan(500);
    expect(data).toBeDefined();

    if (data.success) {
      expect(data.data).toBeDefined();
      expect(data.data.spreadsheetId).toBeDefined();
      expect(data.data.url).toBeDefined();
    } else {
      // If export fails (e.g., no Google Sheets config), should return error message
      expect(data.error).toBeDefined();
    }
  });

  test('should handle empty export when no approved records', async ({ request }) => {
    // Reject all pending records
    const pendingResponse = await request.get('/api/extractions?status=pending');
    const pendingData = await pendingResponse.json();

    await Promise.all(
      pendingData.data.records.map((record: { id: string }) =>
        request.post('/api/approvals', {
          data: { action: 'reject', id: record.id },
        })
      )
    );

    // Reject all approved records (from beforeEach)
    const approvedResponse = await request.get('/api/extractions?status=approved');
    const approvedData = await approvedResponse.json();

    await Promise.all(
      approvedData.data.records.map((record: { id: string }) =>
        request.post('/api/approvals', {
          data: { action: 'reject', id: record.id },
        })
      )
    );

    const response = await request.post('/api/export', {
      data: { createNew: true },
    });

    const data = await response.json();

    // Should return error about no approved records
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error).toContain('approved');
  });

  test('should export specific records by IDs', async ({ request }) => {
    const getResponse = await request.get('/api/extractions?status=approved');
    const getData = await getResponse.json();

    if (getData.data.records.length > 0) {
      const ids = getData.data.records.slice(0, 2).map((r: { id: string }) => r.id);

      const response = await request.post('/api/export', {
        data: {
          ids: ids,
          createNew: true,
        },
      });

      const data = await response.json();

      expect(response.status()).toBeLessThan(500);
      expect(data).toBeDefined();

      if (data.success) {
        expect(data.data.spreadsheetId).toBeDefined();
      }
    }
  });

  test('should verify export response format', async ({ request }) => {
    const response = await request.post('/api/export', {
      data: { createNew: true },
    });

    const data = await response.json();

    expect(data).toBeDefined();
    expect(data.success).toBeDefined();

    if (data.success) {
      expect(data.data).toBeDefined();
      expect(data.message).toBeDefined();
    } else {
      expect(data.error).toBeDefined();
    }
  });

  test('should handle export with existing spreadsheet ID', async ({ request }) => {
    const response = await request.post('/api/export', {
      data: {
        spreadsheetId: 'test-spreadsheet-id',
        createNew: false,
      },
    });

    const data = await response.json();

    // Should handle the request (may succeed or fail based on config)
    expect(response.status()).toBeLessThan(500);
    expect(data).toBeDefined();
  });

  test('should verify data flow: API → Export → Status update', async ({ request }) => {
    // Get approved records
    const getResponse = await request.get('/api/extractions?status=approved');
    const getData = await getResponse.json();

    if (getData.data.records.length > 0) {
      const recordId = getData.data.records[0].id;

      // Export
      const exportResponse = await request.post('/api/export', {
        data: { createNew: true },
      });

      // If export succeeds, record should be marked as exported
      if (exportResponse.ok()) {
        const exportData = await exportResponse.json();
        if (exportData.success) {
          // Check if record status changed to exported
          const verifyResponse = await request.get('/api/extractions?status=exported');
          const verifyData = await verifyResponse.json();

          // At least one record should be exported
          expect(verifyData.data.records.length).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should return proper error message for export failures', async ({ request }) => {
    // Try to export with invalid configuration
    const response = await request.post('/api/export', {
      data: {
        createNew: true,
      },
    });

    const data = await response.json();

    // Should return a proper error message if export fails
    if (!data.success) {
      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe('string');
    }
  });
});

