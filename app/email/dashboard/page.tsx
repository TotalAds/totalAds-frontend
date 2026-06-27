"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { EngagementBreakdownChart } from "@/components/email-dashboard/EngagementBreakdownChart";
import { RateRadialChart } from "@/components/email-dashboard/RateRadialChart";
import { SendingHeatmap } from "@/components/email-dashboard/SendingHeatmap";
import { SendingTrendChart } from "@/components/email-dashboard/SendingTrendChart";
import { TopCampaignsChart } from "@/components/email-dashboard/TopCampaignsChart";
import ContactPlanLimitBanner from "@/components/leads/ContactPlanLimitBanner";
import WorkspaceRoleBanner from "@/components/workspace/WorkspaceRoleBanner";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  AnalyticsSummary,
  ContactMetrics,
  DailyCounterRow,
  default as emailClient,
  EMPTY_ANALYTICS_SUMMARY,
  getAnalyticsSummary,
  getContactMetrics,
  getDailyCounters,
  getQuotaCardData,
  getSesCredentialsStatus,
  QuotaCardData,
} from "@/utils/api/emailClient";
import { getEmailProvider, type SesProvider } from "@/utils/api/apiClient";
import { useEmailProvider } from "@/hooks/useEmailProvider";
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconChartLine,
  IconMail,
  IconRocket,
  IconSettings,
  IconUpload,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";

type RangeDays = 7 | 30;

