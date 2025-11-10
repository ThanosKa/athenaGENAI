import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractionStatistics } from '@/types/data';

export function StatisticsCards({
  statistics,
}: {
  statistics: ExtractionStatistics;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Extractions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.total}</div>
          <p className="text-xs text-muted-foreground">
            Forms: {statistics.bySource.forms} | Emails: {statistics.bySource.emails} | Invoices: {statistics.bySource.invoices}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">{statistics.pending}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting review
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{statistics.approved}</div>
          <p className="text-xs text-muted-foreground">
            Ready to export
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Exported</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">{statistics.exported}</div>
          <p className="text-xs text-muted-foreground">
            Sent to Google Sheets
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

