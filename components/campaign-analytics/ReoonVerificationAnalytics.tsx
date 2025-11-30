"use client";

import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Shield,
  XCircle,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface ReoonVerificationAnalyticsData {
  used: boolean;
  totalVerified: number;
  breakdown: {
    valid: number;
    invalid: number;
    risky: number;
    catchAll: number;
    unknown: number;
  };
  percentages: {
    valid: number;
    invalid: number;
    risky: number;
    catchAll: number;
    unknown: number;
  };
  flags: {
    disposable: number;
    spamtrap: number;
    roleAccount: number;
    inboxFull: number;
    disabled: number;
    smtpConnectable: number;
    mxValid: number;
  };
  lastVerifiedAt: string | null;
  mode: string | null;
  creditsUsed: number;
}

interface ReoonVerificationAnalyticsProps {
  data: ReoonVerificationAnalyticsData | null;
  loading?: boolean;
}

const STATUS_COLORS = {
  valid: "#10b981", // emerald-500
  invalid: "#ef4444", // red-500
  risky: "#f59e0b", // amber-500
  catchAll: "#8b5cf6", // violet-500
  unknown: "#6b7280", // gray-500
};

const STATUS_LABELS = {
  valid: "Valid/Deliverable",
  invalid: "Invalid",
  risky: "Risky",
  catchAll: "Catch-All",
  unknown: "Unknown",
};

const STATUS_ICONS = {
  valid: CheckCircle,
  invalid: XCircle,
  risky: AlertTriangle,
  catchAll: HelpCircle,
  unknown: HelpCircle,
};

export function ReoonVerificationAnalytics({
  data,
  loading = false,
}: ReoonVerificationAnalyticsProps) {
  if (loading) {
    return (
      <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-brand-main" />
          <h2 className="text-xl font-bold text-text-100">
            Email Verification Analytics
          </h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-brand-main/10 rounded-lg" />
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-brand-main/10 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.used) {
    return (
      <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-brand-main" />
          <h2 className="text-xl font-bold text-text-100">
            Email Verification Analytics
          </h2>
        </div>
        <p className="text-sm text-text-200/70">
          No Reoon verification data available for this campaign. Leads were
          sent without pre-verification.
        </p>
        <p className="text-xs text-text-200/50 mt-2">
          Configure Reoon in Settings → Integrations to verify emails before
          sending and protect your sender reputation.
        </p>
      </div>
    );
  }

  const chartData = Object.entries(data.breakdown)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS],
      value,
      color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
    }));

  return (
    <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-main" />
          <h2 className="text-xl font-bold text-text-100">
            Email Verification Analytics
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-200/60">
            Verified with Reoon ({data.mode || "power"} mode)
          </p>
          {data.lastVerifiedAt && (
            <p className="text-xs text-text-200/50">
              {new Date(data.lastVerifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1d",
                  border: "1px solid rgba(235, 133, 122, 0.2)",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#fafafa" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown Cards */}
        <div className="grid grid-cols-2 gap-3">
          {(
            Object.keys(data.breakdown) as Array<keyof typeof data.breakdown>
          ).map((status) => {
            const Icon = STATUS_ICONS[status];
            const color = STATUS_COLORS[status];
            const count = data.breakdown[status];
            const percentage = data.percentages[status];

            return (
              <div
                key={status}
                className="bg-bg-200/50 rounded-lg p-3 border border-brand-main/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-xs text-text-200/80">
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <p className="text-lg font-semibold text-text-100">
                  {count.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color }}>
                  {percentage}%
                </p>
              </div>
            );
          })}
          {/* Total Verified */}
          <div className="bg-bg-200/50 rounded-lg p-3 border border-brand-main/10">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-brand-main" />
              <span className="text-xs text-text-200/80">Total Verified</span>
            </div>
            <p className="text-lg font-semibold text-text-100">
              {data.totalVerified.toLocaleString()}
            </p>
            <p className="text-xs text-brand-main">
              {data.creditsUsed} credits used
            </p>
          </div>
        </div>
      </div>

      {/* Risk Flags Section */}
      {(data.flags.disposable > 0 ||
        data.flags.spamtrap > 0 ||
        data.flags.roleAccount > 0) && (
        <div className="mt-6 pt-6 border-t border-brand-main/10">
          <h3 className="text-sm font-semibold text-text-100 mb-3">
            Risk Flags Detected
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.flags.disposable > 0 && (
              <FlagBadge
                label="Disposable"
                count={data.flags.disposable}
                color="text-red-400"
              />
            )}
            {data.flags.spamtrap > 0 && (
              <FlagBadge
                label="Spamtrap"
                count={data.flags.spamtrap}
                color="text-red-500"
              />
            )}
            {data.flags.roleAccount > 0 && (
              <FlagBadge
                label="Role Account"
                count={data.flags.roleAccount}
                color="text-amber-400"
              />
            )}
            {data.flags.inboxFull > 0 && (
              <FlagBadge
                label="Inbox Full"
                count={data.flags.inboxFull}
                color="text-amber-500"
              />
            )}
            {data.flags.disabled > 0 && (
              <FlagBadge
                label="Disabled"
                count={data.flags.disabled}
                color="text-red-400"
              />
            )}
          </div>
        </div>
      )}

      {/* Quality Indicators */}
      <div className="mt-4 pt-4 border-t border-brand-main/10">
        <div className="flex flex-wrap gap-4 text-xs text-text-200/60">
          <span>
            ✓ SMTP Connectable:{" "}
            <span className="text-emerald-400">
              {data.flags.smtpConnectable}
            </span>
          </span>
          <span>
            ✓ Valid MX:{" "}
            <span className="text-emerald-400">{data.flags.mxValid}</span>
          </span>
          <span className="text-text-200/40">|</span>
          <span>
            Safe to send rate:{" "}
            <span className="text-brand-main font-medium">
              {data.totalVerified > 0
                ? ((data.breakdown.valid / data.totalVerified) * 100).toFixed(1)
                : 0}
              %
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function FlagBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-bg-300/50 rounded px-2 py-1.5">
      <AlertTriangle className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-xs text-text-200/80">{label}</span>
      <span className={`text-xs font-medium ${color}`}>{count}</span>
    </div>
  );
}
