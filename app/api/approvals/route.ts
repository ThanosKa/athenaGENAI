import { NextRequest, NextResponse } from 'next/server';
import { approvalService } from '@/lib/services/approval-service';
import { editService } from '@/lib/services/edit-service';
import { logger } from '@/lib/utils/logger';
import { errorHandler, ErrorCategory } from '@/lib/utils/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ids, approvedBy, rejectedBy, reason, updatedData, editedBy } =
      body;

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action is required',
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'approve': {
        if (!id) {
          return NextResponse.json(
            {
              success: false,
              error: 'Record ID is required',
            },
            { status: 400 }
          );
        }

        const success = approvalService.approve({ id, approvedBy });
        if (!success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to approve record',
            },
            { status: 404 }
          );
        }

        logger.info(
          `Record approved: ${id}`,
          { approvedBy },
          'API:Approvals'
        );

        return NextResponse.json({
          success: true,
          message: 'Record approved successfully',
        });
      }

      case 'reject': {
        if (!id) {
          return NextResponse.json(
            {
              success: false,
              error: 'Record ID is required',
            },
            { status: 400 }
          );
        }

        const success = approvalService.reject({ id, rejectedBy, reason });
        if (!success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to reject record',
            },
            { status: 404 }
          );
        }

        logger.info(
          `Record rejected: ${id}`,
          { rejectedBy, reason },
          'API:Approvals'
        );

        return NextResponse.json({
          success: true,
          message: 'Record rejected successfully',
        });
      }

      case 'bulk_approve': {
        if (!ids || !Array.isArray(ids)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Record IDs array is required',
            },
            { status: 400 }
          );
        }

        const result = approvalService.bulkApprove({ ids, approvedBy });

        logger.info(
          `Bulk approve: ${result.succeeded.length} succeeded, ${result.failed.length} failed`,
          { approvedBy },
          'API:Approvals'
        );

        return NextResponse.json({
          success: true,
          message: `Approved ${result.succeeded.length} of ${ids.length} records`,
          data: result,
        });
      }

      case 'bulk_reject': {
        if (!ids || !Array.isArray(ids)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Record IDs array is required',
            },
            { status: 400 }
          );
        }

        const result = approvalService.bulkReject({ ids, rejectedBy, reason });

        logger.info(
          `Bulk reject: ${result.succeeded.length} succeeded, ${result.failed.length} failed`,
          { rejectedBy, reason },
          'API:Approvals'
        );

        return NextResponse.json({
          success: true,
          message: `Rejected ${result.succeeded.length} of ${ids.length} records`,
          data: result,
        });
      }

      case 'edit': {
        if (!id || !updatedData) {
          return NextResponse.json(
            {
              success: false,
              error: 'Record ID and updated data are required',
            },
            { status: 400 }
          );
        }

        const result = editService.edit({ id, updatedData, editedBy });
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
          `Record edited: ${id}`,
          { editedBy },
          'API:Approvals'
        );

        return NextResponse.json({
          success: true,
          message: 'Record edited successfully',
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Approval action failed', error, 'API:Approvals');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.VALIDATION,
      context: 'POST /api/approvals',
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

