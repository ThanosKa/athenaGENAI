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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Edit, Check, X, FileText, Mail, Receipt, AlertCircle, MoreHorizontal } from 'lucide-react';

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
    <div className="rounded-md border border-border">
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
                  <Badge variant="warning" className="flex items-center gap-1 w-fit">
                    <AlertCircle className="h-3 w-3" />
                    {record.warnings.length}
                  </Badge>
                )}
                {record.error && (
                  <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(record.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    {(record.status === ExtractionStatus.PENDING ||
                      record.status === ExtractionStatus.EDITED) && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(record.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onApprove(record.id)}
                          className="text-[#22C55E]"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onReject(record.id)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
    [SourceType.FORM]: { label: 'Form', variant: 'info' as const, icon: FileText },
    [SourceType.EMAIL]: { label: 'Email', variant: 'secondary' as const, icon: Mail },
    [SourceType.INVOICE]: { label: 'Invoice', variant: 'default' as const, icon: Receipt },
  };

  const config = variants[type];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
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

