import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/services/export-service';
import { logger } from '@/lib/utils/logger';
import { errorHandler, ErrorCategory } from '@/lib/utils/error-handler';

/**
 * POST /api/export
 * Export approved records to Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spreadsheetId, createNew, ids } = body;

    logger.info(
      'Starting export to Google Sheets',
      { spreadsheetId, createNew, recordCount: ids?.length },
      'API:Export'
    );

    let result;
    if (ids && Array.isArray(ids)) {
      // Export specific records
      result = await exportService.exportRecordsByIds({
        ids,
        spreadsheetId,
        createNew,
      });
    } else {
      // Export all approved records
      result = await exportService.exportApprovedRecords({
        spreadsheetId,
        createNew,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    logger.info(
      'Export completed successfully',
      { spreadsheetId: result.spreadsheetId },
      'API:Export'
    );

    return NextResponse.json({
      success: true,
      message: 'Data exported successfully to Google Sheets',
      data: {
        spreadsheetId: result.spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}`,
      },
    });
  } catch (error) {
    logger.error('Export failed', error, 'API:Export');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXPORT,
      context: 'POST /api/export',
    });

    return NextResponse.json(
      {
        success: false,
        error: appError.userMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export
 * Get export status/information
 */
export async function GET() {
  try {
    // This could be extended to track export history
    return NextResponse.json({
      success: true,
      data: {
        message: 'Export API is ready',
        googleSheetsConfigured: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      },
    });
  } catch (error) {
    logger.error('Export status check failed', error, 'API:Export');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check export status',
      },
      { status: 500 }
    );
  }
}

