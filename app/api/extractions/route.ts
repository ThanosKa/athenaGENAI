import { NextRequest, NextResponse } from 'next/server';
import { dataProcessor } from '@/lib/services/data-processor';
import { storageService } from '@/lib/services/storage';
import { ExtractionStatus, SourceType } from '@/types/data';
import { logger } from '@/lib/utils/logger';
import { errorHandler, ErrorCategory } from '@/lib/utils/error-handler';

/**
 * GET /api/extractions
 * List all extractions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') as ExtractionStatus | null;
    const sourceType = searchParams.get('sourceType') as SourceType | null;
    const search = searchParams.get('search');

    const records = storageService.getRecords({
      status: status || undefined,
      sourceType: sourceType || undefined,
      search: search || undefined,
    });

    const statistics = storageService.getStatistics();

    logger.info(
      `Retrieved ${records.length} extraction records`,
      { status, sourceType, search },
      'API:Extractions'
    );

    return NextResponse.json({
      success: true,
      data: {
        records,
        statistics,
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve extractions', error, 'API:Extractions');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.STORAGE,
      context: 'GET /api/extractions',
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
 * POST /api/extractions
 * Process all dummy data files
 */
export async function POST() {
  try {
    logger.info('Starting data extraction process', undefined, 'API:Extractions');

    const result = await dataProcessor.processAllDummyData();

    const totalRecords =
      result.forms.length + result.emails.length + result.invoices.length;

    logger.info(
      `Extraction complete: ${totalRecords} records processed`,
      {
        forms: result.forms.length,
        emails: result.emails.length,
        invoices: result.invoices.length,
      },
      'API:Extractions'
    );

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully processed ${totalRecords} records`,
        summary: {
          forms: result.forms.length,
          emails: result.emails.length,
          invoices: result.invoices.length,
          total: totalRecords,
        },
        records: {
          forms: result.forms,
          emails: result.emails,
          invoices: result.invoices,
        },
      },
    });
  } catch (error) {
    logger.error('Data extraction failed', error, 'API:Extractions');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXTRACTION,
      context: 'POST /api/extractions',
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

