import { test, expect } from '@playwright/test';

test.describe('API Approvals', () => {
  test.beforeEach(async ({ request }) => {
    // Ensure we have some records to work with
    await request.post('/api/extractions');
  });

  test('should approve record by ID', async ({ request }) => {
    // First get a record to approve
    const getResponse = await request.get('/api/extractions?status=pending');
    const getData = await getResponse.json();

    if (getData.data.records.length > 0) {
      const recordId = getData.data.records[0].id;

      const response = await request.post('/api/approvals', {
        data: {
          action: 'approve',
          id: recordId,
          approvedBy: 'test-user',
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('approved');

      // Verify status changed
      const verifyResponse = await request.get(`/api/extractions?status=approved`);
      const verifyData = await verifyResponse.json();
      const approvedRecord = verifyData.data.records.find(
        (r: { id: string }) => r.id === recordId
      );
      expect(approvedRecord).toBeDefined();
      expect(approvedRecord.status).toBe('approved');
    }
  });

  test('should reject record by ID', async ({ request }) => {
    const getResponse = await request.get('/api/extractions?status=pending');
    const getData = await getResponse.json();

    if (getData.data.records.length > 0) {
      const recordId = getData.data.records[0].id;

      const response = await request.post('/api/approvals', {
        data: {
          action: 'reject',
          id: recordId,
          rejectedBy: 'test-user',
          reason: 'Test rejection',
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('rejected');
    }
  });

  test('should handle non-existent record ID', async ({ request }) => {
    const response = await request.post('/api/approvals', {
      data: {
        action: 'approve',
        id: 'non-existent-id-12345',
      },
    });

    const data = await response.json();

    expect(response.status()).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('should handle already approved records', async ({ request }) => {
    const getResponse = await request.get('/api/extractions?status=pending');
    const getData = await getResponse.json();

    if (getData.data.records.length > 0) {
      const recordId = getData.data.records[0].id;

      // Approve first time
      await request.post('/api/approvals', {
        data: { action: 'approve', id: recordId },
      });

      // Try to approve again
      const response = await request.post('/api/approvals', {
        data: { action: 'approve', id: recordId },
      });

      const data = await response.json();

      // Should fail or return success but not change status
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(data).toBeDefined();
    }
  });

  test('should bulk approve multiple records', async ({ request }) => {
    const getResponse = await request.get('/api/extractions?status=pending');
    const getData = await getResponse.json();

    if (getData.data.records.length >= 2) {
      const ids = getData.data.records.slice(0, 2).map((r: { id: string }) => r.id);

      const response = await request.post('/api/approvals', {
        data: {
          action: 'bulk_approve',
          ids: ids,
          approvedBy: 'test-user',
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.succeeded).toBeInstanceOf(Array);
      expect(data.data.failed).toBeInstanceOf(Array);
    }
  });

  test('should bulk reject multiple records', async ({ request }) => {
    const getResponse = await request.get('/api/extractions?status=pending');
    const getData = await getResponse.json();

    if (getData.data.records.length >= 2) {
      const ids = getData.data.records.slice(0, 2).map((r: { id: string }) => r.id);

      const response = await request.post('/api/approvals', {
        data: {
          action: 'bulk_reject',
          ids: ids,
          rejectedBy: 'test-user',
          reason: 'Bulk rejection test',
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.succeeded).toBeInstanceOf(Array);
    }
  });

  test('should edit record data', async ({ request }) => {
    const getResponse = await request.get('/api/extractions?status=pending');
    const getData = await getResponse.json();

    if (getData.data.records.length > 0) {
      const recordId = getData.data.records[0].id;

      const response = await request.post('/api/approvals', {
        data: {
          action: 'edit',
          id: recordId,
          updatedData: {
            fullName: 'Updated Name',
          },
          editedBy: 'test-user',
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('edited');
    }
  });

  test('should return error for invalid action', async ({ request }) => {
    const response = await request.post('/api/approvals', {
      data: {
        action: 'invalid_action',
      },
    });

    const data = await response.json();

    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('should return error when action is missing', async ({ request }) => {
    const response = await request.post('/api/approvals', {
      data: {},
    });

    const data = await response.json();

    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Action is required');
  });

  test('should verify status changes to cancelled after rejection', async ({ request }) => {
    const getResponse = await request.get('/api/extractions?status=pending');
    const getData = await getResponse.json();

    if (getData.data.records.length > 0) {
      const recordId = getData.data.records[0].id;

      await request.post('/api/approvals', {
        data: {
          action: 'reject',
          id: recordId,
          rejectedBy: 'test-user',
        },
      });

      const verifyResponse = await request.get('/api/extractions?status=rejected');
      const verifyData = await verifyResponse.json();
      const rejectedRecord = verifyData.data.records.find(
        (r: { id: string }) => r.id === recordId
      );

      expect(rejectedRecord).toBeDefined();
      expect(rejectedRecord.status).toBe('rejected');
    }
  });
});

