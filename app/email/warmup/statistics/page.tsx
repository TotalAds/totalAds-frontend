"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  ChartBarIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface DailyStat {
  date: string;
  sentCount: number;
  inboxCount: number;
  spamCount: number;
  replyCount: number;
  openCount: number;
  inboxRate: number;
  spamRate: number;
  replyRate: number;
}

interface AccountStats {
  accountId: string;
  email: string;
  stats: DailyStat[];
}

export default function WarmupStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AccountStats[]>([]);
  const [days, setDays] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    try {
      if (!loading) setRefreshing(true);
      
      const res = await fetch(`/api/warmup/stats?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate totals
  const totals = stats.reduce(
    (acc, account) => {
      account.stats.forEach((day) => {
        acc.sent += day.sentCount || 0;
        acc.inbox += day.inboxCount || 0;
        acc.spam += day.spamCount || 0;
        acc.replies += day.replyCount || 0;
      });
      return acc;
    },
    { sent: 0, inbox: 0, spam: 0, replies: 0 }
  );

  const overallInboxRate = totals.sent > 0 ? (totals.inbox / totals.sent) * 100 : 0;
  const overallSpamRate = totals.sent > 0 ? (totals.spam / totals.sent) * 100 : 0;
  const overallReplyRate = totals.sent > 0 ? (totals.replies / totals.sent) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-200">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/email/warmup"
          className="p-2 hover:bg-brand-main/10 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-text-200" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-100">Warmup Statistics</h1>
          <p className="text-text-200 text-sm">Historical performance data for your warmup accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-bg-200 border border-brand-main/20 rounded-xl px-4 py-2 text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={loadStats}
            disabled={refreshing}
            className="p-2 bg-brand-main/20 hover:bg-brand-main/30 rounded-xl transition-all"
          >
            <ArrowPathIcon className={`w-5 h-5 text-brand-main ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <p className="text-text-200 text-sm font-medium">Total Sent</p>
          <p className="text-3xl font-bold text-text-100 mt-2">{totals.sent.toLocaleString()}</p>
          <p className="text-text-300 text-xs mt-1">Last {days} days</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <p className="text-text-200 text-sm font-medium">Inbox Rate</p>
          <p className={`text-3xl font-bold mt-2 ${overallInboxRate >= 90 ? "text-green-400" : overallInboxRate >= 70 ? "text-yellow-400" : "text-red-400"}`}>
            {overallInboxRate.toFixed(1)}%
          </p>
          <p className="text-text-300 text-xs mt-1">{totals.inbox.toLocaleString()} in inbox</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <p className="text-text-200 text-sm font-medium">Spam Rate</p>
          <p className={`text-3xl font-bold mt-2 ${overallSpamRate < 1 ? "text-green-400" : overallSpamRate < 5 ? "text-yellow-400" : "text-red-400"}`}>
            {overallSpamRate.toFixed(2)}%
          </p>
          <p className="text-text-300 text-xs mt-1">{totals.spam} marked spam</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <p className="text-text-200 text-sm font-medium">Reply Rate</p>
          <p className="text-3xl font-bold text-text-100 mt-2">{overallReplyRate.toFixed(1)}%</p>
          <p className="text-text-300 text-xs mt-1">{totals.replies} replies received</p>
        </div>
      </div>

      {/* Per-Account Stats */}
      {stats.length > 0 ? (
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-brand-main/20">
            <h3 className="text-lg font-semibold text-text-100">Account Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-200/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Account</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Sent</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Inbox</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Spam</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Replies</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Inbox Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-main/10">
                {stats.map((account) => {
                  const accountTotals = account.stats.reduce(
                    (acc, day) => ({
                      sent: acc.sent + (day.sentCount || 0),
                      inbox: acc.inbox + (day.inboxCount || 0),
                      spam: acc.spam + (day.spamCount || 0),
                      replies: acc.replies + (day.replyCount || 0),
                    }),
                    { sent: 0, inbox: 0, spam: 0, replies: 0 }
                  );
                  const inboxRate = accountTotals.sent > 0 ? (accountTotals.inbox / accountTotals.sent) * 100 : 0;
                  
                  return (
                    <tr key={account.accountId} className="hover:bg-brand-main/5">
                      <td className="px-6 py-4 text-text-100 font-medium">{account.email}</td>
                      <td className="px-6 py-4 text-text-200">{accountTotals.sent}</td>
                      <td className="px-6 py-4 text-text-200">{accountTotals.inbox}</td>
                      <td className="px-6 py-4 text-text-200">{accountTotals.spam}</td>
                      <td className="px-6 py-4 text-text-200">{accountTotals.replies}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${inboxRate >= 90 ? "text-green-400" : inboxRate >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                          {inboxRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
          <ChartBarIcon className="w-16 h-16 text-text-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-100 mb-2">No Statistics Yet</h3>
          <p className="text-text-200 mb-6">
            Statistics will appear once your warmup accounts start sending emails.
          </p>
          <Link
            href="/email/warmup/accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-main hover:bg-brand-main/90 text-white font-medium rounded-xl transition-all"
          >
            Manage Accounts
          </Link>
        </div>
      )}

      {/* Link to detailed analytics */}
      <div className="text-center">
        <Link
          href="/email/warmup/analytics"
          className="text-brand-main hover:text-brand-main/80 font-medium"
        >
          View Detailed Analytics →
        </Link>
      </div>
    </div>
  );
}
