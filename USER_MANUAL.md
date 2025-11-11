# User Manual: AthenaGen AI Data Extraction Dashboard

**Version:** 1.0.0  
**Last Updated:** November 2025  
**For:** TechFlow Solutions Staff

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Processing Data](#processing-data)
5. [Reviewing Extractions](#reviewing-extractions)
6. [Editing Records](#editing-records)
7. [Approving and Rejecting Records](#approving-and-rejecting-records)
8. [Exporting to Google Sheets](#exporting-to-google-sheets)
9. [Understanding Statuses and Badges](#understanding-statuses-and-badges)
10. [Filtering and Searching](#filtering-and-searching)
11. [Troubleshooting](#troubleshooting)
12. [Frequently Asked Questions](#frequently-asked-questions)

---

## Introduction

### What is This System?

The AthenaGen AI Data Extraction Dashboard is a human-in-the-loop automation system that helps TechFlow Solutions process customer data from multiple sources:

- **HTML Contact Forms** - Customer inquiries from your website
- **Email Files (.eml)** - Customer emails and invoice notifications
- **HTML Invoices** - Invoice documents with financial information

### Key Principle: Human Control

**Important:** This system does NOT work automatically. You have complete control:

- ✅ All extractions require your approval before being saved
- ✅ You can edit any data before approving
- ✅ You can reject any extraction you don't want
- ✅ Nothing is exported to Google Sheets without your explicit approval

**You are always in control.** The system helps you work faster, but you make all the decisions.

---

## Getting Started

### Prerequisites

Before using the dashboard, ensure:

1. The application is running (check with your IT administrator)
2. You have access to the dashboard URL (typically `http://localhost:3000` or your company's server)
3. You have a modern web browser (Chrome, Firefox, Edge, or Safari)

### First-Time Access

1. **Open the Dashboard**

   - Navigate to the dashboard URL in your web browser
   - You should see the "Data Extraction Dashboard" page

2. **Verify You Can See the Interface**

   - You should see:
     - A header with "Data Extraction Dashboard"
     - Two buttons: "Process Data" and "Export to Sheets"
     - Four statistics cards showing zeros (Total Extractions, Pending Approval, Approved, Exported)
     - An empty table or message saying "No extraction records found"

3. **You're Ready!**
   - If you see the dashboard interface, you're ready to start processing data

---

## Dashboard Overview

### Main Components

The dashboard consists of several key areas:

#### 1. Header Section

- **Title:** "Data Extraction Dashboard"
- **Subtitle:** "Human-in-the-loop data extraction and approval workflow"
- **Action Buttons:**
  - **"Process Data"** - Starts extracting data from files
  - **"Export to Sheets"** - Exports approved records to Google Sheets (disabled until you have approved records)

#### 2. Statistics Cards (Top Row)

Four cards showing real-time statistics:

| Card                  | Shows                                      | Color        |
| --------------------- | ------------------------------------------ | ------------ |
| **Total Extractions** | Total number of records processed          | Blue         |
| **Pending Approval**  | Records waiting for your review            | Amber/Yellow |
| **Approved**          | Records you've approved (ready to export)  | Green        |
| **Exported**          | Records successfully sent to Google Sheets | Blue         |

Each card also shows a breakdown by source type (Forms, Emails, Invoices).

#### 3. Charts Section (Below Statistics)

Visual charts showing:

- Distribution of records by status
- Distribution of records by source type
- Trends over time (if applicable)

#### 4. Filters and Search Bar

Located above the records table:

- **Status Filter** - Dropdown to filter by status (All, Pending, Approved, Rejected, Edited, Exported, Failed)
- **Source Type Filter** - Dropdown to filter by source (All, Form, Email, Invoice)
- **Search Box** - Text field to search across all record fields

#### 5. Records Table

The main table showing all extraction records with columns:

- **Source** - Badge showing Form, Email, or Invoice
- **Type** - Preview of extracted data (name, email, invoice number)
- **File** - Source filename
- **Status** - Current status badge
- **Extracted** - Date and time of extraction
- **Warnings** - Number of warnings or error indicator
- **Actions** - Menu with View, Edit, Approve, Reject options

---

## Processing Data

### What Happens When You Process Data?

When you click "Process Data", the system:

1. Reads files from the `dummy_data` folder:

   - 5 HTML contact forms
   - 10 email files (.eml format)
   - 10 HTML invoices

2. Extracts structured data from each file automatically

3. Creates extraction records with status "Pending"

4. Displays all records in the table for your review

### Step-by-Step: Processing Your First Data

1. **Click "Process Data" Button**

   - Located in the top-right corner of the dashboard
   - Button text changes to "Processing..." while working
   - Wait for processing to complete (usually 5-10 seconds)

2. **Wait for Completion**

   - You'll see a success notification: "Successfully processed 25 records"
   - The statistics cards will update showing:
     - Total Extractions: 25
     - Pending Approval: 25
     - Breakdown: Forms: 5, Emails: 10, Invoices: 10

3. **Review the Table**

   - All 25 records appear in the table
   - Each record shows:
     - Source type (Form/Email/Invoice badge)
     - Extracted data preview
     - Status: "Pending" (yellow badge)
     - Warnings count (if any)

4. **You're Ready to Review**
   - All records are now waiting for your approval
   - Nothing has been saved or exported yet
   - You have full control over what happens next

### What If Processing Fails?

If you see an error message:

- Check that the `dummy_data` folder exists and contains files
- Contact your IT administrator if the problem persists
- The system will show which files failed to process

---

## Reviewing Extractions

### Why Review?

Every extraction needs human review because:

- Automated extraction may miss or misinterpret data
- You know your business context better than the system
- Quality control ensures accurate data in Google Sheets

### How to Review a Record

#### Method 1: Quick View (Read-Only)

1. **Find the Record** in the table
2. **Click the Actions Menu** (three dots ⋯) in the rightmost column
3. **Select "View"**
4. **Review Dialog Opens** showing:

   - All extracted fields
   - Warnings (if any)
   - Error messages (if extraction failed)
   - Action buttons: Approve, Reject, Edit

5. **Make Your Decision:**
   - Click **"Approve"** if data looks correct
   - Click **"Reject"** if you don't want this record
   - Click **"Edit"** to modify data before approving
   - Click **"X"** (close) to review later

#### Method 2: Direct Edit

1. **Click Actions Menu** → **"Edit"**
2. **Edit Dialog Opens** in edit mode
3. **Make Changes** to any fields
4. **Click "Save Changes"** to update the record
5. Record status changes to "Edited" (you can still approve/reject later)

### Understanding the Review Dialog

The review dialog shows different fields depending on the source type:

#### For Forms:

- Full Name
- Email
- Phone
- Company
- Service Interest
- Message
- Priority
- Submission Date

#### For Emails:

- Email Type (Client Inquiry or Invoice Notification)
- From (sender name)
- Email (sender address)
- Subject
- Full Name (if found in email)
- Contact Email (if found)
- Phone (if found)
- Company (if found)
- Invoice Reference (if invoice-related)

#### For Invoices:

- Invoice Number
- Date
- Customer Name
- Net Amount (€)
- VAT Rate (%)
- VAT Amount (€)
- Total Amount (€)

### Warnings and Errors

**Yellow Warning Badge:**

- Appears when the system found potential issues
- Common warnings:
  - "Missing email address"
  - "Phone number format may be incorrect"
  - "Invoice amount seems unusual"
- **Action:** Review the data carefully, but warnings don't prevent approval

**Red Error Badge:**

- Appears when extraction completely failed
- Common errors:
  - "Could not parse file"
  - "File format not recognized"
- **Action:** You may need to reject these records or process manually

---

## Editing Records

### When to Edit

Edit records when:

- Data extraction missed some information
- Data needs correction (typos, wrong values)
- You want to add missing details
- Data format needs adjustment

### How to Edit

#### Step 1: Open Edit Mode

**Option A: From Table**

1. Click Actions Menu (⋯) on the record
2. Select "Edit"
3. Dialog opens in edit mode

**Option B: From Review Dialog**

1. Click "View" to open review dialog
2. Click "Edit" button
3. Dialog switches to edit mode

#### Step 2: Make Changes

- All editable fields become active (white background)
- Non-editable fields remain grayed out
- Type directly into fields to change values
- For invoices, numeric fields accept decimal values

#### Step 3: Save or Cancel

**To Save:**

1. Click **"Save Changes"** button
2. Changes are saved immediately
3. Record status changes to "Edited"
4. Dialog closes
5. Table updates to show new status

**To Cancel:**

1. Click **"Cancel"** button
2. All changes are discarded
3. Original data is restored
4. Dialog closes

### Editing Tips

- **Email Fields:** System validates email format
- **Numeric Fields:** Use decimal points (e.g., 1234.56)
- **Dates:** Use format YYYY-MM-DD or as shown
- **Text Fields:** Can contain any characters, including Greek letters

### After Editing

- Record status changes to "Edited" (blue badge)
- You can still approve or reject edited records
- Edited records can be exported to Google Sheets after approval
- You can edit the same record multiple times

---

## Approving and Rejecting Records

### The Approval Workflow

**Important:** Nothing is saved or exported until you approve it. The workflow is:

```
Pending → [Review] → [Approve or Reject]
         ↓                    ↓
      Approved            Rejected
         ↓
      Exported (after clicking "Export to Sheets")
```

### Approving a Record

#### When to Approve

Approve records when:

- All extracted data looks correct
- Warnings are acceptable or resolved
- Data is complete and ready for export

#### How to Approve

**Method 1: From Review Dialog**

1. Open record (click "View")
2. Review all fields
3. Click green **"Approve"** button
4. Confirmation appears: "Record approved successfully"
5. Status changes to "Approved" (green badge)

**Method 2: Quick Approve from Table**

1. Click Actions Menu (⋯)
2. Select "Approve"
3. Record is approved immediately (no dialog)

#### After Approval

- Status badge changes to "Approved" (green)
- Record is ready to be exported to Google Sheets
- Approved count increases in statistics card
- You can still view approved records, but cannot edit them

### Rejecting a Record

#### When to Reject

Reject records when:

- Data is completely wrong or corrupted
- File was processed incorrectly
- You don't want this record in your system
- Data is duplicate or irrelevant

#### How to Reject

**Method 1: From Review Dialog**

1. Open record (click "View")
2. Review the data
3. Click red **"Reject"** button
4. Optional: Enter rejection reason (if prompted)
5. Confirmation appears: "Record rejected"
6. Status changes to "Rejected" (red badge)

**Method 2: Quick Reject from Table**

1. Click Actions Menu (⋯)
2. Select "Reject"
3. Record is rejected immediately

#### After Rejection

- Status badge changes to "Rejected" (red)
- Record is NOT exported to Google Sheets
- Rejected records remain visible for audit purposes
- You can filter to see only rejected records

### Bulk Operations

Currently, approval/rejection is done one record at a time. This ensures you review each record carefully and maintain quality control.

---

## Exporting to Google Sheets

### Prerequisites

Before exporting, ensure:

1. **Google Sheets Integration is Set Up**

   - See [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) for setup instructions
   - Requires Google Cloud service account credentials

2. **You Have Approved Records**
   - The "Export to Sheets" button is disabled if you have no approved records
   - Approve at least one record before exporting

### Export Process

#### Step 1: Prepare for Export

1. **Review Your Approved Records**

   - Use the Status filter: Select "Approved"
   - Verify all records you want to export are approved
   - Check that data looks correct

2. **Check Statistics Card**
   - "Approved" card shows number of approved records
   - This is how many records will be exported

#### Step 2: Export

1. **Click "Export to Sheets" Button**

   - Located in top-right corner next to "Process Data"
   - Button is disabled (gray) if no approved records exist

2. **Wait for Export**

   - Button shows "Exporting..." while processing
   - System creates a new Google Spreadsheet (or uses existing one)
   - Creates three separate sheets:
     - **Forms** - All approved form extractions
     - **Emails** - All approved email extractions
     - **Invoices** - All approved invoice extractions

3. **Success Notification**
   - Green success message appears
   - Shows Google Spreadsheet URL
   - Click the URL to open the spreadsheet
   - Message: "Successfully exported X records to Google Sheets"

#### Step 3: Verify Export

1. **Open the Spreadsheet**

   - Click the URL from the success notification
   - Or copy the URL and open in a new tab

2. **Check the Sheets**

   - Verify data appears in correct sheets
   - Check that all approved records are present
   - Verify data formatting looks correct

3. **Back in Dashboard**
   - Exported records now show status "Exported" (blue badge)
   - "Exported" statistics card updates
   - "Approved" count decreases (records moved to exported)

### Export Behavior

- **Only Approved Records:** Only records with "Approved" status are exported
- **Automatic Organization:** Records are automatically sorted into Forms/Emails/Invoices sheets
- **New Spreadsheet:** Creates a new spreadsheet each time (unless configured otherwise)
- **Status Update:** Exported records change status to "Exported"
- **No Duplicates:** Each record is exported once

### What If Export Fails?

**Common Issues:**

1. **"No approved records to export"**

   - Solution: Approve some records first

2. **"Failed to initialize Google Sheets auth"**

   - Solution: Check Google Sheets setup (see GOOGLE_SHEETS_SETUP.md)
   - Verify service account credentials are configured

3. **"Permission denied"**

   - Solution: Ensure service account has access to Google Sheets
   - Share spreadsheet with service account email if using existing sheet

4. **"Network error"**
   - Solution: Check internet connection
   - Try again after a few moments

---

## Understanding Statuses and Badges

### Status Types

Each record has a status badge showing its current state:

| Status       | Badge Color  | Meaning                            | Can Edit? | Can Approve? | Can Export? |
| ------------ | ------------ | ---------------------------------- | --------- | ------------ | ----------- |
| **Pending**  | Yellow/Amber | Waiting for your review            | ✅ Yes    | ✅ Yes       | ❌ No       |
| **Approved** | Green        | You approved this record           | ❌ No     | ❌ No        | ✅ Yes      |
| **Rejected** | Red          | You rejected this record           | ❌ No     | ❌ No        | ❌ No       |
| **Edited**   | Blue         | You edited this record             | ✅ Yes    | ✅ Yes       | ❌ No       |
| **Exported** | Blue/Gray    | Successfully sent to Google Sheets | ❌ No     | ❌ No        | ❌ No       |
| **Failed**   | Red          | Extraction failed completely       | ❌ No     | ❌ No        | ❌ No       |

### Status Workflow

```
┌─────────┐
│ Pending │ ← New extractions start here
└────┬────┘
     │
     ├──→ [Approve] ──→ Approved ──→ [Export] ──→ Exported
     │
     ├──→ [Reject] ──→ Rejected
     │
     └──→ [Edit] ──→ Edited ──→ [Approve] ──→ Approved ──→ [Export] ──→ Exported
```

### Source Type Badges

Records also show source type badges:

- **Form** (Blue badge with document icon) - HTML contact form
- **Email** (Gray badge with mail icon) - Email file (.eml)
- **Invoice** (Default badge with receipt icon) - HTML invoice

### Warning Badges

**Yellow Warning Badge:**

- Shows number of warnings (e.g., "3")
- Indicates potential data quality issues
- Does not prevent approval
- Review carefully before approving

**Red Error Badge:**

- Shows "Error" text
- Indicates extraction completely failed
- Usually means record should be rejected
- Check error message in review dialog

---

## Filtering and Searching

### Why Filter and Search?

With 25+ records, filtering helps you:

- Focus on records needing attention (Pending)
- Find specific records quickly
- Review records by type (Forms, Emails, Invoices)
- Track exported records

### Using Status Filter

1. **Click Status Dropdown** (above the table)
2. **Select a Status:**

   - **All** - Shows all records (default)
   - **Pending** - Only records waiting for review
   - **Approved** - Only approved records (ready to export)
   - **Rejected** - Only rejected records
   - **Edited** - Only records you've edited
   - **Exported** - Only exported records
   - **Failed** - Only failed extractions

3. **Table Updates** automatically
4. **Statistics Cards** update to show filtered counts

**Example:** Select "Pending" to see only records needing your review.

### Using Source Type Filter

1. **Click Source Type Dropdown** (next to Status filter)
2. **Select a Type:**

   - **All** - Shows all source types (default)
   - **Form** - Only HTML form extractions
   - **Email** - Only email file extractions
   - **Invoice** - Only invoice extractions

3. **Table Updates** to show only selected type

**Example:** Select "Invoice" to review only invoice records.

### Using Search

1. **Click Search Box** (text field above table)
2. **Type Search Term:**

   - Searches across ALL fields (name, email, company, invoice number, etc.)
   - Case-insensitive (capitalization doesn't matter)
   - Partial matches work (typing "john" finds "John Smith")

3. **Results Update** as you type
4. **Clear Search:** Delete text or click X to show all records

**Search Examples:**

- Type "john" → Finds records with "John" in name, email, or company
- Type "TF-2024" → Finds invoices with that invoice number
- Type "@gmail.com" → Finds records with Gmail addresses

### Combining Filters

You can use all three filters together:

**Example Workflow:**

1. Filter Status: "Pending"
2. Filter Source Type: "Invoice"
3. Search: "2024"
4. Result: Shows only pending invoices from 2024

### Clearing Filters

- **Status/Source:** Select "All" from dropdown
- **Search:** Clear the text box
- **All Filters:** Refresh the page (or clear each filter)

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Process Data" Button Doesn't Work

**Symptoms:**

- Button is disabled or grayed out
- Clicking does nothing
- Error message appears

**Solutions:**

1. Check that `dummy_data` folder exists with files
2. Refresh the page (F5 or Ctrl+R)
3. Check browser console for errors (F12)
4. Contact IT administrator if problem persists

#### Issue: Records Not Appearing After Processing

**Symptoms:**

- Success message appears but table is empty
- Statistics show 0 records

**Solutions:**

1. Check filters - make sure Status is set to "All"
2. Clear search box if you have text entered
3. Refresh the page
4. Check browser console for errors

#### Issue: Can't Approve/Reject Records

**Symptoms:**

- Approve/Reject buttons are grayed out
- Options don't appear in Actions menu

**Solutions:**

1. Check record status - only "Pending" or "Edited" records can be approved/rejected
2. Make sure you're clicking the correct record
3. Try refreshing the page
4. Check if record already has "Approved" or "Rejected" status

#### Issue: Edit Mode Not Working

**Symptoms:**

- Fields remain grayed out after clicking "Edit"
- Can't type in fields
- "Save Changes" button doesn't work

**Solutions:**

1. Make sure you clicked "Edit" button (not just "View")
2. Check that record status allows editing (Pending or Edited)
3. Try closing and reopening the dialog
4. Refresh the page if problem persists

#### Issue: Export to Google Sheets Fails

**Symptoms:**

- Error message: "Failed to initialize Google Sheets auth"
- "Permission denied" error
- Export button is disabled

**Solutions:**

1. **Check Setup:**

   - Verify Google Sheets integration is configured (see GOOGLE_SHEETS_SETUP.md)
   - Check that `.env.local` file exists with service account credentials

2. **Check Approved Records:**

   - Make sure you have at least one approved record
   - Export button is disabled if no approved records exist

3. **Check Permissions:**

   - If using existing spreadsheet, share it with service account email
   - Grant "Editor" access to service account

4. **Network Issues:**
   - Check internet connection
   - Try again after a few moments

#### Issue: Data Looks Wrong After Extraction

**Symptoms:**

- Extracted data doesn't match source file
- Missing fields
- Incorrect values

**Solutions:**

1. **This is Normal:** Automated extraction isn't perfect
2. **Use Edit Feature:** Click "Edit" to correct any mistakes
3. **Review Warnings:** Check warning badges for data quality issues
4. **Approve After Editing:** Edit the data, then approve

#### Issue: Can't Find a Specific Record

**Symptoms:**

- Know a record exists but can't find it in table

**Solutions:**

1. **Clear All Filters:**

   - Set Status to "All"
   - Set Source Type to "All"
   - Clear search box

2. **Use Search:**

   - Type part of the record data (name, email, invoice number)
   - Search is case-insensitive

3. **Check Status:**
   - Record might be filtered out
   - Try different status filters

#### Issue: Page Loads Slowly

**Symptoms:**

- Dashboard takes long time to load
- Statistics cards show loading animation

**Solutions:**

1. **Normal on First Load:** Initial load may take 2-3 seconds
2. **Check Internet:** Slow connection affects loading
3. **Too Many Records:** If you have 100+ records, loading may be slower
4. **Browser Cache:** Clear browser cache if consistently slow

#### Issue: Statistics Don't Match Table

**Symptoms:**

- Statistics cards show different numbers than table

**Solutions:**

1. **Check Filters:** Statistics show filtered counts when filters are active
2. **Refresh Page:** Statistics update on page refresh
3. **Normal Behavior:** Statistics reflect current filter state

### Getting Help

If you encounter issues not covered here:

1. **Check Documentation:**

   - Review this manual
   - Check GOOGLE_SHEETS_SETUP.md for integration issues
   - Review README.md for technical details

2. **Contact Support:**

   - Reach out to your IT administrator
   - Provide:
     - What you were trying to do
     - Error message (if any)
     - Screenshot of the issue

3. **Browser Issues:**
   - Try a different browser
   - Clear browser cache
   - Disable browser extensions temporarily

---

## Frequently Asked Questions

### General Questions

**Q: Do I need to approve every record?**  
A: Yes. The system requires human approval for every extraction. Nothing is saved or exported until you approve it.

**Q: Can I skip reviewing some records?**  
A: Technically yes, but not recommended. Quick approval without review defeats the purpose of quality control. Always review at least briefly.

**Q: What happens if I reject a record?**  
A: Rejected records remain visible in the system but are NOT exported to Google Sheets. They stay rejected permanently (unless you reprocess the file).

**Q: Can I undo an approval or rejection?**  
A: Currently, no. Once approved or rejected, the status cannot be changed. If you made a mistake, you would need to reprocess the file.

**Q: How long does processing take?**  
A: Processing 25 files typically takes 5-10 seconds. Larger batches may take longer.

### Data Questions

**Q: What if extraction misses some data?**  
A: Use the Edit feature to add missing information before approving.

**Q: Can I edit records after approving them?**  
A: No. Once approved, records cannot be edited. Edit before approving.

**Q: What if I see warnings on a record?**  
A: Warnings indicate potential issues but don't prevent approval. Review the data carefully and use Edit if needed.

**Q: Why are some fields grayed out in the review dialog?**  
A: Some fields (like email headers) are read-only for data integrity. Editable fields have white backgrounds.

**Q: Can I process the same files multiple times?**  
A: Yes, but you'll get duplicate records. The system doesn't check for duplicates automatically.

### Export Questions

**Q: Do I need to export all approved records at once?**  
A: Yes. Export sends ALL approved records to Google Sheets. You cannot export individual records.

**Q: What happens if I export twice?**  
A: Each export creates a new spreadsheet. Previously exported records are marked "Exported" and won't be exported again unless you reprocess.

**Q: Can I export to an existing Google Sheet?**  
A: Yes, but requires additional configuration. See GOOGLE_SHEETS_SETUP.md for details.

**Q: What format is the exported data?**  
A: Data is exported as structured tables in Google Sheets, with separate sheets for Forms, Emails, and Invoices.

**Q: Can I export rejected records?**  
A: No. Only approved records can be exported.

### Workflow Questions

**Q: What's the best workflow?**  
A: Recommended workflow:

1. Process data
2. Filter to "Pending" status
3. Review each record
4. Edit if needed
5. Approve or reject
6. Export approved records to Google Sheets

**Q: Should I approve records one by one or in batches?**  
A: Either works. One-by-one ensures careful review. Batch approval is faster but less thorough.

**Q: Can multiple people use the dashboard at the same time?**  
A: Yes, but changes are not synchronized in real-time. Refresh the page to see others' approvals.

**Q: How do I know which records I've already reviewed?**  
A: Check the status badge. "Pending" = not reviewed. "Approved"/"Rejected"/"Edited" = already reviewed.

### Technical Questions

**Q: Do I need to install anything?**  
A: No. The dashboard runs in your web browser. No installation needed.

**Q: What browsers are supported?**  
A: Modern browsers: Chrome, Firefox, Edge, Safari (latest versions).

**Q: Can I use this on mobile?**  
A: The dashboard is responsive and works on tablets. Mobile phones may have limited functionality.

**Q: Is my data secure?**  
A: Data is stored in memory during your session. For production use, consult your IT administrator about data security policies.

**Q: What happens if I close the browser?**  
A: Your session data (extractions, approvals) is stored server-side and persists. Refresh the page to see your data again.

---

## Quick Reference Guide

### Common Tasks

| Task                 | Steps                                                      |
| -------------------- | ---------------------------------------------------------- |
| **Process Data**     | Click "Process Data" → Wait for completion                 |
| **Review Record**    | Click Actions (⋯) → "View" → Review → Approve/Reject/Edit  |
| **Edit Record**      | Click Actions (⋯) → "Edit" → Make changes → "Save Changes" |
| **Approve Record**   | Click Actions (⋯) → "Approve" OR Open View → "Approve"     |
| **Reject Record**    | Click Actions (⋯) → "Reject" OR Open View → "Reject"       |
| **Filter by Status** | Select status from Status dropdown                         |
| **Filter by Type**   | Select type from Source Type dropdown                      |
| **Search Records**   | Type in Search box                                         |
| **Export to Sheets** | Click "Export to Sheets" → Wait for completion → Open URL  |

### Keyboard Shortcuts

Currently, no keyboard shortcuts are available. All actions use mouse/touch.

### Status Meanings

- **Pending** = Needs your review
- **Approved** = Ready to export
- **Rejected** = Not wanted
- **Edited** = You modified it
- **Exported** = Sent to Google Sheets
- **Failed** = Extraction error

---

## Conclusion

You now have everything you need to use the AthenaGen AI Data Extraction Dashboard effectively. Remember:

- ✅ **You're in control** - Nothing happens without your approval
- ✅ **Review everything** - Quality control is important
- ✅ **Edit when needed** - Fix mistakes before approving
- ✅ **Export approved records** - Send clean data to Google Sheets

**Happy processing!**

---

**Need Help?**

- Review this manual
- Check GOOGLE_SHEETS_SETUP.md for integration setup
- Contact your IT administrator

**Document Version:** 1.0.0  
**Last Updated:** November 2025  
**For:** TechFlow Solutions Staff
