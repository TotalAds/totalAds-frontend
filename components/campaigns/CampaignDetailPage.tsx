"use client";

import {
  ArrowLeft,
  BarChart2,
  Users,
  Mail,
  Calendar,
  Settings,
  Play,
  Pause,
  StopCircle,
  Edit3,
  Loader2,
  OctagonX,
  MoreHorizontal,
  Download,
  Shield,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { AnalyticsTab } from "@/components/campaigns/tabs/AnalyticsTab";
import { LeadsTab } from "@/components/campaigns/tabs/LeadsTab";
import { SequenceTab } from "@/components/campaigns/tabs/SequenceTab";
import { ScheduleTab } from "@/components/campaigns/tabs/ScheduleTab";
import { OptionsTab } from "@/components/campaigns/tabs/OptionsTab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  pauseCampaign,
  sendCampaign,
  stopCampaign,
  restartCampaign,
  getEmailServiceErrorMessage,
} from "@/utils/api/emailClient";

type TabId = "analytics" | "leads" | "sequence" | "schedule" | "options";

const TABS: { id: TabId; label: string; icon: typeof BarChart2 }[] = [
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "leads", label: "Leads", icon: Users },
  { id: "sequence", label: "Sequence", icon: Mail },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "options", label: "Options", icon: Settings },
];

interface CampaignDetailPageProps {
  campaignId: string;
  analytics: any;
  enhancedAnalytics: any;
  onBack: () => void;
  onRefresh: () => void;
  stopping: boolean;
  setStopping: (v: boolean) => void;
  downloading: boolean;
  onDownloadReport: () => void;
  onMarkReplied: (leadId: string) => Promise<void>;
  onDeliverabilityAcknowledged: () => void;
}

function getStatusConfig(status: string) {
  switch (status) {
    case "sending":
    case "live":
    case "scheduled":
      return {
        label: status === "scheduled" ? "Scheduled" : "Running",
        dotColor: "bg-green-500",
        badgeBg: "bg-green-50 border-green-200 text-green-700",
        pulse: true,
      };
    case "paused":
      return {
        label: "Paused",
        dotColor: "bg-amber-500",
        badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
        pulse: false,
      };
    case "completed":
      return {
        label: "Completed",
        dotColor: "bg-blue-500",
        badgeBg: "bg-blue-50 border-blue-200 text-blue-700",
        pulse: false,
      };
    case "cancelled":
      return {
        label: "Stopped",
        dotColor: "bg-slate-400",
        badgeBg: "bg-slate-50 border-slate-200 text-slate-600",
        pulse: false,
      };
    case "verifying_leads":
      return {
        label: "Verifying",
        dotColor: "bg-purple-500",
        badgeBg: "bg-purple-50 border-purple-200 text-purple-700",
        pulse: true,
      };
    default:
      return {
        label: "Draft",
        dotColor: "bg-slate-400",
        badgeBg: "bg-slate-100 border-slate-200 text-slate-600",
        pulse: false,
      };
  }
}

