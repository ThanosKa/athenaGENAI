# Testing TODO Plan

## Immediate UX Bugs To Reproduce/Fix
- [ ] **Actions menu locking after View/Edit** – open any record via `ExtractionList` → Actions → View; the blocking dialog prevents interacting with other rows until it is closed. Decide whether to auto-close after Approve/Reject, add inline navigation, or swap the modal for a non-blocking sheet. Verify focus trapping and that dropdown triggers remain accessible after each action.
- [ ] **Action dropdown focus trap** – ensure the Radix dropdown closes on every selection (View/Edit/Approve/Reject) and can be reopened with keyboard navigation (Enter/Space, ArrowDown). Add regression test once behavior is confirmed.
- [ ] **Warning/error badge stacking** – when both `warnings` and `error` exist, confirm badges render predictably without layout shift on narrow screens.

## Data Extraction (Unit-Level)
- [ ] **Form extractor parsing matrix** – craft fixtures covering missing `selected` attributes, alternate input names, mixed Greek/English text, invalid emails, and ensure warnings array matches expectations.
- [ ] **Email extractor classification** – simulate client vs invoice emails (UTF-8) and verify `invoiceReference` parsing, fallback to `from` metadata, and error paths when `simpleParser` throws.
- [ ] **Invoice extractor math** – assert VAT/net/total validation triggers, currency normalization (`€1.054,00`, `1054.00`), and absence of line items yields warning.
- [ ] **Error propagation** – force each extractor to throw (malformed HTML/EML) and ensure `error` surfaces without crashing the processor.

## Services & Storage
- [ ] **DataProcessor deduplication** – repeatedly call `processAllDummyData` and confirm storage either deduplicates by `sourceFile` or documents intentional duplication. Consider clearing the map before batch imports.
- [ ] **Storage filtering** – unit test `getRecords` search queries (case-insensitive, nested data hits, combined status/source filters) and ordering by `extractedAt`.
- [ ] **Approval/Edit workflows** – cover rejection/approval of only `pending|edited` records, editing approved-but-not-exported records, and invalid transitions (e.g., approving `failed`).
- [ ] **Export service gating** – mock Google client to validate: missing credentials, createNew toggles, selective export filters out non-approved records, and records marked exported afterward.

## API Routes (Integration)
- [ ] **/api/extractions POST idempotency** – assert route handles empty dummy directories, returns counts matching fixture files, and doesn't block UI when processing twice.
- [ ] **/api/approvals validation** – send malformed payloads (missing id/action) and ensure 400 responses; confirm edit action enforces type validation errors from `editService`.
- [ ] **/api/export** – simulate both all-approved exports and targeted `ids`, verify response shapes, and ensure failures from Google client propagate as 400 vs 500 accordingly.

## UI / UX Flows (Manual or Playwright)
- [ ] **Dashboard loading states** – with slow `/api/extractions`, ensure skeletons show once per filter change (currently `initialLoading` never resets).
- [ ] **Filters + search** – stack status+source filters plus search term; verify query params built correctly and clearing search reloads data.
- [ ] **ExtractionReview editing** – enter edit mode, mutate fields per source type, cancel to ensure form resets, and confirm Save disables until diff exists (currently always enabled).
- [ ] **Approve/Reject CTA feedback** – toast copy appears, modal closes, list row updates badge colors, and warnings badges persist.
- [ ] **Keyboard/accessibility** – tab order reaches Actions button, dropdown items accessible via arrow keys, dialog obeys `aria` roles, and ESC closes review without leaving stray focus traps.
- [ ] **Color contrast regression** – after palette adjustments, verify cards on the new `Mercury White` background meet WCAG AA (buttons, badges, text-muted on grey).

## Non-Functional / Tooling
- [ ] **Logger/error handler unit tests** – mock `logger` sinks to ensure context tagging and severity filtering.
- [ ] **Type safety** – add `ts-jest` or `ts-node` driven tests ensuring no `any` leaks; enforce via `tsconfig` + CI step (`npm run type-check`).
- [ ] **Automated smoke** – script that runs `npm run dev`, hits the API endpoints with sample payloads, and validates non-200 responses fail CI.
- [ ] **Google Sheets stub** – create local stub of `googleSheetsClient` to avoid external dependency during tests while still verifying payload structure.

## Nice-to-Have Enhancements
- [ ] **Persisted storage** – integration test once a real DB (SQLite/Prisma) replaces the in-memory map; focus on concurrency + ordering.
- [ ] **Bulk actions UI** – once implemented, add regression coverage for bulk approve/reject/export flows and disabled-state logic.
- [ ] **Observability** – add structured log snapshot tests (or contract tests) so log schema changes are intentional.
