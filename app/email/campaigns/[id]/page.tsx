"use client";

import {
  Loader2,
  OctagonX,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { CampaignAnalytics } from "@/components/analytics/CampaignAnalytics";
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
  AnalyticsReportType,
  CampaignLeadSequenceRow,
  EnhancedCampaignAnalytics,
  getEmailServiceErrorMessage,
  getCampaignLeadSequence,
  getSubscriptionInfo,
  getEnhancedCampaignAnalytics,
  markLeadRepliedInCampaign,
  stopCampaign,
} from "@/utils/api/emailClient";
import { exportLeadsnipperCampaignReportPDF } from "@/utils/pdfExport";

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
}

interface CampaignLeadIssue {
  id: string;
  leadId?: string;
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
  const [detailedAnalyticsAllowed, setDetailedAnalyticsAllowed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [activeReportDownload, setActiveReportDownload] = useState<AnalyticsReportType | null>(
    null
  );
  const [downloadingAllReports, setDownloadingAllReports] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [failedLeadIssues, setFailedLeadIssues] = useState<CampaignLeadIssue[]>([]);
  const [sequenceRows, setSequenceRows] = useState<CampaignLeadSequenceRow[]>([]);
  const [, setMarkingReplied] = useState<string | null>(null);
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
      const data = await getEnhancedCampaignAnalytics(campaignId, { dateRange: "30d" });
      setEnhancedAnalytics(data);
    } catch (error: any) {
      console.error("Failed to fetch enhanced analytics:", error);
      if (error?.response?.status !== 403) {
        toast.error("Failed to fetch trend data");
      }
      setEnhancedAnalytics(null);
    }
  }, [campaignId, detailedAnalyticsAllowed]);

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

  const fetchSequenceRows = useCallback(async () => {
    try {
      const response = await getCampaignLeadSequence(campaignId, 1, 200);
      setSequenceRows(response.leads || []);
    } catch {
      setSequenceRows([]);
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
    fetchSequenceRows();

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
        fetchSequenceRows();
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
    fetchSequenceRows,
  ]);

  const handleMarkReplied = async (leadId: string) => {
    if (!analytics?.campaign?.domainId) return;
    setMarkingReplied(leadId);
    try {
      await markLeadRepliedInCampaign(analytics.campaign.domainId, campaignId, leadId);
      toast.success("Lead marked as replied. Sequence stopped for this lead.");
      await fetchCampaignAnalytics({ silent: true });
      await fetchSequenceRows();
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
      if (!analytics) {
        throw new Error("Campaign analytics not loaded");
      }

      const reportSteps =
        analytics.sequenceSteps?.map((step) => ({
          stepNumber: Number(step.stepIndex || 0) + 1,
          subject: step.subject || "Untitled step",
          sent: step.sent || 0,
          opened: step.opened || 0,
          replied: step.replied || 0,
        })) || [];

      const reportLeads =
        sequenceRows?.map((row) => ({
          email: row.toEmail,
          stepLabel: `Email ${Number(row.sequenceStepIndex || 0) + 1}`,
          status: String(row.status || "unknown"),
          nextSend: row.nextRetryAt ? new Date(row.nextRetryAt).toLocaleString() : undefined,
        })) || [];

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
  const sendVolume = analytics.sendVolume;
  const isSequenceCampaign = (analytics.sequenceSteps?.length || 0) > 1;

  const campaignStatusNorm = String(campaign.status || "").trim();
  const canStopCampaign =
    !!campaign.domainId &&
    ["draft", "sending", "scheduled", "verifying_leads", "paused", "verification_failed"].includes(
      campaignStatusNorm
    );
  const sequenceEditHref =
    isSequenceCampaign && campaign.domainId
      ? `/email/campaigns/builder?domainId=${campaign.domainId}&id=${campaign.id}&liveSequenceEdit=1`
      : null;
  const mappedSteps =
    analytics.sequenceSteps?.map((step) => {
      const hasSent = (step.sent || 0) > 0;
      const hasPending = (step.pending || 0) > 0 || (step.remaining || 0) > 0;
      return {
        stepNumber: Number(step.stepIndex || 0) + 1,
        dayOffset: Math.max(0, Math.round((step.delayMinutes || 0) / 1440)),
        subject: step.subject || "Untitled step",
        totalInStep: step.total || 0,
        sent: step.sent || 0,
        delivered: step.delivered || 0,
        opened: step.opened || 0,
        replied: step.replied || 0,
        nextSendAt: step.nextPlannedSendAt
          ? new Date(step.nextPlannedSendAt).toLocaleString()
          : undefined,
        status: hasSent ? "done" : hasPending ? "pending" : "waiting",
      } as const;
    }) || [];

  const mappedLeads = sequenceRows.map((row) => {
    const normalizedStatus = String(row.status || "").toLowerCase();
    const status =
      normalizedStatus === "opened" || normalizedStatus === "read"
        ? "opened"
        : normalizedStatus === "pending" ||
          normalizedStatus === "queued" ||
          normalizedStatus === "processing"
        ? "pending"
        : normalizedStatus === "failed" ||
          normalizedStatus === "rejected" ||
          normalizedStatus === "bounced"
        ? "failed"
        : "delivered";

    return {
      email: row.toEmail,
      stepLabel: `Email ${Number(row.sequenceStepIndex || 0) + 1}`,
      stepNumber: Number(row.sequenceStepIndex || 0) + 1,
      status: status as "delivered" | "opened" | "pending" | "failed",
      nextSend: row.nextRetryAt ? new Date(row.nextRetryAt).toLocaleString() : undefined,
      sent: Boolean(row.sentAt),
      read: Boolean(row.readAt || row.openedAt),
      replied: Boolean(row.repliedAt),
      onMarkReplied: () => {
        if (!row.leadId || !campaign.domainId) return;
        void handleMarkReplied(row.leadId);
      },
    };
  });

  const groupedStepTrends = sequenceRows.reduce<
    Record<string, { date: string; stepNumber: number; sent: number; opened: number; clicked: number }>
  >((acc, row) => {
    const stepNumber = Number(row.sequenceStepIndex || 0) + 1;
    const sentDate = row.sentAt ? new Date(row.sentAt).toISOString().split("T")[0] : null;
    const openDate = row.openedAt ? new Date(row.openedAt).toISOString().split("T")[0] : null;
    const clickDate = row.engagementStatus === "clicked" && row.openedAt
      ? new Date(row.openedAt).toISOString().split("T")[0]
      : null;

    if (sentDate) {
      const key = `${sentDate}-${stepNumber}`;
      if (!acc[key]) {
        acc[key] = { date: sentDate, stepNumber, sent: 0, opened: 0, clicked: 0 };
      }
      acc[key].sent += 1;
    }
    if (openDate) {
      const key = `${openDate}-${stepNumber}`;
      if (!acc[key]) {
        acc[key] = { date: openDate, stepNumber, sent: 0, opened: 0, clicked: 0 };
      }
      acc[key].opened += 1;
    }
    if (clickDate) {
      const key = `${clickDate}-${stepNumber}`;
      if (!acc[key]) {
        acc[key] = { date: clickDate, stepNumber, sent: 0, opened: 0, clicked: 0 };
      }
      acc[key].clicked += 1;
    }
    return acc;
  }, {});

  const trendData = Object.values(groupedStepTrends).length
    ? Object.values(groupedStepTrends).sort((a, b) => a.date.localeCompare(b.date))
    : enhancedAnalytics?.timeSeries?.map((point) => ({
        date: point.date,
        sent: point.sent || 0,
        opened: point.opened || 0,
        clicked: point.clicked || 0,
      })) ||
      sendVolume?.sendsByDay?.map((day) => ({
        date: day.date,
        sent: day.count || 0,
        opened: 0,
        clicked: 0,
      })) ||
      [];

  const campaignMode = isSequenceCampaign ? "sequence" : "single";

  return (
    <>
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
      <CampaignAnalytics
        mode={campaignMode}
        campaign={{
          id: campaign.id,
          name: campaign.name,
          status:
            campaign.status === "paused" ||
            campaign.status === "completed" ||
            campaign.status === "sending" ||
            campaign.status === "scheduled" ||
            campaign.status === "draft" ||
            campaign.status === "cancelled"
              ? campaign.status
              : "live",
          sender: campaign.fromName || campaign.fromEmail,
          subject: campaign.subject,
          fromEmail: campaign.fromEmail,
          replyTo: campaign.fromEmail,
          createdAt: new Date(campaign.createdAt).toLocaleString(),
          startedAt: campaign.startedAt
            ? new Date(campaign.startedAt).toLocaleString()
            : "Not started yet",
          totalEmails: Math.max(metrics.totalLeads || 0, analytics.progress?.total || 0),
          sentEmails: metrics.totalSent || 0,
        }}
        metrics={{
          sent: metrics.totalSent || 0,
          delivered: metrics.totalDelivered || 0,
          opened: metrics.totalOpened || 0,
          clicked: metrics.totalClicked || 0,
          replied: metrics.totalReplied || 0,
          bounced: metrics.totalBounced || 0,
          complained: metrics.totalComplained || 0,
          unsubscribed: metrics.totalUnsubscribed || 0,
          pending: metrics.pending || 0,
          failed: (metrics.totalFailed || 0) + (metrics.totalRejected || 0),
          rejected: metrics.totalRejected || 0,
        }}
        steps={mappedSteps}
        leads={mappedLeads}
        trendData={trendData}
        onStopCampaign={canStopCampaign ? () => setStopDialogOpen(true) : undefined}
        onEditCampaign={
          sequenceEditHref
            ? () => router.push(sequenceEditHref)
            : campaign.domainId
            ? () =>
                router.push(
                  `/email/campaigns/builder?domainId=${campaign.domainId}&id=${campaign.id}`
                )
            : undefined
        }
        onDownloadReport={() => void handleDownloadFullReport()}
        onBack={() => router.push("/email/campaigns")}
        showDownload
        downloading={downloadingAllReports || !!activeReportDownload}
        stopping={stopping}
      />
      {failedLeadIssues.length > 0 && (
        <div className="mx-auto max-w-[1000px] px-4 pb-10">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-800 mb-2">Recent failed deliveries</p>
            <div className="space-y-2">
              {failedLeadIssues.slice(0, 3).map((lead) => (
                <div key={lead.id} className="text-xs text-red-700">
                  <span className="font-medium">{lead.toEmail}</span> -{" "}
                  {(lead.errorDetails || lead.error || "Send failed").toString().slice(0, 120)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {!subscriptionLoading && !detailedAnalyticsAllowed && (
        <div className="mx-auto max-w-[1000px] px-4 pb-10">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Detailed analytics is locked</p>
            <p className="text-xs text-amber-800 mt-1">
              Trial plans include core analytics. Upgrade to unlock advanced filtered trends.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
