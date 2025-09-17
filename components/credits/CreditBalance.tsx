"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import apiClient from "../../utils/api/apiClient";

interface CreditBalance {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  totalUsed: number;
  lastUpdate: string | null;
}

interface CreditPricing {
  normalScrapingCredits: number;
  aiScrapingCredits: number;
  creditValue: number;
  freeCreditsPerMonth: number;
  currency: string;
  description: {
    normalScraping: string;
    aiScraping: string;
    creditValue: string;
    freeCredits: string;
  };
}

interface CreditBalanceProps {
  onRefresh?: () => void;
  showPurchaseButton?: boolean;
  onPurchaseClick?: () => void;
  variant?: "light" | "glass";
}

const CreditBalance: React.FC<CreditBalanceProps> = ({
  onRefresh,
  showPurchaseButton = true,
  onPurchaseClick,
  variant = "light",
}) => {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [pricing, setPricing] = useState<CreditPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isGlass = variant === "glass";
  const containerClass = isGlass
    ? "backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
    : "bg-white rounded-lg shadow-lg p-6";

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    try {
      setLoading(true);

      // Fetch balance and pricing in parallel
      const [balanceResponse, pricingResponse] = await Promise.all([
        apiClient.get("/credits/balance"),
        apiClient.get("/credits/pricing"),
      ]);

      const balancePayload = balanceResponse.data?.payload;
      if (balancePayload?.success) {
        setBalance(balancePayload.data as CreditBalance);
      } else if (balanceResponse.data?.success && balanceResponse.data?.data) {
        setBalance(balanceResponse.data.data as CreditBalance);
      }

      const pricingPayload =
        pricingResponse.data?.payload ?? pricingResponse.data;
      if (pricingPayload?.success && pricingPayload?.data) {
        setPricing(pricingPayload.data as CreditPricing);
      } else if (pricingResponse.data?.success && pricingResponse.data?.data) {
        setPricing(pricingResponse.data.data as CreditPricing);
      }
    } catch (error: any) {
      console.error("Error fetching credit data:", error);

      // Handle email verification required error
      if (
        error.response?.status === 403 &&
        error.response?.data?.code === "EMAIL_NOT_VERIFIED"
      ) {
        // Don't show error toast for email verification - let the banner handle it
        return;
      }

      toast.error("Failed to load credit information");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCreditData();
    setRefreshing(false);
    onRefresh?.();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBalanceColor = (balance: number) => {
    if (balance >= 50) return "text-green-600";
    if (balance >= 20) return "text-yellow-600";
    return "text-red-600";
  };

  const getBalanceStatus = (balance: number) => {
    if (balance >= 50) return "Healthy";
    if (balance >= 20) return "Low";
    return "Critical";
  };

  if (loading) {
    return (
      <div className={containerClass}>
        <div className="animate-pulse">
          <div
            className={
              isGlass
                ? "h-6 bg-white/20 rounded w-1/3 mb-4"
                : "h-6 bg-gray-200 rounded w-1/3 mb-4"
            }
          ></div>
          <div className="space-y-3">
            <div
              className={
                isGlass
                  ? "h-4 bg-white/20 rounded w-1/2"
                  : "h-4 bg-gray-200 rounded w-1/2"
              }
            ></div>
            <div
              className={
                isGlass
                  ? "h-4 bg-white/20 rounded w-2/3"
                  : "h-4 bg-gray-200 rounded w-2/3"
              }
            ></div>
            <div
              className={
                isGlass
                  ? "h-4 bg-white/20 rounded w-1/4"
                  : "h-4 bg-gray-200 rounded w-1/4"
              }
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center mb-6">
        <h3
          className={
            isGlass
              ? "text-xl font-semibold text-white"
              : "text-xl font-semibold text-gray-900"
          }
        >
          Credit Balance
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={
            isGlass
              ? "p-2 text-gray-300 hover:text-white transition-colors"
              : "p-2 text-gray-500 hover:text-gray-700 transition-colors"
          }
          title="Refresh balance"
        >
          <svg
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {balance ? (
        <div className="space-y-4">
          {/* Current Balance */}
          <div
            className={
              isGlass
                ? "bg-white/5 border border-white/10 rounded-lg p-4"
                : "bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4"
            }
          >
            <div className="flex justify-between items-center">
              <div>
                <p
                  className={
                    isGlass ? "text-sm text-gray-300" : "text-sm text-gray-600"
                  }
                >
                  Current Balance
                </p>
                <p
                  className={`text-3xl font-bold ${getBalanceColor(
                    balance.currentBalance
                  )}`}
                >
                  {balance.currentBalance.toFixed(1)} Credits
                </p>
                <p
                  className={
                    isGlass ? "text-sm text-gray-300" : "text-sm text-gray-500"
                  }
                >
                  Status:{" "}
                  <span className={getBalanceColor(balance.currentBalance)}>
                    {getBalanceStatus(balance.currentBalance)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p
                  className={
                    isGlass ? "text-sm text-gray-300" : "text-sm text-gray-600"
                  }
                >
                  Value
                </p>
                <p
                  className={
                    isGlass
                      ? "text-lg font-semibold text-white"
                      : "text-lg font-semibold text-gray-900"
                  }
                >
                  $
                  {(
                    balance.currentBalance * (pricing?.creditValue || 0.05)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={
                isGlass
                  ? "bg-white/5 border border-white/10 rounded-lg p-4"
                  : "bg-gray-50 rounded-lg p-4"
              }
            >
              <p
                className={
                  isGlass ? "text-sm text-gray-300" : "text-sm text-gray-600"
                }
              >
                Total Earned
              </p>
              <p className="text-xl font-semibold text-green-600">
                {balance.totalEarned.toFixed(1)}
              </p>
            </div>
            <div
              className={
                isGlass
                  ? "bg-white/5 border border-white/10 rounded-lg p-4"
                  : "bg-gray-50 rounded-lg p-4"
              }
            >
              <p
                className={
                  isGlass ? "text-sm text-gray-300" : "text-sm text-gray-600"
                }
              >
                Total Used
              </p>
              <p className="text-xl font-semibold text-red-600">
                {balance.totalUsed.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Last Update */}
          <div
            className={
              isGlass ? "text-sm text-gray-300" : "text-sm text-gray-500"
            }
          >
            Last updated: {formatDate(balance.lastUpdate)}
          </div>

          {/* Pricing Information */}
          {pricing && (
            <div
              className={
                isGlass
                  ? "bg-white/5 border border-white/10 rounded-lg p-4"
                  : "bg-blue-50 rounded-lg p-4"
              }
            >
              <h4
                className={
                  isGlass
                    ? "font-medium text-white mb-2"
                    : "font-medium text-gray-900 mb-2"
                }
              >
                Credit Usage
              </h4>
              <div
                className={
                  isGlass
                    ? "space-y-1 text-sm text-gray-300"
                    : "space-y-1 text-sm text-gray-700"
                }
              >
                <p>
                  • Normal scraping: {pricing.normalScrapingCredits} credits per
                  request
                </p>
                <p>
                  • AI-enhanced scraping: {pricing.aiScrapingCredits} credits
                  per request
                </p>
                <p>• Credit value: ${pricing.creditValue} per credit</p>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          {showPurchaseButton && (
            <button
              onClick={onPurchaseClick}
              className={
                isGlass
                  ? "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                  : "w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              }
            >
              Purchase More Credits
            </button>
          )}

          {/* Low Balance Warning */}
          {balance.currentBalance < 20 && (
            <div
              className={
                isGlass
                  ? "bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4"
                  : "bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              }
            >
              <div className="flex items-center">
                <svg
                  className={
                    isGlass
                      ? "w-5 h-5 text-yellow-300 mr-2"
                      : "w-5 h-5 text-yellow-600 mr-2"
                  }
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <p
                    className={
                      isGlass
                        ? "text-sm font-medium text-yellow-200"
                        : "text-sm font-medium text-yellow-800"
                    }
                  >
                    Low Credit Balance
                  </p>
                  <p
                    className={
                      isGlass
                        ? "text-sm text-yellow-200/80"
                        : "text-sm text-yellow-700"
                    }
                  >
                    Consider purchasing more credits to continue using the
                    scraper API.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className={
              isGlass
                ? "text-white text-lg font-semibold"
                : "text-gray-700 text-lg font-semibold"
            }
          >
            0 Credits
          </div>
          {showPurchaseButton && (
            <button
              onClick={onPurchaseClick}
              className={
                isGlass
                  ? "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                  : "w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              }
            >
              Purchase Credits
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditBalance;
