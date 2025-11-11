# AGENTS.md - AthenaGen AI

## Header

- **Project Name**: AthenaGen AI - Data Extraction Dashboard
- **Version**: 1.0.0
- **Description**: A human-in-the-loop data extraction and approval workflow system built for TechFlow Solutions. Automates extraction of structured data from multiple sources (HTML forms, email files, and invoices), provides an intuitive dashboard for reviewing and editing extracted records, and enables seamless export to Google Sheets.
- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict mode)
- **Language**: TypeScript
- **Package Manager**: npm
- **License**: ISC

## Overview

AthenaGen AI is a data automation platform designed to streamline manual data entry processes for TechFlow Solutions. The system processes data from three primary sources:

1. **HTML Contact Forms** - Extracts customer information (name, email, phone, company, service interest, message, submission date, priority)
2. **Email Files (.eml)** - Parses email content to extract customer data, contact information, and invoice references
3. **HTML Invoices** - Extracts invoice details (invoice number, date, customer info, amounts, VAT, line items)

The application implements a human-in-the-loop workflow where:

- Data is automatically extracted from source files
- Users review, edit, approve, or reject each extraction
- Approved records can be exported to Google Sheets
- All actions are tracked with status management and audit trails

The system processes dummy data files including 5 contact forms, 10 email messages, and 10 invoices, extracting key information and providing a dashboard interface for managing the entire workflow.

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required for Google Sheets export
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}

# Optional
NODE_ENV=development
```

### Google Sheets Integration Setup

1. **Create Google Cloud Project** at [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable Google Sheets API** in APIs & Services > Library
3. **Create Service Account**:
   - Go to APIs & Services > Credentials
   - Create Credentials > Service Account
   - Name: `techflow-sheets-exporter`
   - Grant role: "Editor" or "Google Sheets API User"
4. **Generate Service Account Key**:
   - Open service account > Keys tab
   - Add Key > Create New Key > JSON format
   - Download the JSON file
5. **Add Credentials**: Copy entire JSON content to `.env.local` as `GOOGLE_SERVICE_ACCOUNT_KEY` (all on one line)

### External Dependencies

- **Google Sheets API** (`googleapis` v128.0.0) - For exporting data to spreadsheets
- **mailparser** (v3.6.0) - For parsing .eml email files
- **cheerio** (v1.0.0) - For server-side HTML parsing and manipulation
- **shadcn/ui** - React component library (installed via `components.json`)
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.9.3** - Type-safe JavaScript (strict mode enabled)
- **Tailwind CSS 4.1.17** - Utility-first CSS framework

### Development Dependencies

- **Vitest** (v2.1.9) - Unit testing framework
- **Playwright** (v1.48.0) - End-to-end and integration testing
- **ESLint** (v9.39.1) - Code linting
- **TypeScript Compiler** - Type checking

## Code Style and Conventions

### TypeScript Patterns

- **Strict Mode**: Always enabled (`strict: true` in `tsconfig.json`)
- **Avoid `any`**: Use `unknown` if type is truly unknown
- **Inline Interfaces**: Use inline interfaces with function parameters, not separate type definitions
- **No Type Assertions**: Never use `as` type assertions to avoid type errors - fix the types instead
- **Descriptive Type Names**: Use clear names like `ExtractedFormData` not `Data`

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

### Error Handling Pattern

All extractors and services use the `ExtractionResult<T>` pattern:

```typescript
interface ExtractionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}
```

- Return error objects, don't throw unless necessary
- Use consistent error result pattern across all extractors
- Errors are categorized (extraction, validation, export) via `ErrorCategory` enum

### Next.js Patterns

- **Default**: Server Components (no 'use client')
- **Use Client**: Only when needed (interactivity, useState, useEffect, browser APIs)
- **Mark Client Components**: Explicitly mark with `'use client'` at top of file
- **Server Actions**: Use server actions for mutations (place in `app/actions/` with `'use server'`)

### File Naming Conventions

- **Components**: PascalCase (`ExtractionList.tsx`, `StatisticsCards.tsx`)
- **Utilities**: kebab-case (`form-extractor.ts`, `email-extractor.ts`)
- **Folders**: kebab-case (`data-extraction/`, `api-extractions/`)
- **Types**: PascalCase (`ExtractedFormData`, `ExtractionRecord`)

### Component Structure

- Use shadcn/ui components from `@/components/ui/`
- Keep components small and focused
- Use TypeScript interfaces for props (inline)
- Export types alongside components when needed

### Import Order

1. React/Next.js imports first
2. Third-party libraries second
3. Internal imports (absolute paths with `@/`) third
4. Relative imports last

### Logging

Use the centralized `Logger` class from `@/lib/utils/logger`:

```typescript
import { logger } from "@/lib/utils/logger";

