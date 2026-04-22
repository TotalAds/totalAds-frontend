"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Mail,
  MousePointerClick,
  RefreshCw,
  Send,
  TrendingUp,
  XCircle,
  AlertTriangle,
  UserMinus,
  FileX,
  Loader2,
  OctagonX,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { FilterPanel } from "@/components/campaign-analytics/FilterPanel";
import KPICard from "@/components/campaign-analytics/KPICard";
import { MetricsSummary } from "@/components/campaign-analytics/MetricsSummary";
import { TrendChart } from "@/components/campaign-analytics/TrendChart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import emailClient, {
  EnhancedAnalyticsFilters,
  EnhancedCampaignAnalytics,
  getEmailServiceErrorMessage,
  getSubscriptionInfo,
  getEnhancedCampaignAnalytics,
  stopCampaign,
} from "@/utils/api/emailClient";
import { exportCampaignAnalyticsToPDF } from "@/utils/pdfExport";

interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    htmlContent: string;
    status: string;
    domainId?: string;
    createdAt: string;
    startedAt?: string;
    updatedAt: string;
  };
  metrics: {
    totalLeads: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalFailed: number;
    totalComplained: number;
    totalRejected: number;
    totalRenderingFailures: number;
    totalDeliveryDelays: number;
    totalUnsubscribed: number;
    pending: number;
    processing: number;
  };
  rates: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
    deliveryRate: number;
    failureRate: number;
    unsubscribeRate: number;
    ctrRate: number;
  };
  progress: {
    percentage: number;
    completed: number;
    total: number;
  };
  todayVerification?: {
    verified: number;
    blocked: number;
    sent: number;
  };
  sendVolume?: {
    calendar: "utc";
    sentToday: number;
    sentYesterday: number;
    sendsByDay: Array<{ date: string; count: number }>;
  };
  reoon?: {
    used: boolean;
    mode: string | null;
    totalLeadsBeforeVerification: number | null;
    totalLeadsAfterVerification: number | null;
    excludedAsRisky: number | null;
    verificationJobFailed?: boolean;
    errorMessage?: string | null;
    failedAt?: string | null;
  } | null;
}

