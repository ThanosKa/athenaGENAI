# AthenaGen AI - Data Extraction Dashboard

## Description

A human-in-the-loop data extraction and approval workflow system built for TechFlow Solutions. This application automates the extraction of structured data from multiple sources (HTML forms, email files, and invoices), provides an intuitive dashboard for reviewing and editing extracted records, and enables seamless export to Google Sheets.

The system processes dummy data files including 5 contact forms, 10 email messages, and 10 invoices, extracting key information such as customer details, contact information, invoice data, and business inquiries. Users can review, edit, approve, or reject extracted records before exporting approved data to Google Sheets.

## Table of Contents

- [Documentation](#documentation)
- [Installation](#installation)
- [Usage](#usage)
- [Running with Docker](#running-with-docker)
- [Features](#features)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Documentation

### Business & Technical Documents

For a complete understanding of the project, business case, and implementation details, please review:

- **[Needs Analysis](.doc/01_NEEDS_ANALYSIS.md)** - Detailed problem analysis, client pain points, current state assessment, and technology justification
- **[Technical Proposal](.doc/02_TECHNICAL_PROPOSAL.md)** - Complete solution design, implementation timeline, cost analysis, ROI calculations, and risk assessment
- **[Executive Summary](.doc/03_EXECUTIVE_SUMMARY.md)** - Business case, financial justification, and high-level overview for decision makers

### Quick Facts

- **Problem:** TechFlow Solutions wastes $123,000/year on manual data entry with 10% error rate
- **Solution:** Intelligent automation with human-in-the-loop control
- **ROI:** 516% over 3 years | Break-even in 5.8 months
- **Cost Savings:** $107,200 annually
- **Error Reduction:** 95% fewer mistakes (10% → <1%)

### Key Metrics

| Metric                       | Result                           |
| ---------------------------- | -------------------------------- |
| Annual Cost Savings          | $107,200                         |
| 3-Year ROI                   | 516%                             |
| Break-even Period            | 5.8 months                       |
| Error Rate Reduction         | 95%                              |
| Processing Speed Improvement | 10x faster                       |
| Scalability                  | 10x volume growth without hiring |

## Installation

1. Install dependencies:

```bash
npm install
```

2. (Optional) Set up Google Sheets integration:

   For detailed setup instructions, see [Google Sheets Setup Guide](GOOGLE_SHEETS_SETUP.md).

   Quick setup: Create a `.env.local` file in the project root:

   ```bash
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
   ```

   **Note:** The application works without Google Sheets integration, but you won't be able to export data to Google Sheets. All other features (data extraction, review, approval) work without it.

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running with Docker

### Prerequisites

- Docker and Docker Compose installed on your system
- For more information, visit [Docker Installation Guide](https://docs.docker.com/get-docker/)

### Quick Start with Docker

1. **Clone and navigate to the project:**

```bash
cd athenaGENAI
```

2. **Create `.env.local` file** (optional for Google Sheets integration):

   For detailed setup instructions, see [Google Sheets Setup Guide](GOOGLE_SHEETS_SETUP.md).

   Quick setup:

   ```bash
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
   ```

3. **Build and run with Docker Compose:**

```bash
docker-compose up --build
```

4. **Access the application:**

- Open [http://localhost:3000](http://localhost:3000) in your browser
- The application will be ready once you see: "Ready in X.XXs"

### Docker Commands

```bash
# Start the application
docker-compose up

# Start in background mode
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild without cache
docker-compose up --build --no-cache

# Remove all volumes (clean slate)
docker-compose down -v
```

### Production Deployment

For production deployments, use the Nginx reverse proxy:

```bash
docker-compose --profile prod up -d
```

This includes:

- Nginx reverse proxy on port 80/443
- Container restart policy
- Health checks
- Log rotation

### Troubleshooting

**Port already in use:**

```bash
# Use a different port
docker-compose -f docker-compose.yml up -p 8000:3000
```

**Container won't start:**

```bash
# Check logs for errors
docker-compose logs app

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

**Need to access container shell:**

```bash
docker-compose exec app sh
```

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

To enable Google Sheets export functionality, follow the detailed setup guide:

**[Complete Google Sheets Setup Guide](GOOGLE_SHEETS_SETUP.md)**

The guide includes:

- Step-by-step instructions for creating a Google Cloud Project
- Enabling the Google Sheets API
- Creating and configuring a service account
- Setting up credentials in your project
- Troubleshooting common issues

**Quick Summary:**

1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account and download JSON key
4. Add the JSON key to `.env.local` as `GOOGLE_SERVICE_ACCOUNT_KEY`

**Note:** If exporting to an existing spreadsheet, share it with the service account email (found in the JSON key file) and grant "Editor" access.

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
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm test                 # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
npm run test:integration # Run integration tests
npm run test:e2e         # Run E2E tests
npm run test:all         # Run all tests
npm run lint             # Run linter
npm run type-check       # Type check with TypeScript
npm run clean            # Clean build artifacts
```

### Project Structure

```
athenaGENAI/
├── .doc/                          # Documentation
│   ├── 01_NEEDS_ANALYSIS.md      # Problem analysis & business case
│   ├── 02_TECHNICAL_PROPOSAL.md  # Technical solution & ROI
│   └── 03_EXECUTIVE_SUMMARY.md   # Executive summary
├── .github/
│   └── workflows/
│       └── ci.yml                # CI/CD pipeline (GitHub Actions)
├── app/
│   ├── api/                       # API routes
│   │   ├── approvals/route.ts
│   │   ├── export/route.ts
│   │   └── extractions/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main dashboard
├── components/
│   ├── ExtractionList.tsx         # Records table
│   ├── ExtractionReview.tsx       # Record review modal
│   ├── StatisticsCards.tsx        # Statistics overview
│   ├── StatisticsCharts.tsx       # Data visualization charts
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── extractors/                # Data extraction logic
│   │   ├── email-extractor.ts
│   │   ├── form-extractor.ts
│   │   └── invoice-extractor.ts
│   ├── integrations/
│   │   └── google-sheets.ts       # Google Sheets API
│   ├── services/                  # Business logic
│   │   ├── approval-service.ts
│   │   ├── data-processor.ts
│   │   ├── edit-service.ts
│   │   ├── export-service.ts
│   │   └── storage.ts
│   └── utils/
│       ├── error-handler.ts
│       └── logger.ts
├── types/
│   └── data.ts                    # Type definitions
├── dummy_data/                    # Test data
│   ├── forms/                     # 5 HTML forms
│   ├── emails/                    # 10 email files
│   └── invoices/                  # 10 invoice files
├── tests/
│   ├── e2e/                       # End-to-end tests
│   ├── integration/               # Integration tests
│   ├── unit/                      # Unit tests
│   └── fixtures/                  # Test data
├── Dockerfile                     # Container image
├── docker-compose.yml             # Multi-container setup
├── .dockerignore                  # Docker build ignore
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### Continuous Integration

The project includes automated CI/CD pipeline with GitHub Actions (`.github/workflows/ci.yml`):

- **Linting & Code Quality** - ESLint and TypeScript type checking
- **Unit & Integration Tests** - Vitest with coverage reports
- **Build Verification** - Next.js production build validation
- **Security Scanning** - npm audit for dependencies
- **Docker Build** - Container image build verification
- **E2E Tests** - Playwright browser automation tests

All checks must pass before code is merged to main branch.

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
