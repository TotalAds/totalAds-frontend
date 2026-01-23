"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EnvelopeIcon,
  InboxIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import emailClient from "@/utils/api/emailClient";

// Types for analytics data
interface AnalyticsOverview {
  totalAccounts: number;
  activeAccounts: number;
  totalSent: number;
  totalInbox: number;
  totalSpam: number;
  totalReplies: number;
  averageInboxRate: number;
  averageSpamRate: number;
  averageReplyRate: number;
  averageReputationScore: number;
}

interface DailyStats {
  date: string;
  sent: number;
  inbox: number;
  spam: number;
  replies: number;
  inboxRate: number;
  spamRate: number;
}

interface AccountPerformance {
  id: string;
  email: string;
  provider: string;
  warmupStage: string;
  reputationScore: number;
  inboxRate: number;
  spamRate: number;
  replyRate: number;
  sentCount: number;
  status: "healthy" | "warning" | "critical";
}

interface Alert {
  id: string;
  type: "warning" | "critical" | "info";
  category: string;
  message: string;
  recommendation: string;
  domain?: string;
  createdAt: string;
}

export default function WarmupAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [accounts, setAccounts] = useState<AccountPerformance[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dateRange, setDateRange] = useState(7);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics summary using emailClient for proper authentication
      const summaryRes = await emailClient.get(`/api/warmup/analytics/summary?days=${dateRange}`);
      const summaryData = summaryRes.data;
      if (summaryData.success && summaryData.data) {
        // Backend returns flat data structure, map it to our overview format
        const data = summaryData.data;
        setOverview({
          totalAccounts: data.totalAccounts || 0,
          activeAccounts: data.accounts?.filter((a: any) => a.sentToday > 0).length || 0,
          totalSent: data.totalEmailsSent || 0,
          totalInbox: 0, // Not provided by backend
          totalSpam: 0, // Not provided by backend  
          totalReplies: 0, // Not provided by backend
          averageInboxRate: data.averageInboxRate || 0,
          averageSpamRate: 0, // Not provided by backend
          averageReplyRate: 0, // Not provided by backend
          averageReputationScore: data.averageReputationScore || 0,
        });
        // Map accounts to expected format
        setAccounts((data.accounts || []).map((acc: any) => ({
          id: acc.accountId?.toString() || acc.id,
          email: acc.email,
          provider: acc.provider || "gmail",
          warmupStage: acc.warmupStage?.toString() || "1",
          reputationScore: acc.reputationScore || 0,
          inboxRate: acc.currentInboxRate || 0,
          spamRate: 0,
          replyRate: 0,
          sentCount: acc.sentToday || 0,
          status: acc.reputationScore >= 70 ? "healthy" : acc.reputationScore >= 40 ? "warning" : "critical",
        })));
      }

      // Postmaster alerts disabled
      // const alertsRes = await fetch("/api/warmup/postmaster/alerts");
      // if (alertsRes.ok) {
      //   const alertsData = await alertsRes.json();
      //   if (alertsData.success) {
      //     setAlerts(alertsData.data.alerts || []);
      //   }
      // }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "brand-main",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: any;
    trend?: "up" | "down" | "stable";
    color?: string;
  }) => (
    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:border-brand-main/40 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-200 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-text-100 mt-2">{value}</p>
          {subtitle && (
            <p className="text-text-300 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`${
              trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-gray-400"
            }`}>
              {trend === "up" ? (
                <ArrowTrendingUpIcon className="w-5 h-5" />
              ) : trend === "down" ? (
                <ArrowTrendingDownIcon className="w-5 h-5" />
              ) : null}
            </span>
          )}
          {Icon && (
            <div className={`p-3 rounded-xl bg-${color}/20`}>
              <Icon className={`w-6 h-6 text-${color}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const MiniChart = ({ data, color = "#6366f1" }: { data: number[]; color?: string }) => {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    
    return (
      <div className="flex items-end gap-1 h-16">
        {data.slice(-14).map((value, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${((value - min) / range) * 100}%`,
              backgroundColor: color,
              minHeight: "4px",
              opacity: 0.5 + (i / data.length) * 0.5,
            }}
          />
        ))}
      </div>
    );
  };

  if (loading && !overview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-200">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-100">Warmup Analytics</h1>
          <p className="text-text-200 mt-1">Monitor your email deliverability and warmup performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="bg-bg-200 border border-brand-main/20 rounded-xl px-4 py-2 text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>

        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.filter(a => !a.domain || a.type === "critical").length > 0 && (
        <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-semibold">Action Required</h3>
              <ul className="mt-2 space-y-1">
                {alerts.filter(a => a.type === "critical").slice(0, 3).map((alert) => (
                  <li key={alert.id} className="text-text-200 text-sm">
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Emails Sent"
          value={overview?.totalSent?.toLocaleString() || 0}
          subtitle={`${overview?.activeAccounts || 0} active accounts`}
          icon={EnvelopeIcon}
        />
        <StatCard
          title="Inbox Placement"
          value={`${overview?.averageInboxRate?.toFixed(1) || 0}%`}
          subtitle={`${overview?.totalInbox?.toLocaleString() || 0} in inbox`}
          icon={InboxIcon}
          trend={overview?.averageInboxRate && overview.averageInboxRate > 90 ? "up" : "down"}
        />
        <StatCard
          title="Spam Rate"
          value={`${overview?.averageSpamRate?.toFixed(2) || 0}%`}
          subtitle={`${overview?.totalSpam || 0} marked as spam`}
          icon={ExclamationTriangleIcon}
          trend={overview?.averageSpamRate && overview.averageSpamRate < 1 ? "up" : "down"}
        />
        <StatCard
          title="Reply Rate"
          value={`${overview?.averageReplyRate?.toFixed(1) || 0}%`}
          subtitle={`${overview?.totalReplies || 0} total replies`}
          icon={ChatBubbleLeftRightIcon}
          trend={overview?.averageReplyRate && overview.averageReplyRate > 10 ? "up" : "stable"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbox Placement Trend */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-100 mb-4">Inbox Placement Trend</h3>
          <MiniChart 
            data={dailyStats.map(d => d.inboxRate)} 
            color="#22c55e"
          />
          <div className="mt-4 flex justify-between text-xs text-text-300">
            <span>{dailyStats[0]?.date || ""}</span>
            <span>{dailyStats[dailyStats.length - 1]?.date || ""}</span>
          </div>
        </div>

        {/* Daily Send Volume */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-100 mb-4">Daily Send Volume</h3>
          <MiniChart 
            data={dailyStats.map(d => d.sent)} 
            color="#6366f1"
          />
          <div className="mt-4 flex justify-between text-xs text-text-300">
            <span>{dailyStats[0]?.date || ""}</span>
            <span>{dailyStats[dailyStats.length - 1]?.date || ""}</span>
          </div>
        </div>
      </div>

      {/* Account Performance Table */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-brand-main/20">
          <h3 className="text-lg font-semibold text-text-100">Account Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-200/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase tracking-wider">Account</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase tracking-wider">Stage</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase tracking-wider">Reputation</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase tracking-wider">Inbox Rate</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase tracking-wider">Spam Rate</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase tracking-wider">Sent</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-main/10">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-brand-main/5">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-text-100 font-medium">{account.email}</p>
                      <p className="text-text-300 text-xs">{account.provider}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-200">{account.warmupStage}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      account.reputationScore >= 70 ? "text-green-400" :
                      account.reputationScore >= 40 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {account.reputationScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-200">{account.inboxRate?.toFixed(1)}%</td>
                  <td className="px-6 py-4">
                    <span className={account.spamRate > 1 ? "text-red-400" : "text-text-200"}>
                      {account.spamRate?.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-200">{account.sentCount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      account.status === "healthy" ? "bg-green-500/20 text-green-400" :
                      account.status === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {account.status}
                    </span>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-300">
                    No accounts found. Start warming up your email accounts to see analytics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health Score & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Health Score */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-bg-300"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(overview?.averageReputationScore || 0) * 2.51} 251`}
                  className={`${
                    (overview?.averageReputationScore || 0) >= 70 ? "text-green-400" :
                    (overview?.averageReputationScore || 0) >= 40 ? "text-yellow-400" : "text-red-400"
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-text-100">
                  {overview?.averageReputationScore || 0}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-100">Overall Health Score</h3>
              <p className="text-text-200 text-sm mt-1">
                {(overview?.averageReputationScore || 0) >= 70 
                  ? "Your email reputation is excellent!" 
                  : (overview?.averageReputationScore || 0) >= 40
                  ? "Room for improvement. Monitor spam rates."
                  : "Attention needed. Review email content and frequency."}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-100 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/email/warmup/accounts"
              className="block w-full px-4 py-3 bg-bg-200/50 hover:bg-bg-200 rounded-xl text-text-100 transition-all"
            >
              → Manage Warmup Accounts
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}
