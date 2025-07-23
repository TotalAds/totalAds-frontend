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

import CreditBalance from "../../components/credits/CreditBalance";
import RazorpayPayment from "../../components/payment/RazorpayPayment";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [creditRefreshKey, setCreditRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    fetchBillingData();
  }, [isAuthenticated, selectedMonth]);

  const currentPlan = usageData && usageData.monthly > 10 ? "pro" : "free";

  const handleUpgradeToPro = async () => {
    // Open the credit purchase modal to allow users to buy credits
    // This effectively "upgrades" them to pro tier by giving them credits to use
    setShowPaymentModal(true);
    setMessage({
      type: "success",
      text: "Purchase credits to unlock unlimited API calls! Each credit allows you to make API requests beyond the free tier.",
    });
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

  const handlePaymentSuccess = (creditBalance: any) => {
    setShowPaymentModal(false);
    setCreditRefreshKey((prev) => prev + 1);
    setMessage({
      type: "success",
      text: `Payment successful! Your credit balance has been updated.`,
    });
    // Refresh billing data
    fetchBillingData();
  };

  const handlePaymentError = (error: string) => {
    setMessage({
      type: "error",
      text: error || "Payment failed. Please try again.",
    });
  };

  const handlePurchaseCredits = () => {
    setShowPaymentModal(true);
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
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                  <IconCalendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Select Month
                  </h3>
                  <p className="text-gray-300 text-sm">
                    View usage for specific month
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Balance Section */}
        <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 group">
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <IconCreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Credit Balance
                  </h2>
                  <p className="text-gray-300 text-sm">
                    Manage your API credits and usage
                  </p>
                </div>
              </div>
            </div>
            <CreditBalance
              key={creditRefreshKey}
              onPurchaseClick={handlePurchaseCredits}
              onRefresh={() => setCreditRefreshKey((prev) => prev + 1)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Plan */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 group">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                {currentPlan === "free" ? (
                  <IconShield className="w-6 h-6 text-white" />
                ) : (
                  <IconRocket className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {currentPlan === "free" ? "Free Tier" : "Credit-Based Plan"}
                </h2>
                <p className="text-gray-300">
                  {currentPlan === "free"
                    ? "10 free credits per month"
                    : "Using purchased credits"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-300 flex items-center">
                  <IconCheck className="w-4 h-4 mr-2 text-green-400" />
                  Monthly Limit
                </span>
                <span className="text-white font-semibold">
                  {currentPlan === "free" ? "10 credits" : "Based on balance"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-300 flex items-center">
                  <IconCreditCard className="w-4 h-4 mr-2 text-blue-400" />
                  Rate per credit
                </span>
                <span className="text-white font-semibold">
                  {currentPlan === "free" ? "Free" : "₹0.05"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-300 flex items-center">
                  <IconTrendingUp className="w-4 h-4 mr-2 text-purple-400" />
                  Billing
                </span>
                <span className="text-white font-semibold">
                  {currentPlan === "free" ? "No charges" : "Credit-based"}
                </span>
              </div>
            </div>

            {currentPlan === "free" && (
              <div className="mt-6 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-center mb-3">
                  <IconRocket className="w-5 h-5 text-purple-400 mr-2" />
                  <h4 className="text-white font-semibold">
                    Need More Credits?
                  </h4>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Purchase credits to continue using the API beyond your free
                  tier. Pay only for what you use.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <IconCheck className="w-4 h-4 text-green-400 mr-2" />
                    <span>No monthly subscription</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <IconCheck className="w-4 h-4 text-green-400 mr-2" />
                    <span>Pay per credit used</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <IconCheck className="w-4 h-4 text-green-400 mr-2" />
                    <span>Credits never expire</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUpgradeToPro()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Purchase Credits
                </button>
              </div>
            )}
          </div>

          {/* Usage Statistics */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 group">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                <IconTrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Usage Statistics
                </h2>
                <p className="text-gray-300 text-sm">
                  Track your API consumption
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 flex items-center">
                    <IconTrendingUp className="w-4 h-4 mr-2 text-blue-400" />
                    Total API Calls
                  </span>
                  <span className="text-white font-semibold text-2xl">
                    {usageData?.monthly || 0}
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-500 ease-out relative"
                      style={{
                        width: `${Math.min(
                          ((usageData?.monthly || 0) / 10) * 100,
                          100
                        )}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>0</span>
                    <span className="text-center">
                      {Math.round(((usageData?.monthly || 0) / 10) * 100)}% used
                    </span>
                    <span>10 (Free limit)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 hover:border-green-400/30 transition-all duration-300 group">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                      <IconCheck className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm font-medium">
                      Free Credits
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-white font-bold text-2xl">
                      {Math.min(10, usageData?.monthly || 0)}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">/10</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/20 hover:border-orange-400/30 transition-all duration-300 group">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                      <IconCreditCard className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-gray-300 text-sm font-medium">
                      Billable
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-white font-bold text-2xl">
                      {Math.max(0, (usageData?.monthly || 0) - 10)}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">credits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Summary */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 mb-8 group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                <IconCreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Billing Summary
                </h2>
                <p className="text-gray-300 text-sm">Monthly usage breakdown</p>
              </div>
            </div>
            <button className="flex items-center px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 group">
              <IconDownload className="w-4 h-4 mr-2 text-white group-hover:scale-110 transition-transform duration-200" />
              <span className="text-white font-medium">Download Invoice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-center mb-2">
                <IconTrendingUp className="w-5 h-5 text-blue-400 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-gray-300 text-sm font-medium">Total Calls</p>
              </div>
              <p className="text-white font-bold text-3xl">
                {billingData?.totalCalls || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-center mb-2">
                <IconCheck className="w-5 h-5 text-green-400 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-gray-300 text-sm font-medium">Free Calls</p>
              </div>
              <p className="text-green-400 font-bold text-3xl">
                {billingData?.freeCalls || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-center mb-2">
                <IconCreditCard className="w-5 h-5 text-orange-400 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-gray-300 text-sm font-medium">
                  Billable Calls
                </p>
              </div>
              <p className="text-orange-400 font-bold text-3xl">
                {billingData?.billableCalls || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-center mb-2">
                <IconCreditCard className="w-5 h-5 text-purple-400 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-gray-300 text-sm font-medium">
                  Total Amount
                </p>
              </div>
              <p className="text-white font-bold text-3xl">
                ₹{billingData?.totalAmount?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          {billingData && billingData.totalAmount > 0 && (
            <div className="mt-6 p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mr-4">
                    <IconCreditCard className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">
                      Payment Required
                    </h4>
                    <p className="text-gray-300 text-sm">
                      You have outstanding charges for this month.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePayNow}
                  disabled={paymentLoading}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {paymentLoading ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Usage Summary */}
        {usageData && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 group">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                <IconTrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Monthly Usage Summary
                </h2>
                <p className="text-gray-300 text-sm">
                  Detailed breakdown of your API usage
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300 group">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <IconTrendingUp className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">
                      Total API Calls
                    </p>
                    <p className="text-gray-300 text-sm">
                      This Month (
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                      )
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-3xl">
                    {usageData.monthly}
                  </p>
                  <p className="text-gray-300 text-sm">calls</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Purchase Credits
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <IconX className="w-6 h-6" />
                </button>
              </div>
              <RazorpayPayment
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
