"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Eye,
  Mail,
  MousePointer,
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

// Light theme color classes with proper contrast
const colorClasses = {
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    iconBg: "bg-purple-100",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    iconBg: "bg-red-100",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
  },
  yellow: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
    iconBg: "bg-pink-100",
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
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:shadow-md shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-600 font-medium">{title}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg ${colors.iconBg} p-2`}>{icon}</div>
      </div>
      {trend && trendValue && (
        <div className="mt-2 flex items-center gap-1">
          {trend === "up" ? (
            <ArrowUp className="h-3 w-3 text-emerald-600" />
          ) : trend === "down" ? (
            <ArrowDown className="h-3 w-3 text-red-600" />
          ) : null}
          <span
            className={`text-xs font-medium ${
              trend === "up"
                ? "text-emerald-600"
                : trend === "down"
                ? "text-red-600"
                : "text-slate-500"
            }`}
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
        icon={<Mail className="h-5 w-5 text-blue-600" />}
        color="blue"
      />
      <MetricCard
        title="Delivered"
        value={summary.totalDelivered.toLocaleString()}
        subtitle={`${rates.deliveryRate}% rate`}
        icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        color="green"
      />
      <MetricCard
        title="Opened"
        value={summary.totalOpened.toLocaleString()}
        subtitle={`${rates.openRate}% rate`}
        icon={<Eye className="h-5 w-5 text-purple-600" />}
        color="purple"
      />
      <MetricCard
        title="Clicked"
        value={summary.totalClicked.toLocaleString()}
        subtitle={`${rates.clickRate}% rate`}
        icon={<MousePointer className="h-5 w-5 text-pink-600" />}
        color="pink"
      />
      <MetricCard
        title="Bounced"
        value={summary.totalBounced.toLocaleString()}
        subtitle={`${rates.bounceRate}% rate`}
        icon={<XCircle className="h-5 w-5 text-red-600" />}
        color="red"
      />
      <MetricCard
        title="Complained"
        value={summary.totalComplained.toLocaleString()}
        subtitle={`${rates.complaintRate}% rate`}
        icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
        color="orange"
      />
      <MetricCard
        title="CTR"
        value={`${rates.ctrRate}%`}
        subtitle="Click-to-open"
        icon={<MousePointer className="h-5 w-5 text-amber-600" />}
        color="yellow"
      />
    </div>
  );
}
