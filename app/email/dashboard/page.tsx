"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import {
  Analytics,
  DailyCounterRow,
  getAnalytics,
  getContactMetrics,
  getDailyCounters,
  getQuotaCardData,
  getLeads,
  QuotaCardData,
  ContactMetrics,
} from "@/utils/api/emailClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import {
  IconArrowUpRight,
  IconChartLine,
  IconClick,
  IconMail,
  IconShieldCheck,
  IconTrendingUp,
  IconUpload,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";

export default function DashboardPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<QuotaCardData | null>(null);
  const [counters, setCounters] = useState<DailyCounterRow[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [contactMetrics, setContactMetrics] = useState<ContactMetrics | null>(null);
  const [totalLeadsCount, setTotalLeadsCount] = useState<number>(0);
  const [range, setRange] = useState<7 | 30>(7);

  // Calculate metrics from backend data
  const dashboardMetrics = useMemo(() => {
    const totalSent = analytics?.sent || 0;
    const totalOpened = analytics?.opened || 0;
    const totalClicked = analytics?.clicked || 0;
    const totalBounced = analytics?.bounced || 0;
    const totalComplained = analytics?.complained || 0;
    const totalDelivered = totalSent - totalBounced;

    // Calculate rates
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    
    // Reply rate - would need backend data for this
    const replyRate = 0; // TODO: Add reply tracking to backend

    // Engagement score (0-100) based on opens, clicks, and low bounces
    const engagementScore = Math.min(
      100,
      Math.round(
        (openRate * 0.5) + (clickRate * 0.3) + ((100 - bounceRate) * 0.2)
      )
    );

    return {
      totalLeads: contactMetrics?.contacts?.total || totalLeadsCount || 0,
      totalEmailsSent: totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      totalComplained,
      totalDelivered,
      openRate,
      clickRate,
      bounceRate,
      replyRate,
      engagementScore,
    };
  }, [analytics, contactMetrics, totalLeadsCount]);

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
    fetchDashboardData(range);
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(range);
    }, 30000);

    return () => clearInterval(interval);
  }, [range]);

  const fetchDashboardData = async (days: 7 | 30) => {
    try {
      setLoading(true);
      const [quotaData, dailyCounters, analyticsData, contactMetricsData] = await Promise.all([
        getQuotaCardData(),
        getDailyCounters(days),
        getAnalytics().catch(() => null), // Gracefully handle if analytics not available
        getContactMetrics().catch(() => null), // Gracefully handle if not available
      ]);

      setQuota(quotaData);
      setCounters(dailyCounters || []);
      setAnalytics(analyticsData);
      setContactMetrics(contactMetricsData);

      // Fetch total leads count
      try {
        const leadsResponse = await getLeads(1, 1);
        const totalLeads = leadsResponse?.data?.pagination?.total || 0;
        setTotalLeadsCount(totalLeads);
      } catch (error) {
        console.error("Failed to fetch leads count:", error);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
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
          <p className="text-text-200">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasAnyData = (counters || []).some(
    (c) => (c.sentCount || 0) + (c.bounceCount || 0) + (c.complaintCount || 0) > 0
  );

  return (
    <div className="min-h-screen bg-bg-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-100 mb-2">Dashboard</h1>
          <p className="text-text-200">
            Overview of your email marketing performance and account health
          </p>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Total Leads",
              value: dashboardMetrics.totalLeads.toLocaleString(),
              icon: <IconUsers className="w-5 h-5" />,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              label: "Total Emails Sent",
              value: dashboardMetrics.totalEmailsSent.toLocaleString(),
              icon: <IconMail className="w-5 h-5" />,
              color: "text-brand-main",
              bgColor: "bg-brand-main/10",
            },
            {
              label: "Open Rate",
              value: `${dashboardMetrics.openRate.toFixed(1)}%`,
              icon: <IconChartLine className="w-5 h-5" />,
              color: "text-green-600",
              bgColor: "bg-green-50",
            },
            {
              label: "Click Rate",
              value: `${dashboardMetrics.clickRate.toFixed(1)}%`,
              icon: <IconClick className="w-5 h-5" />,
              color: "text-purple-600",
              bgColor: "bg-purple-50",
            },
            {
              label: "Reply Rate",
              value: dashboardMetrics.replyRate > 0 
                ? `${dashboardMetrics.replyRate.toFixed(1)}%`
                : "—",
              icon: <IconTrendingUp className="w-5 h-5" />,
              color: "text-orange-600",
              bgColor: "bg-orange-50",
            },
            {
              label: "Bounce Rate",
              value: `${dashboardMetrics.bounceRate.toFixed(1)}%`,
              icon: <IconShieldCheck className="w-5 h-5" />,
              color: dashboardMetrics.bounceRate < 2 ? "text-green-600" : "text-red-600",
              bgColor: dashboardMetrics.bounceRate < 2 ? "bg-green-50" : "bg-red-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${card.bgColor} ${card.color} rounded-lg flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </section>

        {/* Performance Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Campaign Summary */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Sent", value: dashboardMetrics.totalEmailsSent },
                { label: "Delivered", value: dashboardMetrics.totalDelivered },
                { label: "Opened", value: dashboardMetrics.totalOpened },
                { label: "Clicked", value: dashboardMetrics.totalClicked },
                { label: "Bounced", value: dashboardMetrics.totalBounced },
                { label: "Complained", value: dashboardMetrics.totalComplained },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                >
                  <p className="text-xs text-gray-600 mb-1">{item.label}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {item.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Score */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Score</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="52"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-brand-main"
                    strokeWidth="8"
                    strokeDasharray={`${(dashboardMetrics.engagementScore / 100) * 326.73}, 999`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="52"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-gray-900">
                    {dashboardMetrics.engagementScore}
                  </span>
                  <span className="text-xs text-gray-500">/100</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Based on open rate, click rate, and deliverability
            </p>
          </div>
        </section>

        {/* Deliverability Health */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-gray-900">Reputation Status</h4>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <IconShieldCheck className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {dashboardMetrics.bounceRate < 2 ? "Stable" : dashboardMetrics.bounceRate < 5 ? "Good" : "Needs Attention"}
            </p>
            <p className="text-xs text-gray-500">
              Bounce rate: {dashboardMetrics.bounceRate.toFixed(2)}%
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-gray-900">Domain Health</h4>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {dashboardMetrics.bounceRate < 2 && dashboardMetrics.totalComplained === 0 
                ? "Good" 
                : dashboardMetrics.bounceRate < 5 
                ? "Fair" 
                : "Review Needed"}
            </p>
            <p className="text-xs text-gray-500">
              {dashboardMetrics.totalComplained === 0 
                ? "No complaints recorded" 
                : `${dashboardMetrics.totalComplained} complaint(s)`}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-gray-900">Daily Sending Capacity</h4>
              <div className="w-8 h-8 bg-brand-main/10 rounded-lg flex items-center justify-center">
                <IconMail className="w-4 h-4 text-brand-main" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className="text-lg font-semibold text-gray-900">
                  {quota?.remaining ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Daily Cap</span>
                <span className="text-lg font-semibold text-gray-900">
                  {quota?.cap ?? 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-brand-main transition-all duration-500"
                  style={{
                    width: quota?.cap
                      ? `${Math.min(((quota.used || 0) / quota.cap) * 100, 100)}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Trend Chart */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Sending Trends</h3>
              <p className="text-sm text-gray-600">Track your sending volume over time</p>
            </div>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  range === 7
                    ? "bg-brand-main text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setRange(7);
                  fetchDashboardData(7);
                }}
              >
                7 Days
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  range === 30
                    ? "bg-brand-main text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setRange(30);
                  fetchDashboardData(30);
                }}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {hasAnyData ? (
              <svg viewBox="0 0 400 200" className="w-full h-full">
                <defs>
                  <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const maxValue = Math.max(1, ...counters.map((c) => c.sentCount || 0));
                  const points = counters.map((c, idx) => ({
                    x: (idx / Math.max(counters.length - 1, 1)) * 380 + 10,
                    y: 180 - ((c.sentCount || 0) / maxValue) * 160,
                  }));
                  const path = points
                    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
                    .join(" ");
                  const areaPath = `${path} L ${points[points.length - 1]?.x || 390} 180 L 10 180 Z`;
                  return (
                    <>
                      <path
                        d={areaPath}
                        fill="url(#areaGrad)"
                        stroke="none"
                      />
                      <path
                        d={path}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r="3"
                          fill="#3b82f6"
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            ) : (
              <div className="text-center text-gray-500">
                <IconChartLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sending data available yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start sending campaigns to see trends here
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Create Campaign",
              description: "Set up and launch a new email campaign",
              href: "/email/campaigns",
              icon: <IconMail className="w-6 h-6" />,
            },
            {
              title: "Upload Leads",
              description: "Import contacts and build your lead list",
              href: "/email/leads",
              icon: <IconUpload className="w-6 h-6" />,
            },
            {
              title: "Verify Domains",
              description: "Add and verify domains for better deliverability",
              href: "/email/domains",
              icon: <IconWorld className="w-6 h-6" />,
            },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-brand-main/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-brand-main/10 text-brand-main rounded-lg flex items-center justify-center group-hover:bg-brand-main/20 transition-colors">
                  {action.icon}
                </div>
                <IconArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-brand-main transition-colors" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                {action.title}
              </h4>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