export default function DashboardPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const { role, activeWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const {
    isByoSes,
    isManagedSes,
    isConnectedInboxUser,
    hasConnectedSendingAccount,
    primarySendingMethod,
    sesConnected: byoSesConnected,
  } = useEmailProvider();
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<QuotaCardData | null>(null);
  const [counters, setCounters] = useState<DailyCounterRow[]>([]);
  const [analyticsSummary, setAnalyticsSummary] =
    useState<AnalyticsSummary | null>(null);
  const [contactMetrics, setContactMetrics] = useState<ContactMetrics | null>(
    null
  );
  const [range, setRange] = useState<RangeDays>(7);
  const [sesProvider, setSesProvider] = useState<SesProvider | null>(null);
  const [sesConnected, setSesConnected] = useState(true);
  const [managedSenderQuota, setManagedSenderQuota] = useState<{
    cap: number;
    remaining: number;
    used: number;
  } | null>(null);

  const summary = analyticsSummary?.summary;
  const rates = analyticsSummary?.rates;
  const savedGoals = useMemo(() => {
    const raw = state.user?.businessGoals;
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [state.user?.businessGoals]);

  const dashboardMetrics = useMemo(() => {
    const totalSent = summary?.totalSent ?? 0;
    const totalOpened = summary?.totalOpened ?? 0;
    const totalClicked = summary?.totalClicked ?? 0;
    const totalBounced = summary?.totalBounced ?? 0;
    const totalComplained = summary?.totalComplained ?? 0;
    const totalDelivered = Math.max(0, totalSent - totalBounced);

    const openRate = rates?.openRate ?? (totalSent > 0 ? (totalOpened / totalSent) * 100 : 0);
    const clickRate = rates?.clickRate ?? (totalSent > 0 ? (totalClicked / totalSent) * 100 : 0);
    const bounceRate = rates?.bounceRate ?? (totalSent > 0 ? (totalBounced / totalSent) * 100 : 0);

    const engagementScore = Math.min(
      100,
      Math.round(openRate * 0.5 + clickRate * 0.3 + (100 - bounceRate) * 0.2)
    );

    return {
      totalContacts: contactMetrics?.contacts?.total ?? 0,
      totalCampaigns: summary?.totalCampaigns ?? 0,
      activeCampaigns: summary?.activeCampaigns ?? 0,
      totalEmailsSent: totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      totalComplained,
      totalDelivered,
      openRate,
      clickRate,
      bounceRate,
      engagementScore,
      monthlyEmailsUsed: contactMetrics?.emails?.used ?? 0,
      monthlyEmailsLimit: contactMetrics?.emails?.allocated ?? 0,
    };
  }, [summary, rates, contactMetrics]);

  const quickActions = useMemo(() => {
    const items = [
      {
        id: "campaigns",
        title: "Create campaign",
        description: "Launch a single send or multi-step sequence",
        href: "/email/campaigns",
        icon: <IconMail className="h-6 w-6" />,
      },
      {
        id: "leads",
        title: "Upload leads",
        description: "Import contacts and verify before sending",
        href: "/email/leads",
        icon: <IconUpload className="h-6 w-6" />,
      },
      {
        id: "domains",
        title: "Domain health",
        description: "Verify domains and monitor deliverability",
        href: "/email/domains",
        icon: <IconWorld className="h-6 w-6" />,
      },
      {
        id: "inbox",
        title: "Manage replies",
        description: "Track and manage your campaign conversations",
        href: "/email/inbox",
        icon: <IconUsers className="h-6 w-6" />,
      },
    ];

    const preferred = new Set<string>();
    for (const goal of savedGoals) {
      if (goal === "find_new_leads") preferred.add("leads");
      if (goal === "send_cold_emails") preferred.add("campaigns");
      if (goal === "verify_email_lists") preferred.add("leads");
      if (goal === "manage_replies") preferred.add("inbox");
      if (goal === "everything") {
        preferred.add("campaigns");
        preferred.add("leads");
        preferred.add("inbox");
      }
    }

    const ordered = [...items].sort((a, b) => {
      const aWeight = preferred.has(a.id) ? 0 : 1;
      const bWeight = preferred.has(b.id) ? 0 : 1;
      return aWeight - bWeight;
    });

    return ordered.slice(0, 3);
  }, [savedGoals]);

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated && state.user) {
      if (!state.user.onboardingCompleted) {
        router.push("/onboarding");
      }
    }
  }, [state.isLoading, state.isAuthenticated, state.user, router]);

  useEffect(() => {
    if (workspaceLoading || !activeWorkspace) return;
    fetchDashboardData(range);
  }, [range, workspaceLoading, activeWorkspace?.id]);

  const fetchDashboardData = async (days: RangeDays) => {
    try {
      setLoading(true);
      const [quotaData, dailyCounters, summaryData, contactMetricsData] =
        await Promise.all([
          getQuotaCardData(),
          getDailyCounters(days),
          getAnalyticsSummary().catch((err) => {
            console.error("Failed to fetch analytics summary:", err);
            return EMPTY_ANALYTICS_SUMMARY;
          }),
          getContactMetrics().catch(() => null),
        ]);

      setQuota(quotaData);
      setCounters(dailyCounters || []);
      setAnalyticsSummary(summaryData);
      setContactMetrics(contactMetricsData);
      setManagedSenderQuota(null);

      try {
        const provider = await getEmailProvider();
        const prov = (provider.sesProvider as SesProvider) || null;
        const method = provider.primarySendingMethod ?? null;
        setSesProvider(prov);
        if (prov === "custom" || method === "byo_ses") {
          try {
            const creds = await getSesCredentialsStatus();
            setSesConnected(creds.connected);
          } catch {
            setSesConnected(false);
          }
        } else if (prov === "leadsnipper_managed" || method === "managed_ses") {
          try {
            const sendersResp = await emailClient.get("/api/email-senders", {
              params: { page: 1, limit: 100 },
            });
            const allSenders = sendersResp.data?.data?.senders || [];
            const verifiedSenders = allSenders.filter(
              (sender: { verificationStatus: string }) =>
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-main border-t-transparent" />
          <p className="text-text-200">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const sesNotConfigured = isByoSes && !byoSesConnected;
  const displayedQuota =
    isManagedSes && managedSenderQuota
      ? managedSenderQuota
      : quota;

  const quotaUsedPct =
    displayedQuota?.cap && displayedQuota.cap > 0
      ? Math.min(100, ((displayedQuota.used || 0) / displayedQuota.cap) * 100)
      : 0;

  const contactUsedPct =
    contactMetrics?.contacts?.limit && contactMetrics.contacts.limit > 0
      ? Math.min(
          100,
          (contactMetrics.contacts.total / contactMetrics.contacts.limit) * 100
        )
      : 0;

  const periodSent = counters.reduce((s, c) => s + (c.sentCount || 0), 0);
  const periodBounces = counters.reduce((s, c) => s + (c.bounceCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-bg-100 to-bg-100">
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {role && role !== "admin" && (
          <WorkspaceRoleBanner variant="dashboard" />
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-main">
              LeadSnipper
            </p>
            <h1 className="text-3xl font-bold text-text-100">Dashboard</h1>
            <p className="mt-1 text-text-200">
              Live outreach performance, deliverability, and account health
            </p>
          </div>
          <div className="flex gap-2">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRange(d)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  range === d
                    ? "bg-brand-main text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {sesNotConfigured && (
          <div className="flex items-start gap-4 rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-base font-semibold text-gray-900">
                Connect AWS SES to unlock sending
              </h3>
              <p className="mb-3 text-sm text-gray-700">
                Connect AWS SES and import your verified domains and senders to
                start campaigns.
              </p>
              <Link
                href="/email/sending-accounts?showSes=true"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                <IconSettings className="h-4 w-4" />
                Connect AWS SES
              </Link>
            </div>
          </div>
        )}

        {isConnectedInboxUser && !hasConnectedSendingAccount && (
          <div className="flex items-start gap-4 rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-base font-semibold text-gray-900">
                Connect your sending account
              </h3>
              <p className="mb-3 text-sm text-gray-700">
                Finish setup by connecting your{" "}
                {primarySendingMethod === "gmail"
                  ? "Google"
                  : primarySendingMethod === "outlook"
                    ? "Microsoft"
                    : "SMTP"}{" "}
                account before launching campaigns.
              </p>
              <Link
                href={
                  primarySendingMethod === "gmail"
                    ? "/email/sending-accounts?connect=gmail"
                    : primarySendingMethod === "outlook"
                      ? "/email/sending-accounts?connect=outlook"
                      : "/email/sending-accounts?showSmtp=true"
                }
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                <IconMail className="h-4 w-4" />
                Set up sending account
              </Link>
            </div>
          </div>
        )}

        <ContactPlanLimitBanner metrics={contactMetrics} />

        {/* KPI row */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Contacts",
              value: dashboardMetrics.totalContacts.toLocaleString(),
              sub: contactMetrics?.contacts?.limit
                ? `${Math.round(contactUsedPct)}% of plan limit`
                : "In your workspace",
              icon: <IconUsers className="h-5 w-5" />,
              accent: "from-blue-500/10 to-blue-600/5 text-blue-600",
            },
            {
              label: "Emails sent (all time)",
              value: dashboardMetrics.totalEmailsSent.toLocaleString(),
              sub: `${periodSent.toLocaleString()} in last ${range} days`,
              icon: <IconMail className="h-5 w-5" />,
              accent: "from-violet-500/10 to-violet-600/5 text-violet-600",
            },
            {
              label: "Open rate",
              value: `${dashboardMetrics.openRate.toFixed(1)}%`,
              sub: `${dashboardMetrics.totalOpened.toLocaleString()} opens total`,
              icon: <IconChartLine className="h-5 w-5" />,
              accent: "from-emerald-500/10 to-emerald-600/5 text-emerald-600",
            },
            {
              label: "Daily send left",
              value: sesNotConfigured
                ? "—"
                : (displayedQuota?.remaining ?? 0).toLocaleString(),
              sub: sesNotConfigured
                ? "Connect SES to view quota"
                : `of ${(displayedQuota?.cap ?? 0).toLocaleString()} today`,
              icon: <IconRocket className="h-5 w-5" />,
              accent: "from-amber-500/10 to-amber-600/5 text-amber-600",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div
                className={`mb-3 inline-flex rounded-lg bg-gradient-to-br p-2.5 ${card.accent}`}
              >
                {card.icon}
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
            </div>
          ))}
        </section>

        {/* Charts row 1 */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Sending activity
                </h2>
                <p className="text-sm text-slate-500">
                  Daily sends, bounces, and complaints — last {range} days
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {periodSent} sent · {periodBounces} bounced
              </span>
            </div>
            <SendingTrendChart counters={counters} days={range} />
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Engagement breakdown
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              How recipients interacted with your emails
            </p>
            <EngagementBreakdownChart
              sent={dashboardMetrics.totalEmailsSent}
              opened={dashboardMetrics.totalOpened}
              clicked={dashboardMetrics.totalClicked}
              bounced={dashboardMetrics.totalBounced}
              complained={dashboardMetrics.totalComplained}
            />
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-500" /> Clicked
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Opened
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Delivered
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Bounced
              </span>
            </div>
          </div>
        </section>

        {/* Charts row 2 */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Performance rates
            </h2>
            <p className="mb-2 text-sm text-slate-500">
              Calculated from your campaign analytics
            </p>
            <RateRadialChart
              openRate={dashboardMetrics.openRate}
              clickRate={dashboardMetrics.clickRate}
              bounceRate={dashboardMetrics.bounceRate}
            />
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Sending heatmap
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Volume by day of week (darker = more activity)
            </p>
            <SendingHeatmap counters={counters} days={range} />
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2 xl:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">
              Top campaigns
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Ranked by opens (live from your account)
            </p>
            <TopCampaignsChart
              campaigns={analyticsSummary?.topCampaigns ?? []}
            />
          </div>
        </section>

        {/* Account + funnel stats */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Campaign funnel
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Sent", value: dashboardMetrics.totalEmailsSent },
                { label: "Delivered", value: dashboardMetrics.totalDelivered },
                { label: "Opened", value: dashboardMetrics.totalOpened },
                { label: "Clicked", value: dashboardMetrics.totalClicked },
                { label: "Bounced", value: dashboardMetrics.totalBounced },
                { label: "Complaints", value: dashboardMetrics.totalComplained },
              ].map((item) => {
                const pct =
                  dashboardMetrics.totalEmailsSent > 0
                    ? (item.value / dashboardMetrics.totalEmailsSent) * 100
                    : 0;
                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <p className="text-lg font-bold text-slate-900">
                      {item.value.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-slate-700">
                      {item.label}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-brand-main transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {pct.toFixed(0)}% of sent
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Engagement score
              </h3>
              <div className="mt-3 flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0">
                  <svg className="h-24 w-24 -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      className="text-brand-main"
                      strokeWidth="8"
                      strokeDasharray={`${
                        (dashboardMetrics.engagementScore / 100) * 251.2
                      } 999`}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900">
                    {dashboardMetrics.engagementScore}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {dashboardMetrics.engagementScore >= 70
                    ? "Strong engagement across your campaigns."
                    : dashboardMetrics.engagementScore >= 40
                      ? "Solid baseline — test subjects and CTAs to lift opens."
                      : "Focus on list quality and message relevance."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Account snapshot
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Campaigns</dt>
                  <dd className="font-medium text-slate-900">
                    {dashboardMetrics.totalCampaigns}{" "}
                    <span className="text-slate-400">
                      ({dashboardMetrics.activeCampaigns} active)
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Monthly emails</dt>
                  <dd className="font-medium text-slate-900">
                    {dashboardMetrics.monthlyEmailsUsed.toLocaleString()} /{" "}
                    {dashboardMetrics.monthlyEmailsLimit.toLocaleString() || "—"}
                  </dd>
                </div>
                {!sesNotConfigured && (
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <dt className="text-slate-500">Today&apos;s quota</dt>
                      <dd className="font-medium text-slate-900">
                        {Math.round(quotaUsedPct)}% used
                      </dd>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-brand-main"
                        style={{ width: `${quotaUsedPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-brand-main/40 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-main/10 text-brand-main group-hover:bg-brand-main/20">
                    {action.icon}
                  </div>
                  <IconArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-brand-main" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900">
                  {action.title}
                </h4>
                <p className="text-sm text-slate-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
