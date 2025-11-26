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
  metrics?: Array<"sent" | "opened" | "clicked" | "bounced" | "complained">;
}

const METRIC_COLORS = {
  sent: "#9DD0c7",
  opened: "#eb857a",
  clicked: "#f4cdc1",
  bounced: "#ef4444",
  complained: "#f59e0b",
  unsubscribed: "#8b5cf6",
};

const METRIC_LABELS = {
  sent: "Sent",
  opened: "Opened",
  clicked: "Clicked",
  bounced: "Bounced",
  complained: "Complained",
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
        <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-3 shadow-lg">
          <p className="mb-2 text-sm font-medium text-[#fafafa]">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-400">{entry.name}:</span>
              <span className="font-medium text-[#fafafa]">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-[#2a2a2d] bg-[#1a1a1d] p-6">
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-[#fafafa]">{title}</h3>
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
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={METRIC_COLORS[metric]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2d" />
          <XAxis
            dataKey="formattedDate"
            stroke="#6b7280"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickLine={{ stroke: "#2a2a2d" }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickLine={{ stroke: "#2a2a2d" }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span className="text-sm text-gray-400">{value}</span>
              )}
            />
          )}
          {metrics.map((metric) => (
            <Area
              key={metric}
              type="monotone"
              dataKey={metric}
              name={METRIC_LABELS[metric]}
              stroke={METRIC_COLORS[metric]}
              fill={`url(#gradient-${metric})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

