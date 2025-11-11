# AthenaGen AI - Data Extraction Dashboard

## Description

A human-in-the-loop data extraction and approval workflow system built for TechFlow Solutions. This application automates the extraction of structured data from multiple sources (HTML forms, email files, and invoices), provides an intuitive dashboard for reviewing and editing extracted records, and enables seamless export to Google Sheets.

The system processes dummy data files including 5 contact forms, 10 email messages, and 10 invoices, extracting key information such as customer details, contact information, invoice data, and business inquiries. Users can review, edit, approve, or reject extracted records before exporting approved data to Google Sheets.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Installation

1. Install dependencies:

```bash
npm install
```

2. (Optional) Set up Google Sheets integration by creating a `.env.local` file:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Processing Data

1. Navigate to the Dashboard
2. Click the **"Process Data"** button
3. The system will automatically extract data from:
   - 5 HTML contact forms (`dummy_data/forms/`)
   - 10 email files (`dummy_data/emails/`)
   - 10 HTML invoices (`dummy_data/invoices/`)
4. Wait for extraction to complete (you should see 25 total records)

### Reviewing Extractions

1. View extraction records in the main table
2. Use filters to narrow down results:
   - **Status**: Filter by pending, approved, rejected, edited, exported, or failed
   - **Source Type**: Filter by forms, emails, or invoices
   - **Search**: Search across all record fields
3. Click **"View"** on any record to see detailed information
4. Records with warnings are marked with yellow badges

### Editing Records

1. Click **"Edit"** on any record
2. Modify the extracted data fields
3. Click **"Save Changes"** to update the record
4. The record status will change to "Edited"

### Approving or Rejecting Records

1. Open a record for review (click "View" or "Edit")
2. Review the extracted data and any warnings
3. Click **"Approve"** to mark the record as approved
4. Or click **"Reject"** to mark the record as rejected (with optional reason)

### Exporting to Google Sheets

1. Ensure you have at least one approved record
2. Click the **"Export to Sheets"** button
3. A new Google Spreadsheet will be created automatically
4. The spreadsheet URL will be displayed in a success notification
5. Approved records will be marked as "Exported"

### Google Sheets Integration

To enable Google Sheets export functionality:

1. **Create a Google Cloud Project**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Sheets API**

   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it

3. **Create Service Account**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name it (e.g., `techflow-sheets-exporter`)
   - Grant role: "Editor" or "Google Sheets API User"

4. **Generate Service Account Key**

   - Open your service account
   - Go to "Keys" tab > "Add Key" > "Create New Key"
   - Select JSON format and download

5. **Add Credentials to Project**
   - Copy the entire JSON content from the downloaded file
   - Add it to `.env.local` as `GOOGLE_SERVICE_ACCOUNT_KEY` (all on one line)

**Note**: If exporting to an existing spreadsheet, share it with the service account email (found in the JSON key file) and grant "Editor" access.

## Features

### Data Extraction

- **Multi-Source Support**: Extract data from HTML forms, email files (.eml), and HTML invoices
- **Intelligent Parsing**: Automatically identifies and extracts structured data fields
- **Warning System**: Flags potential data quality issues or missing fields
- **Error Handling**: Gracefully handles extraction failures with detailed error messages

### Review and Approval Workflow

- **Status Management**: Track records through pending → approved/rejected/edited → exported workflow
- **Interactive Review**: View detailed extraction results in a user-friendly interface
- **Inline Editing**: Edit extracted data directly from the dashboard
- **Bulk Operations**: Approve or reject multiple records efficiently

### Dashboard and Analytics

- **Statistics Cards**: Real-time overview of extraction statistics
  - Total records
  - Pending, approved, rejected, exported, and failed counts
  - Breakdown by source type (forms, emails, invoices)
- **Advanced Filtering**: Filter by status, source type, or search term
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Export Capabilities

- **Google Sheets Integration**: Export approved records to Google Sheets
- **Automatic Spreadsheet Creation**: Creates new spreadsheets automatically
- **Structured Data Export**: Maintains data structure and formatting

### Testing and Quality Assurance

- **Unit Tests**: Comprehensive test coverage for extractors and services
- **Integration Tests**: API endpoint testing
- **E2E Tests**: End-to-end workflow testing with Playwright
- **Type Safety**: Full TypeScript support for type-safe development

## Technologies

### Frontend

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React component library
- **Lucide React**: Icon library
- **Sonner**: Toast notification system

### Backend & Processing

- **Next.js API Routes**: Server-side API endpoints
- **mailparser**: Email file parsing (.eml format)
- **cheerio**: Server-side HTML parsing and manipulation
- **Google APIs**: Google Sheets API integration via googleapis

### Development Tools

- **Vitest**: Fast unit testing framework
- **Playwright**: End-to-end testing framework
- **ESLint**: Code linting
- **TypeScript Compiler**: Type checking

### Build & Deployment

- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow the existing code style** and TypeScript conventions
3. **Write tests** for new features or bug fixes
4. **Update documentation** as needed
5. **Submit a pull request** with a clear description of changes

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:all     # Run all tests (unit + integration + E2E)
npm run lint         # Run linter
```

## Authors

Built for **AthenaGen AI** as part of the Solutions Engineer assignment.

## License

ISC

## Acknowledgments

- **TechFlow Solutions** - Project requirements and specifications
- **shadcn/ui** - Beautiful and accessible React components
- **Next.js Team** - Excellent React framework
- **Google Cloud Platform** - Google Sheets API integration

---

**Built for TechFlow Solutions | AthenaGen AI Assignment**
