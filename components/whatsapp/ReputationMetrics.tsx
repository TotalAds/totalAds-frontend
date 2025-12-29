"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconShield,
  IconTrendingUp,
} from "@tabler/icons-react";
import { getReputationMetrics, exportReputationMetrics } from "@/utils/api/whatsappClient";
import { Button } from "@/components/ui/button";

interface ReputationMetricsProps {
  phoneNumberId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export default function ReputationMetrics({
  phoneNumberId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: ReputationMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMetrics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchMetrics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getReputationMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Error fetching reputation metrics:", error);
      if (showLoading) {
        toast.error("Failed to fetch reputation metrics");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-brand-main/20 rounded w-1/3"></div>
          <div className="h-4 bg-brand-main/10 rounded w-full"></div>
          <div className="h-4 bg-brand-main/10 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const getQualityColor = (rating: string) => {
    switch (rating) {
      case "GREEN":
        return "text-green-400 bg-green-400/20";
      case "YELLOW":
        return "text-yellow-400 bg-yellow-400/20";
      case "RED":
        return "text-red-400 bg-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  const getWarmupStageColor = (stage: string) => {
    switch (stage) {
      case "NEW":
        return "text-blue-400 bg-blue-400/20";
      case "WARMING":
        return "text-yellow-400 bg-yellow-400/20";
      case "STABLE":
        return "text-green-400 bg-green-400/20";
      case "COOLED":
        return "text-gray-400 bg-gray-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      await exportReputationMetrics(format);
      toast.success(`Reputation metrics exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error("Failed to export reputation metrics");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-100">Reputation Metrics</h2>
          {lastUpdated && (
            <p className="text-xs text-text-200 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {autoRefresh && " (Auto-refreshing every 30s)"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchMetrics(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            Refresh
          </Button>
          <Button
            onClick={() => handleExport("csv")}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
          >
            <IconDownload className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <Button
            onClick={() => handleExport("json")}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
          >
            <IconDownload className="w-4 h-4 mr-1" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Warmup Stage */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-100">Warmup Status</h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getWarmupStageColor(
              metrics.warmup.stage
            )}`}
          >
            {metrics.warmup.stage}
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-200">Warmup Progress</span>
              <span className="text-text-100 font-medium">
                Day {metrics.warmup.day} / 30
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-brand-main h-2 rounded-full transition-all"
                style={{ width: `${metrics.warmup.progress}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-text-200 text-sm mb-1">Max Daily Send</p>
              <p className="text-2xl font-bold text-text-100">
                {metrics.warmup.maxDailySend}
              </p>
            </div>
            <div>
              <p className="text-text-200 text-sm mb-1">Next Milestone</p>
              <p className="text-lg font-semibold text-text-100">
                {metrics.warmup.nextMilestone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Rating */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-100">Quality Rating</h2>
          <div className="flex items-center gap-2">
            <IconShield className="w-5 h-5 text-brand-main" />
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getQualityColor(
                metrics.quality.rating
              )}`}
            >
              {metrics.quality.rating}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-200">Quality Score</span>
            <span className="text-text-100 font-semibold">
              {metrics.quality.score}/100
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-200">Ban Status</span>
            <span className="text-text-100 font-semibold">
              {metrics.quality.banStatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-200">Quality Guard</span>
            <span className="text-text-100 font-semibold">
              {metrics.quality.qualityGuardStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Message Limits */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-100 mb-4">Message Limits</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-text-200 text-sm mb-1">Last 24 Hours</p>
            <p className="text-2xl font-bold text-text-100">
              {metrics.messageLimits.last24Hours}
            </p>
          </div>
          <div>
            <p className="text-text-200 text-sm mb-1">Last 7 Days</p>
            <p className="text-2xl font-bold text-text-100">
              {metrics.messageLimits.last7Days}
            </p>
          </div>
          <div>
            <p className="text-text-200 text-sm mb-1">Last 30 Days</p>
            <p className="text-2xl font-bold text-text-100">
              {metrics.messageLimits.last30Days}
            </p>
          </div>
          <div>
            <p className="text-text-200 text-sm mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-text-100">
              {metrics.messageLimits.totalVolume.toLocaleString()}
            </p>
          </div>
        </div>
        {metrics.messageLimits.metaLimit && (
          <div className="mt-4 pt-4 border-t border-brand-main/20">
            <p className="text-text-200 text-sm mb-1">Meta API Limit</p>
            <p className="text-lg font-semibold text-text-100">
              {metrics.messageLimits.metaLimit.toLocaleString()} messages
            </p>
          </div>
        )}
      </div>

      {/* Quality Metrics */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-100 mb-4">Quality Metrics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-text-200 text-sm mb-1">Delivery Rate</p>
            <p className="text-xl font-bold text-green-400">
              {metrics.metrics.deliveryRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-text-200 text-sm mb-1">Read Rate</p>
            <p className="text-xl font-bold text-blue-400">
              {metrics.metrics.readRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-text-200 text-sm mb-1">Reply Rate</p>
            <p className="text-xl font-bold text-purple-400">
              {metrics.metrics.replyRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-text-200 text-sm mb-1">Block Rate</p>
            <p className="text-xl font-bold text-red-400">
              {metrics.metrics.blockRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-text-200 text-sm mb-1">Spam Rate</p>
            <p className="text-xl font-bold text-orange-400">
              {metrics.metrics.spamRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-text-200 text-sm mb-1">Opt-Out Rate</p>
            <p className="text-xl font-bold text-gray-400">
              {metrics.metrics.optOutRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

