'use client';

import { useState } from 'react';
import {
  ExtractionRecord,
  SourceType,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from '@/types/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function ExtractionReview({
  record,
  onApprove,
  onReject,
  onSaveEdit,
  onClose,
}: {
  record: ExtractionRecord;
  onApprove: () => void;
  onReject: () => void;
  onSaveEdit: (updatedData: Partial<ExtractedFormData | ExtractedEmailData | ExtractedInvoiceData>) => void;
  onClose: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(record.data);

  const handleSave = () => {
    onSaveEdit(editedData);
    setIsEditing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Extraction Review</CardTitle>
            <CardDescription>{record.sourceFile}</CardDescription>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {record.warnings.length > 0 && (
          <Alert variant="warning">
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {record.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {record.error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{record.error}</AlertDescription>
          </Alert>
        )}

        {/* Data fields based on source type */}
        {record.sourceType === SourceType.FORM && (
          <FormDataFields
            data={editedData as ExtractedFormData}
            isEditing={isEditing}
            onChange={setEditedData}
          />
        )}

        {record.sourceType === SourceType.EMAIL && (
          <EmailDataFields
            data={editedData as ExtractedEmailData}
            isEditing={isEditing}
            onChange={setEditedData}
          />
        )}

        {record.sourceType === SourceType.INVOICE && (
          <InvoiceDataFields
            data={editedData as ExtractedInvoiceData}
            isEditing={isEditing}
            onChange={setEditedData}
          />
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => {
                setEditedData(record.data);
                setIsEditing(false);
              }}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={onApprove}
            className="bg-green-500 hover:bg-green-600"
          >
            Approve
          </Button>
          <Button variant="destructive" onClick={onReject}>
            Reject
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function FormDataFields({
  data,
  isEditing,
  onChange,
}: {
  data: ExtractedFormData;
  isEditing: boolean;
  onChange: (data: ExtractedFormData) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          value={data.fullName}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={data.phone}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Company</Label>
        <Input
          value={data.company}
          onChange={(e) => onChange({ ...data, company: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Service</Label>
        <Input
          value={data.service}
          onChange={(e) => onChange({ ...data, service: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Priority</Label>
        <Input
          value={data.priority}
          onChange={(e) => onChange({ ...data, priority: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Message</Label>
        <Textarea
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
          disabled={!isEditing}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label>Submission Date</Label>
        <Input
          value={data.submissionDate}
          onChange={(e) => onChange({ ...data, submissionDate: e.target.value })}
          disabled={!isEditing}
        />
      </div>
    </div>
  );
}

function EmailDataFields({
  data,
  isEditing,
  onChange,
}: {
  data: ExtractedEmailData;
  isEditing: boolean;
  onChange: (data: ExtractedEmailData) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>Email Type</Label>
        <Badge variant={data.emailType === 'client_inquiry' ? 'info' : 'warning'}>
          {data.emailType === 'client_inquiry' ? 'Client Inquiry' : 'Invoice Notification'}
        </Badge>
      </div>
      <div className="space-y-2">
        <Label>From</Label>
        <Input value={data.from} disabled />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={data.fromEmail} disabled />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Subject</Label>
        <Input value={data.subject} disabled />
      </div>
      {data.fullName && (
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
            value={data.fullName}
            onChange={(e) => onChange({ ...data, fullName: e.target.value })}
            disabled={!isEditing}
          />
        </div>
      )}
      {data.email && (
        <div className="space-y-2">
          <Label>Contact Email</Label>
          <Input
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            disabled={!isEditing}
          />
        </div>
      )}
      {data.phone && (
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            disabled={!isEditing}
          />
        </div>
      )}
      {data.company && (
        <div className="space-y-2">
          <Label>Company</Label>
          <Input
            value={data.company}
            onChange={(e) => onChange({ ...data, company: e.target.value })}
            disabled={!isEditing}
          />
        </div>
      )}
      {data.invoiceReference && (
        <div className="space-y-2">
          <Label>Invoice Reference</Label>
          <Input value={data.invoiceReference} disabled />
        </div>
      )}
    </div>
  );
}

function InvoiceDataFields({
  data,
  isEditing,
  onChange,
}: {
  data: ExtractedInvoiceData;
  isEditing: boolean;
  onChange: (data: ExtractedInvoiceData) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Invoice Number</Label>
        <Input
          value={data.invoiceNumber}
          onChange={(e) => onChange({ ...data, invoiceNumber: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          value={data.date}
          onChange={(e) => onChange({ ...data, date: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Customer Name</Label>
        <Input
          value={data.customerName}
          onChange={(e) => onChange({ ...data, customerName: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Net Amount (€)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.netAmount}
          onChange={(e) => onChange({ ...data, netAmount: parseFloat(e.target.value) || 0 })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>VAT Rate (%)</Label>
        <Input
          type="number"
          value={data.vatRate}
          onChange={(e) => onChange({ ...data, vatRate: parseFloat(e.target.value) || 24 })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>VAT Amount (€)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.vatAmount}
          onChange={(e) => onChange({ ...data, vatAmount: parseFloat(e.target.value) || 0 })}
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Total Amount (€)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.totalAmount}
          onChange={(e) => onChange({ ...data, totalAmount: parseFloat(e.target.value) || 0 })}
          disabled={!isEditing}
        />
      </div>
    </div>
  );
}

