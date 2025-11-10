# Coding Patterns

## TypeScript

- Avoid `any` - use `unknown` if type is truly unknown
- Use inline interfaces with function parameters, not separate type definitions
- Never use `as` type assertions to avoid type errors - fix the types instead
- Use descriptive type names: `ExtractedFormData` not `Data`

```typescript
// ✅ Good - inline interface
export function extractFormData({
  htmlContent,
  options,
}: {
  htmlContent: string;
  options: ExtractionOptions;
}): ExtractionResult<FormData> {
  // implementation
}

// ❌ Bad - separate interface
interface ExtractFormDataParams {
  htmlContent: string;
  options: ExtractionOptions;
}
```

## Next.js Patterns

- **Default**: Server Components (no 'use client')
- **Use Client**: Only when needed (interactivity, useState, useEffect, browser APIs)
- Mark client components explicitly: `'use client'` at top of file
- Use server actions for mutations (place in `app/actions/` with `'use server'`)

## File Naming

- **Components**: PascalCase (`DataExtractionCard.tsx`)
- **Utilities**: kebab-case (`extract-form-data.ts`)
- **Folders**: kebab-case (`data-extraction/`)
- **Types**: PascalCase (`ExtractedFormData`)

## Error Handling

- Return error objects, don't throw unless necessary
- Use consistent error result pattern:

```typescript
interface ExtractionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}
```

## Component Structure

- Use shadcn/ui components from `@/components/ui/`
- Keep components small and focused
- Use TypeScript interfaces for props (inline)
- Export types alongside components when needed

## Imports

- React/Next.js imports first
- Third-party libraries second
- Internal imports (absolute paths with `@/`) third
- Relative imports last

