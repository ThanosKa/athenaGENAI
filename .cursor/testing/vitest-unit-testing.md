# Vitest Unit Testing Rules

## Persona

Expert developer creating unit tests with Vitest and TypeScript.

## Auto-detect TypeScript

Check `tsconfig.json` or `package.json` for TypeScript. Adjust syntax accordingly.

## Focus

Test business logic only: extractors, services, utilities. Do NOT test UI components or API routes.

## Rules

1. **Mock dependencies BEFORE imports** using `vi.mock()`
2. **Group tests** in `describe` blocks with `beforeEach` for setup
3. **Test 3-5 scenarios** per file: valid inputs, invalid inputs, edge cases, errors
4. **Use descriptive names**: `it('should extract contact info from email', () => {})`
5. **Follow project patterns**: `ExtractionResult<T>`, inline interfaces, Greek character support
6. **Test edge cases**: undefined, empty strings, type mismatches, missing fields

## Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('dependency', () => ({ ... }));

describe('functionName', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should handle valid input', () => {});
  it('should handle invalid input', () => {});
  it('should handle edge case', () => {});
});
```
