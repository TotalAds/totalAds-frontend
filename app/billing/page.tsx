"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  createPaymentIntent,
  getBillingInfo,
  getCreditPackages,
} from "@/utils/api/billingClient";
import { getUsageStats } from "@/utils/api/usageClient";
import {
  IconCalendar,
  IconCheck,
  IconCreditCard,
  IconDownload,
  IconRocket,
  IconShield,
  IconTrendingUp,
  IconX,
} from "@tabler/icons-react";

interface BillingData {
  totalCalls: number;
  freeCalls: number;
  billableCalls: number;
  rate: number;
  totalAmount: number;
  month: string;
}

interface UsageData {
  daily: any[];
  monthly: number;
}

export default function Billing() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading, user } = state;
  const router = useRouter();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);

        // Fetch billing data
        const billingResult = await getBillingInfo();

        // Fetch usage data
        const usageResult = await getUsageStats("monthly");

        setBillingData({
          totalCalls: usageResult.stats?.totalRequests || 0,
          freeCalls: Math.min(10, usageResult.stats?.totalRequests || 0),
          billableCalls: Math.max(
            0,
            (usageResult.stats?.totalRequests || 0) - 10
          ),
          rate: 0.01, // Default rate
          totalAmount: billingResult.totalSpent || 0,
          month: new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        });

        setUsageData({
          daily: usageResult.daily || [],
          monthly: usageResult.stats?.totalRequests || 0,
        });
      } catch (error) {
        console.error("Error fetching billing data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [isAuthenticated, selectedMonth]);

  const currentPlan = usageData && usageData.monthly > 10 ? "pro" : "free";

  const handleUpgradeToPro = async () => {
    setPaymentLoading(true);
    setMessage(null);

    try {
      // For now, just show a message about contacting support
      // In a real implementation, you would integrate with Stripe
      setMessage({
        type: "success",
        text: "Pro tier upgrade coming soon! Contact support for early access.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to upgrade to pro tier. Please try again.",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!billingData || billingData.totalAmount <= 0) return;

    setPaymentLoading(true);
    setMessage(null);

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent(
        "default-package", // You may need to adjust this based on your package system
        Math.round(billingData.totalAmount * 100) // Convert to cents
      );

      if (paymentIntent) {
        // In a real implementation, you would redirect to Stripe Checkout
        // or use Stripe Elements for payment
        setMessage({
          type: "success",
          text: "Payment processing initiated. You will be redirected to complete payment.",
        });
      } else {
        throw new Error("Failed to create payment intent");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to process payment. Please try again.",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Billing & Usage
          </h1>
          <p className="text-gray-300 text-lg">
            Monitor your API usage and manage your billing information.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              message.type === "success"
                ? "bg-green-500/20 border-green-500/30 text-green-200"
                : "bg-red-500/20 border-red-500/30 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Month Selector */}
        <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IconCalendar className="w-6 h-6 text-white mr-3" />
                <h3 className="text-xl font-semibold text-white">
                  Select Month
                </h3>
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Plan */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
                {currentPlan === "free" ? (
                  <IconShield className="w-6 h-6 text-white" />
                ) : (
                  <IconRocket className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {currentPlan === "free" ? "Free Tier" : "Pro Tier"}
                </h2>
                <p className="text-gray-300">
                  {currentPlan === "free"
                    ? "10 free API calls per month"
                    : "Pay per call after free tier"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Monthly Limit</span>
                <span className="text-white font-semibold">
                  {currentPlan === "free" ? "10 calls" : "Unlimited"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Rate per call</span>
                <span className="text-white font-semibold">
                  {currentPlan === "free" ? "Free" : "$0.05"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Billing</span>
                <span className="text-white font-semibold">
                  {currentPlan === "free" ? "No charges" : "Pay as you go"}
                </span>
              </div>
            </div>

            {currentPlan === "free" && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                <h4 className="text-white font-semibold mb-2">
                  Upgrade to Pro
                </h4>
                <p className="text-gray-300 text-sm mb-3">
                  Get unlimited API calls with pay-per-use pricing.
                </p>
                <button
                  onClick={() => handleUpgradeToPro()}
                  className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-200"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>

          {/* Usage Statistics */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4">
                <IconTrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Usage Statistics
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Total API Calls</span>
                  <span className="text-white font-semibold text-2xl">
                    {usageData?.monthly || 0}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        ((usageData?.monthly || 0) / 10) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>0</span>
                  <span>10 (Free limit)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center mb-2">
                    <IconCheck className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-gray-300 text-sm">Free Calls</span>
                  </div>
                  <span className="text-white font-semibold text-xl">
                    {Math.min(10, usageData?.monthly || 0)}
                  </span>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center mb-2">
                    <IconCreditCard className="w-5 h-5 text-orange-400 mr-2" />
                    <span className="text-gray-300 text-sm">Billable</span>
                  </div>
                  <span className="text-white font-semibold text-xl">
                    {Math.max(0, (usageData?.monthly || 0) - 10)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Summary */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4">
                <IconCreditCard className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Billing Summary
              </h2>
            </div>
            <button className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20">
              <IconDownload className="w-4 h-4 mr-2 text-white" />
              <span className="text-white">Download Invoice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-1">Total Calls</p>
              <p className="text-white font-semibold text-2xl">
                {billingData?.totalCalls || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-1">Free Calls</p>
              <p className="text-green-400 font-semibold text-2xl">
                {billingData?.freeCalls || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-1">Billable Calls</p>
              <p className="text-orange-400 font-semibold text-2xl">
                {billingData?.billableCalls || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-1">Total Amount</p>
              <p className="text-white font-semibold text-2xl">
                ${billingData?.totalAmount?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          {billingData && billingData.totalAmount > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold">Payment Required</h4>
                  <p className="text-gray-300 text-sm">
                    You have outstanding charges for this month.
                  </p>
                </div>
                <button
                  onClick={handlePayNow}
                  disabled={paymentLoading}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200"
                >
                  {paymentLoading ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Usage Summary */}
        {usageData && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Monthly Usage Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20">
                <div>
                  <p className="text-white font-medium">Total API Calls</p>
                  <p className="text-gray-300 text-sm">This Month</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {usageData.monthly}
                  </p>
                  <p className="text-gray-300 text-sm">calls</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
