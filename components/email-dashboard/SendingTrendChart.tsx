"use client";

import { format, parseISO, subDays } from "date-fns";
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

import { DailyCounterRow } from "@/utils/api/emailClient";

interface SendingTrendChartProps {
  counters: DailyCounterRow[];
  days: number;
  height?: number;
}

function fillDateRange(counters: DailyCounterRow[], days: number) {
  const map = new Map(counters.map((c) => [c.date, c]));
  const result: Array<{
    date: string;
    formattedDate: string;
    sent: number;
    bounced: number;
    complained: number;
  }> = [];

  const end = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(end, i);
    const date = format(d, "yyyy-MM-dd");
    const row = map.get(date);
    result.push({
      date,
      formattedDate: format(d, "MMM d"),
      sent: row?.sentCount ?? 0,
      bounced: row?.bounceCount ?? 0,
      complained: row?.complaintCount ?? 0,
    });
  }

  return result;
}

export function SendingTrendChart({
  counters,
  days,
  height = 280,
}: SendingTrendChartProps) {
  const chartData = fillDateRange(counters, days);
  const hasData = chartData.some(
    (d) => d.sent + d.bounced + d.complained > 0
  );

  if (!hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-center"
        style={{ height }}
      >
        <p className="text-sm font-medium text-slate-600">No sending activity yet</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Launch a campaign to see daily sends, bounces, and complaints here.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="dashSentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="dashBounceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="formattedDate"
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="mb-1.5 text-xs font-semibold text-slate-800">{label}</p>
                {payload.map((entry) => (
                  <div
                    key={String(entry.dataKey)}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-500">{entry.name}:</span>
                    <span className="font-semibold text-slate-800">{entry.value}</span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          formatter={(value) => (
            <span className="text-slate-600">{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="sent"
          name="Sent"
          stroke="#3b82f6"
          fill="url(#dashSentGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="bounced"
          name="Bounced"
          stroke="#ef4444"
          fill="url(#dashBounceGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="complained"
          name="Complaints"
          stroke="#f97316"
          fill="transparent"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
