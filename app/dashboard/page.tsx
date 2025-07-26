"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import OnboardingBanner from "@/components/dashboard/OnboardingBanner";
import OnboardingProtectedLayout from "@/components/layout/OnboardingProtectedLayout";
import { useAuthContext } from "@/context/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import {
  IconApi,
  IconChartBar,
  IconClock,
  IconCreditCard,
  IconDatabase,
  IconKey,
  IconPlus,
  IconRocket,
  IconShield,
  IconUser,
} from "@tabler/icons-react";

interface DashboardStats {
  totalApiCalls: number;
  remainingCalls: number;
  totalTokens: number;
  lastActivity: string;
  currentPlan: "free" | "pro";
  monthlyUsage: number;
  billingAmount: number;
}

interface UsageData {
  total: number;
  free: number;
  billable: number;
  byEndpoint: Record<string, number>;
  byToken: Record<string, number>;
}

interface BillingData {
  totalCalls: number;
  freeCalls: number;
  billableCalls: number;
  rate: number;
  totalAmount: number;
  month: string;
}

export default function Dashboard() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading, user } = state;
  const router = useRouter();
  const onboardingStatus = useOnboardingStatus();
  const [stats, setStats] = useState<DashboardStats>({
    totalApiCalls: 0,
    remainingCalls: 10,
    totalTokens: 0,
    lastActivity: "Never",
    currentPlan: "free",
    monthlyUsage: 0,
    billingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);

        // Import API clients at the top of the file
        const { getUsageStats } = await import("@/utils/api/usageClient");
        const { getBillingInfo } = await import("@/utils/api/billingClient");
        const { listTokens } = await import("@/utils/api/tokenClient");

        // Fetch usage data
        const usageData = await getUsageStats();

        // Fetch billing data
        const billingData = await getBillingInfo();

        // Fetch tokens count
        const tokensData = await listTokens();

        setStats({
          totalApiCalls: usageData.stats?.totalRequests || 0,
          remainingCalls: Math.max(
            0,
            10 - (usageData.stats?.totalRequests || 0)
          ),
          totalTokens: tokensData.length || 0,
          lastActivity: "Today", // You can enhance this with real last activity data
          currentPlan:
            (usageData.stats?.totalRequests || 0) > 10 ? "pro" : "free",
          monthlyUsage: usageData.stats?.totalRequests || 0,
          billingAmount: billingData.totalSpent || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <OnboardingProtectedLayout>
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
              Welcome back, {user?.name || "User"}! 👋
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your scraping operations and API usage from your dashboard.
            </p>
          </div>

          {/* Onboarding Banner */}
          {!onboardingStatus.isLoading && onboardingStatus.isSkipped && (
            <OnboardingBanner />
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* API Calls Used */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">
                    API Calls Used
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {loading ? "..." : stats.totalApiCalls}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">This month</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <IconApi className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Remaining Free Calls */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">
                    Free Calls Left
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {loading ? "..." : stats.remainingCalls}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Out of 10 free</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <IconShield className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Current Plan */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">
                    Current Plan
                  </p>
                  <p className="text-3xl font-bold text-white capitalize">
                    {loading ? "..." : stats.currentPlan}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats.currentPlan === "free"
                      ? "Upgrade for unlimited"
                      : "Pay per call"}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <IconRocket className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Monthly Billing */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">
                    This Month
                  </p>
                  <p className="text-3xl font-bold text-white">
                    ${loading ? "..." : stats.billingAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Billable amount</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <IconCreditCard className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">
                    Remaining Calls
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.remainingCalls}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <IconChartBar className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">
                    API Tokens
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalTokens}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <IconKey className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">
                    Last Activity
                  </p>
                  <p className="text-lg font-bold text-white">
                    {stats.lastActivity}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <IconClock className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Quick Actions
              </h2>
              <div className="space-y-4">
                <Link
                  href="/scraper"
                  className="flex items-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <IconDatabase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Start Scraping</h3>
                    <p className="text-sm text-gray-300">
                      Extract data from websites
                    </p>
                  </div>
                </Link>

                <Link
                  href="/api-tokens"
                  className="flex items-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <IconPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Create API Token
                    </h3>
                    <p className="text-sm text-gray-300">
                      Generate new API access token
                    </p>
                  </div>
                </Link>

                <Link
                  href="/scraper/history"
                  className="flex items-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <IconClock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">View History</h3>
                    <p className="text-sm text-gray-300">
                      Check your scraping history
                    </p>
                  </div>
                </Link>

                <Link
                  href="/billing"
                  className="flex items-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <IconCreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Billing & Usage
                    </h3>
                    <p className="text-sm text-gray-300">
                      Monitor usage and billing
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Account Overview
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Plan</span>
                  <span
                    className={`font-semibold text-white px-3 py-1 rounded-full text-sm ${
                      stats.currentPlan === "free"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}
                  >
                    {stats.currentPlan === "free" ? "Free Tier" : "Pro Tier"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Monthly Limit</span>
                  <span className="font-semibold text-white">
                    {stats.currentPlan === "free" ? "10 calls" : "Unlimited"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Used This Month</span>
                  <span className="font-semibold text-white">
                    {loading ? "..." : stats.totalApiCalls} calls
                  </span>
                </div>
                {stats.currentPlan === "free" && (
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (stats.totalApiCalls / 10) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                )}
                {stats.currentPlan === "pro" && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">
                      This Month&apos;s Bill
                    </span>
                    <span className="font-semibold text-white">
                      ${loading ? "..." : stats.billingAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    href="/billing"
                    className="flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    <IconCreditCard className="w-5 h-5 mr-2" />
                    Upgrade to Pro
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Recent Activity
            </h2>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <IconDatabase className="w-10 h-10 text-white" />
              </div>
              <p className="text-gray-300 text-lg mb-2">No recent activity</p>
              <p className="text-gray-400">
                Start scraping to see your activity here
              </p>
            </div>
          </div>
        </div>
      </div>
    </OnboardingProtectedLayout>
  );
}
