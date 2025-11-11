import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/services/export-service';
import { logger } from '@/lib/utils/logger';
import { errorHandler, ErrorCategory } from '@/lib/utils/error-handler';

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
      result = await exportService.exportRecordsByIds({
        ids,
        spreadsheetId,
        createNew,
      });
    } else {
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

export async function GET() {
  try {
    const hasEnvVar = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    // Console log for environment variable check
    console.log('[Export API] GET /api/export - Checking environment variable...');
    console.log('[Export API] GOOGLE_SERVICE_ACCOUNT_KEY exists:', hasEnvVar);
    
    if (hasEnvVar) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log('[Export API] Credentials JSON is valid. Project ID:', parsed.project_id || 'N/A');
      } catch (parseError) {
        console.error('[Export API] WARNING: GOOGLE_SERVICE_ACCOUNT_KEY exists but is not valid JSON');
      }
    } else {
      console.log('[Export API] WARNING: GOOGLE_SERVICE_ACCOUNT_KEY is not set');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Export API is ready',
        googleSheetsConfigured: hasEnvVar,
      },
    });
  } catch (error) {
    console.error('[Export API] ERROR: Failed to check export status:', error instanceof Error ? error.message : String(error));
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

