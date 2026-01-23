"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  EnvelopeIcon,
  ChartBarIcon,
  UserGroupIcon,
  PlusIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import emailClient from "@/utils/api/emailClient";

interface WarmupAccount {
  id: string;
  email: string;
  provider: string;
  warmupEnabled: boolean;
  reputationScore: number;
  inboxRate: number;
  spamRate: number;
  warmupStage: string;
}

export default function WarmupDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<WarmupAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true);
      else setLoading(true);

      const res = await emailClient.get("/api/warmup/accounts");
      setAccounts(res.data?.data || []);
    } catch (error) {
      console.error("Failed to load warmup data:", error);
      toast.error("Failed to load warmup data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleWarmup = async (accountId: string, enable: boolean) => {
    try {
      await emailClient.patch(`/api/warmup/accounts/${accountId}/toggle`, {
        warmupEnabled: enable
      });
      toast.success(enable ? "Warmup enabled" : "Warmup paused");
      // Update local state immediately for instant feedback
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, warmupEnabled: enable } : acc
      ));
    } catch (error) {
      toast.error("Failed to update account");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove this account from warmup?")) return;
    
    try {
      await emailClient.delete(`/api/warmup/accounts/${accountId}`);
      toast.success("Account removed");
      // Update local state immediately
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error) {
      toast.error("Failed to remove account");
    }
  };

  // Calculate stats from accounts
  const activeAccounts = accounts.filter(a => a.warmupEnabled);
  const avgInboxRate = activeAccounts.length > 0 
    ? activeAccounts.reduce((sum, a) => sum + (a.inboxRate || 0), 0) / activeAccounts.length 
    : 0;
  const avgReputation = activeAccounts.length > 0
    ? activeAccounts.reduce((sum, a) => sum + (a.reputationScore || 0), 0) / activeAccounts.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-200">Loading warmup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-100">Email Warmup</h1>
          <p className="text-text-200 mt-1">
            Improve your email deliverability with intelligent warmup
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="p-2 bg-brand-main/20 hover:bg-brand-main/30 rounded-xl transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 text-brand-main ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/email/warmup/connect"
            className="px-4 py-2 bg-brand-main hover:bg-brand-main/90 text-white font-medium rounded-xl transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Account
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <p className="text-text-200 text-sm font-medium">Total Accounts</p>
          <p className="text-3xl font-bold text-text-100 mt-2">{accounts.length}</p>
          <p className="text-text-300 text-xs mt-1">{activeAccounts.length} active</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <p className="text-text-200 text-sm font-medium">Avg Inbox Rate</p>
          <p className={`text-3xl font-bold mt-2 ${avgInboxRate >= 90 ? "text-green-400" : avgInboxRate >= 70 ? "text-yellow-400" : "text-red-400"}`}>
            {avgInboxRate.toFixed(1)}%
          </p>
          <p className="text-text-300 text-xs mt-1">Target: 95%+</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <p className="text-text-200 text-sm font-medium">Avg Reputation</p>
          <p className={`text-3xl font-bold mt-2 ${avgReputation >= 70 ? "text-green-400" : avgReputation >= 40 ? "text-yellow-400" : "text-red-400"}`}>
            {avgReputation.toFixed(0)}
          </p>
          <p className="text-text-300 text-xs mt-1">Out of 100</p>
        </div>
        <Link
          href="/email/warmup/analytics"
          className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:border-brand-main/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-200 text-sm font-medium">Analytics</p>
              <p className="text-text-100 font-semibold mt-2 group-hover:text-brand-main">View Details →</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-brand-main" />
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/email/warmup/accounts"
          className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-5 hover:border-brand-main/40 transition-all group flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-brand-main/20 group-hover:bg-brand-main/30">
            <UserGroupIcon className="w-6 h-6 text-brand-main" />
          </div>
          <div>
            <h3 className="text-text-100 font-semibold group-hover:text-brand-main">Manage Accounts</h3>
            <p className="text-text-300 text-sm">Configure warmup settings</p>
          </div>
        </Link>
        <Link
          href="/email/warmup/analytics"
          className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-5 hover:border-brand-main/40 transition-all group flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-brand-main/20 group-hover:bg-brand-main/30">
            <ChartBarIcon className="w-6 h-6 text-brand-main" />
          </div>
          <div>
            <h3 className="text-text-100 font-semibold group-hover:text-brand-main">Account Analytics</h3>
            <p className="text-text-300 text-sm">View performance metrics</p>
          </div>
        </Link>

      </div>

      {/* Accounts Table */}
      {accounts.length > 0 ? (
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-brand-main/20 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-100">Connected Accounts</h3>
            <Link
              href="/email/warmup/accounts"
              className="text-brand-main hover:text-brand-main/80 text-sm font-medium"
            >
              Manage All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-200/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Reputation</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Inbox Rate</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-main/10">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-brand-main/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-main/20 flex items-center justify-center">
                          <EnvelopeIcon className="w-5 h-5 text-brand-main" />
                        </div>
                        <div>
                          <p className="text-text-100 font-medium">{account.email}</p>
                          <p className="text-text-300 text-xs">{account.provider}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                          account.warmupEnabled
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${account.warmupEnabled ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                        {account.warmupEnabled ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          account.reputationScore >= 70
                            ? "text-green-400"
                            : account.reputationScore >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {account.reputationScore || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-200">{(account.inboxRate || 0).toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleWarmup(account.id, !account.warmupEnabled)}
                          className={`p-2 rounded-lg transition-all ${
                            account.warmupEnabled
                              ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                              : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                          }`}
                          title={account.warmupEnabled ? "Pause warmup" : "Start warmup"}
                        >
                          {account.warmupEnabled ? (
                            <PauseIcon className="w-4 h-4" />
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                          title="Remove account"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
          <EnvelopeIcon className="w-16 h-16 text-brand-main mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-100 mb-2">Get Started with Warmup</h3>
          <p className="text-text-200 mb-6 max-w-md mx-auto">
            Connect your email accounts to start warming them up and improve deliverability.
          </p>
          <Link
            href="/email/warmup/connect"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-main hover:bg-brand-main/90 text-white font-medium rounded-xl transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Connect Your First Account
          </Link>
        </div>
      )}
    </div>
  );
}
