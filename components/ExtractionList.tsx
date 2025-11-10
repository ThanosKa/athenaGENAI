'use client';

import { ExtractionRecord, ExtractionStatus, SourceType } from '@/types/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ExtractionList({
  records,
  onApprove,
  onReject,
  onEdit,
  onView,
}: {
  records: ExtractionRecord[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}) {
  if (records.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No extraction records found. Click "Process Data" to start extracting data from files.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Extracted</TableHead>
            <TableHead>Warnings</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <SourceTypeBadge type={record.sourceType} />
              </TableCell>
              <TableCell className="font-medium">
                {getDataPreview(record)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {record.sourceFile}
              </TableCell>
              <TableCell>
                <StatusBadge status={record.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(record.extractedAt).toLocaleString()}
              </TableCell>
              <TableCell>
                {record.warnings.length > 0 && (
                  <Badge variant="warning">{record.warnings.length}</Badge>
                )}
                {record.error && (
                  <Badge variant="destructive">Error</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(record.id)}
                  >
                    View
                  </Button>
                  {(record.status === ExtractionStatus.PENDING ||
                    record.status === ExtractionStatus.EDITED) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(record.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onApprove(record.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onReject(record.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SourceTypeBadge({ type }: { type: SourceType }) {
  const variants = {
    [SourceType.FORM]: { label: 'Form', variant: 'info' as const },
    [SourceType.EMAIL]: { label: 'Email', variant: 'secondary' as const },
    [SourceType.INVOICE]: { label: 'Invoice', variant: 'default' as const },
  };

  const config = variants[type];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function StatusBadge({ status }: { status: ExtractionStatus }) {
  const variants = {
    [ExtractionStatus.PENDING]: { label: 'Pending', variant: 'warning' as const },
    [ExtractionStatus.APPROVED]: { label: 'Approved', variant: 'success' as const },
    [ExtractionStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' as const },
    [ExtractionStatus.EDITED]: { label: 'Edited', variant: 'info' as const },
    [ExtractionStatus.EXPORTED]: { label: 'Exported', variant: 'default' as const },
    [ExtractionStatus.FAILED]: { label: 'Failed', variant: 'destructive' as const },
  };

  const config = variants[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getDataPreview(record: ExtractionRecord): string {
  const data = record.data;
  
  if ('fullName' in data) {
    return data.fullName || 'N/A';
  }
  if ('from' in data) {
    return data.from || 'N/A';
  }
  if ('invoiceNumber' in data) {
    return data.invoiceNumber || 'N/A';
  }
  
  return 'N/A';
}

