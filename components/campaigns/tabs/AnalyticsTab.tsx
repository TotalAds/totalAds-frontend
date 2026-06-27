"use client";

import React from "react";
import { BarChart2, Zap } from "lucide-react";

import { CampaignAnalytics } from "@/components/analytics/CampaignAnalytics";

interface AnalyticsTabProps {
  campaignId: string;
  domainId?: string;
  campaign: any;
  analytics: any;
  enhancedAnalytics: any;
  metrics: any;
  rates: any;
  steps: any[];
  leads: any[];
  trendData: any[];
  sendVolume: any;
  reoon: any;
  todayVerification: any;
  progress: any;
  deliverability: any;
  stopping: boolean;
  downloading: boolean;
  onStopCampaign?: () => void;
  onEditCampaign?: () => void;
  onDownloadReport?: () => void;
  onBack?: () => void;
  onMarkReplied?: (leadId: string) => Promise<void>;
  onDeliverabilityAcknowledged?: () => void;
}

export function AnalyticsTab({
  campaignId,
  domainId,
  campaign,
  analytics,
  metrics,
  rates,
  steps,
  leads,
  trendData,
  sendVolume,
  reoon,
  todayVerification,
  progress,
  deliverability,
  stopping,
  downloading,
  onStopCampaign,
  onEditCampaign,
  onDownloadReport,
  onBack,
  onMarkReplied,
  onDeliverabilityAcknowledged,
}: AnalyticsTabProps) {
  const isDraft = campaign.status === "draft";
  const isSequenceCampaign = (steps?.length || 0) > 1;
  const campaignMode = isSequenceCampaign ? "sequence" : "single";

  // Draft state — show empty state prompt
  if (isDraft) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 ring-1 ring-blue-100">
          <BarChart2 className="h-9 w-9 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Analytics will appear here once you launch
        </h3>
        <p className="text-slate-500 max-w-md text-sm leading-relaxed">
          Set up your sequence and leads, then launch your campaign. Open rates, click rates,
          replies, and step-by-step analytics will show here in real time.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
          <Zap className="h-3.5 w-3.5" />
          Campaign is in Draft — configure your sequence first
        </div>
      </div>
    );
  }

  // Campaign has been launched — show full analytics
  return (
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
        sender: campaign.sender,
        subject: campaign.subject,
        fromEmail: campaign.fromEmail,
        replyTo: campaign.fromEmail,
        createdAt: campaign.createdAt,
        startedAt: campaign.startedAt || "Not started yet",
        totalEmails: campaign.totalEmails,
        sentEmails: campaign.sentEmails,
        deliverabilityPauseReason: campaign.deliverabilityPauseReason ?? null,
        deliverabilityAcknowledgedAt: campaign.deliverabilityAcknowledgedAt ?? null,
        requiresDeliverabilityAcknowledgment: campaign.requiresDeliverabilityAcknowledgment ?? false,
      }}
      metrics={metrics}
      rates={rates}
      steps={steps}
      leads={leads}
      trendData={trendData}
      onStopCampaign={onStopCampaign}
      onEditCampaign={onEditCampaign}
      onDownloadReport={onDownloadReport}
      stopping={stopping}
      downloading={downloading}
      showDownload
      deliverability={deliverability}
      sendVolume={sendVolume}
      reoon={reoon}
      todayVerification={todayVerification}
      progress={progress}
      campaignId={campaignId}
      domainId={domainId}
      onMarkReplied={onMarkReplied}
      onDeliverabilityAcknowledged={onDeliverabilityAcknowledged}
      embedded
    />
  );
}
