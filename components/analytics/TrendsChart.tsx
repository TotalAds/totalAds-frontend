"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SendVolume } from "@/types/analytics";

interface TrendsChartProps {
  data: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    bounced?: number;
    complained?: number;
    unsubscribed?: number;
    stepNumber?: number;
  }>;
  metrics: {
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
  };
  sendVolume?: SendVolume;
  sequenceSteps?: number[];
  selectedStep?: number | "all";
  onStepChange?: (step: number | "all") => void;
}

const COLORS = {
  sent: "#3b82f6", // blue-500
  opened: "#22c55e", // green-500
  clicked: "#8b5cf6", // violet-500
  bounced: "#ef4444", // red-500
  complained: "#f97316", // orange-500
  unsubscribed: "#6366f1", // indigo-500
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 capitalize">{entry.name}:</span>
              <span className="font-medium text-gray-900">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const TrendsChart: React.FC<TrendsChartProps> = ({
  data,
  metrics,
  sendVolume,
  sequenceSteps = [],
  selectedStep,
  onStepChange,
}) => {
  const deliveryRate =
    metrics.delivered > 0
      ? 100
      : data.reduce((sum, d) => sum + d.sent, 0) > 0
      ? Math.round(
          (metrics.delivered /
            data.reduce((sum, d) => sum + d.sent, 0)) *
            100
        )
      : 0;
  const openRate =
    metrics.delivered > 0
      ? Math.round((metrics.opened / metrics.delivered) * 100)
      : 0;
  const clickRate =
    metrics.opened > 0
      ? Math.round((metrics.clicked / metrics.opened) * 100)
      : 0;

  const hasNegativeMetrics = data.some(
    (d) => (d.bounced || 0) > 0 || (d.complained || 0) > 0 || (d.unsubscribed || 0) > 0
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const chartData = data.map((d) => ({
    ...d,
    formattedDate: formatDate(d.date),
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-700">
          Delivered: {metrics.delivered.toLocaleString()} ({deliveryRate}%)
        </div>
        <div className="px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg text-xs font-medium text-green-700">
          Opened: {metrics.opened.toLocaleString()} ({openRate}%)
        </div>
        <div className="px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg text-xs font-medium text-violet-700">
          Clicked: {metrics.clicked.toLocaleString()} ({clickRate}%)
        </div>
        {metrics.bounced > 0 && (
          <div className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs font-medium text-red-700">
            Bounced: {metrics.bounced.toLocaleString()}
          </div>
        )}
        {metrics.complained > 0 && (
          <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-xs font-medium text-orange-700">
            Complaints: {metrics.complained.toLocaleString()}
          </div>
        )}
        {sequenceSteps.length > 0 && onStepChange && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Step filter:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onStepChange("all")}
                className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                  selectedStep === "all"
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              {sequenceSteps.slice(0, 5).map((step) => (
                <button
                  key={step}
                  onClick={() => onStepChange(step)}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                    selectedStep === step
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Performance Chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Email Performance Over Time
        </h4>
        <div className="h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.sent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.sent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.opened}
                      stopOpacity={0.3}
                    />
                    <stop offset="95%" stopColor={COLORS.opened} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClicked" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.clicked}
                      stopOpacity={0.3}
                    />
                    <stop offset="95%" stopColor={COLORS.clicked} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  name="Sent"
                  stroke={COLORS.sent}
                  fillOpacity={1}
                  fill="url(#colorSent)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  name="Opened"
                  stroke={COLORS.opened}
                  fillOpacity={1}
                  fill="url(#colorOpened)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="clicked"
                  name="Clicked"
                  stroke={COLORS.clicked}
                  fillOpacity={1}
                  fill="url(#colorClicked)"
                  strokeWidth={2}
                />
                {hasNegativeMetrics && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="bounced"
                      name="Bounced"
                      stroke={COLORS.bounced}
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Area
                      type="monotone"
                      dataKey="complained"
                      name="Complained"
                      stroke={COLORS.complained}
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <p className="text-sm">No trend data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Send Volume Bar Chart */}
      {sendVolume && sendVolume.sendsByDay.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Daily Send Volume
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sendVolume.sendsByDay.slice(0, 14).map((d) => ({
                  ...d,
                  formattedDate: formatDate(d.date),
                }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Emails Sent"
                  fill={COLORS.sent}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rate Trends Line Chart */}
      {chartData.length > 1 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Daily Rate Trends (%)
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.map((d) => ({
                  ...d,
                  openRate: d.sent > 0 ? Math.round((d.opened / d.sent) * 100) : 0,
                  clickRate:
                    d.opened > 0 ? Math.round((d.clicked / d.opened) * 100) : 0,
                }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, ""]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="openRate"
                  name="Open Rate"
                  stroke={COLORS.opened}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="clickRate"
                  name="Click Rate"
                  stroke={COLORS.clicked}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
