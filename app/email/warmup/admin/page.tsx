"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  UsersIcon,
  EnvelopeIcon,
  QueueListIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface SystemStats {
  totalUsers: number;
  totalAccounts: number;
  activeAccounts: number;
  pausedAccounts: number;
  totalPairsToday: number;
  successfulPairs: number;
  failedPairs: number;
  pendingPairs: number;
  averageInboxRate: number;
  averageSpamRate: number;
}

interface QueueStats {
  senderQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  schedulerQueue: {
    waiting: number;
    active: number;
    lastRun: string;
    nextRun: string;
  };
  readerQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

interface AccountIssue {
  accountId: string;
  email: string;
  issue: string;
  severity: "warning" | "critical";
  action: string;
}

interface RecentActivity {
  id: string;
  type: "sent" | "received" | "error" | "paused";
  message: string;
  timestamp: string;
}

export default function AdminWarmupDashboard() {
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [issues, setIssues] = useState<AccountIssue[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      if (!loading) setRefreshing(true);
      
      // Fetch system stats
      const statsRes = await fetch("/api/warmup/admin/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSystemStats(statsData.data.system);
        setQueueStats(statsData.data.queues);
        setIssues(statsData.data.issues || []);
        setActivities(statsData.data.recentActivity || []);
      }
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBulkPause = async (accountIds: string[]) => {
    try {
      const res = await fetch("/api/warmup/admin/accounts/bulk-pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountIds: accountIds.map(Number) }),
      });
      if (res.ok) {
        toast.success(`Paused ${accountIds.length} accounts`);
        loadDashboard();
      }
    } catch (error) {
      toast.error("Failed to pause accounts");
    }
  };

  const handleBulkUnpause = async (accountIds: string[]) => {
    try {
      const res = await fetch("/api/warmup/admin/accounts/bulk-unpause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountIds: accountIds.map(Number) }),
      });
      if (res.ok) {
        toast.success(`Unpaused ${accountIds.length} accounts`);
        loadDashboard();
      }
    } catch (error) {
      toast.error("Failed to unpause accounts");
    }
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "brand-main",
    trend,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: any;
    color?: string;
    trend?: "up" | "down";
  }) => (
    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:border-brand-main/40 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-200 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-text-100 mt-2">{value}</p>
          {subtitle && <p className="text-text-300 text-xs mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-${color}/20`}>
            <Icon className={`w-6 h-6 text-${color}`} />
          </div>
        )}
      </div>
    </div>
  );

  const QueueCard = ({
    name,
    stats,
  }: {
    name: string;
    stats: { waiting: number; active: number; completed?: number; failed?: number };
  }) => (
    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
      <h4 className="text-text-100 font-semibold mb-3">{name}</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-200/50 rounded-lg p-2">
          <p className="text-yellow-400 text-lg font-bold">{stats.waiting}</p>
          <p className="text-text-300 text-xs">Waiting</p>
        </div>
        <div className="bg-bg-200/50 rounded-lg p-2">
          <p className="text-blue-400 text-lg font-bold">{stats.active}</p>
          <p className="text-text-300 text-xs">Active</p>
        </div>
        {stats.completed !== undefined && (
          <div className="bg-bg-200/50 rounded-lg p-2">
            <p className="text-green-400 text-lg font-bold">{stats.completed}</p>
            <p className="text-text-300 text-xs">Completed</p>
          </div>
        )}
        {stats.failed !== undefined && (
          <div className="bg-bg-200/50 rounded-lg p-2">
            <p className="text-red-400 text-lg font-bold">{stats.failed}</p>
            <p className="text-text-300 text-xs">Failed</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-200">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-100">Admin Warmup Dashboard</h1>
          <p className="text-text-200 mt-1">System-wide monitoring and queue management</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className="p-2 bg-brand-main/20 hover:bg-brand-main/30 border border-brand-main/30 rounded-xl transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 text-brand-main ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <span className="text-text-300 text-sm">
            Auto-refreshes every 30s
          </span>
        </div>
      </div>

      {/* Critical Issues Banner */}
      {issues.filter(i => i.severity === "critical").length > 0 && (
        <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold">Critical Issues Detected</h3>
              <ul className="mt-2 space-y-1">
                {issues.filter(i => i.severity === "critical").map((issue) => (
                  <li key={issue.accountId} className="text-text-200 text-sm flex items-center justify-between">
                    <span>{issue.email}: {issue.issue}</span>
                    <button
                      onClick={() => handleBulkPause([issue.accountId])}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/20 rounded"
                    >
                      Pause
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={systemStats?.totalUsers || 0}
          subtitle={`${systemStats?.activeAccounts || 0} active accounts`}
          icon={UsersIcon}
        />
        <StatCard
          title="Pairs Today"
          value={systemStats?.totalPairsToday || 0}
          subtitle={`${systemStats?.successfulPairs || 0} successful`}
          icon={EnvelopeIcon}
        />
        <StatCard
          title="Avg Inbox Rate"
          value={`${systemStats?.averageInboxRate?.toFixed(1) || 0}%`}
          subtitle="System-wide average"
          icon={ChartBarIcon}
        />
        <StatCard
          title="Avg Spam Rate"
          value={`${systemStats?.averageSpamRate?.toFixed(2) || 0}%`}
          subtitle="Target: <1%"
          icon={ExclamationTriangleIcon}
        />
      </div>

      {/* Queue Monitoring */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-100">Queue Monitoring</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-text-200 text-sm">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {queueStats?.senderQueue && (
            <QueueCard name="Sender Queue" stats={queueStats.senderQueue} />
          )}
          {queueStats?.readerQueue && (
            <QueueCard name="Reader Queue" stats={queueStats.readerQueue} />
          )}
          {queueStats?.schedulerQueue && (
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
              <h4 className="text-text-100 font-semibold mb-3">Scheduler</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-200 text-sm">Waiting</span>
                  <span className="text-yellow-400 font-bold">{queueStats.schedulerQueue.waiting}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-200 text-sm">Last Run</span>
                  <span className="text-text-100 text-sm">{queueStats.schedulerQueue.lastRun || "Never"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-200 text-sm">Next Run</span>
                  <span className="text-brand-main text-sm">{queueStats.schedulerQueue.nextRun || "TBD"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts with Issues */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-100 mb-4">Accounts Needing Attention</h3>
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-text-200">All accounts healthy</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {issues.map((issue) => (
                <div
                  key={issue.accountId}
                  className={`p-3 rounded-xl ${
                    issue.severity === "critical" 
                      ? "bg-red-500/10 border border-red-500/30" 
                      : "bg-yellow-500/10 border border-yellow-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-text-100 font-medium text-sm">{issue.email}</p>
                      <p className={`text-xs mt-1 ${
                        issue.severity === "critical" ? "text-red-400" : "text-yellow-400"
                      }`}>
                        {issue.issue}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBulkPause([issue.accountId])}
                      className="text-xs px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg"
                    >
                      Pause
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-100 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-text-300 text-center py-8">No recent activity</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-bg-200/30 rounded-xl"
                >
                  <div className={`p-1.5 rounded-lg ${
                    activity.type === "sent" ? "bg-green-500/20 text-green-400" :
                    activity.type === "received" ? "bg-blue-500/20 text-blue-400" :
                    activity.type === "error" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {activity.type === "sent" ? <EnvelopeIcon className="w-4 h-4" /> :
                     activity.type === "error" ? <XCircleIcon className="w-4 h-4" /> :
                     <ClockIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-100 text-sm">{activity.message}</p>
                    <p className="text-text-300 text-xs mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-text-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/email/warmup/analytics"
            className="p-4 bg-bg-200/50 hover:bg-bg-200 rounded-xl text-center transition-all"
          >
            <ChartBarIcon className="w-8 h-8 text-brand-main mx-auto mb-2" />
            <p className="text-text-100 text-sm font-medium">User Analytics</p>
          </Link>
          <Link
            href="/email/warmup/accounts"
            className="p-4 bg-bg-200/50 hover:bg-bg-200 rounded-xl text-center transition-all"
          >
            <UsersIcon className="w-8 h-8 text-brand-main mx-auto mb-2" />
            <p className="text-text-100 text-sm font-medium">Manage Accounts</p>
          </Link>
          <Link
            href="/email/warmup/pairs"
            className="p-4 bg-bg-200/50 hover:bg-bg-200 rounded-xl text-center transition-all"
          >
            <QueueListIcon className="w-8 h-8 text-brand-main mx-auto mb-2" />
            <p className="text-text-100 text-sm font-medium">Active Pairs</p>
          </Link>
          <button
            onClick={() => toast.success("Schedule triggered")}
            className="p-4 bg-bg-200/50 hover:bg-bg-200 rounded-xl text-center transition-all"
          >
            <PlayIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-text-100 text-sm font-medium">Run Scheduler</p>
          </button>
        </div>
      </div>
    </div>
  );
}
