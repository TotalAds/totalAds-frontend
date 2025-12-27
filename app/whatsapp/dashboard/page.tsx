"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import {
  getDashboardAnalytics,
  WhatsAppCampaign,
} from "@/utils/api/whatsappClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import {
  IconArrowUpRight,
  IconChartLine,
  IconMail,
  IconMessage,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";

export default function WhatsAppDashboardPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchAnalytics();
  }, [state.isAuthenticated, range]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - range);

      // TODO: Get phoneNumberId from user settings
      const phoneNumberId = "default"; // This should come from user's Meta settings
      const data = await getDashboardAnalytics(phoneNumberId, startDate, endDate);
      setAnalytics(data);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);

      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-200">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = analytics?.statistics || {
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalFailed: 0,
    deliveryRate: 0,
    readRate: 0,
    failureRate: 0,
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-text-100">
                WhatsApp Dashboard
              </h1>
              <p className="text-text-200 text-sm mt-1">
                Overview of your WhatsApp messaging performance
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRange(7)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  range === 7
                    ? "bg-brand-main text-white"
                    : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setRange(30)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  range === 30
                    ? "bg-brand-main text-white"
                    : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sent */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brand-main/20 rounded-lg flex items-center justify-center">
                <IconMessage className="w-6 h-6 text-brand-main" />
              </div>
              <IconArrowUpRight className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-text-200 text-sm font-medium mb-1">
              Total Sent
            </h3>
            <p className="text-3xl font-bold text-text-100">
              {stats.totalSent.toLocaleString()}
            </p>
          </div>

          {/* Delivery Rate */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <IconMail className="w-6 h-6 text-green-400" />
              </div>
              <IconTrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-text-200 text-sm font-medium mb-1">
              Delivery Rate
            </h3>
            <p className="text-3xl font-bold text-text-100">
              {stats.deliveryRate.toFixed(1)}%
            </p>
            <p className="text-xs text-text-200 mt-1">
              {stats.totalDelivered.toLocaleString()} delivered
            </p>
          </div>

          {/* Read Rate */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <IconChartLine className="w-6 h-6 text-blue-400" />
              </div>
              <IconTrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-text-200 text-sm font-medium mb-1">
              Read Rate
            </h3>
            <p className="text-3xl font-bold text-text-100">
              {stats.readRate.toFixed(1)}%
            </p>
            <p className="text-xs text-text-200 mt-1">
              {stats.totalRead.toLocaleString()} read
            </p>
          </div>

          {/* Failure Rate */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <IconUsers className="w-6 h-6 text-red-400" />
              </div>
              {stats.failureRate > 5 ? (
                <IconArrowUpRight className="w-5 h-5 text-red-400" />
              ) : (
                <IconTrendingUp className="w-5 h-5 text-green-400" />
              )}
            </div>
            <h3 className="text-text-200 text-sm font-medium mb-1">
              Failure Rate
            </h3>
            <p className="text-3xl font-bold text-text-100">
              {stats.failureRate.toFixed(1)}%
            </p>
            <p className="text-xs text-text-200 mt-1">
              {stats.totalFailed.toLocaleString()} failed
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push("/whatsapp/campaigns")}
            className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/20 transition text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-brand-main/20 rounded-lg flex items-center justify-center">
                <IconMail className="w-6 h-6 text-brand-main" />
              </div>
              <h3 className="text-lg font-semibold text-text-100">
                Campaigns
              </h3>
            </div>
            <p className="text-text-200 text-sm">
              Create and manage your WhatsApp campaigns
            </p>
          </button>

          <button
            onClick={() => router.push("/whatsapp/contacts")}
            className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/20 transition text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <IconUsers className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-text-100">Contacts</h3>
            </div>
            <p className="text-text-200 text-sm">
              Manage your WhatsApp contacts
            </p>
          </button>

          <button
            onClick={() => router.push("/whatsapp/chat")}
            className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/20 transition text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <IconMessage className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-text-100">Chat</h3>
            </div>
            <p className="text-text-200 text-sm">
              View and manage conversations
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}

