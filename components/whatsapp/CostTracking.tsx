"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getCostTracking } from "@/utils/api/whatsappClient";
import {
  IconChartBar,
  IconCurrencyDollar,
  IconTrendingUp,
} from "@tabler/icons-react";

import { Button } from "../ui/button";

interface CostTrackingProps {
  phoneNumberId?: string;
  range?: 7 | 30;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export default function CostTracking({
  phoneNumberId,
  range = 30,
  autoRefresh = true,
  refreshInterval = 60000, // 60 seconds
}: CostTrackingProps) {
  const [loading, setLoading] = useState(true);
  const [costData, setCostData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchCostData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchCostData(false);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [range, autoRefresh, refreshInterval]);

  const fetchCostData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - range);
      const data = await getCostTracking(startDate, endDate);
      setCostData(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Error fetching cost tracking:", error);
      if (showLoading) {
        toast.error("Failed to fetch cost tracking data");
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
        </div>
      </div>
    );
  }

  if (!costData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-100">Cost Tracking</h2>
          {lastUpdated && (
            <p className="text-xs text-text-200 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {autoRefresh && " (Auto-refreshing every 60s)"}
            </p>
          )}
        </div>
        <Button
          onClick={() => fetchCostData(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
        >
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <IconCurrencyDollar className="w-6 h-6 text-green-400" />
            </div>
            <IconTrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-text-200 text-sm font-medium mb-1">
            Total Spent
          </h3>
          <p className="text-3xl font-bold text-text-100">
            {costData.summary.currency} {costData.summary.totalSpent.toFixed(2)}
          </p>
          <p className="text-xs text-text-200 mt-1">
            {costData.summary.totalMessages.toLocaleString()} messages
          </p>
        </div>

        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <IconChartBar className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h3 className="text-text-200 text-sm font-medium mb-1">
            Avg Cost/Message
          </h3>
          <p className="text-3xl font-bold text-text-100">
            {costData.summary.currency}{" "}
            {costData.summary.avgCostPerMessage.toFixed(4)}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <IconTrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-text-200 text-sm font-medium mb-1">
            Total Messages
          </h3>
          <p className="text-3xl font-bold text-text-100">
            {costData.summary.totalMessages.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Daily Spending Trend Chart */}
      {costData.trends.dailySpending.length > 0 && (
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-text-100 mb-4">
            Daily Spending Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costData.trends.dailySpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF" }}
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF" }}
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F3F4F6" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={2}
                name={`Spending (${costData.summary.currency})`}
                dot={{ fill: "#3B82F6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdown */}
      <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-100 mb-4">Cost Breakdown</h2>

        {/* Breakdown Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* By Category Chart */}
          {Object.keys(costData.breakdown.byCategory).length > 0 && (
            <div>
              <h3 className="text-text-200 text-sm font-medium mb-3">
                By Category
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={Object.entries(costData.breakdown.byCategory).map(
                    ([name, value]) => ({
                      name: name.charAt(0) + name.slice(1).toLowerCase(),
                      value: parseFloat(String(value)),
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [
                      `${costData.summary.currency} ${parseFloat(value).toFixed(
                        2
                      )}`,
                      "Cost",
                    ]}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Conversation Type Chart */}
          {Object.keys(costData.breakdown.byConversationType).length > 0 && (
            <div>
              <h3 className="text-text-200 text-sm font-medium mb-3">
                By Conversation Type
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={Object.entries(
                    costData.breakdown.byConversationType
                  ).map(([name, value]) => ({
                    name: name
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                    value: parseFloat(String(value)),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [
                      `${costData.summary.currency} ${parseFloat(value).toFixed(
                        2
                      )}`,
                      "Cost",
                    ]}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* By Category */}
          <div>
            <h3 className="text-text-200 text-sm font-medium mb-3">
              By Category
            </h3>
            <div className="space-y-2">
              {Object.entries(costData.breakdown.byCategory).map(
                ([category, cost]: [string, any]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-text-200 text-sm capitalize">
                      {category}
                    </span>
                    <span className="text-text-100 font-semibold">
                      {costData.summary.currency} {cost.toFixed(2)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* By Conversation Type */}
          <div>
            <h3 className="text-text-200 text-sm font-medium mb-3">By Type</h3>
            <div className="space-y-2">
              {Object.entries(costData.breakdown.byConversationType).map(
                ([type, cost]: [string, any]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-text-200 text-sm capitalize">
                      {type.replace("_", " ")}
                    </span>
                    <span className="text-text-100 font-semibold">
                      {costData.summary.currency} {cost.toFixed(2)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* By Pricing Tier */}
          <div>
            <h3 className="text-text-200 text-sm font-medium mb-3">
              By Pricing Tier
            </h3>
            <div className="space-y-2">
              {Object.entries(costData.breakdown.byPricingTier).map(
                ([tier, cost]: [string, any]) => (
                  <div key={tier} className="flex justify-between">
                    <span className="text-text-200 text-sm">{tier}</span>
                    <span className="text-text-100 font-semibold">
                      {costData.summary.currency} {cost.toFixed(2)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Campaigns */}
      {costData.topCampaigns.length > 0 && (
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-text-100 mb-4">
            Top Campaigns by Cost
          </h2>
          <div className="space-y-2">
            {costData.topCampaigns.map((campaign: any, index: number) => (
              <div
                key={campaign.campaignId}
                className="flex justify-between items-center p-3 bg-brand-main/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-text-200 text-sm font-medium">
                    #{index + 1}
                  </span>
                  <span className="text-text-100 font-medium">
                    {campaign.campaignName}
                  </span>
                </div>
                <span className="text-text-100 font-semibold">
                  {costData.summary.currency} {campaign.cost.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
