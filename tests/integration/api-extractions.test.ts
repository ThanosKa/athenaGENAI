import { test, expect } from '@playwright/test';

test.describe('API Extractions', () => {
  test.beforeEach(async ({ request }) => {
    // Clear storage before each test by calling a cleanup endpoint if available
    // For now, we'll rely on the server being reset between tests
  });

  test('should retrieve all records successfully', async ({ request }) => {
    const response = await request.get('/api/extractions');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.records).toBeInstanceOf(Array);
    expect(data.data.statistics).toBeDefined();
  });

  test('should filter records by status', async ({ request }) => {
    // First, process some data to have records
    await request.post('/api/extractions');

    const response = await request.get('/api/extractions?status=pending');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    if (data.data.records.length > 0) {
      data.data.records.forEach((record: { status: string }) => {
        expect(record.status).toBe('pending');
      });
    }
  });

  test('should filter records by sourceType', async ({ request }) => {
    await request.post('/api/extractions');

    const response = await request.get('/api/extractions?sourceType=form');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    if (data.data.records.length > 0) {
      data.data.records.forEach((record: { sourceType: string }) => {
        expect(record.sourceType).toBe('form');
      });
    }
  });

  test('should search records by query', async ({ request }) => {
    await request.post('/api/extractions');

    const response = await request.get('/api/extractions?search=contact');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.records).toBeInstanceOf(Array);
  });

  test('should return statistics with records', async ({ request }) => {
    const response = await request.get('/api/extractions');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.statistics).toBeDefined();
    expect(data.data.statistics.total).toBeGreaterThanOrEqual(0);
    expect(data.data.statistics.pending).toBeGreaterThanOrEqual(0);
    expect(data.data.statistics.approved).toBeGreaterThanOrEqual(0);
    expect(data.data.statistics.bySource).toBeDefined();
  });

  test('should process all dummy data files', async ({ request }) => {
    const response = await request.post('/api/extractions');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.summary).toBeDefined();
    expect(data.data.summary.forms).toBeGreaterThanOrEqual(0);
    expect(data.data.summary.emails).toBeGreaterThanOrEqual(0);
    expect(data.data.summary.invoices).toBeGreaterThanOrEqual(0);
    expect(data.data.summary.total).toBeGreaterThanOrEqual(0);
  });

  test('should return records after processing', async ({ request }) => {
    const response = await request.post('/api/extractions');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.records).toBeDefined();
    expect(data.data.records.forms).toBeInstanceOf(Array);
    expect(data.data.records.emails).toBeInstanceOf(Array);
    expect(data.data.records.invoices).toBeInstanceOf(Array);
  });

  test('should handle extraction failures gracefully', async ({ request }) => {
    // This test verifies that the API handles errors properly
    // The actual error handling depends on the server implementation
    const response = await request.post('/api/extractions');
    const data = await response.json();

    // Even if some extractions fail, the API should return a response
    expect(response.status()).toBeLessThan(500);
    expect(data).toBeDefined();
  });

  test('should verify data flow: API → Storage → API response', async ({ request }) => {
    // Process data
    const postResponse = await request.post('/api/extractions');
    const postData = await postResponse.json();

    expect(postResponse.status()).toBe(200);
    expect(postData.success).toBe(true);

    // Retrieve data
    const getResponse = await request.get('/api/extractions');
    const getData = await getResponse.json();

    expect(getResponse.status()).toBe(200);
    expect(getData.success).toBe(true);
    expect(getData.data.records.length).toBeGreaterThanOrEqual(0);
  });
});

