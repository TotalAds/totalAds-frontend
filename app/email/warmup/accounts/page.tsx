"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import WarmupStatusPanel from "@/components/warmup/WarmupStatusPanel";
import { useAuthContext } from "@/context/AuthContext";
import {
  deleteWarmupAccount,
  getWarmupAccounts,
  getWarmupPairs,
  getWarmupPairStats,
  getWarmupStats,
  getWarmupStatsSummary,
  toggleWarmupAccount,
  WarmupAccount,
  WarmupPair,
  WarmupPairStats,
  WarmupStats,
  WarmupStatsSummary,
} from "@/utils/api/warmupClient";
import { IconCheck, IconPlus, IconTrash, IconX } from "@tabler/icons-react";

type TabType = "accounts" | "pairs" | "statistics" | "status";
type PairStatus =
  | "scheduled"
  | "sent"
  | "delivered"
  | "opened"
  | "replied"
  | "failed";

export default function WarmupAccountsPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [accounts, setAccounts] = useState<WarmupAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("accounts");

  // Pairs state
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [pairs, setPairs] = useState<WarmupPair[]>([]);
  const [pairStats, setPairStats] = useState<WarmupPairStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PairStatus | "all">(
    "all"
  );
  const [pairLimit, setPairLimit] = useState(50);
  const [pairOffset, setPairOffset] = useState(0);
  const [pairTotal, setPairTotal] = useState(0);

  // Statistics state
  const [stats, setStats] = useState<WarmupStats[]>([]);
  const [summary, setSummary] = useState<WarmupStatsSummary | null>(null);
  const [days, setDays] = useState<7 | 30>(7);

  const statuses: PairStatus[] = [
    "scheduled",
    "sent",
    "delivered",
    "opened",
    "replied",
    "failed",
  ];

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated && state.user) {
      if (!state.user.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }
      fetchAccounts();
    }
  }, [state.isLoading, state.isAuthenticated, state.user, router]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getWarmupAccounts();
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    } catch (error: any) {
      console.error("Failed to fetch accounts:", error);
      toast.error("Failed to load warmup accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchPairs = async (
    accountId: string,
    status: PairStatus | "all",
    newOffset: number
  ) => {
    try {
      setLoading(true);
      const result = await getWarmupPairs(
        accountId,
        status === "all" ? undefined : status,
        pairLimit,
        newOffset
      );
      setPairs(result.pairs);
      setPairTotal(result.total);
      setPairOffset(newOffset);
    } catch (error: any) {
      console.error("Failed to fetch pairs:", error);
      toast.error("Failed to load pairs");
    } finally {
      setLoading(false);
    }
  };

  const fetchPairStats = async (accountId: string) => {
    try {
      const stats = await getWarmupPairStats(accountId);
      setPairStats(stats);
    } catch (error: any) {
      console.error("Failed to fetch pair stats:", error);
    }
  };

  const fetchStats = async (accountId: string, daysValue: 7 | 30) => {
    try {
      setLoading(true);
      const [statsData, summaryData] = await Promise.all([
        getWarmupStats(accountId, daysValue),
        getWarmupStatsSummary(accountId, daysValue),
      ]);
      setStats(statsData);
      setSummary(summaryData);
      setDays(daysValue);
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWarmup = async (
    accountId: string,
    currentState: boolean
  ) => {
    try {
      setToggling(accountId);
      const updated = await toggleWarmupAccount(accountId, !currentState);
      setAccounts(
        accounts.map((acc) => (acc.id === accountId ? updated : acc))
      );
      toast.success(
        `Warmup ${!currentState ? "enabled" : "disabled"} successfully`
      );
    } catch (error: any) {
      console.error("Failed to toggle warmup:", error);
      toast.error("Failed to toggle warmup");
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      setDeleting(accountId);
      await deleteWarmupAccount(accountId);
      setAccounts(accounts.filter((acc) => acc.id !== accountId));
      toast.success("Account deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account");
    } finally {
      setDeleting(null);
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    setPairOffset(0);
    setSelectedStatus("all");
    fetchPairs(accountId, "all", 0);
    fetchPairStats(accountId);
    fetchStats(accountId, days);
  };

  const handleStatusChange = (status: PairStatus | "all") => {
    setSelectedStatus(status);
    setPairOffset(0);
    if (selectedAccountId) {
      fetchPairs(selectedAccountId, status, 0);
    }
  };

  const handleDaysChange = (newDays: 7 | 30) => {
    if (selectedAccountId) {
      fetchStats(selectedAccountId, newDays);
    }
  };

  const getStatusColor = (status: PairStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-400";
      case "sent":
        return "bg-blue-500/20 text-blue-400";
      case "delivered":
        return "bg-green-500/20 text-green-400";
      case "opened":
        return "bg-purple-500/20 text-purple-400";
      case "replied":
        return "bg-pink-500/20 text-pink-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const pairPages = Math.ceil(pairTotal / pairLimit);
  const pairCurrentPage = Math.floor(pairOffset / pairLimit) + 1;

  // --------------------

  return process.env.NEXT_PUBLIC_SHOW_WARMUP === "true" ? (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-100">
              Warmup Accounts
            </h1>
            <p className="text-text-200 text-sm mt-1">
              Manage your email warmup accounts and monitor performance
            </p>
          </div>
          <Link href="/email/warmup/connect">
            <Button className="bg-brand-main hover:bg-brand-main/80 text-text-100 px-6 py-2 rounded-lg transition flex items-center gap-2">
              <IconPlus className="w-4 h-4" />
              Add Account
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-200">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Warmup Accounts Yet
            </h3>
            <p className="text-text-200 mb-6">
              Create your first warmup account to get started
            </p>
            <Link href="/email/warmup/connect">
              <Button className="bg-brand-main hover:bg-brand-main/80 text-text-100 px-6 py-2 rounded-lg transition">
                Create Your First Account
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-brand-main/10">
              <button
                onClick={() => setActiveTab("accounts")}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  activeTab === "accounts"
                    ? "border-brand-main text-brand-main"
                    : "border-transparent text-text-200 hover:text-text-100"
                }`}
              >
                Accounts
              </button>
              <button
                onClick={() => {
                  setActiveTab("pairs");
                  if (selectedAccountId) {
                    fetchPairs(selectedAccountId, "all", 0);
                    fetchPairStats(selectedAccountId);
                  }
                }}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  activeTab === "pairs"
                    ? "border-brand-main text-brand-main"
                    : "border-transparent text-text-200 hover:text-text-100"
                }`}
              >
                Warmup Pairs
              </button>
              <button
                onClick={() => {
                  setActiveTab("statistics");
                  if (selectedAccountId) {
                    fetchStats(selectedAccountId, days);
                  }
                }}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  activeTab === "statistics"
                    ? "border-brand-main text-brand-main"
                    : "border-transparent text-text-200 hover:text-text-100"
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => {
                  setActiveTab("status");
                }}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  activeTab === "status"
                    ? "border-brand-main text-brand-main"
                    : "border-transparent text-text-200 hover:text-text-100"
                }`}
              >
                Status
              </button>
            </div>

            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-main/10 bg-brand-main/5">
                        <th className="px-6 py-4 text-left text-text-100 font-semibold">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-text-100 font-semibold">
                          Provider
                        </th>
                        <th className="px-6 py-4 text-left text-text-100 font-semibold">
                          Daily Limit
                        </th>
                        <th className="px-6 py-4 text-left text-text-100 font-semibold">
                          Reputation
                        </th>
                        <th className="px-6 py-4 text-left text-text-100 font-semibold">
                          Inbox Rate
                        </th>
                        <th className="px-6 py-4 text-left text-text-100 font-semibold">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-text-100 font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => (
                        <tr
                          key={account.id}
                          className="border-b border-brand-main/10 hover:bg-brand-main/5 transition"
                        >
                          <td className="px-6 py-4 text-text-100">
                            {account.email}
                          </td>
                          <td className="px-6 py-4 text-text-200 capitalize">
                            {account.provider}
                          </td>
                          <td className="px-6 py-4 text-text-200">
                            {account.dailyLimit}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-bg-300 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand-main"
                                  style={{
                                    width: `${account.reputationScore}%`,
                                  }}
                                />
                              </div>
                              <span className="text-text-200 text-sm">
                                {account.reputationScore}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-200">
                            {account.inboxRate.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                handleToggleWarmup(
                                  account.id,
                                  account.warmupEnabled
                                )
                              }
                              disabled={toggling === account.id}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                                account.warmupEnabled
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-gray-500/20 text-gray-400"
                              } ${toggling === account.id ? "opacity-50" : ""}`}
                            >
                              {account.warmupEnabled ? (
                                <span className="flex items-center gap-1">
                                  <IconCheck className="w-4 h-4" />
                                  Enabled
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <IconX className="w-4 h-4" />
                                  Disabled
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => handleAccountChange(account.id)}
                                className="bg-blue-200 hover:bg-blue-300 text-blue-500 text-xs px-3 py-1 rounded transition"
                              >
                                View Details
                              </Button>
                              <Button
                                onClick={() => handleDeleteAccount(account.id)}
                                disabled={deleting === account.id}
                                className="bg-red-200 hover:bg-red-300 text-red-500 text-xs px-3 py-1 rounded transition disabled:opacity-50"
                              >
                                <IconTrash className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Status Tab */}
            {activeTab === "status" && (
              <div className="space-y-6">
                {/* Account Selector */}
                <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                  <label className="block text-text-100 font-medium mb-2">
                    Select Account
                  </label>
                  <select
                    value={selectedAccountId || ""}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    className="px-4 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.email}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Panel */}
                {selectedAccountId ? (
                  <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                    <WarmupStatusPanel accountId={selectedAccountId} />
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-200">
                    Select an account to view status
                  </div>
                )}
              </div>
            )}

            {/* Pairs Tab */}
            {activeTab === "pairs" && (
              <div className="space-y-6">
                {/* Account Selector */}
                <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                  <label className="block text-text-100 font-medium mb-2">
                    Select Account
                  </label>
                  <select
                    value={selectedAccountId || ""}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    className="px-4 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pair Stats */}
                {pairStats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
                      <p className="text-text-200 text-xs mb-1">Total</p>
                      <p className="text-2xl font-bold text-text-100">
                        {pairStats.totalPairs}
                      </p>
                    </div>
                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
                      <p className="text-text-200 text-xs mb-1">Scheduled</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {pairStats.scheduledCount}
                      </p>
                    </div>
                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
                      <p className="text-text-200 text-xs mb-1">Sent</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {pairStats.sentCount}
                      </p>
                    </div>
                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
                      <p className="text-text-200 text-xs mb-1">Delivered</p>
                      <p className="text-2xl font-bold text-green-400">
                        {pairStats.deliveredCount}
                      </p>
                    </div>
                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
                      <p className="text-text-200 text-xs mb-1">Opened</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {pairStats.openedCount}
                      </p>
                    </div>
                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
                      <p className="text-text-200 text-xs mb-1">Failed</p>
                      <p className="text-2xl font-bold text-red-400">
                        {pairStats.failedCount}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                  <label className="block text-text-100 font-medium mb-3">
                    Filter by Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusChange("all")}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        selectedStatus === "all"
                          ? "bg-brand-main text-text-100"
                          : "bg-bg-300 text-text-200 hover:bg-bg-300/80"
                      }`}
                    >
                      All
                    </button>
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`px-3 py-1 rounded-lg text-sm capitalize transition ${
                          selectedStatus === status
                            ? "bg-brand-main text-text-100"
                            : "bg-bg-300 text-text-200 hover:bg-bg-300/80"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pairs Table */}
                <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brand-main/10 bg-brand-main/5">
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            From
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            To
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Scheduled
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Sent
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Retries
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pairs.map((pair) => (
                          <tr
                            key={pair.id}
                            className="border-b border-brand-main/10 hover:bg-brand-main/5 transition"
                          >
                            <td className="px-6 py-4 text-text-100 text-sm">
                              {pair.senderEmail}
                            </td>
                            <td className="px-6 py-4 text-text-100 text-sm">
                              {pair.receiverEmail}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${getStatusColor(
                                  pair.status
                                )}`}
                              >
                                {pair.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-text-200 text-sm">
                              {new Date(pair.sendAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-text-200 text-sm">
                              {pair.sentAt
                                ? new Date(pair.sentAt).toLocaleDateString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-text-200 text-sm">
                              {pair.retryCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {pairPages > 1 && (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() =>
                        fetchPairs(
                          selectedAccountId!,
                          selectedStatus,
                          Math.max(0, pairOffset - pairLimit)
                        )
                      }
                      disabled={pairOffset === 0}
                      className="px-4 py-2 bg-bg-300 text-text-100 rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: pairPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() =>
                              fetchPairs(
                                selectedAccountId!,
                                selectedStatus,
                                (page - 1) * pairLimit
                              )
                            }
                            className={`px-3 py-2 rounded-lg ${
                              pairCurrentPage === page
                                ? "bg-brand-main text-text-100"
                                : "bg-bg-300 text-text-200 hover:bg-bg-300/80"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() =>
                        fetchPairs(
                          selectedAccountId!,
                          selectedStatus,
                          pairOffset + pairLimit
                        )
                      }
                      disabled={pairOffset + pairLimit >= pairTotal}
                      className="px-4 py-2 bg-bg-300 text-text-100 rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "statistics" && (
              <div className="space-y-6">
                {/* Account Selector */}
                <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 flex gap-4 items-end flex-wrap">
                  <div>
                    <label className="block text-text-100 font-medium mb-2">
                      Account
                    </label>
                    <select
                      value={selectedAccountId || ""}
                      onChange={(e) => handleAccountChange(e.target.value)}
                      className="px-4 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-text-100 font-medium mb-2">
                      Period
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDaysChange(7)}
                        className={`px-4 py-2 rounded-lg transition ${
                          days === 7
                            ? "bg-brand-main text-text-100"
                            : "bg-bg-300 text-text-200 hover:bg-bg-300/80"
                        }`}
                      >
                        7d
                      </button>
                      <button
                        onClick={() => handleDaysChange(30)}
                        className={`px-4 py-2 rounded-lg transition ${
                          days === 30
                            ? "bg-brand-main text-text-100"
                            : "bg-bg-300 text-text-200 hover:bg-bg-300/80"
                        }`}
                      >
                        30d
                      </button>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                      <p className="text-text-200 text-sm mb-2">Total Sent</p>
                      <p className="text-3xl font-bold text-text-100">
                        {summary.totalSent}
                      </p>
                    </div>

                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                      <p className="text-text-200 text-sm mb-2">Inbox Rate</p>
                      <p className="text-3xl font-bold text-green-400">
                        {summary.averageInboxRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                      <p className="text-text-200 text-sm mb-2">Spam Rate</p>
                      <p className="text-3xl font-bold text-red-400">
                        {summary.averageSpamRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                      <p className="text-text-200 text-sm mb-2">Open Rate</p>
                      <p className="text-3xl font-bold text-blue-400">
                        {summary.averageOpenRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                      <p className="text-text-200 text-sm mb-2">Reply Rate</p>
                      <p className="text-3xl font-bold text-purple-400">
                        {summary.averageReplyRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Chart */}
                <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-text-100 mb-6">
                    Daily Trend
                  </h3>
                  {stats.length > 0 ? (
                    <div className="h-64 flex items-end gap-1">
                      {stats.map((stat, idx) => {
                        const max = Math.max(
                          1,
                          ...stats.map((s) => s.sentCount)
                        );
                        const sentH = Math.round((stat.sentCount / max) * 100);
                        const inboxH = Math.round(
                          (stat.inboxCount / max) * 100
                        );
                        const spamH = Math.round((stat.spamCount / max) * 100);

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex items-end justify-center gap-[2px]"
                          >
                            <div
                              className="bg-green-400/80 rounded-t"
                              style={{
                                height: `${sentH}%`,
                                width: "6px",
                              }}
                              title={`${stat.date}: Sent ${stat.sentCount}`}
                            />
                            <div
                              className="bg-blue-400/80 rounded-t"
                              style={{
                                height: `${inboxH}%`,
                                width: "6px",
                              }}
                              title={`${stat.date}: Inbox ${stat.inboxCount}`}
                            />
                            <div
                              className="bg-red-400/80 rounded-t"
                              style={{
                                height: `${spamH}%`,
                                width: "6px",
                              }}
                              title={`${stat.date}: Spam ${stat.spamCount}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-text-200 text-center py-12">
                      No data available
                    </p>
                  )}

                  {/* Legend */}
                  <div className="flex gap-6 mt-6 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded" />
                      <span className="text-text-200 text-sm">Sent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded" />
                      <span className="text-text-200 text-sm">Inbox</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded" />
                      <span className="text-text-200 text-sm">Spam</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Stats Table */}
                <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brand-main/10 bg-brand-main/5">
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Sent
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Inbox
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Spam
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Opens
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Replies
                          </th>
                          <th className="px-6 py-4 text-left text-text-100 font-semibold">
                            Inbox Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((stat) => (
                          <tr
                            key={stat.id}
                            className="border-b border-brand-main/10 hover:bg-brand-main/5 transition"
                          >
                            <td className="px-6 py-4 text-text-100">
                              {new Date(stat.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-text-200">
                              {stat.sentCount}
                            </td>
                            <td className="px-6 py-4 text-text-200">
                              {stat.inboxCount}
                            </td>
                            <td className="px-6 py-4 text-text-200">
                              {stat.spamCount}
                            </td>
                            <td className="px-6 py-4 text-text-200">
                              {stat.openCount}
                            </td>
                            <td className="px-6 py-4 text-text-200">
                              {stat.replyCount}
                            </td>
                            <td className="px-6 py-4 text-text-200">
                              {stat.inboxRate.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  ) : (
    <>
      <main className="flex h-screen w-full items-center justify-center  text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-lg px-6"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Coming Soon 🚀
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            We&apos;re working hard to launch something amazing. Stay tuned!
          </p>
        </motion.div>
      </main>
    </>
  );
}
