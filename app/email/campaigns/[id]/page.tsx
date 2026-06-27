"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { CampaignDetailPage } from "@/components/campaigns/CampaignDetailPage";
import emailClient, {
  AnalyticsReportType,
  EnhancedCampaignAnalytics,
  getEmailServiceErrorMessage,
  getCampaignLeadSequence,
  getSubscriptionInfo,
  getEnhancedCampaignAnalytics,
  markLeadRepliedInCampaign,
} from "@/utils/api/emailClient";
import { exportLeadsnipperCampaignReportPDF } from "@/utils/pdfExport";

interface CampaignAnalyticsData {
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
    deliverabilityPauseReason?: string | null;
    deliverabilityAcknowledgedAt?: string | null;
    requiresDeliverabilityAcknowledgment?: boolean;
    reoonVerificationSummary?: { requireLeadVerification?: boolean };
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
    totalRead?: number;
    totalReplied?: number;
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
  sequenceSteps?: Array<{
    stepIndex: number;
    delayMinutes: number;
    subject: string;
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    read: number;
    replied: number;
    failed: number;
    pending?: number;
    processing?: number;
    remaining?: number;
    scheduledToday?: number;
    scheduledTomorrow?: number;
    nextPlannedSendAt?: string | null;
  }>;
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
  deliverability?: {
    alerts: Array<{
      id: string;
      type: string;
      severity: string;
      senderId: string;
      senderEmail: string;
      currentCap: number;
      usedToday: number;
      remainingToday: number;
      healthStatus?: string;
      bounceRate7d?: number;
      complaintRate7d?: number;
      reasons: string[];
      userMessage?: string;
      recordedAt: string;
      source: "live" | "event";
    }>;
    hasActiveIssue: boolean;
    throttledPendingCount: number;
  };
}

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [analytics, setAnalytics] = useState<CampaignAnalyticsData | null>(null);
  const [enhancedAnalytics, setEnhancedAnalytics] = useState<EnhancedCampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailedAnalyticsAllowed, setDetailedAnalyticsAllowed] = useState(false);
  const [activeReportDownload, setActiveReportDownload] = useState<AnalyticsReportType | null>(null);
  const [downloadingAllReports, setDownloadingAllReports] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [, setMarkingReplied] = useState<string | null>(null);

  const campaignStatusRef = useRef<string | null>(null);
  const initialLoadedRef = useRef(false);
  const lastRefreshRef = useRef<number>(Date.now());

  // ──────────── Data fetching ────────────
  const fetchCampaignAnalytics = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      try {
        if (!silent && !initialLoadedRef.current) setLoading(true);
        const response = await emailClient.get(
          `/api/analytics/campaigns/${campaignId}/analytics`
        );
        if (response.data.success) {
          setAnalytics(response.data.data);
          campaignStatusRef.current = response.data.data?.campaign?.status || null;
          initialLoadedRef.current = true;
        }
      } catch (error: any) {
        if (!silent) toast.error(error.response?.data?.message || "Failed to fetch campaign");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [campaignId]
  );

  const fetchEnhancedAnalytics = useCallback(async () => {
    if (!detailedAnalyticsAllowed) return;
    try {
      const data = await getEnhancedCampaignAnalytics(campaignId, { dateRange: "30d" });
      setEnhancedAnalytics(data);
    } catch (error: any) {
      if (error?.response?.status !== 403) console.error("Failed to fetch trend data:", error);
      setEnhancedAnalytics(null);
    }
  }, [campaignId, detailedAnalyticsAllowed]);

  const fetchAnalyticsAccess = useCallback(async () => {
    try {
      const sub = await getSubscriptionInfo();
      const tierName = String(sub?.tierName || "").toLowerCase();
      const subStatus = String(sub?.status || "").toLowerCase();
      const isTrialTier = tierName === "trial" || tierName === "byo_trial";
      const inactive = ["expired", "cancelled", "paused"].includes(subStatus);
      setDetailedAnalyticsAllowed(!isTrialTier && !inactive);
    } catch {
      setDetailedAnalyticsAllowed(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsAccess();
  }, [fetchAnalyticsAccess]);

  useEffect(() => {
    fetchCampaignAnalytics({ silent: false });
    if (detailedAnalyticsAllowed) fetchEnhancedAnalytics();
    else setEnhancedAnalytics(null);
  }, [campaignId, detailedAnalyticsAllowed, fetchCampaignAnalytics, fetchEnhancedAnalytics]);

  // Polling for active campaigns
  useEffect(() => {
    const interval = setInterval(() => {
      const st = campaignStatusRef.current;
      if (["sending", "verifying_leads", "scheduled", "verification_failed"].includes(st || "")) {
        const now = Date.now();
        if (now - lastRefreshRef.current > 60000) {
          lastRefreshRef.current = now;
          fetchCampaignAnalytics({ silent: true });
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [campaignId, fetchCampaignAnalytics]);

  // ──────────── Action handlers ────────────
  const handleMarkReplied = async (leadId: string) => {
    if (!analytics?.campaign?.domainId) return;
    setMarkingReplied(leadId);
    try {
      await markLeadRepliedInCampaign(analytics.campaign.domainId, campaignId, leadId);
      toast.success("Lead marked as replied. Sequence stopped for this lead.");
      await fetchCampaignAnalytics({ silent: true });
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to mark lead as replied"));
    } finally {
      setMarkingReplied(null);
    }
  };

  const handleDownloadFullReport = async () => {
    setDownloadingAllReports(true);
    try {
      setActiveReportDownload("overall_summary");
      if (!analytics) throw new Error("Campaign analytics not loaded");

      const reportSteps =
        analytics.sequenceSteps?.map((step) => ({
          stepNumber: Number(step.stepIndex || 0) + 1,
          subject: step.subject || "Untitled step",
          sent: step.sent || 0,
          opened: step.opened || 0,
          replied: step.replied || 0,
        })) || [];

      let reportLeads: any[] = [];
      try {
        const leadsResponse = await getCampaignLeadSequence(campaignId, 1, 100);
        reportLeads =
          leadsResponse.leads?.map((row: any) => ({
            email: row.toEmail,
            stepLabel: `Email ${Number(row.sequenceStepIndex || 0) + 1}`,
            status: String(row.status || "unknown"),
            nextSend: row.nextRetryAt ? new Date(row.nextRetryAt).toLocaleString() : undefined,
          })) || [];
      } catch {
        reportLeads = [];
      }

      exportLeadsnipperCampaignReportPDF(
        {
          campaign: {
            name: analytics.campaign.name,
            subject: analytics.campaign.subject,
            sender: analytics.campaign.fromName || analytics.campaign.fromEmail,
            fromEmail: analytics.campaign.fromEmail,
            status: analytics.campaign.status,
            createdAt: new Date(analytics.campaign.createdAt).toLocaleString(),
            startedAt: analytics.campaign.startedAt
              ? new Date(analytics.campaign.startedAt).toLocaleString()
              : undefined,
          },
          metrics: {
            sent: analytics.metrics.totalSent || 0,
            delivered: analytics.metrics.totalDelivered || 0,
            opened: analytics.metrics.totalOpened || 0,
            clicked: analytics.metrics.totalClicked || 0,
            replied: analytics.metrics.totalReplied || 0,
            bounced: analytics.metrics.totalBounced || 0,
            complained: analytics.metrics.totalComplained || 0,
            unsubscribed: analytics.metrics.totalUnsubscribed || 0,
            pending: analytics.metrics.pending || 0,
            failed: analytics.metrics.totalFailed || 0,
            rejected: analytics.metrics.totalRejected || 0,
          },
          steps: reportSteps,
          leads: reportLeads,
        },
        `${analytics.campaign.name.replace(/\s+/g, "-").toLowerCase()}-report`
      );
      toast.success("Styled PDF report downloaded");
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to download PDF report"));
    } finally {
      setActiveReportDownload(null);
      setDownloadingAllReports(false);
    }
  };

  // ──────────── Loading / error states ────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-700 text-lg font-medium">Loading campaign…</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-700 text-xl font-semibold mb-4">Campaign not found</p>
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

  return (
    <CampaignDetailPage
      campaignId={campaignId}
      analytics={analytics}
      enhancedAnalytics={enhancedAnalytics}
      onBack={() => router.push("/email/campaigns")}
      onRefresh={() => fetchCampaignAnalytics({ silent: true })}
      stopping={stopping}
      setStopping={setStopping}
      downloading={downloadingAllReports || !!activeReportDownload}
      onDownloadReport={() => void handleDownloadFullReport()}
      onMarkReplied={handleMarkReplied}
      onDeliverabilityAcknowledged={() => void fetchCampaignAnalytics({ silent: true })}
    />
  );
}
