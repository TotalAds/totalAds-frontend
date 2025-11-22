"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import KPICard from "@/components/campaign-analytics/KPICard";
import emailClient from "@/utils/api/emailClient";

interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    htmlContent: string;
    status: string;
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
  reoon?: {
    used: boolean;
    mode: string | null;
    totalLeadsBeforeVerification: number | null;
    totalLeadsAfterVerification: number | null;
    excludedAsRisky: number | null;
  } | null;
}

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "leads">("overview");

  useEffect(() => {
    fetchCampaignAnalytics();
    // Auto-refresh every 5s while sending
    const interval = setInterval(() => {
      if (analytics?.campaign.status === "sending") {
        fetchCampaignAnalytics();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [campaignId, analytics?.campaign.status]);

  const fetchCampaignAnalytics = async () => {
    try {
      setLoading(true);
      const response = await emailClient.get(
        `/api/analytics/campaigns/${campaignId}/analytics`
      );
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch campaign");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-text-100 text-lg">Loading campaign analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-100 text-xl mb-4">Campaign not found</p>
          <button
            onClick={() => router.back()}
            className="text-blue-400 hover:text-blue-300"
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "sending":
        return "bg-blue-500/20 border-blue-500/50 text-blue-300";
      case "completed":
        return "bg-green-500/20 border-green-500/50 text-green-300";
      case "failed":
        return "bg-red-500/20 border-red-500/50 text-red-300";
      case "paused":
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-300";
      case "draft":
        return "bg-brand-main/20 border-brand-main/50 text-brand-main";
      default:
        return "bg-slate-500/20 border-slate-500/50 text-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-bg-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-text-100 mb-3">
                {campaign.name}
              </h1>
              <p className="text-text-100/60 text-sm mb-4">
                Subject: {campaign.subject}
              </p>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full border text-sm font-medium ${getStatusBadgeColor(
                    campaign.status
                  )}`}
                >
                  {campaign.status.charAt(0).toUpperCase() +
                    campaign.status.slice(1)}
                </span>
                {metrics.totalFailed > 0 && (
                  <span className="inline-block px-3 py-1 rounded-full border border-red-500/50 bg-red-500/20 text-red-300 text-sm font-medium">
                    ⚠️ {metrics.totalFailed} Failed
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 px-6 py-2 rounded-lg transition"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {campaign.status === "sending" && (
          <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6 mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-text-100">
                Sending Progress
              </h3>
              <span className="text-2xl font-bold text-blue-400">
                {progress.percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-brand-tertiary h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-text-100/60 text-sm mt-3">
              {progress.completed} of {progress.total} emails processed
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-brand-main/10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "overview"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-text-100/60 hover:text-text-100"
            }`}
          >
            📊 Overview
          </button>
          {/* <button
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "leads"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-text-100/60 hover:text-text-100"
            }`}
          >
            👥 Leads ({metrics.totalLeads})
          </button> */}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Primary KPIs */}
            <div>
              <h2 className="text-2xl font-bold text-text-100 mb-4">
                📈 Key Performance Indicators
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Total Emails"
                  value={metrics.totalLeads}
                  icon="📧"
                  color="blue"
                  description="All recipients in campaign"
                />
                <KPICard
                  label="Delivered"
                  value={metrics.totalDelivered}
                  icon="📬"
                  color="green"
                  description={`${rates.deliveryRate.toFixed(
                    1
                  )}% delivery rate`}
                />
                <KPICard
                  label="Opened"
                  value={metrics.totalOpened}
                  icon="👁️"
                  color="blue"
                  description={`${rates.openRate.toFixed(1)}% open rate`}
                />
                <KPICard
                  label="Clicked"
                  value={metrics.totalClicked}
                  icon="🔗"
                  color="purple"
                  description={`${rates.clickRate.toFixed(1)}% click rate`}
                />
              </div>
            </div>

            {/* Reoon Verification Summary */}
            <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
              <h2 className="text-2xl font-bold text-text-100 mb-2">
                🛡️ Reoon Verification Summary
              </h2>
              {reoon && reoon.used ? (
                <div className="space-y-3 text-sm text-text-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <p className="text-text-100/60 text-xs">
                        Leads before filtering
                      </p>
                      <p className="text-text-100 mt-1 font-semibold text-lg">
                        {reoon.totalLeadsBeforeVerification ??
                          metrics.totalLeads}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-100/60 text-xs">
                        Excluded as risky
                      </p>
                      <p className="text-red-300 mt-1 font-semibold text-lg">
                        {reoon.excludedAsRisky ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-100/60 text-xs">
                        Final leads sent
                      </p>
                      <p className="text-emerald-300 mt-1 font-semibold text-lg">
                        {reoon.totalLeadsAfterVerification ??
                          metrics.totalLeads}
                      </p>
                    </div>
                  </div>
                  <p className="text-text-100/70 text-xs">
                    Verification mode: {reoon.mode || "power"}. Reoon
                    verification helped protect your sender reputation by
                    filtering out risky addresses before sending.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-100/70 mt-2">
                  Reoon verification was not used for this campaign. All leads
                  were sent without pre-verification. Configure Reoon in
                  Settings → Integrations to reduce bounces and protect
                  deliverability.
                </p>
              )}
            </div>

            {/* Engagement Metrics */}
            <div>
              <h2 className="text-2xl font-bold text-text-100 mb-4">
                💬 Engagement Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Bounced"
                  value={metrics.totalBounced ?? 0}
                  icon="⚠️"
                  color="orange"
                  description={`${
                    rates.bounceRate.toFixed(1) ?? 0
                  }% bounce rate`}
                />
                <KPICard
                  label="Complaints"
                  value={metrics.totalComplained ?? 0}
                  icon="🚫"
                  color="red"
                  description={`${
                    rates.complaintRate.toFixed(1) ?? 0
                  }% complaint rate`}
                />
                <KPICard
                  label="Unsubscribed"
                  value={metrics.totalUnsubscribed ?? 0}
                  icon="📵"
                  color="yellow"
                  description={`${
                    rates.unsubscribeRate?.toFixed(1) ?? 0
                  }% unsubscribe rate`}
                />
                <KPICard
                  label="CTR (Click-to-Open)"
                  value={`${rates.ctrRate?.toFixed(1) ?? 0}%`}
                  icon="📊"
                  color="purple"
                  description="Clicked / Opened ratio"
                />
              </div>
            </div>

            {/* Error & Issue Metrics */}
            <div>
              <h2 className="text-2xl font-bold text-text-100 mb-4">
                ⚠️ Issues & Errors
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Failed"
                  value={metrics.totalFailed ?? 0}
                  icon="✕"
                  color="red"
                  description={`${
                    rates.failureRate?.toFixed(1) ?? 0
                  }% failure rate`}
                />
                <KPICard
                  label="Rejected"
                  value={metrics.totalRejected ?? 0}
                  icon="🔒"
                  color="red"
                  description="Virus/malware detected"
                />
                <KPICard
                  label="Rendering Failed"
                  value={metrics.totalRenderingFailures ?? 0}
                  icon="🎨"
                  color="orange"
                  description="Template rendering issues"
                />
                <KPICard
                  label="Delivery Delayed"
                  value={metrics.totalDeliveryDelays ?? 0}
                  icon="⏱️"
                  color="yellow"
                  description="Temporary delivery delays"
                />
              </div>
            </div>

            {/* Queue Status */}
            <div>
              <h2 className="text-2xl font-bold text-text-100 mb-4">
                ⚙️ Queue Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                  label="Pending"
                  value={metrics.pending}
                  icon="⏳"
                  color="yellow"
                  description="Waiting to be processed"
                />
                <KPICard
                  label="Processing"
                  value={metrics.processing}
                  icon="⚙️"
                  color="blue"
                  description="Currently being sent"
                />
                <KPICard
                  label="Sent"
                  value={metrics.totalSent}
                  icon="✓"
                  color="green"
                  description="Successfully sent"
                />
              </div>
            </div>

            {/* Campaign Info */}
            <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
              <h3 className="text-lg font-bold text-text-100 mb-4">
                ℹ️ Campaign Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-text-100/60 text-sm">From</p>
                  <p className="text-text-100 mt-1 font-medium">
                    {campaign.fromName || campaign.fromEmail}
                  </p>
                </div>
                <div>
                  <p className="text-text-100/60 text-sm">Email</p>
                  <p className="text-text-100 mt-1 font-medium text-sm">
                    {campaign.fromEmail}
                  </p>
                </div>
                <div>
                  <p className="text-text-100/60 text-sm">Created</p>
                  <p className="text-text-100 mt-1 font-medium">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {campaign.startedAt && (
                  <div>
                    <p className="text-text-100/60 text-sm">Started</p>
                    <p className="text-text-100 mt-1 font-medium">
                      {new Date(campaign.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
