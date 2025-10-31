"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import apiClient from "@/utils/api/apiClient";
import { IconLoader } from "@tabler/icons-react";

interface UsageStats {
  emailsSentToday: number;
  emailsSentThisMonth: number;
  dailyCap: number;
  monthlyCap: number;
  bounceRate: number;
  complaintRate: number;
  openRate: number;
  clickRate: number;
}

interface ChartData {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

const UsageSection = () => {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, chartsRes] = await Promise.all([
        apiClient.get("/settings/usage"),
        apiClient.get("/settings/usage/charts"),
      ]);
      const stats =
        statsRes.data?.payload?.data ?? statsRes.data?.data ?? statsRes.data;
      const charts =
        chartsRes.data?.payload?.data ?? chartsRes.data?.data ?? chartsRes.data;
      setUsageStats(stats);
      setChartData(charts || []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch usage data");
    } finally {
      setIsLoading(false);
    }
  };

  const getDailyUsagePercentage = () => {
    if (!usageStats) return 0;
    return Math.min(
      (usageStats.emailsSentToday / usageStats.dailyCap) * 100,
      100
    );
  };

  const getMonthlyUsagePercentage = () => {
    if (!usageStats) return 0;
    return Math.min(
      (usageStats.emailsSentThisMonth / usageStats.monthlyCap) * 100,
      100
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <IconLoader className="w-6 h-6 animate-spin mx-auto text-brand-main" />
      </div>
    );
  }

  if (!usageStats) {
    return (
      <div className="text-center py-12">
        <p className="text-text-200">Failed to load usage data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Usage Overview */}
      <div>
        <h2 className="text-2xl font-bold text-text-100 mb-6">
          Usage Overview
        </h2>

        {/* Daily Usage */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-text-100 font-medium">Daily Usage</p>
            <p className="text-text-200 text-sm">
              {usageStats.emailsSentToday} / {usageStats.dailyCap}
            </p>
          </div>
          <div className="w-full bg-bg-300 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-main to-brand-secondary h-full transition-all duration-300"
              style={{ width: `${getDailyUsagePercentage()}%` }}
            />
          </div>
          <p className="text-text-200 text-xs mt-2">
            {getDailyUsagePercentage().toFixed(1)}% of daily limit used
          </p>
        </div>

        {/* Monthly Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-text-100 font-medium">Monthly Usage</p>
            <p className="text-text-200 text-sm">
              {usageStats.emailsSentThisMonth} / {usageStats.monthlyCap}
            </p>
          </div>
          <div className="w-full bg-bg-300 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-main to-brand-secondary h-full transition-all duration-300"
              style={{ width: `${getMonthlyUsagePercentage()}%` }}
            />
          </div>
          <p className="text-text-200 text-xs mt-2">
            {getMonthlyUsagePercentage().toFixed(1)}% of monthly limit used
          </p>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="border-t border-brand-main/20 pt-8">
        <h2 className="text-2xl font-bold text-text-100 mb-6">
          Engagement Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-brand-main/10 p-5 bg-bg-300/40 shadow-sm hover:shadow-md transition">
            <p className="text-text-200 text-xs mb-2">Open Rate</p>
            <p className="text-2xl font-bold text-brand-main">
              {usageStats.openRate.toFixed(2)}%
            </p>
          </div>

          <div className="rounded-xl border border-brand-main/10 p-5 bg-bg-300/40 shadow-sm hover:shadow-md transition">
            <p className="text-text-200 text-xs mb-2">Click Rate</p>
            <p className="text-2xl font-bold text-brand-main">
              {usageStats.clickRate.toFixed(2)}%
            </p>
          </div>

          <div className="rounded-xl border border-brand-main/10 p-5 bg-bg-300/40 shadow-sm hover:shadow-md transition">
            <p className="text-text-200 text-xs mb-2">Bounce Rate</p>
            <p className="text-2xl font-bold text-red-400">
              {usageStats.bounceRate.toFixed(2)}%
            </p>
          </div>

          <div className="rounded-xl border border-brand-main/10 p-5 bg-bg-300/40 shadow-sm hover:shadow-md transition">
            <p className="text-text-200 text-xs mb-2">Complaint Rate</p>
            <p className="text-2xl font-bold text-red-400">
              {usageStats.complaintRate.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Trend */}
      {chartData.length > 0 && (
        <div className="border-t border-brand-main/20 pt-8">
          <h2 className="text-2xl font-bold text-text-100 mb-6">7-Day Trend</h2>

          <div className="overflow-x-auto rounded-xl border border-brand-main/10 bg-bg-300/30">
            <table className="w-full text-sm">
              <thead className="bg-bg-300/60">
                <tr className="border-b border-brand-main/20">
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Sent
                  </th>
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Opened
                  </th>
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Clicked
                  </th>
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Bounced
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-brand-main/10 hover:bg-bg-300/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-text-100">{row.date}</td>
                    <td className="py-3 px-4 text-text-100">{row.sent}</td>
                    <td className="py-3 px-4 text-text-100">{row.opened}</td>
                    <td className="py-3 px-4 text-text-100">{row.clicked}</td>
                    <td className="py-3 px-4 text-text-100">{row.bounced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageSection;