interface CampaignLeadIssue {
  id: string;
  toEmail: string;
  status: string;
  error?: string | null;
  errorDetails?: string | null;
  retryCount?: number;
}

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [enhancedAnalytics, setEnhancedAnalytics] =
    useState<EnhancedCampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [detailedAnalyticsAllowed, setDetailedAnalyticsAllowed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trends">("trends");
  const [filters, setFilters] = useState<EnhancedAnalyticsFilters>({
    dateRange: "30d",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [failedLeadIssues, setFailedLeadIssues] = useState<CampaignLeadIssue[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const campaignStatusRef = useRef<string | null>(null);
  const initialLoadedRef = useRef(false);

  const fetchCampaignAnalytics = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    try {
      // Show fullscreen loader only on first load, not during background polling.
      if (!silent && !initialLoadedRef.current) {
        setLoading(true);
      }
      const response = await emailClient.get(
        `/api/analytics/campaigns/${campaignId}/analytics`
      );
      if (response.data.success) {
        setAnalytics(response.data.data);
        campaignStatusRef.current = response.data.data?.campaign?.status || null;
        initialLoadedRef.current = true;
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.response?.data?.message || "Failed to fetch campaign");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [campaignId]);

  const fetchEnhancedAnalytics = useCallback(async () => {
    if (!detailedAnalyticsAllowed) return;
    try {
      setEnhancedLoading(true);
      const data = await getEnhancedCampaignAnalytics(campaignId, filters);
      setEnhancedAnalytics(data);
    } catch (error: any) {
      console.error("Failed to fetch enhanced analytics:", error);
      if (error?.response?.status !== 403) {
        toast.error("Failed to fetch trend data");
      }
      setEnhancedAnalytics(null);
    } finally {
      setEnhancedLoading(false);
    }
  }, [campaignId, detailedAnalyticsAllowed, filters]);

  const fetchAnalyticsAccess = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      const sub = await getSubscriptionInfo();
      const tierName = String(sub?.tierName || "").toLowerCase();
      const subStatus = String(sub?.status || "").toLowerCase();
      const isTrialTier = tierName === "trial" || tierName === "byo_trial";
      const inactive =
        subStatus === "expired" ||
        subStatus === "cancelled" ||
        subStatus === "paused";
      const allowed = !isTrialTier && !inactive;
      setDetailedAnalyticsAllowed(Boolean(allowed));
      if (!allowed) {
        setEnhancedAnalytics(null);
      }
    } catch (error) {
      setDetailedAnalyticsAllowed(false);
      setEnhancedAnalytics(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const fetchLeadIssues = useCallback(async () => {
    try {
      const response = await emailClient.get(
        `/api/analytics/campaigns/${campaignId}/leads?page=1&limit=100`
      );
      const leads: CampaignLeadIssue[] = response?.data?.data?.leads || [];
      const failed = leads.filter(
        (lead) =>
          lead.status === "failed" && (!!lead.error || !!lead.errorDetails)
      );
      setFailedLeadIssues(failed.slice(0, 8));
    } catch (error) {
      console.error("Failed to fetch campaign lead issues:", error);
      setFailedLeadIssues([]);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchAnalyticsAccess();
  }, [fetchAnalyticsAccess]);

  useEffect(() => {
    fetchCampaignAnalytics({ silent: false });
    if (detailedAnalyticsAllowed) {
      fetchEnhancedAnalytics();
    } else {
      setEnhancedAnalytics(null);
    }
    fetchLeadIssues();

    // Poll only lightweight campaign/issue data while campaign is active.
    // Avoid reloading enhanced charts every cycle to prevent UI flicker.
    const interval = setInterval(() => {
      const st = campaignStatusRef.current;
      if (
        st === "sending" ||
        st === "verifying_leads" ||
        st === "scheduled" ||
        st === "verification_failed"
      ) {
        fetchCampaignAnalytics({ silent: true });
        fetchLeadIssues();
        if (detailedAnalyticsAllowed) {
          fetchEnhancedAnalytics();
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [
    campaignId,
    fetchCampaignAnalytics,
    detailedAnalyticsAllowed,
    fetchAnalyticsAccess,
    fetchEnhancedAnalytics,
    fetchLeadIssues,
  ]);

  const handleExportPDF = async () => {
    if (!enhancedAnalytics || !analytics) {
      toast.error("Analytics data not available");
      return;
    }
    
    setIsExporting(true);
    try {
      // Ensure trends tab is active to show charts
      if (activeTab !== "trends") {
        setActiveTab("trends");
        // Wait for charts to render
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get all chart elements from the trends section
      const chartContainer = chartRef.current;
      if (!chartContainer) {
        toast.error("No chart data available to export");
        setIsExporting(false);
        return;
      }
      
      // Wait a bit more for any animations
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await exportCampaignAnalyticsToPDF(
        enhancedAnalytics,
        chartContainer,
        {
          filename: `campaign-${enhancedAnalytics.campaign.name}-analytics`,
          campaignData: analytics,
        }
      );
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyFilters = () => {
    fetchEnhancedAnalytics();
  };

  const handleResetFilters = () => {
    setFilters({ dateRange: "30d" });
  };

  const executeStopCampaign = async () => {
    if (!analytics?.campaign?.domainId) {
      toast.error("Missing domain for this campaign; cannot stop from here.");
      setStopDialogOpen(false);
      return;
    }
    setStopping(true);
    try {
      const result = await stopCampaign(analytics.campaign.domainId, campaignId);
      const msg =
        typeof result?.message === "string"
          ? result.message
          : "Campaign stopped. No further emails will be sent.";
      toast.success(msg);
      const nextStatus =
        (result as { campaign?: { status?: string } })?.campaign?.status;
      campaignStatusRef.current =
        typeof nextStatus === "string" ? nextStatus : "cancelled";
      setStopDialogOpen(false);
      await fetchCampaignAnalytics({ silent: false });
      await fetchLeadIssues();
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Could not stop this campaign"));
    } finally {
      setStopping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-700 text-lg font-medium">
            Loading campaign analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-700 text-xl font-semibold mb-4">
            Campaign not found
          </p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const campaign = analytics.campaign;
  const metrics = analytics.metrics;
  const rates = analytics.rates;
  const progress = analytics.progress;
  const reoon = analytics.reoon;
  const todayVerification = analytics.todayVerification;
  const sendVolume = analytics.sendVolume;

  const campaignStatusNorm = String(campaign.status || "").trim();
  const canStopCampaign =
    !!campaign.domainId &&
    ["draft", "sending", "scheduled", "verifying_leads", "paused", "verification_failed"].includes(
      campaignStatusNorm
    );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "sending":
        return "bg-blue-100 border-blue-300 text-blue-700";
      case "verifying_leads":
        return "bg-violet-100 border-violet-300 text-violet-800";
      case "completed":
        return "bg-emerald-100 border-emerald-300 text-emerald-700";
      case "failed":
        return "bg-red-100 border-red-300 text-red-700";
      case "paused":
        return "bg-amber-100 border-amber-300 text-amber-700";
      case "draft":
        return "bg-slate-100 border-slate-300 text-slate-700";
      case "scheduled":
        return "bg-sky-100 border-sky-300 text-sky-800";
      case "verification_failed":
        return "bg-red-100 border-red-300 text-red-800";
      case "cancelled":
        return "bg-rose-100 border-rose-300 text-rose-800";
      default:
        return "bg-slate-100 border-slate-300 text-slate-600";
    }
  };

  const campaignStatusLabel = (status: string) => {
    if (status === "verifying_leads") return "Verifying leads";
    if (status === "verification_failed") return "Verification failed";
    if (status === "cancelled") return "Stopped";
    if (status === "scheduled") return "Ready to send";
    return (
      status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Dialog
        open={stopDialogOpen}
        onOpenChange={(open) => {
          if (!open && stopping) return;
          setStopDialogOpen(open);
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <OctagonX className="h-5 w-5 text-rose-700" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-3 text-left">
                <DialogTitle className="text-lg font-semibold leading-snug text-slate-900">
                  Stop this campaign?
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>
                      This ends the campaign for this audience. No further steps or emails will
                      send, including any scheduled for later days.
                    </p>
                    <ul className="list-disc space-y-1.5 pl-5">
                      <li>Queued and unsent messages are cancelled.</li>
                      <li>Emails already delivered are not recalled.</li>
                      <li>You can still view analytics for this campaign.</li>
                    </ul>
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200"
              onClick={() => setStopDialogOpen(false)}
              disabled={stopping}
            >
              Keep campaign
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void executeStopCampaign()}
              disabled={stopping}
            >
              {stopping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Stopping…
                </>
              ) : (
                <>
                  <OctagonX className="h-4 w-4 mr-2" />
                  Stop campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto p-4">
        {/* Ultra Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {campaign.name}
                </h1>
                <p className="text-xs text-slate-500">
                  {campaign.subject}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                  campaign.status
                )}`}
              >
                {campaignStatusLabel(campaign.status)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {detailedAnalyticsAllowed && (
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                />
              )}
              {canStopCampaign && (
                <Button
                  type="button"
                  onClick={() => setStopDialogOpen(true)}
                  variant="destructive"
                  size="sm"
                  title="Stop this campaign so no further emails are sent"
                >
                  <OctagonX className="h-4 w-4 mr-2" />
                  Stop campaign
                </Button>
              )}
              <Button
                onClick={handleExportPDF}
                disabled={isExporting || !enhancedAnalytics || !detailedAnalyticsAllowed}
                variant="outline"
                size="sm"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
            </div>
          </div>

          {campaign.status === "cancelled" && (
            <div className="bg-rose-50 rounded-lg border border-rose-200 p-3 mb-4">
              <p className="text-xs font-medium text-rose-950">
                This campaign was stopped. No further emails will be sent for it;
                messages already delivered are unchanged.
              </p>
            </div>
          )}

          {campaign.status === "verifying_leads" && (
            <div className="bg-violet-50 rounded-lg border border-violet-200 p-3 mb-4">
              <p className="text-xs text-violet-900">
                We are verifying your recipient list with Reoon. Sending stays
                disabled until this finishes. You will get an email when
                verification completes.
              </p>
            </div>
          )}

          {campaign.status === "scheduled" && campaign.domainId && (
            <div className="bg-sky-50 rounded-lg border border-sky-200 p-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-sky-950">
                Verification finished. Your list is ready — open the builder to
                review and send (same flow as a new campaign).
              </p>
              <Link
                href={`/email/campaigns/builder?domainId=${campaign.domainId}&id=${campaign.id}`}
                className="inline-flex items-center justify-center rounded-md bg-sky-600 text-white text-xs font-semibold px-3 py-2 hover:bg-sky-700 shrink-0"
              >
                Review &amp; send
              </Link>
            </div>
          )}

          {campaign.status === "verification_failed" && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-3 mb-4">
              <p className="text-xs font-semibold text-red-900 mb-1">
                Lead verification failed
              </p>
              <p className="text-xs text-red-900">
                {reoon?.errorMessage ||
                  "Something went wrong while verifying with Reoon. You can try again from the builder or contact support if this persists."}
              </p>
              {campaign.domainId && (
                <Link
                  href={`/email/campaigns/builder?domainId=${campaign.domainId}&id=${campaign.id}`}
                  className="inline-block mt-2 text-xs font-semibold text-red-800 underline"
                >
                  Open in builder to retry or adjust recipients
                </Link>
              )}
            </div>
          )}

          {/* Progress Bar - Ultra Compact */}
          {campaign.status === "sending" && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700">
                  Sending in progress
                </span>
                <span className="text-base font-bold text-blue-600">
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                {progress.completed.toLocaleString()} of {progress.total.toLocaleString()} emails sent
              </p>
            </div>
          )}
        </div>

        {/* Main Metrics - All in First View - Ultra Compact */}
        <div className="space-y-4">
          {todayVerification && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-slate-600" />
                <h2 className="text-base font-semibold text-slate-900">
                  Today: Verification Pipeline
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <KPICard
                  label="Verified"
                  value={todayVerification.verified}
                  icon={CheckCircle2}
                  color="blue"
                  description="Reached verify decision today"
                  compact
                />
                <KPICard
                  label="Blocked"
                  value={todayVerification.blocked}
                  icon={FileX}
                  color="red"
                  description="Failed verification (invalid/risky)"
                  compact
                />
                <KPICard
                  label="Sent"
                  value={todayVerification.sent}
                  icon={Send}
                  color="green"
                  description="Successfully sent today"
                  compact
                />
              </div>
            </div>
          )}

          {sendVolume && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-slate-600" />
                <h2 className="text-base font-semibold text-slate-900">
                  Send activity
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Emails sent per calendar day (UTC). Matches your daily send pacing
                across time zones.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Today (UTC)
                  </p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                    {sendVolume.sentToday.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Yesterday (UTC)
                  </p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                    {sendVolume.sentYesterday.toLocaleString()}
                  </p>
                </div>
              </div>
              {sendVolume.sendsByDay.length > 0 ? (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
                        <th className="py-2 px-3">Day (UTC)</th>
                        <th className="py-2 px-3 text-right">Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sendVolume.sendsByDay.map((row) => (
                        <tr
                          key={row.date}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                        >
                          <td className="py-2 px-3 font-mono text-slate-800">
                            {row.date}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-900 tabular-nums">
                            {row.count.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No sends recorded yet for this campaign.
                </p>
              )}
            </div>
          )}

          {/* Primary Performance Metrics - Single Row */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Performance Metrics
              </h2>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              <KPICard
                label="Recipients"
                value={metrics.totalLeads}
                icon={Mail}
                color="blue"
                description={`${rates.deliveryRate.toFixed(1)}% delivered`}
                compact
              />
              <KPICard
                label="Delivered"
                value={metrics.totalDelivered}
                icon={CheckCircle2}
                color="green"
                description={`${rates.deliveryRate.toFixed(1)}%`}
                compact
              />
              <KPICard
                label="Opened"
                value={metrics.totalOpened}
                icon={Eye}
                color="purple"
                description={`${rates.openRate.toFixed(1)}%`}
                compact
              />
              <KPICard
                label="Clicked"
                value={metrics.totalClicked}
                icon={MousePointerClick}
                color="pink"
                description={`${rates.clickRate.toFixed(1)}%`}
                compact
              />
              <KPICard
                label="Sent"
                value={metrics.totalSent}
                icon={Send}
                color="blue"
                compact
              />
              <KPICard
                label="Bounced"
                value={metrics.totalBounced ?? 0}
                icon={FileX}
                color="orange"
                description={metrics.totalBounced > 0 ? `${rates.bounceRate.toFixed(1)}%` : undefined}
                compact
              />
              <KPICard
                label="Complaints"
                value={metrics.totalComplained ?? 0}
                icon={AlertTriangle}
                color="red"
                description={metrics.totalComplained > 0 ? `${rates.complaintRate.toFixed(1)}%` : undefined}
                compact
              />
              <KPICard
                label="Unsubscribed"
                value={metrics.totalUnsubscribed ?? 0}
                icon={UserMinus}
                color="yellow"
                description={metrics.totalUnsubscribed > 0 ? `${rates.unsubscribeRate?.toFixed(1) ?? 0}%` : undefined}
                compact
              />
            </div>

            {/* Key Rates - Compact Row */}
            <div className="grid grid-cols-4 gap-4 pt-3 mt-3 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Open Rate</p>
                <p className="text-lg font-bold text-slate-900">
                  {rates.openRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Click Rate</p>
                <p className="text-lg font-bold text-slate-900">
                  {rates.clickRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">CTR</p>
                <p className="text-lg font-bold text-slate-900">
                  {rates.ctrRate?.toFixed(1) ?? 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Delivery Rate</p>
                <p className="text-lg font-bold text-slate-900">
                  {rates.deliveryRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Status & Issues - Single Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Delivery Status
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <KPICard
                  label="Pending"
                  value={metrics.pending}
                  icon={Clock}
                  color="yellow"
                  compact
                />
                <KPICard
                  label="Processing"
                  value={metrics.processing}
                  icon={Loader2}
                  color="slate"
                  compact
                />
                <KPICard
                  label="Failed"
                  value={metrics.totalFailed}
                  icon={XCircle}
                  color="red"
                  compact
                />
                <KPICard
                  label="Rejected"
                  value={metrics.totalRejected ?? 0}
                  icon={XCircle}
                  color="red"
                  compact
                />
              </div>
              {failedLeadIssues.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Recent Failed Deliveries
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {failedLeadIssues.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded border border-red-200 bg-red-50 p-2"
                      >
                        <p className="text-xs font-medium text-red-900 truncate">
                          {lead.toEmail}
                        </p>
                        <p className="text-xs text-red-700">
                          {(lead.errorDetails || lead.error || "Send failed")
                            .toString()
                            .slice(0, 160)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Campaign Info - Compact */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Campaign Info
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-slate-500">From</p>
                  <p className="text-slate-900 font-medium">
                    {campaign.fromName || campaign.fromEmail}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="text-slate-900 font-medium text-xs truncate">
                    {campaign.fromEmail}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-500">Created</p>
                    <p className="text-slate-900 font-medium">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {campaign.startedAt && (
                    <div>
                      <p className="text-slate-500">Started</p>
                      <p className="text-slate-900 font-medium">
                        {new Date(campaign.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                {reoon?.excludedAsRisky != null && reoon.excludedAsRisky > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <p className="text-slate-500">Risky leads excluded</p>
                    <p className="text-slate-900 font-medium">
                      {reoon.excludedAsRisky.toLocaleString()} before send
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trends Tab Only */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex gap-1 border-b border-slate-200 px-4 pt-3">
              <button
                onClick={() => setActiveTab("trends")}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === "trends"
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                Trends & Detailed Charts
              </button>
            </div>

            {/* Trends Tab - Enhanced with More Charts */}
            {activeTab === "trends" && (
              <div className="p-4 space-y-4">
                {/* Filter Panel - Compact */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Performance Trends & Analytics
                  </h3>
                  {detailedAnalyticsAllowed && (
                    <FilterPanel
                      filters={filters}
                      onFiltersChange={setFilters}
                      onApply={handleApplyFilters}
                      onReset={handleResetFilters}
                    />
                  )}
                </div>

                {!subscriptionLoading && !detailedAnalyticsAllowed && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Detailed analytics is locked
                    </p>
                    <p className="text-xs text-amber-800 mt-1">
                      Trial plans (including BYO trial) get basic analytics
                      only. Upgrade to any paid plan to unlock advanced trend
                      charts, filters, and detailed analytics.
                    </p>
                  </div>
                )}

                {/* Enhanced Metrics Summary */}
                {detailedAnalyticsAllowed && enhancedAnalytics && (
                  <>
                    <MetricsSummary
                      summary={enhancedAnalytics.summary}
                      rates={enhancedAnalytics.rates}
                    />

                    {/* Main Performance Chart */}
                    <div ref={chartRef} className="space-y-4">
                      <TrendChart
                        data={enhancedAnalytics.timeSeries}
                        title="Overall Performance Trends"
                        height={280}
                        metrics={["sent", "opened", "clicked"]}
                      />

                      {/* Multiple Detailed Charts Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <TrendChart
                          data={enhancedAnalytics.timeSeries}
                          title="Delivery Performance"
                          height={220}
                          metrics={["sent", "bounced"]}
                          showLegend={true}
                        />
                        <TrendChart
                          data={enhancedAnalytics.timeSeries}
                          title="Engagement Trends"
                          height={220}
                          metrics={["opened", "clicked"]}
                          showLegend={true}
                        />
                        <TrendChart
                          data={enhancedAnalytics.timeSeries}
                          title="Issue Tracking"
                          height={220}
                          metrics={["bounced", "complained", "unsubscribed"]}
                          showLegend={true}
                        />
                        <TrendChart
                          data={enhancedAnalytics.timeSeries}
                          title="Conversion Funnel"
                          height={220}
                          metrics={["sent", "opened", "clicked"]}
                          showLegend={true}
                        />
                      </div>

                      {/* Rate Trends Chart */}
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">
                          Rate Trends Over Time
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Open Rate Trend</p>
                            <p className="text-lg font-bold text-purple-600">
                              {enhancedAnalytics.rates.openRate.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Click Rate Trend</p>
                            <p className="text-lg font-bold text-pink-600">
                              {enhancedAnalytics.rates.clickRate.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">CTR Trend</p>
                            <p className="text-lg font-bold text-blue-600">
                              {enhancedAnalytics.rates.ctrRate?.toFixed(1) ?? 0}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Delivery Rate Trend</p>
                            <p className="text-lg font-bold text-emerald-600">
                              {enhancedAnalytics.rates.deliveryRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Applied Filters Info */}
                      {enhancedAnalytics.appliedFilters && (
                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                          <p className="text-xs text-blue-800">
                            <span className="font-semibold">Date Range:</span>{" "}
                            {enhancedAnalytics.appliedFilters.dateRange === "7d"
                              ? "Last 7 days"
                              : enhancedAnalytics.appliedFilters.dateRange ===
                                "30d"
                              ? "Last 30 days"
                              : `${
                                  enhancedAnalytics.appliedFilters.startDate?.split(
                                    "T"
                                  )[0]
                                } to ${
                                  enhancedAnalytics.appliedFilters.endDate?.split(
                                    "T"
                                  )[0]
                                }`}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {detailedAnalyticsAllowed && enhancedLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-slate-500 text-xs font-medium">
                        Loading trend data...
                      </p>
                    </div>
                  </div>
                )}

                {detailedAnalyticsAllowed && !enhancedLoading && !enhancedAnalytics && (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-500 text-xs font-medium">
                      No trend data available for this campaign.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
