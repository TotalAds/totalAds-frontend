"use client";

import { format, formatDistanceToNow } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import {
  ApiToken,
  tokenService,
  TokenUsageStats,
} from "@/utils/api/tokenService";

interface TokenDetailsModalProps {
  token: ApiToken;
  onClose: () => void;
}

export default function TokenDetailsModal({
  token,
  onClose,
}: TokenDetailsModalProps) {
  const [usageStats, setUsageStats] = useState<TokenUsageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (err) {
      return "Invalid date";
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return "Invalid date";
    }
  };

  // Function to fetch token usage statistics
  const fetchUsageStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await tokenService.getTokenUsage(token.id);
      setUsageStats(stats);
      setError(null);
    } catch (err) {
      console.error("Error fetching token usage stats:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch token usage statistics"
      );
      setUsageStats(null);
    } finally {
      setLoading(false);
    }
  }, [token.id]);

  // Fetch token usage stats on component mount
  useEffect(() => {
    fetchUsageStats();
  }, [fetchUsageStats]);

  return (
    <Dialog open={!!token} onOpenChange={onClose}>
      <div className="bg-white p-6 rounded-lg max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">
          Token Details: {token.name}
        </h2>

        <div className="bg-gray-50 p-4 rounded mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Token ID</p>
              <p className="font-medium">{token.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Token Preview</p>
              <p className="font-medium">••••••••••••</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{formatDate(token.createdAt)}</p>
              <p className="text-xs text-gray-500">
                {formatRelativeTime(token.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Used</p>
              <p className="font-medium">
                {formatDate(token.lastUsed || undefined)}
              </p>
              {token.lastUsed && (
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(token.lastUsed)}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Expires</p>
              <p className="font-medium">
                {token.expiresAt ? formatDate(token.expiresAt) : "Never"}
              </p>
              {token.expiresAt && (
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(token.expiresAt)}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">Active</p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-medium mb-2">Usage Statistics</h3>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading usage statistics...</div>
        ) : usageStats ? (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded border p-4">
              <h4 className="font-medium mb-3">Daily Usage (Last 7 Days)</h4>
              {usageStats.dailyUsage && usageStats.dailyUsage.length > 0 ? (
                <div className="h-40">
                  <div className="flex h-full items-end">
                    {usageStats.dailyUsage.map((day, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className="bg-blue-500 w-full mx-1"
                          style={{
                            height: `${Math.max(
                              5,
                              (day.count /
                                Math.max(
                                  ...usageStats.dailyUsage.map((d) => d.count),
                                  1
                                )) *
                                100
                            )}%`,
                          }}
                        ></div>
                        <div className="text-xs mt-1 text-gray-600 w-full text-center overflow-hidden text-ellipsis">
                          {format(new Date(day.date), "MMM d")}
                        </div>
                        <div className="text-xs font-medium">{day.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No daily usage data available
                </div>
              )}
            </div>

            <div className="bg-white shadow-sm rounded border p-4">
              <h4 className="font-medium mb-3">Monthly Usage</h4>
              {usageStats.monthlyUsage && usageStats.monthlyUsage.length > 0 ? (
                <div className="h-40">
                  <div className="flex h-full items-end">
                    {usageStats.monthlyUsage.map((month, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className="bg-green-500 w-full mx-1"
                          style={{
                            height: `${Math.max(
                              5,
                              (month.count /
                                Math.max(
                                  ...usageStats.monthlyUsage.map(
                                    (m) => m.count
                                  ),
                                  1
                                )) *
                                100
                            )}%`,
                          }}
                        ></div>
                        <div className="text-xs mt-1 text-gray-600 w-full text-center overflow-hidden text-ellipsis">
                          {month.month}
                        </div>
                        <div className="text-xs font-medium">{month.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No monthly usage data available
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No usage statistics available for this token
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
