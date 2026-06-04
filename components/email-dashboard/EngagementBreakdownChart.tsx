"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface EngagementBreakdownChartProps {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  height?: number;
}

const COLORS = {
  clicked: "#8b5cf6",
  openedOnly: "#22c55e",
  deliveredOnly: "#3b82f6",
  bounced: "#ef4444",
  complained: "#f97316",
};

export function EngagementBreakdownChart({
  sent,
  opened,
  clicked,
  bounced,
  complained,
  height = 260,
}: EngagementBreakdownChartProps) {
  const clickedOnly = Math.max(0, clicked);
  const openedNotClicked = Math.max(0, opened - clicked);
  const deliveredQuiet = Math.max(
    0,
    sent - opened - bounced - complained
  );

  const segments = [
    { name: "Clicked", value: clickedOnly, color: COLORS.clicked },
    { name: "Opened (no click)", value: openedNotClicked, color: COLORS.openedOnly },
    { name: "Delivered (no open)", value: deliveredQuiet, color: COLORS.deliveredOnly },
    { name: "Bounced", value: bounced, color: COLORS.bounced },
    { name: "Complaints", value: complained, color: COLORS.complained },
  ].filter((s) => s.value > 0);

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-center"
        style={{ height }}
      >
        <p className="text-sm font-medium text-slate-600">No engagement data yet</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Send emails to see how recipients engage with your campaigns.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={segments}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
        >
          {segments.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0].payload as { name: string; value: number };
            const pct = ((item.value / total) * 100).toFixed(1);
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-600">
                  {item.value.toLocaleString()} ({pct}%)
                </p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
