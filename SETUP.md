# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Open Application

Navigate to http://localhost:3000

---

## Google Sheets Integration (Optional)

The application can export data to Google Sheets. To enable this feature:

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Name your project (e.g., "techflow-automation")

### Step 2: Enable Google Sheets API

1. In the Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `techflow-sheets-exporter`
   - Description: `Service account for TechFlow data export`
4. Click "Create and Continue"
5. Grant role: "Editor" (or "Google Sheets API User")
6. Click "Done"

### Step 4: Generate Service Account Key

1. In the Credentials page, find your service account
2. Click on it to open details
3. Go to the "Keys" tab
4. Click "Add Key" > "Create New Key"
5. Select JSON format
6. Click "Create" - the key file will download

### Step 5: Add Credentials to Project

1. Open the downloaded JSON file
2. Copy the entire content
3. Create a `.env.local` file in the project root:

```bash
# .env.local
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
```

4. Paste the JSON content as the value (all on one line)

### Step 6: Share Spreadsheet (if using existing sheet)

If you want to export to an existing spreadsheet:

1. Open your Google Sheet
2. Click "Share"
3. Add the service account email (found in the JSON key file as `client_email`)
4. Give it "Editor" access

**Note**: If you use the "Create New Spreadsheet" option in the app, this step is not needed.

---

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Required for Google Sheets export
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Optional
NODE_ENV=development
```

---

## Testing the Application

### 1. Process Data

1. Navigate to the Dashboard
2. Click "Process Data" button
3. Wait for extraction to complete
4. You should see 25 total records:
   - 5 Forms
   - 10 Emails
   - 10 Invoices

### 2. Review Extractions

1. Click on any record to view details
2. Check for warnings (yellow badges)
3. Edit data if needed
4. Approve or reject

### 3. Export to Google Sheets

1. Approve one or more records
2. Click "Export to Sheets"
3. A new spreadsheet will be created
4. The URL will be displayed in the success message

---

## Project Structure

```
.
├── app/
│   ├── api/                      # API routes
│   │   ├── approvals/route.ts
│   │   ├── extractions/route.ts
│   │   └── export/route.ts
│   ├── dashboard/                # Dashboard page
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── ExtractionList.tsx
│   ├── ExtractionReview.tsx
│   └── StatisticsCards.tsx
├── lib/
│   ├── extractors/               # Data extraction logic
│   ├── integrations/             # External integrations
│   ├── services/                 # Business logic
│   └── utils/                    # Utilities
├── types/                        # TypeScript types
├── dummy_data/                   # Sample data
│   ├── forms/                    # 5 HTML forms
│   ├── emails/                   # 10 .eml files
│   └── invoices/                 # 10 HTML invoices
└── SETUP.md                      # This file
```

---

## Troubleshooting

### "Failed to initialize Google Sheets auth"

**Solution**: Check that your `GOOGLE_SERVICE_ACCOUNT_KEY` is properly formatted in `.env.local`. The entire JSON object should be on one line.

### "No extraction records found"

**Solution**: Click the "Process Data" button to extract data from the dummy_data folder.

### "Permission denied" when exporting

**Solution**: Make sure the service account has Editor access to the target spreadsheet (if using existing sheet).

### Components not rendering

**Solution**: Make sure all dependencies are installed:
```bash
npm install
```

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npm run type-check
```

---

## Architecture Overview

### Data Flow

1. **Extraction**: User clicks "Process Data"
   - API route `/api/extractions` (POST)
   - `DataProcessor` orchestrates extraction
   - Extractors parse files and return `ExtractionResult`
   - Records stored in `StorageService`

2. **Review**: User views/edits records
   - Dashboard loads via `/api/extractions` (GET)
   - User clicks "View" → `ExtractionReview` component
   - User edits → API route `/api/approvals` (POST action: edit)

3. **Approval**: User approves/rejects
   - Click "Approve" → API route `/api/approvals` (POST action: approve)
   - `ApprovalService` updates status
   - Record marked as approved

4. **Export**: User exports to Sheets
   - Click "Export" → API route `/api/export` (POST)
   - `ExportService` coordinates export
   - `GoogleSheetsClient` creates/updates spreadsheet
   - Records marked as exported

### Services

- **DataProcessor**: Orchestrates file extraction
- **StorageService**: In-memory data store (singleton)
- **ApprovalService**: Handles approve/reject logic
- **EditService**: Validates and applies edits
- **ExportService**: Coordinates Google Sheets export
- **GoogleSheetsClient**: Direct integration with Sheets API

### Error Handling

- All extractors return `ExtractionResult<T>`
- Errors categorized (extraction, validation, export)
- User-friendly messages in Greek
- Logging with context and levels

---

## Next Steps

### Recommended Enhancements

1. **Testing**
   - Add unit tests for extractors
   - Add integration tests for API routes
   - Add E2E tests with Playwright

2. **Database**
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Add data persistence
   - Add audit log table

3. **Authentication**
   - Add user authentication (NextAuth.js)
   - Role-based access control
   - Multi-tenancy support

4. **Real-time Updates**
   - Add WebSocket support for live updates
   - Show extraction progress in real-time
   - Notify users of new extractions

5. **File Upload**
   - Allow users to upload their own files
   - Support more file formats (PDF, DOCX)
   - Batch file processing

6. **Advanced Features**
   - Email notifications on approval
   - Scheduled exports
   - Custom export templates
   - Export to Excel (alternative to Sheets)
   - Data validation rules engine

---

## Support

For questions or issues:
- Check the `.cursor/tasks.md` file for implementation details
- Review the coding patterns in `.cursor/rules/`
- Check the Greek documentation files for requirements

---

**Built for TechFlow Solutions | AthenaGen AI Assignment**

