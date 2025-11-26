"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Mail,
  MousePointer,
  Eye,
  XCircle,
} from "lucide-react";

interface MetricsSummaryProps {
  summary: {
    totalLeads: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalFailed: number;
    totalComplained: number;
    totalUnsubscribed: number;
    pending: number;
    processing: number;
  };
  rates: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
    deliveryRate: number;
    unsubscribeRate: number;
    ctrRate: number;
  };
}

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: "green" | "blue" | "purple" | "red" | "orange" | "yellow" | "pink";
}

const colorClasses = {
  green: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
  },
};

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg ${colors.bg} p-2`}>{icon}</div>
      </div>
      {trend && trendValue && (
        <div className="mt-2 flex items-center gap-1">
          {trend === "up" ? (
            <ArrowUp className="h-3 w-3 text-emerald-400" />
          ) : trend === "down" ? (
            <ArrowDown className="h-3 w-3 text-red-400" />
          ) : null}
          <span
            className={`text-xs ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-gray-400"}`}
          >
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

export function MetricsSummary({ summary, rates }: MetricsSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      <MetricCard
        title="Total Sent"
        value={summary.totalSent.toLocaleString()}
        subtitle={`${summary.pending} pending`}
        icon={<Mail className="h-5 w-5 text-blue-400" />}
        color="blue"
      />
      <MetricCard
        title="Delivered"
        value={summary.totalDelivered.toLocaleString()}
        subtitle={`${rates.deliveryRate}% rate`}
        icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
        color="green"
      />
      <MetricCard
        title="Opened"
        value={summary.totalOpened.toLocaleString()}
        subtitle={`${rates.openRate}% rate`}
        icon={<Eye className="h-5 w-5 text-purple-400" />}
        color="purple"
      />
      <MetricCard
        title="Clicked"
        value={summary.totalClicked.toLocaleString()}
        subtitle={`${rates.clickRate}% rate`}
        icon={<MousePointer className="h-5 w-5 text-pink-400" />}
        color="pink"
      />
      <MetricCard
        title="Bounced"
        value={summary.totalBounced.toLocaleString()}
        subtitle={`${rates.bounceRate}% rate`}
        icon={<XCircle className="h-5 w-5 text-red-400" />}
        color="red"
      />
      <MetricCard
        title="Complained"
        value={summary.totalComplained.toLocaleString()}
        subtitle={`${rates.complaintRate}% rate`}
        icon={<AlertTriangle className="h-5 w-5 text-orange-400" />}
        color="orange"
      />
      <MetricCard
        title="CTR"
        value={`${rates.ctrRate}%`}
        subtitle="Click-to-open"
        icon={<MousePointer className="h-5 w-5 text-yellow-400" />}
        color="yellow"
      />
    </div>
  );
}

