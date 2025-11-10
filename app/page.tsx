"use client";

import { useState, useEffect } from "react";
import {
  ExtractionRecord,
  ExtractionStatus,
  SourceType,
  ExtractionStatistics,
} from "@/types/data";
import { StatisticsCards } from "@/components/StatisticsCards";
import { ExtractionList } from "@/components/ExtractionList";
import { ExtractionReview } from "@/components/ExtractionReview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [records, setRecords] = useState<ExtractionRecord[]>([]);
  const [statistics, setStatistics] = useState<ExtractionStatistics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    exported: 0,
    failed: 0,
    bySource: { forms: 0, emails: 0, invoices: 0 },
  });
  const [selectedRecord, setSelectedRecord] = useState<ExtractionRecord | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ExtractionStatus | "">("");
  const [filterSource, setFilterSource] = useState<SourceType | "">("");
  const [search, setSearch] = useState("");

  // Load extractions
  const loadExtractions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterSource) params.append("sourceType", filterSource);
      if (search) params.append("search", search);

      const response = await fetch(`/api/extractions?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setRecords(result.data.records);
        setStatistics(result.data.statistics);
      } else {
        setError(result.error || "Failed to load extractions");
      }
    } catch (err) {
      setError("Failed to load extractions");
      console.error(err);
    }
  };

  useEffect(() => {
    loadExtractions();
  }, [filterStatus, filterSource, search]);

  // Process all data
  const handleProcessData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/extractions", { method: "POST" });
      const result = await response.json();

      if (result.success) {
        setSuccess(
          `Successfully processed ${result.data.summary.total} records`
        );
        await loadExtractions();
      } else {
        setError(result.error || "Failed to process data");
      }
    } catch (err) {
      setError("Failed to process data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Approve extraction
  const handleApprove = async (id: string) => {
    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", id }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Record approved successfully");
        await loadExtractions();
        setSelectedRecord(null);
      } else {
        setError(result.error || "Failed to approve record");
      }
    } catch (err) {
      setError("Failed to approve record");
      console.error(err);
    }
  };

  // Reject extraction
  const handleReject = async (id: string) => {
    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", id, reason: "User rejected" }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Record rejected successfully");
        await loadExtractions();
        setSelectedRecord(null);
      } else {
        setError(result.error || "Failed to reject record");
      }
    } catch (err) {
      setError("Failed to reject record");
      console.error(err);
    }
  };

  // Save edited data
  const handleSaveEdit = async (id: string, updatedData: unknown) => {
    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", id, updatedData }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Record updated successfully");
        await loadExtractions();
      } else {
        setError(result.error || "Failed to update record");
      }
    } catch (err) {
      setError("Failed to update record");
      console.error(err);
    }
  };

  // Export to Google Sheets
  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createNew: true }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(
          `Data exported successfully! Spreadsheet ID: ${result.data.spreadsheetId}`
        );
        await loadExtractions();
      } else {
        setError(result.error || "Failed to export data");
      }
    } catch (err) {
      setError("Failed to export data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // View record
  const handleView = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (record) {
      setSelectedRecord(record);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Data Extraction Dashboard
          </h1>
          <p className="text-muted-foreground">
            Human-in-the-loop data extraction and approval workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleProcessData} disabled={loading}>
            {loading ? "Processing..." : "Process Data"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || statistics.approved === 0}
            variant="default"
            className="bg-[#5E6AD2] hover:bg-[#5E6AD2]/90"
          >
            Export to Sheets
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <StatisticsCards statistics={statistics} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter extractions by status, source, or search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as ExtractionStatus | "")
                }
              >
                <option value="">All</option>
                <option value={ExtractionStatus.PENDING}>Pending</option>
                <option value={ExtractionStatus.APPROVED}>Approved</option>
                <option value={ExtractionStatus.REJECTED}>Rejected</option>
                <option value={ExtractionStatus.EDITED}>Edited</option>
                <option value={ExtractionStatus.EXPORTED}>Exported</option>
                <option value={ExtractionStatus.FAILED}>Failed</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Type</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterSource}
                onChange={(e) =>
                  setFilterSource(e.target.value as SourceType | "")
                }
              >
                <option value="">All</option>
                <option value={SourceType.FORM}>Forms</option>
                <option value={SourceType.EMAIL}>Emails</option>
                <option value={SourceType.INVOICE}>Invoices</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Record Review */}
      {selectedRecord && (
        <ExtractionReview
          record={selectedRecord}
          onApprove={() => handleApprove(selectedRecord.id)}
          onReject={() => handleReject(selectedRecord.id)}
          onSaveEdit={(updatedData) =>
            handleSaveEdit(selectedRecord.id, updatedData)
          }
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Extraction List */}
      <Card>
        <CardHeader>
          <CardTitle>Extractions</CardTitle>
          <CardDescription>
            {records.length} record{records.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExtractionList
            records={records}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleView}
            onView={handleView}
          />
        </CardContent>
      </Card>
    </div>
  );
}