logger.info("Message", data, "Context");
logger.error("Error message", error, "Context");
logger.warn("Warning", data, "Context");
logger.debug("Debug info", data, "Context");
```

Log levels: `DEBUG`, `INFO`, `WARN`, `ERROR` (default: `INFO` in production, `DEBUG` in development)

## Capabilities

### Data Extraction

- **Multi-Source Support**: Extract data from HTML forms, email files (.eml), and HTML invoices
- **Intelligent Parsing**: Automatically identifies and extracts structured data fields
- **Warning System**: Flags potential data quality issues or missing fields
- **Error Handling**: Gracefully handles extraction failures with detailed error messages
- **Greek Character Support**: Full UTF-8 support for international characters

### Review and Approval Workflow

- **Status Management**: Track records through `pending → approved/rejected/edited → exported` workflow
- **Interactive Review**: View detailed extraction results in a user-friendly interface
- **Inline Editing**: Edit extracted data directly from the dashboard
- **Bulk Operations**: Approve or reject multiple records efficiently
- **Audit Trail**: Track who edited/approved/rejected and when

### Dashboard and Analytics

- **Statistics Cards**: Real-time overview of extraction statistics
  - Total records
  - Pending, approved, rejected, exported, and failed counts
  - Breakdown by source type (forms, emails, invoices)
- **Advanced Filtering**: Filter by status, source type, or search term
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Export Capabilities

- **Google Sheets Integration**: Export approved records to Google Sheets
- **Automatic Spreadsheet Creation**: Creates new spreadsheets automatically with separate sheets for Forms, Emails, and Invoices
- **Structured Data Export**: Maintains data structure and formatting
- **Selective Export**: Only exports approved records

### Testing and Quality Assurance

- **Unit Tests**: Comprehensive test coverage for extractors and services (Vitest)
- **Integration Tests**: API endpoint testing (Playwright)
- **E2E Tests**: End-to-end workflow testing with Playwright
- **Type Safety**: Full TypeScript support for type-safe development

## Implementation

### Project Structure

```
.
├── app/
│   ├── api/                      # API routes
│   │   ├── approvals/route.ts    # Approval/rejection/edit endpoints
│   │   ├── extractions/route.ts  # Data extraction endpoints
│   │   └── export/route.ts       # Google Sheets export endpoint
│   ├── dashboard/                # Dashboard page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── ExtractionList.tsx        # Main extraction records table
│   ├── ExtractionReview.tsx      # Record review/edit dialog
│   └── StatisticsCards.tsx       # Dashboard statistics
├── lib/
│   ├── extractors/               # Data extraction logic
│   │   ├── email-extractor.ts    # Email parsing (.eml files)
│   │   ├── form-extractor.ts     # HTML form parsing
│   │   └── invoice-extractor.ts  # HTML invoice parsing
│   ├── integrations/             # External integrations
│   │   └── google-sheets.ts      # Google Sheets API client
│   ├── services/                 # Business logic
│   │   ├── approval-service.ts   # Approve/reject logic
│   │   ├── data-processor.ts    # Orchestrates file extraction
│   │   ├── edit-service.ts       # Validates and applies edits
│   │   ├── export-service.ts     # Coordinates Google Sheets export
│   │   └── storage.ts            # In-memory data store (singleton)
│   └── utils/                    # Utilities
│       ├── error-handler.ts      # Centralized error handling
│       └── logger.ts             # Logging utility
├── types/
│   └── data.ts                   # TypeScript type definitions
├── dummy_data/                   # Sample data
│   ├── forms/                    # 5 HTML forms
│   ├── emails/                   # 10 .eml files
│   └── invoices/                 # 10 HTML invoices
└── tests/
    ├── unit/                     # Vitest unit tests
    ├── integration/              # Playwright integration tests
    └── e2e/                      # Playwright E2E tests
