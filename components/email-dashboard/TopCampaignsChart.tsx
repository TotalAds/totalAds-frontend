"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnalyticsTopCampaign } from "@/utils/api/emailClient";

interface TopCampaignsChartProps {
  campaigns: AnalyticsTopCampaign[];
  height?: number;
}

export function TopCampaignsChart({
  campaigns,
  height = 240,
}: TopCampaignsChartProps) {
  const chartData = [...campaigns]
    .sort((a, b) => b.openCount - a.openCount)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name:
        c.name.length > 28 ? `${c.name.slice(0, 26)}…` : c.name,
      fullName: c.name,
      opens: c.openCount,
      clicks: c.clickCount,
      sent: c.sentCount,
    }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-center"
        style={{ height }}
      >
        <p className="text-sm font-medium text-slate-600">No campaigns yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Your top performers by opens will appear here.
        </p>
        <Link
          href="/email/campaigns"
          className="mt-3 text-xs font-medium text-brand-main hover:underline"
        >
          Create your first campaign →
        </Link>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 11, fill: "#64748b" }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as {
              fullName: string;
              opens: number;
              clicks: number;
              sent: number;
            };
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="mb-1 text-xs font-semibold text-slate-800">{row.fullName}</p>
                <p className="text-xs text-slate-600">Sent: {row.sent}</p>
                <p className="text-xs text-slate-600">Opens: {row.opens}</p>
                <p className="text-xs text-slate-600">Clicks: {row.clicks}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="opens" name="Opens" fill="#22c55e" radius={[0, 4, 4, 0]} />
        <Bar dataKey="clicks" name="Clicks" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
