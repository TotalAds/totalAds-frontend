"use client";

import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TimeSeriesDataPoint } from "@/utils/api/emailClient";

interface TrendChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  metrics?: Array<"sent" | "opened" | "clicked" | "bounced" | "complained" | "delivered" | "unsubscribed">;
}

// Professional colors with good contrast for light theme
const METRIC_COLORS = {
  sent: "#3b82f6", // blue-500
  opened: "#22c55e", // green-500
  clicked: "#8b5cf6", // violet-500
  bounced: "#ef4444", // red-500
  complained: "#f97316", // orange-500
  delivered: "#10b981", // emerald-500
  unsubscribed: "#6366f1", // indigo-500
};

const METRIC_LABELS = {
  sent: "Sent",
  opened: "Opened",
  clicked: "Clicked",
  bounced: "Bounced",
  complained: "Complained",
  delivered: "Delivered",
  unsubscribed: "Unsubscribed",
};

export function TrendChart({
  data,
  title = "Email Performance Trends",
  height = 300,
  showLegend = true,
  metrics = ["sent", "opened", "clicked"],
}: TrendChartProps) {
  // Format data for chart
  const chartData = data.map((point) => ({
    ...point,
    formattedDate: format(parseISO(point.date), "MMM dd"),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold text-slate-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-500">{entry.name}:</span>
              <span className="font-semibold text-slate-700">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {metrics.map((metric) => (
              <linearGradient
                key={metric}
                id={`gradient-${metric}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={METRIC_COLORS[metric]}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={METRIC_COLORS[metric]}
                  stopOpacity={0.05}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="formattedDate"
            stroke="#94a3b8"
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span className="text-sm text-slate-600 font-medium">
                  {value}
                </span>
              )}
            />
          )}
          {metrics.map((metric) => {
            // Check if metric exists in data (some metrics might not be available)
            const hasData = chartData.some((point: any) => point[metric] !== undefined);
            if (!hasData) return null;
            
            return (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                name={METRIC_LABELS[metric]}
                stroke={METRIC_COLORS[metric]}
                fill={`url(#gradient-${metric})`}
                strokeWidth={2}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
