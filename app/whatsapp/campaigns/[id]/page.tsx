"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { getCampaign, getCampaignAnalytics, WhatsAppCampaign } from "@/utils/api/whatsappClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<WhatsAppCampaign | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
      fetchAnalytics();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await getCampaign(campaignId);
      setCampaign(data);
    } catch (error: any) {
      console.error("Error fetching campaign:", error);

      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      toast.error("Failed to fetch campaign");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await getCampaignAnalytics(campaignId);
      setAnalytics(data);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-200">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-100 mb-2">
            Campaign Not Found
          </h2>
          <button
            onClick={() => router.push("/whatsapp/campaigns")}
            className="text-brand-main hover:text-brand-secondary"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const stats = campaign.campaignStatus || {
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    pending: 0,
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/whatsapp/campaigns")}
            className="text-brand-main hover:text-brand-secondary mb-4 text-sm"
          >
            ← Back to Campaigns
          </button>
          <h1 className="text-3xl font-bold text-text-100">
            {campaign.campaignName}
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Campaign details and analytics
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-text-100 mb-4">
                Campaign Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-text-200 text-sm">Template</p>
                  <p className="text-text-100 font-medium">
                    {campaign.templateName} ({campaign.templateLanguage})
                  </p>
                </div>
                <div>
                  <p className="text-text-200 text-sm">Category</p>
                  <p className="text-text-100 font-medium">
                    {campaign.templateCategory}
                  </p>
                </div>
                <div>
                  <p className="text-text-200 text-sm">Total Records</p>
                  <p className="text-text-100 font-medium">
                    {campaign.totalRecords}
                  </p>
                </div>
                <div>
                  <p className="text-text-200 text-sm">Status</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      campaign.status === "running"
                        ? "bg-green-100 text-green-700"
                        : campaign.status === "paused"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {campaign.status.charAt(0).toUpperCase() +
                      campaign.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Analytics */}
            {analytics && (
              <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-text-100 mb-4">
                  Analytics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-text-200 text-xs mb-1">Sent</p>
                    <p className="text-2xl font-bold text-text-100">
                      {analytics.summary.totalSent}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-xs mb-1">Delivered</p>
                    <p className="text-2xl font-bold text-green-400">
                      {analytics.summary.totalDelivered}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-xs mb-1">Read</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {analytics.summary.totalRead}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-xs mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-400">
                      {analytics.summary.totalFailed}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-xs mb-1">Pending</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {analytics.summary.totalPending}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-text-200 text-xs mb-1">Delivery Rate</p>
                    <p className="text-xl font-bold text-text-100">
                      {analytics.rates.deliveryRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-xs mb-1">Read Rate</p>
                    <p className="text-xl font-bold text-text-100">
                      {analytics.rates.readRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-xs mb-1">Failure Rate</p>
                    <p className="text-xl font-bold text-text-100">
                      {analytics.rates.failureRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-text-100 mb-4">
                Status Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-200 text-sm">Sent</span>
                  <span className="text-text-100 font-semibold">
                    {stats.sent}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-200 text-sm">Delivered</span>
                  <span className="text-green-400 font-semibold">
                    {stats.delivered}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-200 text-sm">Read</span>
                  <span className="text-blue-400 font-semibold">
                    {stats.read}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-200 text-sm">Failed</span>
                  <span className="text-red-400 font-semibold">
                    {stats.failed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-200 text-sm">Pending</span>
                  <span className="text-amber-400 font-semibold">
                    {stats.pending}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

