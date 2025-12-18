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
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Email Verification Analytics
          </h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-slate-100 rounded-lg" />
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || !data.used) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Email Verification Analytics
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          No Reoon verification data available for this campaign. Leads were
          sent without pre-verification.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Configure Reoon in Settings → Integrations to verify emails before
          sending and protect your sender reputation.
        </p>
      </section>
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
    <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Email Verification Analytics
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-medium">
            Verified with Reoon ({data.mode || "power"} mode)
          </p>
          {data.lastVerifiedAt && (
            <p className="text-xs text-slate-400">
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
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ color: "#1e293b" }}
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
                className="bg-slate-50 rounded-lg p-3 border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-xs text-slate-600 font-medium">
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {count.toLocaleString()}
                </p>
                <p className="text-xs font-semibold" style={{ color }}>
                  {percentage}%
                </p>
              </div>
            );
          })}
          {/* Total Verified */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">
                Total Verified
              </span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              {data.totalVerified.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 font-semibold">
              {data.creditsUsed} credits used
            </p>
          </div>
        </div>
      </div>

      {/* Risk Flags Section */}
      {(data.flags.disposable > 0 ||
        data.flags.spamtrap > 0 ||
        data.flags.roleAccount > 0) && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Risk Flags Detected
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.flags.disposable > 0 && (
              <FlagBadge
                label="Disposable"
                count={data.flags.disposable}
                color="text-red-600"
              />
            )}
            {data.flags.spamtrap > 0 && (
              <FlagBadge
                label="Spamtrap"
                count={data.flags.spamtrap}
                color="text-red-700"
              />
            )}
            {data.flags.roleAccount > 0 && (
              <FlagBadge
                label="Role Account"
                count={data.flags.roleAccount}
                color="text-amber-600"
              />
            )}
            {data.flags.inboxFull > 0 && (
              <FlagBadge
                label="Inbox Full"
                count={data.flags.inboxFull}
                color="text-amber-600"
              />
            )}
            {data.flags.disabled > 0 && (
              <FlagBadge
                label="Disabled"
                count={data.flags.disabled}
                color="text-red-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Quality Indicators */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span>
            ✓ SMTP Connectable:{" "}
            <span className="text-emerald-600 font-semibold">
              {data.flags.smtpConnectable}
            </span>
          </span>
          <span>
            ✓ Valid MX:{" "}
            <span className="text-emerald-600 font-semibold">
              {data.flags.mxValid}
            </span>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Safe to send rate:{" "}
            <span className="text-blue-600 font-semibold">
              {data.totalVerified > 0
                ? ((data.breakdown.valid / data.totalVerified) * 100).toFixed(1)
                : 0}
              %
            </span>
          </span>
        </div>
      </div>
    </section>
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
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
      <AlertTriangle className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-xs text-slate-600 font-medium">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{count}</span>
    </div>
  );
}
