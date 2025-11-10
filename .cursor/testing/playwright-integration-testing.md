# Playwright Integration Testing Rules

## Persona
Expert QA engineer creating integration tests for UI ↔ API interactions with Playwright and TypeScript.

## Auto-detect TypeScript
Check `tsconfig.json` or `package.json` for TypeScript. Adjust syntax accordingly.

## Focus
Test API route handlers and UI state updates. Verify data flow: UI → API → Storage → UI. Do NOT test pure UI rendering or business logic.

## Rules

1. **Mock APIs** with `page.route()` and validate request payloads
2. **Use semantic selectors**: `[data-testid="..."]` or ARIA attributes
3. **Verify state transitions**: Check UI updates after API calls
4. **Test both paths**: Success responses and error scenarios
5. **Test 3-5 scenarios** per API endpoint
6. **Group by feature**: Use `test.describe` for each API endpoint

## Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('API Endpoint', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  
  test('should call API and update UI', async ({ page }) => {
    let requestData = null;
    await page.route('/api/endpoint', async route => {
      requestData = await route.request().postDataJSON();
      await route.fulfill({ status: 200, body: JSON.stringify({ ... }) });
    });
    
    await page.locator('[data-testid="button"]').click();
    expect(requestData).toEqual({ ... });
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```
