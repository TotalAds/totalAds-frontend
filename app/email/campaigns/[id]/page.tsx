"use client";

import { Download, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { FilterPanel } from "@/components/campaign-analytics/FilterPanel";
import KPICard from "@/components/campaign-analytics/KPICard";
import { MetricsSummary } from "@/components/campaign-analytics/MetricsSummary";
import {
  ReoonVerificationAnalytics,
  ReoonVerificationAnalyticsData,
} from "@/components/campaign-analytics/ReoonVerificationAnalytics";
import { TrendChart } from "@/components/campaign-analytics/TrendChart";
import { Button } from "@/components/ui/button";
import emailClient, {
  EnhancedAnalyticsFilters,
  EnhancedCampaignAnalytics,
  getEnhancedCampaignAnalytics,
  getReoonVerificationAnalytics,
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
  const [enhancedAnalytics, setEnhancedAnalytics] =
    useState<EnhancedCampaignAnalytics | null>(null);
  const [reoonAnalytics, setReoonAnalytics] =
    useState<ReoonVerificationAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [reoonLoading, setReoonLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "leads">(
    "overview"
  );
  const [filters, setFilters] = useState<EnhancedAnalyticsFilters>({
    dateRange: "30d",
  });
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const fetchCampaignAnalytics = useCallback(async () => {
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
  }, [campaignId]);

  const fetchEnhancedAnalytics = useCallback(async () => {
    try {
      setEnhancedLoading(true);
      const data = await getEnhancedCampaignAnalytics(campaignId, filters);
      setEnhancedAnalytics(data);
    } catch (error: any) {
      console.error("Failed to fetch enhanced analytics:", error);
      toast.error("Failed to fetch trend data");
    } finally {
      setEnhancedLoading(false);
    }
  }, [campaignId, filters]);

  const fetchReoonAnalytics = useCallback(async () => {
    try {
      setReoonLoading(true);
      const data = await getReoonVerificationAnalytics(campaignId);
      setReoonAnalytics(data);
    } catch (error: any) {
      console.error("Failed to fetch Reoon analytics:", error);
      // Don't show toast for Reoon analytics failure - it's optional
    } finally {
      setReoonLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaignAnalytics();
    fetchEnhancedAnalytics();
    fetchReoonAnalytics();
    // Auto-refresh every 5s while sending
    const interval = setInterval(() => {
      if (analytics?.campaign.status === "sending") {
        fetchCampaignAnalytics();
        fetchEnhancedAnalytics();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [
    campaignId,
    analytics?.campaign.status,
    fetchCampaignAnalytics,
    fetchEnhancedAnalytics,
    fetchReoonAnalytics,
  ]);

  const handleExportPDF = async () => {
    if (!enhancedAnalytics) return;
    setIsExporting(true);
    try {
      await exportCampaignAnalyticsToPDF(enhancedAnalytics, chartRef.current, {
        filename: `campaign-${enhancedAnalytics.campaign.name}-analytics`,
      });
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF");
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "sending":
        return "bg-blue-100 border-blue-300 text-blue-700";
      case "completed":
        return "bg-emerald-100 border-emerald-300 text-emerald-700";
      case "failed":
        return "bg-red-100 border-red-300 text-red-700";
      case "paused":
        return "bg-amber-100 border-amber-300 text-amber-700";
      case "draft":
        return "bg-slate-100 border-slate-300 text-slate-700";
      default:
        return "bg-slate-100 border-slate-300 text-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-bg-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {campaign.name}
              </h1>
              <p className="text-slate-500 text-sm mb-4">
                Subject: {campaign.subject}
              </p>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-semibold ${getStatusBadgeColor(
                    campaign.status
                  )}`}
                >
                  {campaign.status.charAt(0).toUpperCase() +
                    campaign.status.slice(1)}
                </span>
                {metrics.totalFailed > 0 && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-700 text-sm font-semibold">
                    ⚠️ {metrics.totalFailed} Failed
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
              <Button
                onClick={handleExportPDF}
                disabled={isExporting || !enhancedAnalytics}
                className="bg-brand-main text-white hover:bg-emerald-700 font-medium shadow-sm"
              >
                {isExporting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>
              <button
                onClick={() => router.back()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2 rounded-lg border border-slate-200 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {campaign.status === "sending" && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Sending Progress
              </h3>
              <span className="text-2xl font-bold text-blue-600">
                {progress.percentage}%
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-slate-600 text-sm mt-3">
              {progress.completed} of {progress.total} emails processed
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-3 font-medium transition-colors rounded-t-lg ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab("trends")}
            className={`px-5 py-3 font-medium transition-colors rounded-t-lg ${
              activeTab === "trends"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            📈 Trends
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Primary KPIs */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="text-2xl">📈</span> Key Performance Indicators
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
            </section>

            {/* Reoon Verification Analytics */}
            <ReoonVerificationAnalytics
              data={reoonAnalytics}
              loading={reoonLoading}
            />

            {/* Engagement Metrics */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="text-2xl">💬</span> Engagement Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
            </section>

            {/* Error & Issue Metrics */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="text-2xl">⚠️</span> Issues & Errors
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
            </section>

            {/* Queue Status */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="text-2xl">⚙️</span> Queue Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            </section>

            {/* Campaign Info */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="text-xl">ℹ️</span> Campaign Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-slate-500 text-sm font-medium">From</p>
                  <p className="text-slate-800 mt-1 font-semibold">
                    {campaign.fromName || campaign.fromEmail}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Email</p>
                  <p className="text-slate-800 mt-1 font-medium text-sm">
                    {campaign.fromEmail}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Created</p>
                  <p className="text-slate-800 mt-1 font-semibold">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {campaign.startedAt && (
                  <div>
                    <p className="text-slate-500 text-sm font-medium">
                      Started
                    </p>
                    <p className="text-slate-800 mt-1 font-semibold">
                      {new Date(campaign.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div className="space-y-10">
            {/* Enhanced Metrics Summary */}
            {enhancedAnalytics && (
              <>
                <section>
                  <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <span className="text-2xl">📊</span> Performance Summary
                  </h2>
                  <MetricsSummary
                    summary={enhancedAnalytics.summary}
                    rates={enhancedAnalytics.rates}
                  />
                </section>

                {/* Trend Charts */}
                <div ref={chartRef} className="space-y-6">
                  <TrendChart
                    data={enhancedAnalytics.timeSeries}
                    title="Email Performance Over Time"
                    height={350}
                    metrics={["sent", "opened", "clicked"]}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TrendChart
                      data={enhancedAnalytics.timeSeries}
                      title="Delivery Metrics"
                      height={250}
                      metrics={["sent", "bounced"]}
                      showLegend={true}
                    />
                    <TrendChart
                      data={enhancedAnalytics.timeSeries}
                      title="Engagement Metrics"
                      height={250}
                      metrics={["opened", "clicked"]}
                      showLegend={true}
                    />
                  </div>
                </div>

                {/* Applied Filters Info */}
                {enhancedAnalytics.appliedFilters && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-slate-600 text-sm">
                      Showing data for:{" "}
                      <span className="text-slate-800 font-semibold">
                        {enhancedAnalytics.appliedFilters.dateRange === "7d"
                          ? "Last 7 days"
                          : enhancedAnalytics.appliedFilters.dateRange === "30d"
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
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}

            {enhancedLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-500 font-medium">
                    Loading trend data...
                  </p>
                </div>
              </div>
            )}

            {!enhancedLoading && !enhancedAnalytics && (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">
                  No trend data available for this campaign.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
