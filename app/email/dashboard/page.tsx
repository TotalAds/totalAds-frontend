"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import {
  DailyCounterRow,
  getDailyCounters,
  getQuotaCardData,
  QuotaCardData,
} from "@/utils/api/emailClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function DashboardPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<QuotaCardData | null>(null);
  const [counters, setCounters] = useState<DailyCounterRow[]>([]);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    // Check if user has completed onboarding
    if (!state.isLoading && state.isAuthenticated && state.user) {
      if (!state.user.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }
    }
  }, [state.isLoading, state.isAuthenticated, state.user, router]);

  useEffect(() => {
    // Get user name from localStorage
    const storedUserName = localStorage.getItem("userName");
    setUserName(storedUserName);
    setLoading(false);
    fetchQuotaAndCounters(7);
  }, []);

  const fetchQuotaAndCounters = async (days: 7 | 30) => {
    try {
      const [q, dc] = await Promise.all([
        getQuotaCardData(),
        getDailyCounters(days),
      ]);
      setQuota(q);
      setCounters(dc || []);
    } catch (error) {
      console.error("Failed to fetch quota/counters:", error);
      setQuota(null);
      setCounters([]);
    }
  };

  const handleLogout = () => {
    // Clear tokens and localStorage
    tokenStorage.removeTokens();
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");

    toast.success("Logged out successfully");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-200">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-text-100 mb-4">
            Welcome to Your Dashboard
          </h2>
          <p className="text-text-200">
            Get started with TotalAds Email Service. Manage your email
            campaigns, domains, and leads.
          </p>
        </div>

        {/* Trend Chart (7/30 days) */}
        <div className="w-full max-w-3xl mb-12 bg-brand-main/10 backdrop-blur-xl border border-brand-main/20 rounded-2xl p-4 text-text-100">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm opacity-80">Daily Sends Trend</div>
            <div className="flex gap-2 text-xs">
              <button
                className={`px-2 py-0.5 rounded ${
                  range === 7
                    ? "bg-brand-main/20 text-brand-main"
                    : "bg-brand-main/5 text-text-200"
                }`}
                onClick={() => {
                  setRange(7);
                  fetchQuotaAndCounters(7);
                }}
              >
                7d
              </button>
              <button
                className={`px-2 py-0.5 rounded ${
                  range === 30
                    ? "bg-brand-main/20 text-brand-main"
                    : "bg-brand-main/5 text-text-200"
                }`}
                onClick={() => {
                  setRange(30);
                  fetchQuotaAndCounters(30);
                }}
              >
                30d
              </button>
            </div>
          </div>
          {/* Simple bar chart */}
          <div className="h-36 flex items-end gap-1">
            {(counters || []).map((d, idx) => {
              const max = Math.max(1, ...counters.map((x) => x.sentCount));
              const sentH = Math.round((d.sentCount / max) * 100);
              const bounceH = Math.round((d.bounceCount / max) * 100);
              const compH = Math.round((d.complaintCount / max) * 100);
              return (
                <div key={idx} className="flex-1 flex items-end justify-center">
                  <div className="w-2 flex items-end gap-[2px]">
                    <div
                      className="bg-green-400/80"
                      style={{
                        height: `${sentH}%`,
                        width: "6px",
                        borderRadius: "2px",
                      }}
                      title={`${d.date}: Sent ${d.sentCount}`}
                    />
                    <div
                      className="bg-red-400/80"
                      style={{
                        height: `${bounceH}%`,
                        width: "6px",
                        borderRadius: "2px",
                      }}
                      title={`${d.date}: Bounced ${d.bounceCount}`}
                    />
                    <div
                      className="bg-amber-400/80"
                      style={{
                        height: `${compH}%`,
                        width: "6px",
                        borderRadius: "2px",
                      }}
                      title={`${d.date}: Complaints ${d.complaintCount}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-3 flex gap-4 text-[11px] text-text-200">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 inline-block rounded-sm" />{" "}
              Sent
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-red-400 inline-block rounded-sm" />{" "}
              Bounced
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-400 inline-block rounded-sm" />{" "}
              Complaints
            </span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Domains */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/15 transition">
            <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-text-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              Domains
            </h3>
            <p className="text-text-200 mb-4">
              Verify and manage your email domains
            </p>
            <Link
              href="/email/domains"
              className="text-brand-main hover:text-brand-secondary font-semibold"
            >
              Manage Domains →
            </Link>
          </div>

          {/* Leads */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/15 transition">
            <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-text-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-6-6 6 6 0 00-6 6z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">Leads</h3>
            <p className="text-text-200 mb-4">
              Upload and manage your contact lists
            </p>
            <Link
              href="/email/leads"
              className="text-brand-main hover:text-brand-secondary font-semibold"
            >
              Manage Leads →
            </Link>
          </div>

          {/* Campaigns */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/15 transition">
            <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-text-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              Campaigns
            </h3>
            <p className="text-text-200 mb-4">
              Create and manage email campaigns
            </p>
            <Link
              href="/email/campaigns"
              className="text-brand-main hover:text-brand-secondary font-semibold"
            >
              Create Campaign →
            </Link>
          </div>

          {/* Analytics */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/15 transition">
            <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-text-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              Analytics
            </h3>
            <p className="text-text-200 mb-4">
              Track campaign performance and metrics
            </p>
            <Link
              href="/email/analytics"
              className="text-brand-main hover:text-brand-secondary font-semibold"
            >
              View Analytics →
            </Link>
          </div>

          {/* Credits */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/15 transition">
            <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-text-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              Pricing & Plans
            </h3>
            <p className="text-text-200 mb-4">
              View pricing plans and manage your subscription
            </p>
            <Link
              href="/email/pricing"
              className="text-brand-main hover:text-brand-secondary font-semibold"
            >
              View Plans →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
