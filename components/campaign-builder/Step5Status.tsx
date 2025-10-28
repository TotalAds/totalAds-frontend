"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { CampaignBuilderState } from "@/app/email/campaigns/builder/page";
import { Button } from "@/components/ui/button";
import emailClient from "@/utils/api/emailClient";

interface Step5Props {
  state: CampaignBuilderState;
  setState: (state: CampaignBuilderState) => void;
  onPrev: () => void;
}

export default function CampaignStep5Status({
  state,
  setState,
  onPrev,
}: Step5Props) {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchStatus();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, state.campaignId, state.domainId]);

  // Auto-redirect to campaign details after 5 seconds
  useEffect(() => {
    if (!state.campaignId) return;
    setCountdown(5);
    const tick = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    const to = setTimeout(() => {
      router.push(`/email/campaigns/${state.campaignId}`);
    }, 5000);
    return () => {
      clearInterval(tick);
      clearTimeout(to);
    };
  }, [router, state.campaignId]);

  const fetchStatus = async () => {
    if (!state.campaignId || !state.domainId) return;

    try {
      const response = await emailClient.get(
        `/api/domains/${state.domainId}/campaigns/${state.campaignId}/status`
      );
      setStatus(response.data?.data);
    } catch (error: any) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!status?.stats) return 0;
    const total = status.stats.total || 1;
    const sent = status.stats.sent || 0;
    return Math.round((sent / total) * 100);
  };

  const handleViewCampaign = () => {
    router.push(`/email/campaigns/${state.campaignId}`);
  };

  const handleBackToCampaigns = () => {
    router.push("/email/campaigns");
  };

  return (
    <div className="space-y-6">
      {/* Celebration + Success Message */}
      <div className="relative">
        {/* Confetti overlay */}
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: 80 }).map((_, i) => {
            const colors = [
              "#ef4444",
              "#f59e0b",
              "#10b981",
              "#3b82f6",
              "#8b5cf6",
              "#ec4899",
            ];
            const left = Math.random() * 100;
            const duration = 2 + Math.random() * 2;
            const delay = Math.random() * 0.6;
            const rotate = Math.random() * 360;
            return (
              <span
                key={i}
                className="confetti"
                style={{
                  left: `${left}%`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  backgroundColor: colors[i % colors.length],
                  transform: `rotate(${rotate}deg)`,
                }}
              />
            );
          })}
        </div>

        <div className="backdrop-blur-xl bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400">
                Congratulations! Your campaign has started 🎉
              </h3>
              <p className="text-green-300/80 text-sm">
                Delivering to {state.csvData.length} lead
                {state.csvData.length === 1 ? "" : "s"}. Redirecting to campaign
                details in {countdown}s...
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fall {
            0% {
              transform: translateY(-20px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(110vh) rotate(720deg);
              opacity: 0.9;
            }
          }
          .confetti {
            position: absolute;
            top: -10px;
            width: 8px;
            height: 12px;
            border-radius: 2px;
            opacity: 0.9;
            animation-name: fall;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
          }
        `}</style>
      </div>

      {/* Real-time Status */}
      {loading ? (
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading campaign status...</p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Delivery Progress
              </h3>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs px-3 py-1 rounded transition ${
                  autoRefresh
                    ? "bg-green-500/20 text-green-300"
                    : "bg-gray-500/20 text-gray-300"
                }`}
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </button>
            </div>

            <div className="mb-2">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-brand-main h-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            <p className="text-sm text-gray-400">
              {getProgressPercentage()}% complete ({status?.stats?.sent || 0} of{" "}
              {status?.stats?.total || 0} sent)
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {status?.stats?.total || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Total</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {status?.stats?.sent || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Sent</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {status?.stats?.processing || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Processing</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {status?.stats?.bounced || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Bounced</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">
                {status?.stats?.failed || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Failed</p>
            </div>
          </div>

          {/* Campaign Info */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Campaign Details
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-gray-400">Campaign Name:</p>
                <p className="text-white font-medium">{state.campaignName}</p>
              </div>
              <div>
                <p className="text-gray-400">Campaign ID:</p>
                <p className="text-white font-mono text-xs">
                  {state.campaignId}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Status:</p>
                <p className="text-white font-medium">
                  <span className="inline-block px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                    Sending
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Leads:</p>
                <p className="text-white font-medium">{state.csvData.length}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="backdrop-blur-xl bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              What&apos;s Next?
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">→</span>
                <span>Monitor delivery progress in real-time</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">→</span>
                <span>Track opens, clicks, and bounces</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">→</span>
                <span>View detailed analytics for each recipient</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">→</span>
                <span>Pause or stop the campaign if needed</span>
              </li>
            </ul>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={handleBackToCampaigns}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition"
        >
          Back to Campaigns
        </Button>
        <Button
          onClick={handleViewCampaign}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
        >
          View Campaign Details →
        </Button>
      </div>
    </div>
  );
}
