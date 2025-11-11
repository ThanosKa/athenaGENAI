"use client";

import { useState, Fragment } from "react";
import {
  ExtractionRecord,
  SourceType,
  ExtractedFormData,
  ExtractedEmailData,
  ExtractedInvoiceData,
} from "@/types/data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit } from "lucide-react";

export function ExtractionReview({
  record,
  initialEditMode = false,
  onApprove,
  onReject,
  onSaveEdit,
  onClose,
}: {
  record: ExtractionRecord;
  initialEditMode?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSaveEdit: (
    updatedData: Partial<
      ExtractedFormData | ExtractedEmailData | ExtractedInvoiceData
    >
  ) => void;
  onClose: () => void;
}) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editedData, setEditedData] = useState(record.data);

  const handleSave = () => {
    onSaveEdit(editedData);
    setIsEditing(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Fragment key={record.id}>
      <Dialog open={true} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-testid="extraction-dialog"
        >
          <DialogHeader>
            <DialogTitle>Extraction Review</DialogTitle>
            <DialogDescription>{record.sourceFile}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {record.warnings.length > 0 && (
              <Alert variant="warning" data-testid="warnings-alert">
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

            {record.error && (
              <Alert variant="destructive" data-testid="error-alert">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{record.error}</AlertDescription>
              </Alert>
            )}

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
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} data-testid="save-edit-btn">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedData(record.data);
                    setIsEditing(false);
                  }}
                  data-testid="cancel-edit-btn"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={onApprove}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  data-testid="approve-btn"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={onReject}
                  data-testid="reject-btn"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  data-testid="enable-edit-btn"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
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
          data-testid="field-fullName"
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
          onChange={(e) =>
            onChange({ ...data, submissionDate: e.target.value })
          }
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
        <Badge
          variant={data.emailType === "client_inquiry" ? "info" : "warning"}
        >
          {data.emailType === "client_inquiry"
            ? "Client Inquiry"
            : "Invoice Notification"}
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
          onChange={(e) =>
            onChange({ ...data, netAmount: parseFloat(e.target.value) || 0 })
          }
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>VAT Rate (%)</Label>
        <Input
          type="number"
          value={data.vatRate}
          onChange={(e) =>
            onChange({ ...data, vatRate: parseFloat(e.target.value) || 24 })
          }
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>VAT Amount (€)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.vatAmount}
          onChange={(e) =>
            onChange({ ...data, vatAmount: parseFloat(e.target.value) || 0 })
          }
          disabled={!isEditing}
        />
      </div>
      <div className="space-y-2">
        <Label>Total Amount (€)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.totalAmount}
          onChange={(e) =>
            onChange({ ...data, totalAmount: parseFloat(e.target.value) || 0 })
          }
          disabled={!isEditing}
        />
      </div>
    </div>
  );
}
