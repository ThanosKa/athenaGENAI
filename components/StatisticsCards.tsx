import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractionStatistics } from '@/types/data';
import { TrendingUp, Clock, CheckCircle, Upload } from 'lucide-react';

export function StatisticsCards({
  statistics,
}: {
  statistics: ExtractionStatistics;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Extractions</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Forms: {statistics.bySource.forms} | Emails: {statistics.bySource.emails} | Invoices: {statistics.bySource.invoices}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">{statistics.pending}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting review
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{statistics.approved}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ready to export
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Exported</CardTitle>
          <Upload className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{statistics.exported}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Sent to Google Sheets
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