```

### Key Services

#### StorageService (`lib/services/storage.ts`)

- **Type**: Singleton in-memory storage
- **Purpose**: Stores all extraction records in a Map
- **Methods**:
  - `addRecord(record)` - Add new extraction record
  - `getRecord(id)` - Get record by ID
  - `getRecords({status, sourceType, search})` - Filtered record retrieval
  - `updateRecord(id, updates)` - Update record fields
  - `getStatistics()` - Calculate extraction statistics
  - `clear()` - Clear all records (for testing)

#### DataProcessor (`lib/services/data-processor.ts`)

- **Purpose**: Orchestrates file extraction from dummy_data folder
- **Methods**:
  - `processForm({filePath, fileName})` - Process HTML form
  - `processEmail({filePath, fileName})` - Process .eml file
  - `processInvoice({filePath, fileName})` - Process HTML invoice
  - `processAllDummyData()` - Process all files in dummy_data folder

#### ApprovalService (`lib/services/approval-service.ts`)

- **Purpose**: Handles approve/reject logic
- **Methods**:
  - `approve({id, approvedBy})` - Approve single record
  - `reject({id, rejectedBy, reason})` - Reject single record
  - `bulkApprove({ids, approvedBy})` - Approve multiple records
  - `bulkReject({ids, rejectedBy, reason})` - Reject multiple records

#### EditService (`lib/services/edit-service.ts`)

- **Purpose**: Validates and applies edits to extraction records
- **Methods**:
  - `edit({id, updatedData, editedBy})` - Edit record with validation

#### ExportService (`lib/services/export-service.ts`)

- **Purpose**: Coordinates Google Sheets export
- **Methods**:
  - `exportApprovedRecords()` - Export all approved records to Google Sheets

### Extractors

#### FormExtractor (`lib/extractors/form-extractor.ts`)

- **Input**: HTML content string
- **Output**: `ExtractionResult<ExtractedFormData>`
- **Extracts**: fullName, email, phone, company, service, message, submissionDate, priority
- **Validation**: Email format, required fields, data quality checks

#### EmailExtractor (`lib/extractors/email-extractor.ts`)

- **Input**: .eml file content string
- **Output**: `ExtractionResult<ExtractedEmailData>`
- **Extracts**: from, fromEmail, to, subject, date, fullName, email, phone, company, position, emailType, invoiceReference, bodyText
- **Uses**: `mailparser` library for parsing

#### InvoiceExtractor (`lib/extractors/invoice-extractor.ts`)

- **Input**: HTML content string
- **Output**: `ExtractionResult<ExtractedInvoiceData>`
- **Extracts**: invoiceNumber, date, customerName, customerAddress, customerTaxId, netAmount, vatRate, vatAmount, totalAmount, items[], paymentMethod, notes
- **Uses**: `cheerio` for HTML parsing

### API Routes

#### GET `/api/extractions`

- **Query Parameters**: `status`, `sourceType`, `search`
- **Response**: `{ success: boolean, data: { records: ExtractionRecord[], statistics: ExtractionStatistics } }`
- **Purpose**: Retrieve filtered extraction records and statistics

#### POST `/api/extractions`

- **Body**: None
- **Response**: `{ success: boolean, data: { message: string, summary: {...}, records: {...} } }`
- **Purpose**: Process all dummy data files and extract records

#### POST `/api/approvals`

- **Body**: `{ action: 'approve' | 'reject' | 'bulk_approve' | 'bulk_reject' | 'edit', id?: string, ids?: string[], ... }`
- **Response**: `{ success: boolean, message: string }`
- **Purpose**: Approve, reject, or edit extraction records

#### POST `/api/export`

- **Body**: `{ spreadsheetId?: string, createNew?: boolean }`
- **Response**: `{ success: boolean, data: { spreadsheetId: string, spreadsheetUrl: string } }`
- **Purpose**: Export approved records to Google Sheets

### Type Definitions (`types/data.ts`)

- `ExtractionResult<T>` - Standard result pattern
- `ExtractionStatus` - Enum: PENDING, APPROVED, REJECTED, EDITED, EXPORTED, FAILED
- `SourceType` - Enum: FORM, EMAIL, INVOICE
- `ExtractedFormData` - Form extraction data structure
- `ExtractedEmailData` - Email extraction data structure
- `ExtractedInvoiceData` - Invoice extraction data structure
- `ExtractionRecord` - Complete record with metadata
- `ExtractionStatistics` - Statistics aggregation

## Usage

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Type check
npm run type-check

# Run unit tests
npm test

# Run unit tests with UI
npm run test:ui

# Run unit tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Processing Data

1. Navigate to Dashboard (`/dashboard`)
2. Click **"Process Data"** button
3. System automatically extracts data from:
   - 5 HTML contact forms (`dummy_data/forms/`)
   - 10 email files (`dummy_data/emails/`)
   - 10 HTML invoices (`dummy_data/invoices/`)
4. Wait for extraction to complete (25 total records)

### Reviewing Extractions

1. View extraction records in the main table
2. Use filters:
   - **Status**: Filter by pending, approved, rejected, edited, exported, or failed
   - **Source Type**: Filter by forms, emails, or invoices
   - **Search**: Search across all record fields
3. Click **"View"** on any record to see detailed information
4. Records with warnings are marked with yellow badges

### Editing Records

1. Click **"Edit"** on any record
2. Modify the extracted data fields
3. Click **"Save Changes"** to update the record
4. Record status changes to "Edited"

### Approving or Rejecting Records

1. Open a record for review (click "View" or "Edit")
2. Review the extracted data and any warnings
3. Click **"Approve"** to mark as approved
4. Or click **"Reject"** to mark as rejected (with optional reason)

### Exporting to Google Sheets

1. Ensure you have at least one approved record
2. Click the **"Export to Sheets"** button
3. A new Google Spreadsheet will be created automatically with three sheets:
   - Forms
   - Emails
   - Invoices
4. The spreadsheet URL will be displayed in a success notification
5. Approved records will be marked as "Exported"

### API Usage Examples

#### Process Data

```bash
POST /api/extractions
```

#### Get Records

```bash
GET /api/extractions?status=pending&sourceType=form&search=john
```

#### Approve Record

```bash
POST /api/approvals
{
  "action": "approve",
  "id": "record-id",
  "approvedBy": "user@example.com"
}
```

#### Edit Record

```bash
POST /api/approvals
{
  "action": "edit",
  "id": "record-id",
  "updatedData": { "fullName": "Updated Name" },
  "editedBy": "user@example.com"
}
```

#### Export to Sheets

```bash
POST /api/export
{
  "createNew": true
}
```

## Maintenance

### Testing

The project uses a comprehensive testing strategy:

1. **Unit Tests** (Vitest):

   - Test extractors (`tests/unit/extractors/`)
   - Test services (`tests/unit/services/`)
   - Test utilities (`tests/unit/utils/`)
   - Run with: `npm test`

2. **Integration Tests** (Playwright):

   - Test API endpoints (`tests/integration/`)
   - Run with: `npm run test:integration`

3. **E2E Tests** (Playwright):
   - Test full workflows (`tests/e2e/`)
   - Run with: `npm run test:e2e`

### Code Quality

- **ESLint**: Configured with Next.js rules (`eslint.config.mjs`)
- **TypeScript**: Strict mode enabled, type checking with `npm run type-check`
- **Prettier**: Code formatting (if configured)

### Dependencies

- **Update Dependencies**: Run `npm update` regularly
- **Security Audits**: Run `npm audit` to check for vulnerabilities
- **Major Updates**: Review changelogs before updating major versions

### Deployment

1. **Build**: `npm run build`
2. **Start**: `npm start`
3. **Environment Variables**: Ensure `.env.local` is configured (or use production env vars)
4. **Google Sheets**: Service account must have proper permissions

### Monitoring

- **Logging**: Use `Logger` class for structured logging
- **Error Tracking**: Errors are logged with context via `errorHandler`
- **Statistics**: Available via `storageService.getStatistics()`

## Update History

### Version 1.0.0 (Initial Release)

- Initial implementation of data extraction dashboard
- Support for HTML forms, email files (.eml), and HTML invoices
- Human-in-the-loop approval workflow
- Google Sheets integration
- Comprehensive testing suite (unit, integration, E2E)
- Dashboard with filtering and search capabilities
- Statistics and analytics
