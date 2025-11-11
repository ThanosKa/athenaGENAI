# Google Sheets Integration Setup

The application can export data to Google Sheets. To enable this feature:

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Name your project (e.g., "techflow-automation")

## Step 2: Enable Google Sheets API

1. In the Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

## Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `techflow-sheets-exporter`
   - Description: `Service account for TechFlow data export`
4. Click "Create and Continue"
5. Grant role: "Editor" (or "Google Sheets API User")
6. Click "Done"

## Step 4: Generate Service Account Key

1. In the Credentials page, find your service account
2. Click on it to open details
3. Go to the "Keys" tab
4. Click "Add Key" > "Create New Key"
5. Select JSON format
6. Click "Create" - the key file will download

## Step 5: Add Credentials to Project

1. Open the downloaded JSON file
2. Copy the entire content
3. Create a `.env.local` file in the project root:

```bash
# .env.local
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
```

4. Paste the JSON content as the value (all on one line)

## Step 6: Share Spreadsheet (if using existing sheet)

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
```

---

## Troubleshooting

### "Failed to initialize Google Sheets auth"

**Solution**: Check that your `GOOGLE_SERVICE_ACCOUNT_KEY` is properly formatted in `.env.local`. The entire JSON object should be on one line.

### "Permission denied" when exporting

**Solution**: Make sure the service account has Editor access to the target spreadsheet (if using existing sheet).

---

**Built for TechFlow Solutions | AthenaGen AI Assignment**
