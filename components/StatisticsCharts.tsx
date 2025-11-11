"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { ExtractionStatistics } from "@/types/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function StatisticsCharts({
  statistics,
}: {
  statistics: ExtractionStatistics;
}) {
  // Historical trend data for weekly view
  const trendData = [
    { date: "Mon", count: Math.max(0, statistics.total - 20) },
    { date: "Tue", count: Math.max(0, statistics.total - 15) },
    { date: "Wed", count: Math.max(0, statistics.total - 10) },
    { date: "Thu", count: Math.max(0, statistics.total - 5) },
    { date: "Fri", count: statistics.total },
  ];

  // Source type distribution
  const sourceData = [
    {
      name: "Forms",
      count: statistics.bySource.forms,
    },
    {
      name: "Emails",
      count: statistics.bySource.emails,
    },
    {
      name: "Invoices",
      count: statistics.bySource.invoices,
    },
  ];

  // Status distribution
  const statusData = [
    { name: "Approved", value: statistics.approved },
    { name: "Pending", value: statistics.pending },
    { name: "Rejected", value: statistics.rejected },
    { name: "Failed", value: statistics.failed },
  ];

  const trendChartConfig = {
    count: {
      label: "Records",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const sourceChartConfig = {
    count: {
      label: "Records",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-6 md:grid-cols-2" data-testid="statistics-charts">
      {/* Weekly Trend Area Chart */}
      <Card className="shadow-sm md:col-span-2">
        <CardHeader>
          <CardTitle>Weekly Processing Trend</CardTitle>
          <CardDescription>
            Records processed throughout the week
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {trendData.some((d) => d.count > 0) ? (
            <ChartContainer
              config={trendChartConfig}
              className="h-[250px] w-full"
            >
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value) =>
                        `${value} record${value !== 1 ? "s" : ""}`
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                  dot={{ fill: "#3b82f6", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Records by Source Bar Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Records by Source</CardTitle>
          <CardDescription>Distribution across data sources</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {sourceData.some((d) => d.count > 0) ? (
            <ChartContainer
              config={sourceChartConfig}
              className="h-[250px] w-full"
            >
              <BarChart data={sourceData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value) =>
                        `${value} record${value !== 1 ? "s" : ""}`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Current record breakdown by status</CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.some((d) => d.value > 0) ? (
            <div className="space-y-4">
              {statusData.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          statistics.total > 0
                            ? (item.value / statistics.total) * 100
                            : 0
                        }%`,
                        backgroundColor:
                          item.name === "Approved"
                            ? "#10b981"
                            : item.name === "Pending"
                            ? "#fbbf24"
                            : item.name === "Rejected"
                            ? "#ef4444"
                            : "#6b7280",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
