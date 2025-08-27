"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";
import { createPaymentIntent, getBillingInfo } from "@/utils/api/billingClient";
import { getUsageStats } from "@/utils/api/usageClient";

import {
  CreditBalanceSection,
  CurrentPlanCard,
  PaymentModal,
  UsageStatsCard,
} from "./_components";

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
  creditsRemaining?: number | null;
}

export default function Billing() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [creditRefreshKey, setCreditRefreshKey] = useState(0);
  const [serverPlan, setServerPlan] = useState<"free" | "starter" | "pro">(
    "free"
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchBillingData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);

      // Fetch billing, usage and credit balance in parallel
      const [billingResult, usageResult, balanceResponse] = await Promise.all([
        getBillingInfo(),
        getUsageStats("monthly"),
        apiClient.get("/credits/balance"),
      ]);

      // billingResult may be { success, data } shape; normalize
      const billing = (billingResult as any)?.data || billingResult;
      setBillingData({
        totalCalls: usageResult.stats?.totalRequests || 0,
        freeCalls: Math.min(20, usageResult.stats?.totalRequests || 0),
        billableCalls: Math.max(
          0,
          (usageResult.stats?.totalRequests || 0) - 20
        ),
        rate: 0.01, // Default rate
        totalAmount: billing?.totalSpent || 0,
        month: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });

      setUsageData({
        daily: usageResult.daily || [],
        monthly: usageResult.stats?.totalRequests || 0,
        creditsRemaining: usageResult.stats?.creditsRemaining ?? null,
      });

      // Normalize credits balance from payload across shapes; coerce to number
      const extractNumber = (v: any): number | null => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      const bData = balanceResponse?.data ?? {};
      const p = bData?.payload ?? {};
      const candidates = [
        p?.data?.currentBalance,
        p?.currentBalance,
        bData?.data?.currentBalance,
        bData?.currentBalance,
      ];
      const found = candidates.map(extractNumber).find((n) => n !== null);
      if (found !== undefined && found !== null) {
        setCreditsBalance(found);
      }

      if (billing?.subscriptionStatus) {
        const s = String(billing.subscriptionStatus).toLowerCase();
        setServerPlan(
          s === "pro" ? "pro" : s === "starter" ? "starter" : "free"
        );
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBillingData();
  }, [isAuthenticated, fetchBillingData]);

  const currentPlan = serverPlan;

  // Prefer balance API (used by CreditBalance) and fallback to usage stats
  const creditsRemaining =
    creditsBalance ?? usageData?.creditsRemaining ?? null;

  // Fallback for monthly if usageData missing
  const usageResultFallback = (b: BillingData | null): number => {
    return b?.totalCalls ?? 0;
  };

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

  const handlePaymentSuccess = () => {
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
          <h1 className="text-4xl font-bold text-white mb-2">Billing</h1>
          <p className="text-gray-300">
            See your credits, plan, and usage at a glance.
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

        {/* Credit Balance Section */}

        {/* Payment History */}
        {/* <div className="mb-8">
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <PaymentHistorySection />
          </div>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <CreditBalanceSection
            refreshKey={creditRefreshKey}
            onPurchase={handlePurchaseCredits}
            onRefresh={() => setCreditRefreshKey((prev) => prev + 1)}
          />
          <CurrentPlanCard
            currentPlan={currentPlan as "free" | "starter" | "pro"}
            onUpgrade={handleUpgradeToPro}
          />
        </div>

        <div className="mb-8">
          <UsageStatsCard
            monthly={usageData?.monthly || usageResultFallback(billingData)}
            plan={currentPlan as "free" | "starter" | "pro"}
            creditsRemaining={creditsRemaining}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