export function CampaignDetailPage({
  campaignId,
  analytics,
  enhancedAnalytics,
  onBack,
  onRefresh,
  stopping,
  setStopping,
  downloading,
  onDownloadReport,
  onMarkReplied,
  onDeliverabilityAcknowledged,
}: CampaignDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("analytics");
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [pausingCampaign, setPausingCampaign] = useState(false);
  const [launchingCampaign, setLaunchingCampaign] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [pendingLaunchWithVerification, setPendingLaunchWithVerification] = useState<
    boolean | null
  >(null);

  const campaign = analytics?.campaign;
  const metrics = analytics?.metrics;
  const rates = analytics?.rates;
  const sendVolume = analytics?.sendVolume;

  if (!campaign) return null;

  const status = campaign.status || "draft";
  const statusConfig = getStatusConfig(status);
  const domainId = campaign.domainId;

  const isDraft = status === "draft";
  const isRunning = ["sending", "live", "scheduled"].includes(status);
  const isPaused = status === "paused";
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isVerifying = status === "verifying_leads";

  const mappedSteps = (() => {
    const rawSteps: any[] = analytics?.sequenceSteps || [];
    let cumulativeMinutes = 0;
    return rawSteps.map((step: any) => {
      // delayMinutes on each step is relative ("wait after previous step").
      // We accumulate to get the absolute day offset from campaign start.
      cumulativeMinutes += Math.max(0, Number(step.delayMinutes || 0));
      const hasSent = (step.sent || 0) > 0;
      const hasPending = (step.pending || 0) > 0 || (step.remaining || 0) > 0;
      return {
        stepNumber: Number(step.stepIndex || 0) + 1,
        dayOffset: Math.round(cumulativeMinutes / 1440),
        subject: step.subject || "Untitled step",
        totalInStep: step.total || 0,
        sent: step.sent || 0,
        delivered: step.delivered || 0,
        opened: step.opened || 0,
        replied: step.replied || 0,
        failed: step.failed || 0,
        bounced: (step as any).bounced || 0,
        complained: (step as any).complained || 0,
        unsubscribed: (step as any).unsubscribed || 0,
        pending: step.pending || 0,
        nextSendAt: step.nextPlannedSendAt
          ? new Date(step.nextPlannedSendAt).toLocaleString()
          : undefined,
        status: hasSent ? "done" : hasPending ? "pending" : ("waiting" as const),
      };
    });
  })();

  const trendData =
    enhancedAnalytics?.timeSeries?.map((point: any) => ({
      date: point.date,
      sent: point.sent || 0,
      opened: point.opened || 0,
      clicked: point.clicked || 0,
    })) ||
    sendVolume?.sendsByDay?.map((day: any) => ({
      date: day.date,
      sent: day.count || 0,
      opened: 0,
      clicked: 0,
    })) ||
    [];

  // ──────────────── Action handlers ────────────────
  const handleLaunch = () => {
    // Show verification choice modal
    setVerificationDialogOpen(true);
  };

  const executeLaunch = async (withVerification: boolean) => {
    if (!domainId) {
      toast.error("Missing domain ID — cannot launch campaign");
      return;
    }
    setLaunchingCampaign(true);
    setVerificationDialogOpen(false);
    try {
      await sendCampaign(domainId, campaignId, {
        requireLeadVerification: withVerification,
      });
      toast.success("Campaign launched! Emails are being queued.");
      onRefresh();
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to launch campaign"));
    } finally {
      setLaunchingCampaign(false);
      setPendingLaunchWithVerification(null);
    }
  };

  const handlePause = async () => {
    if (!domainId) return;
    setPausingCampaign(true);
    try {
      await pauseCampaign(domainId, campaignId);
      toast.success("Campaign paused");
      onRefresh();
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to pause campaign"));
    } finally {
      setPausingCampaign(false);
    }
  };

  const handleResume = () => {
    // Resume = re-launch (check if verification needed)
    setVerificationDialogOpen(true);
  };

  const handleStop = async () => {
    if (!domainId) return;
    setStopping(true);
    try {
      await stopCampaign(domainId, campaignId);
      toast.success("Campaign stopped");
      setStopDialogOpen(false);
      onRefresh();
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to stop campaign"));
    } finally {
      setStopping(false);
    }
  };

  const [restartingCampaign, setRestartingCampaign] = useState(false);

  const handleRestart = async () => {
    if (!domainId) return;
    setRestartingCampaign(true);
    try {
      const res = await restartCampaign(domainId, campaignId);
      toast.success(res.message || "Campaign restarted! Missing sequence steps queued.");
      onRefresh();
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to restart campaign"));
    } finally {
      setRestartingCampaign(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100 flex flex-col">
      {/* ────────── TOP HEADER ────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Back + Campaign name */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-semibold text-slate-900 truncate">
                    {campaign.name}
                  </h1>
                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.badgeBg}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} ${
                        statusConfig.pulse ? "animate-pulse" : ""
                      }`}
                    />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Download report */}
              {!isDraft && !isVerifying && (
                <button
                  onClick={onDownloadReport}
                  disabled={downloading}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {downloading ? "Downloading…" : "Report"}
                </button>
              )}

              {/* Restart (running, paused, or completed) */}
              {!isDraft && !isVerifying && (
                <button
                  onClick={handleRestart}
                  disabled={restartingCampaign}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50 shadow-sm"
                  title="Restart campaign to queue any newly added sequence steps for existing leads"
                >
                  {restartingCampaign ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Restart Campaign
                </button>
              )}

              {/* Pause (running) */}
              {isRunning && (
                <button
                  onClick={handlePause}
                  disabled={pausingCampaign}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  {pausingCampaign ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" />
                  )}
                  Pause
                </button>
              )}

              {/* Resume (paused) */}
              {isPaused && (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all"
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume Campaign
                </button>
              )}

              {/* Launch (draft) */}
              {isDraft && (
                <button
                  onClick={handleLaunch}
                  disabled={launchingCampaign}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                >
                  {launchingCampaign ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Launching…
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Launch Campaign
                    </>
                  )}
                </button>
              )}

              {/* Stop (running / paused) */}
              {(isRunning || isPaused) && (
                <button
                  onClick={() => setStopDialogOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <StopCircle className="h-3.5 w-3.5" />
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* ────────── TAB NAV ────────── */}
          <div className="flex items-center gap-0 -mb-px">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ────────── TAB CONTENT ────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-0 sm:px-6 lg:px-8 py-0">
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 overflow-hidden shadow-sm">
          {activeTab === "analytics" && (
            <AnalyticsTab
              campaignId={campaignId}
              domainId={domainId}
              campaign={{
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                sender: campaign.fromName || campaign.fromEmail,
                subject: campaign.subject,
                fromEmail: campaign.fromEmail,
                createdAt: new Date(campaign.createdAt).toLocaleString(),
                startedAt: campaign.startedAt
                  ? new Date(campaign.startedAt).toLocaleString()
                  : undefined,
                totalEmails: Math.max(metrics?.totalLeads || 0, analytics?.progress?.total || 0),
                sentEmails: metrics?.totalSent || 0,
                deliverabilityPauseReason: campaign.deliverabilityPauseReason ?? null,
                deliverabilityAcknowledgedAt: campaign.deliverabilityAcknowledgedAt
                  ? String(campaign.deliverabilityAcknowledgedAt)
                  : null,
                requiresDeliverabilityAcknowledgment:
                  campaign.requiresDeliverabilityAcknowledgment ?? false,
              }}
              analytics={analytics}
              enhancedAnalytics={enhancedAnalytics}
              metrics={{
                sent: metrics?.totalSent || 0,
                delivered: metrics?.totalDelivered || 0,
                opened: metrics?.totalOpened || 0,
                clicked: metrics?.totalClicked || 0,
                replied: metrics?.totalReplied || 0,
                bounced: metrics?.totalBounced || 0,
                complained: metrics?.totalComplained || 0,
                unsubscribed: metrics?.totalUnsubscribed || 0,
                pending: metrics?.pending || 0,
                failed: (metrics?.totalFailed || 0) + (metrics?.totalRejected || 0),
                rejected: metrics?.totalRejected || 0,
              }}
              rates={rates}
              steps={mappedSteps}
              leads={[]}
              trendData={trendData}
              sendVolume={analytics?.sendVolume}
              reoon={analytics?.reoon}
              todayVerification={analytics?.todayVerification}
              progress={analytics?.progress}
              deliverability={analytics?.deliverability || null}
              stopping={stopping}
              downloading={downloading}
              onStopCampaign={
                (isRunning || isPaused) && domainId
                  ? () => setStopDialogOpen(true)
                  : undefined
              }
              onEditCampaign={isPaused ? handleResume : undefined}
              onDownloadReport={onDownloadReport}
              onBack={onBack}
              onMarkReplied={onMarkReplied}
              onDeliverabilityAcknowledged={onDeliverabilityAcknowledged}
            />
          )}

          {activeTab === "leads" && (
            <LeadsTab
              campaignId={campaignId}
              domainId={domainId}
              campaignStatus={status}
              totalLeads={metrics?.totalLeads || analytics?.progress?.total || 0}
              onLeadsAdded={onRefresh}
            />
          )}

          {activeTab === "sequence" && (
            <SequenceTab
              campaignId={campaignId}
              domainId={domainId}
              campaignStatus={status}
            />
          )}

          {activeTab === "schedule" && (
            <ScheduleTab
              campaignId={campaignId}
              domainId={domainId}
              campaignStatus={status}
            />
          )}

          {activeTab === "options" && (
            <OptionsTab
              campaignId={campaignId}
              domainId={domainId}
              campaignStatus={status}
              totalLeads={metrics?.totalLeads || analytics?.progress?.total || 0}
              initialDailyLimit={
                campaign.campaignDailyLimitOverride ?? undefined
              }
              initialOpenTracking={campaign.openTrackingEnabled !== false}
              initialLinkTracking={campaign.linkTrackingEnabled === true}
              initialRequireVerification={
                analytics?.reoon?.used === true ||
                campaign.reoonVerificationSummary?.requireLeadVerification === true
              }
              initialIsContinuous={campaign.isContinuous === true}
              onOptionsSaved={onRefresh}
            />
          )}
        </div>
      </div>

      {/* ─────── STOP DIALOG ─────── */}
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
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  Stop this campaign?
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>
                      This ends the campaign for this audience. No further emails will be sent.
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
              onClick={() => void handleStop()}
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

      {/* ─────── VERIFICATION DIALOG (on launch/resume) ─────── */}
      <Dialog
        open={verificationDialogOpen}
        onOpenChange={(open) => {
          if (!open && launchingCampaign) return;
          setVerificationDialogOpen(open);
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-5 w-5 text-blue-700" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-left">
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  Lead Verification
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="text-sm text-slate-600">
                    <p>
                      Would you like to run Reoon email verification on your leads before
                      sending? This reduces bounces but uses verification credits.
                    </p>
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 flex-1"
              onClick={() => void executeLaunch(false)}
              disabled={launchingCampaign}
            >
              {launchingCampaign ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Skip verification
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 flex-1"
              onClick={() => void executeLaunch(true)}
              disabled={launchingCampaign}
            >
              {launchingCampaign ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Verify & Launch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
