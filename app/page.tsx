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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search } from "lucide-react";

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
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ExtractionStatus | "all">(
    "all"
  );
  const [filterSource, setFilterSource] = useState<SourceType | "all">("all");
  const [search, setSearch] = useState("");

  // Load extractions
  const loadExtractions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== "all")
        params.append("status", filterStatus);
      if (filterSource && filterSource !== "all")
        params.append("sourceType", filterSource);
      if (search) params.append("search", search);

      const response = await fetch(`/api/extractions?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setRecords(result.data.records);
        setStatistics(result.data.statistics);
      } else {
        toast.error(result.error || "Failed to load extractions");
      }
    } catch (err) {
      toast.error("Failed to load extractions");
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadExtractions();
  }, [filterStatus, filterSource, search]);

  // Process all data
  const handleProcessData = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/extractions", { method: "POST" });
      const result = await response.json();

      if (result.success) {
        toast.success(
          `Successfully processed ${result.data.summary.total} records`
        );
        await loadExtractions();
      } else {
        toast.error(result.error || "Failed to process data");
      }
    } catch (err) {
      toast.error("Failed to process data");
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
        toast.success("Record approved successfully");
        await loadExtractions();
        setSelectedRecord(null);
      } else {
        toast.error(result.error || "Failed to approve record");
      }
    } catch (err) {
      toast.error("Failed to approve record");
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
        toast.success("Record rejected successfully");
        await loadExtractions();
        setSelectedRecord(null);
      } else {
        toast.error(result.error || "Failed to reject record");
      }
    } catch (err) {
      toast.error("Failed to reject record");
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
        toast.success("Record updated successfully");
        await loadExtractions();
      } else {
        toast.error(result.error || "Failed to update record");
      }
    } catch (err) {
      toast.error("Failed to update record");
      console.error(err);
    }
  };

  // Export to Google Sheets
  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createNew: true }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(
          `Data exported successfully! Spreadsheet ID: ${result.data.spreadsheetId}`
        );
        await loadExtractions();
      } else {
        toast.error(result.error || "Failed to export data");
      }
    } catch (err) {
      toast.error("Failed to export data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // View record (read-only)
  const handleView = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (record) {
      setInitialEditMode(false);
      setSelectedRecord(record);
    }
  };

  // Edit record (opens in edit mode)
  const handleEdit = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (record) {
      setInitialEditMode(true);
      setSelectedRecord(record);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Data Extraction Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Human-in-the-loop data extraction and approval workflow
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleProcessData}
              disabled={loading}
              size="default"
              data-testid="process-data-btn"
            >
              {loading ? "Processing..." : "Process Data"}
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading || statistics.approved === 0}
              variant="outline"
              size="default"
              data-testid="export-btn"
            >
              Export to Sheets
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {initialLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <StatisticsCards statistics={statistics} />
        )}

        {/* Filters */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              Filter extraction records by status, source type, or search term
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value: string) =>
                    setFilterStatus(value as ExtractionStatus | "all")
                  }
                >
                  <SelectTrigger data-testid="filter-status-select">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value={ExtractionStatus.PENDING}>
                      Pending
                    </SelectItem>
                    <SelectItem value={ExtractionStatus.APPROVED}>
                      Approved
                    </SelectItem>
                    <SelectItem value={ExtractionStatus.REJECTED}>
                      Rejected
                    </SelectItem>
                    <SelectItem value={ExtractionStatus.EDITED}>
                      Edited
                    </SelectItem>
                    <SelectItem value={ExtractionStatus.EXPORTED}>
                      Exported
                    </SelectItem>
                    <SelectItem value={ExtractionStatus.FAILED}>
                      Failed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select
                  value={filterSource}
                  onValueChange={(value: string) =>
                    setFilterSource(value as SourceType | "all")
                  }
                >
                  <SelectTrigger data-testid="filter-source-select">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value={SourceType.FORM}>Forms</SelectItem>
                    <SelectItem value={SourceType.EMAIL}>Emails</SelectItem>
                    <SelectItem value={SourceType.INVOICE}>Invoices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="search-input"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Record Review */}
        {selectedRecord && (
          <ExtractionReview
            record={selectedRecord}
            initialEditMode={initialEditMode}
            onApprove={() => handleApprove(selectedRecord.id)}
            onReject={() => handleReject(selectedRecord.id)}
            onSaveEdit={(updatedData) =>
              handleSaveEdit(selectedRecord.id, updatedData)
            }
            onClose={() => {
              setSelectedRecord(null);
              setInitialEditMode(false);
            }}
          />
        )}

        {/* Extraction List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Extractions</CardTitle>
            <CardDescription>
              {records.length} record{records.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {initialLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <ExtractionList
                records={records}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
                onView={handleView}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
