"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import ReoonSetupGuideModal from "@/components/settings/ReoonSetupGuideModal";
import { Button } from "@/components/ui/button";
import {
  getReoonStatus,
  ReoonStatus,
  saveReoonApiKey,
} from "@/utils/api/reoonClient";
import {
  IconAlertCircle,
  IconCheck,
  IconHelpCircle,
  IconRefresh,
} from "@tabler/icons-react";

const IntegrationsSection = () => {
  const [status, setStatus] = useState<ReoonStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);

  const loadStatus = async (opts?: { refresh?: boolean }) => {
    try {
      if (opts?.refresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const s = await getReoonStatus(opts?.refresh ?? false);
      setStatus(s);
    } catch (error: any) {
      console.error("Failed to fetch Reoon status", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch Reoon status"
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) {
      toast.error("Please enter your Reoon API key");
      return;
    }

    try {
      setSaving(true);
      const s = await saveReoonApiKey(trimmed);
      setStatus(s);
      setApiKey("");
      toast.success("Reoon API key saved and validated successfully");
    } catch (error: any) {
      console.error("Failed to save Reoon API key", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save Reoon API key";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await loadStatus({ refresh: true });
    toast.success("Reoon balance refreshed");
  };

  const isConfigured = status?.isConfigured;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-100 mb-2">Integrations</h2>
        <p className="text-text-200 text-sm max-w-2xl">
          Connect third-party services to enhance deliverability and analytics.
          Reoon Email Verifier helps you validate email lists before sending
          campaigns so you avoid bounces, spamtraps, and risky addresses.
        </p>
      </div>

      {/* Reoon Email Verifier Card */}
      <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-text-100 mb-1">
              Reoon Email Verifier
            </h3>
            <p className="text-text-200 text-sm max-w-xl">
              Store your personal Reoon API key to verify emails during campaign
              creation. Verification results are cached per email so you never
              pay twice for the same address.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isConfigured ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/40">
                <IconCheck className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/40">
                <IconAlertCircle className="w-3 h-3" /> Not connected
              </span>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowGuideModal(true)}
              className="border-brand-main/40 text-text-100 hover:bg-brand-main/10"
            >
              <IconHelpCircle className="w-4 h-4 mr-1" />
              Setup Guide
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={refreshing || isLoading}
              onClick={handleRefresh}
              className="border-brand-main/40 text-text-100 hover:bg-brand-main/10"
            >
              <IconRefresh className="w-4 h-4 mr-1" />
              {refreshing ? "Refreshing..." : "Refresh balance"}
            </Button>
          </div>
        </div>

        {/* Balance & Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border border-brand-main/15 bg-bg-300/40 p-4">
            <p className="text-text-200 text-xs mb-1">
              Daily credits remaining
            </p>
            <p className="text-lg font-semibold text-text-100">
              {isLoading
                ? "-"
                : status?.lastBalanceDailyCredits ?? "Not available"}
            </p>
          </div>
          <div className="rounded-xl border border-brand-main/15 bg-bg-300/40 p-4">
            <p className="text-text-200 text-xs mb-1">
              Instant credits remaining
            </p>
            <p className="text-lg font-semibold text-text-100">
              {isLoading
                ? "-"
                : status?.lastBalanceInstantCredits ?? "Not available"}
            </p>
          </div>
          <div className="rounded-xl border border-brand-main/15 bg-bg-300/40 p-4">
            <p className="text-text-200 text-xs mb-1">Last checked</p>
            <p className="text-sm font-medium text-text-100">
              {isLoading
                ? "-"
                : status?.lastBalanceCheckedAt
                ? new Date(status.lastBalanceCheckedAt).toLocaleString()
                : "Not checked yet"}
            </p>
          </div>
        </div>

        {/* API Key Form */}
        <form
          onSubmit={handleSave}
          className="border-t border-brand-main/20 pt-6 mt-2 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-text-200 mb-2">
              Reoon API key
            </label>
            <input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Reoon API key"
              className="w-full px-4 py-2 bg-bg-300 border border-brand-main/30 rounded-lg text-text-100 placeholder-text-200/60 focus:outline-none focus:ring-2 focus:ring-brand-main"
            />
            <p className="text-xs text-text-200/70 mt-2 max-w-xl">
              We never store your key in plain text. It is encrypted with our
              KMS and used only from the backend to call Reoon.{" "}
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-brand-main hover:underline"
              >
                Need help getting your API key?
              </button>
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="bg-brand-main hover:bg-brand-main/90 disabled:bg-brand-main/40 text-brand-white px-6 py-2 rounded-lg"
            >
              {saving
                ? "Saving..."
                : isConfigured
                ? "Update API key"
                : "Connect Reoon"}
            </Button>
          </div>
        </form>
      </div>

      {/* Reoon Setup Guide Modal */}
      <ReoonSetupGuideModal
        open={showGuideModal}
        onOpenChange={setShowGuideModal}
      />
    </div>
  );
};

export default IntegrationsSection;
