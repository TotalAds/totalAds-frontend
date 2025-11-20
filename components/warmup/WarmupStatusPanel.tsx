"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getWarmupStatus, WarmupStatusResponse } from "@/utils/api/warmupClient";

interface Props {
  accountId: string;
}

export default function WarmupStatusPanel({ accountId }: Props) {
  const [status, setStatus] = useState<WarmupStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getWarmupStatus(accountId);
      setStatus(data);
    } catch (e: any) {
      console.error("Failed to load warmup status", e);
      toast.error("Failed to load warmup status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  if (loading && !status) {
    return (
      <div className="text-center py-12">
        <p className="text-text-200">Loading status...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-center py-12">
        <p className="text-text-200">No status available</p>
      </div>
    );
  }

  const { account, health, today, tomorrow } = status;

  return (
    <div className="space-y-6">
      {/* Account summary */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-text-100">{account.email}</h3>
            <p className="text-text-200 text-sm">
              Timezone: {account.timezone || "UTC"}
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-text-200 text-xs">Spam rate</p>
              <p className="text-red-400 text-lg font-semibold">{account.spamRate?.toFixed?.(1) ?? account.spamRate}%</p>
            </div>
            <div>
              <p className="text-text-200 text-xs">Reputation</p>
              <p className="text-green-400 text-lg font-semibold">{account.reputationScore}</p>
            </div>
            <div>
              <p className="text-text-200 text-xs">Warmup</p>
              <p className={`text-lg font-semibold ${account.warmupEnabled ? "text-green-400" : "text-gray-400"}`}>
                {account.warmupEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today/Tomorrow cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
          <p className="text-text-200 text-xs mb-1">Tomorrow TDWS</p>
          <p className="text-2xl font-bold text-text-100">{tomorrow.tdws}</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
          <p className="text-text-200 text-xs mb-1">Expected Replies (tomorrow)</p>
          <p className="text-2xl font-bold text-text-100">{tomorrow.expectedReplies}</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
          <p className="text-text-200 text-xs mb-1">New Initials Budget</p>
          <p className="text-2xl font-bold text-text-100">{tomorrow.newInitialsBudget}</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
          <p className="text-text-200 text-xs mb-1">Headroom</p>
          <p className="text-2xl font-bold text-text-100">{Math.round((tomorrow.headroomPct || 0) * 100)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
          <p className="text-text-200 text-xs mb-1">Today Planned Initials</p>
          <p className="text-2xl font-bold text-text-100">{today.plannedInitials}</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
          <p className="text-text-200 text-xs mb-1">Today Sent Initials</p>
          <p className="text-2xl font-bold text-text-100">{today.sentInitials}</p>
        </div>
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
          <p className="text-text-200 text-xs mb-1">Remaining Initials</p>
          <p className="text-2xl font-bold text-text-100">{today.remainingInitials}</p>
        </div>
      </div>

      {/* Health gates */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-text-100 mb-2">Health gates</h4>
        <div className="flex flex-wrap gap-4">
          <span className={`px-3 py-1 rounded-lg text-sm ${health.clampedByHealth ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
            {health.clampedByHealth ? "Clamped by health" : "Healthy"}
          </span>
          <span className={`px-3 py-1 rounded-lg text-sm ${health.paused ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-300"}`}>
            {health.paused ? "Paused" : "Active"}
          </span>
        </div>
      </div>
    </div>
  );
}

