"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import ContactPlanLimitBanner from "@/components/leads/ContactPlanLimitBanner";
import { useAuthContext } from "@/context/AuthContext";
import {
  Analytics,
  ContactMetrics,
  DailyCounterRow,
  default as emailClient,
  getAnalytics,
  getContactMetrics,
  getDailyCounters,
  getLeads,
  getQuotaCardData,
  getSesCredentialsStatus,
  QuotaCardData,
} from "@/utils/api/emailClient";
import { getEmailProvider, type SesProvider } from "@/utils/api/apiClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconChartLine,
  IconClick,
  IconMail,
  IconSettings,
  IconShieldCheck,
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
  const [contactMetrics, setContactMetrics] = useState<ContactMetrics | null>(
    null
  );
  const [totalLeadsCount, setTotalLeadsCount] = useState<number>(0);
  const [range, setRange] = useState<7 | 30>(7);
  const [sesProvider, setSesProvider] = useState<SesProvider | null>(null);
  const [sesConnected, setSesConnected] = useState(true);
  const [managedSenderQuota, setManagedSenderQuota] = useState<{
    cap: number;
    remaining: number;
    used: number;
  } | null>(null);

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
      Math.round(openRate * 0.5 + clickRate * 0.3 + (100 - bounceRate) * 0.2)
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
  }, [range]);

  const fetchDashboardData = async (days: 7 | 30) => {
    try {
      setLoading(true);
      const [quotaData, dailyCounters, analyticsData, contactMetricsData] =
        await Promise.all([
          getQuotaCardData(),
          getDailyCounters(days),
          getAnalytics().catch(() => null), // Gracefully handle if analytics not available
          getContactMetrics().catch(() => null), // Gracefully handle if not available
        ]);

      setQuota(quotaData);
      setCounters(dailyCounters || []);
      setAnalytics(analyticsData);
      setContactMetrics(contactMetricsData);
      setManagedSenderQuota(null);

      // Fetch total leads count
      try {
        const leadsResponse = await getLeads(1, 1);
        const totalLeads = leadsResponse?.data?.pagination?.total || 0;
        setTotalLeadsCount(totalLeads);
      } catch (error) {
        console.error("Failed to fetch leads count:", error);
      }

      // Check BYO-SES credentials status
      try {
        const provider = await getEmailProvider();
        const prov = (provider.sesProvider as SesProvider) || null;
        setSesProvider(prov);
        if (prov === "custom") {
          try {
            const creds = await getSesCredentialsStatus();
            setSesConnected(creds.connected);
          } catch {
            setSesConnected(false);
          }
        } else if (prov === "leadsnipper_managed") {
          try {
            const sendersResp = await emailClient.get("/api/email-senders", {
              params: { page: 1, limit: 100 },
            });
            const allSenders = sendersResp.data?.data?.senders || [];
            const verifiedSenders = allSenders.filter(
              (sender: { id: string; verificationStatus: string }) =>
                sender.verificationStatus === "verified"
            );

            if (verifiedSenders.length > 0) {
              const quotaResponses = await Promise.all(
                verifiedSenders.map((sender: { id: string }) =>
                  emailClient.get(`/api/email-senders/${sender.id}/quota`)
                )
              );

              const aggregated = quotaResponses.reduce(
                (acc, res) => {
                  const q = res.data?.data || {};
                  acc.cap += Number(q.dailyCap || 0);
                  acc.remaining += Number(q.remaining || 0);
                  acc.used += Number(q.used || 0);
                  return acc;
                },
                { cap: 0, remaining: 0, used: 0 }
              );
              setManagedSenderQuota(aggregated);
            } else {
              setManagedSenderQuota({ cap: 0, remaining: 0, used: 0 });
            }
          } catch {
            // Fallback to quota card data if sender-level quotas are unavailable
            setManagedSenderQuota(null);
          }
        }
      } catch {
        // non-fatal
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
    (c) =>
      (c.sentCount || 0) + (c.bounceCount || 0) + (c.complaintCount || 0) > 0
  );

  const reputationLabel =
    dashboardMetrics.bounceRate < 2
      ? "Stable"
      : dashboardMetrics.bounceRate < 5
        ? "Good"
        : "Needs attention";
  const reputationHint =
    dashboardMetrics.bounceRate < 2
      ? "Your emails are reaching inboxes well."
      : dashboardMetrics.bounceRate < 5
        ? "A few emails didn’t deliver; keep an eye on your list."
        : "Many emails bounced. Clean your list and check addresses.";

  const domainHealthLabel =
    dashboardMetrics.bounceRate < 2 && dashboardMetrics.totalComplained === 0
      ? "Good"
      : dashboardMetrics.bounceRate < 5
        ? "Fair"
        : "Review needed";

  const sesNotConfigured = sesProvider === "custom" && !sesConnected;
  const displayedQuota =
    sesProvider === "leadsnipper_managed" && managedSenderQuota
      ? managedSenderQuota
      : quota;

  return (
    <div className="min-h-screen bg-bg-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-100 mb-1">Dashboard</h1>
          <p className="text-text-200">
            See how your emails are doing and how healthy your account is
          </p>
        </div>

        {/* BYO-SES Setup Banner */}
        {sesProvider === "custom" && !sesConnected && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 flex items-start gap-4 shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <IconAlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Set up your AWS SES credentials
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                You chose <strong>Bring Your Own SES</strong> but haven&apos;t connected your AWS credentials yet.
                Campaigns, domains, and sender verification all require a working SES connection.
                Head to <strong>Settings → Email Delivery</strong> to add your Access Key and Secret.
              </p>
              <Link
                href="/email/settings?tab=email-delivery"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <IconSettings className="w-4 h-4" />
                Go to Email Delivery Settings
              </Link>
            </div>
          </div>
        )}

        <ContactPlanLimitBanner metrics={contactMetrics} />

        {/* At a glance — 4 big numbers */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            At a glance
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Your contacts</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {dashboardMetrics.totalLeads.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">People in your list</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Emails sent</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {dashboardMetrics.totalEmailsSent.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">Total campaigns</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Inbox health</p>
              {sesNotConfigured ? (
                <>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                    Set up required
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Connect AWS SES in Settings to see inbox health
                  </p>
                </>
              ) : (
                <>
                  <p
                    className={`text-2xl sm:text-3xl font-bold ${
                      dashboardMetrics.bounceRate < 2
                        ? "text-green-600"
                        : dashboardMetrics.bounceRate < 5
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {reputationLabel}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{reputationHint}</p>
                </>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Emails left today</p>
              {sesNotConfigured ? (
                <>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-500">
                    —
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Connect AWS SES in Settings to see your daily limit
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {(displayedQuota?.remaining ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    of {(displayedQuota?.cap ?? 0).toLocaleString()} daily limit
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* How your emails did — plain-language counts */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            How your emails did
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Counts from your campaigns (what happened after you hit send)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Sent",
                value: dashboardMetrics.totalEmailsSent,
                hint: "You sent this many",
              },
              {
                label: "Delivered",
                value: dashboardMetrics.totalDelivered,
                hint: "Reached their inbox",
              },
              {
                label: "Opened",
                value: dashboardMetrics.totalOpened,
                hint: "Recipients opened",
              },
              {
                label: "Clicked",
                value: dashboardMetrics.totalClicked,
                hint: "Clicked a link",
              },
              {
                label: "Bounced",
                value: dashboardMetrics.totalBounced,
                hint: "Couldn’t deliver",
              },
              {
                label: "Complaints",
                value: dashboardMetrics.totalComplained,
                hint: "Marked as spam",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100"
              >
                <p className="text-lg font-bold text-gray-900">
                  {item.value.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rates that matter — open, click, bounce with explanations */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <IconChartLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Open rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.openRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              People who opened your email out of everyone who received it
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <IconClick className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Click rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.clickRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              People who clicked a link in your email
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  dashboardMetrics.bounceRate < 2
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <IconShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Bounce rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.bounceRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Emails that couldn’t be delivered (lower is better)
            </p>
          </div>
        </section>

        {/* Engagement + Account health in one row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement score — what it means */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Engagement score
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              How interested people are (opens, clicks, few bounces)
            </p>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="44"
                    cx="56"
                    cy="56"
                  />
                  <circle
                    className="text-brand-main"
                    strokeWidth="8"
                    strokeDasharray={`${
                      (dashboardMetrics.engagementScore / 100) * 276.46
                    }, 999`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="44"
                    cx="56"
                    cy="56"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardMetrics.engagementScore}
                  </span>
                  <span className="text-xs text-gray-500">/100</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {dashboardMetrics.engagementScore >= 70
                  ? "Great — your audience is engaging."
                  : dashboardMetrics.engagementScore >= 40
                    ? "Good — there’s room to improve with better subject lines and content."
                    : "Low — try cleaning your list and testing different content."}
              </p>
            </div>
          </div>

          {/* Account health — reputation, domain, capacity */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Account health
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Your sending reputation and daily limit
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      sesNotConfigured
                        ? "bg-gray-200 text-gray-500"
                        : reputationLabel === "Stable"
                          ? "bg-green-100 text-green-600"
                          : reputationLabel === "Good"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-red-100 text-red-600"
                    }`}
                  >
                    <IconShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Your reputation
                    </p>
                    <p className="text-xs text-gray-500">
                      {sesNotConfigured
                        ? "Connect AWS SES to see your sending reputation"
                        : reputationHint}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    sesNotConfigured
                      ? "text-gray-500"
                      : reputationLabel === "Stable"
                        ? "text-green-600"
                        : reputationLabel === "Good"
                          ? "text-amber-600"
                          : "text-red-600"
                  }`}
                >
                  {sesNotConfigured ? "Set up required" : reputationLabel}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <IconWorld className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Domain health
                    </p>
                    <p className="text-xs text-gray-500">
                      {sesNotConfigured
                        ? "Connect SES first to see domain status"
                        : dashboardMetrics.totalComplained === 0
                          ? "No spam complaints"
                          : `${dashboardMetrics.totalComplained} complaint(s)`}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {sesNotConfigured ? "Set up required" : domainHealthLabel}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Daily sending limit
                  </span>
                  {sesNotConfigured ? (
                    <span className="text-sm text-gray-500">
                      Connect SES to see limit
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">
                      {(displayedQuota?.remaining ?? 0).toLocaleString()} left
                      of {(displayedQuota?.cap ?? 0).toLocaleString()}
                    </span>
                  )}
                </div>
                {sesNotConfigured ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Add your AWS SES credentials in{" "}
                    <Link
                      href="/email/settings?tab=email-delivery"
                      className="text-brand-main hover:underline"
                    >
                      Settings → Email Delivery
                    </Link>{" "}
                    to see your real daily limit.
                  </p>
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-1">
                    <div
                      className="h-full bg-brand-main transition-all duration-500"
                      style={{
                        width: displayedQuota?.cap
                          ? `${Math.min(
                              ((displayedQuota.used || 0) /
                                displayedQuota.cap) *
                                100,
                              100
                            )}%`
                          : "0%",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sending over time */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Emails sent over time
              </h3>
              <p className="text-sm text-gray-500">
                How many you sent each day (last {range} days)
              </p>
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
                7 days
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
                30 days
              </button>
            </div>
          </div>

          <div className="h-56 flex items-center justify-center">
            {hasAnyData ? (
              <svg viewBox="0 0 400 200" className="w-full h-full">
                <defs>
                  <linearGradient
                    id="areaGrad"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const maxValue = Math.max(
                    1,
                    ...counters.map((c) => c.sentCount || 0)
                  );
                  const points = counters.map((c, idx) => ({
                    x: (idx / Math.max(counters.length - 1, 1)) * 380 + 10,
                    y: 180 - ((c.sentCount || 0) / maxValue) * 160,
                  }));
                  const path = points
                    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
                    .join(" ");
                  const areaPath = `${path} L ${
                    points[points.length - 1]?.x || 390
                  } 180 L 10 180 Z`;
                  return (
                    <>
                      <path d={areaPath} fill="url(#areaGrad)" stroke="none" />
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
                <p className="text-sm">No sending data yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Send a campaign to see your trend here
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Create campaign",
                description: "Write and send a new email to your list",
                href: "/email/campaigns",
                icon: <IconMail className="w-6 h-6" />,
              },
              {
                title: "Upload leads",
                description: "Add contacts from a file or paste a list",
                href: "/email/leads",
                icon: <IconUpload className="w-6 h-6" />,
              },
              {
                title: "Verify domains",
                description: "Connect your domain so emails send from your address",
                href: "/email/domains",
                icon: <IconWorld className="w-6 h-6" />,
              },
            ].map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-brand-main/50 transition-all"
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
          </div>
        </section>
      </main>
    </div>
  );
}
