"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import ReoonSetupGuideModal from "@/components/settings/ReoonSetupGuideModal";
import LeadhubIntegrationsCard from "@/components/settings/LeadhubIntegrationsCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_REOON_REVERIFICATION_INTERVAL_DAYS,
  deleteReoonApiKey,
  getReoonStatus,
  REOON_REVERIFICATION_INTERVAL_OPTIONS,
  ReoonStatus,
  saveReoonApiKey,
  updateReoonSettings,
} from "@/utils/api/reoonClient";
import {
  IconAlertCircle,
  IconCheck,
  IconHelpCircle,
  IconKey,
  IconRefresh,
  IconShieldCheck,
} from "@tabler/icons-react";

const IntegrationsSection = () => {
  const [status, setStatus] = useState<ReoonStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingInterval, setSavingInterval] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

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
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save Reoon API key"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (!status?.isConfigured) return;
    await loadStatus({ refresh: true });
    toast.success("Reoon balance refreshed");
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const s = await deleteReoonApiKey();
      setStatus(s);
      setApiKey("");
      setShowDisconnectDialog(false);
      toast.success("Reoon disconnected");
    } catch (error: any) {
      console.error("Failed to remove Reoon API key", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to remove Reoon API key"
      );
    } finally {
      setDisconnecting(false);
    }
  };

  const handleIntervalChange = async (days: number) => {
    if (!status?.isConfigured || savingInterval) return;
    if (days === status.reverificationIntervalDays) return;

    try {
      setSavingInterval(true);
      const s = await updateReoonSettings({
        reverificationIntervalDays: days,
      });
      setStatus(s);
      toast.success("Re-verification interval updated");
    } catch (error: any) {
      console.error("Failed to update Reoon settings", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update re-verification interval"
      );
    } finally {
      setSavingInterval(false);
    }
  };

  const isConfigured = Boolean(status?.isConfigured);
  const intervalOptions =
    status?.reverificationIntervalOptions?.length
      ? status.reverificationIntervalOptions
      : REOON_REVERIFICATION_INTERVAL_OPTIONS;
  const selectedIntervalDays =
    status?.reverificationIntervalDays ??
    DEFAULT_REOON_REVERIFICATION_INTERVAL_DAYS;

  const formatCredits = (value: number | null | undefined) => {
    if (isLoading) return "—";
    if (value == null) return "Not available";
    return value.toLocaleString();
  };

  const formatLastChecked = () => {
    if (isLoading) return "—";
    if (!status?.lastBalanceCheckedAt) return "Not checked yet";
    return new Date(status.lastBalanceCheckedAt).toLocaleString();
  };

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

      <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 md:p-8 flex flex-col gap-6 max-w-3xl">
        {/* Title + status */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-main/15 border border-brand-main/25">
              <IconShieldCheck className="h-5 w-5 text-brand-main" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-text-100">
                Reoon Email Verifier
              </h3>
              <p className="text-text-200 text-sm mt-1 leading-relaxed">
                Verify emails during campaigns and lead imports. Results are
                cached per address and re-checked after your re-verification
                interval so data stays current.
              </p>
            </div>
          </div>
          {isConfigured ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 self-start px-3 py-1.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/40">
              <IconCheck className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1.5 self-start px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300">
              <IconAlertCircle className="w-3.5 h-3.5" />
              Not connected
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowGuideModal(true)}
            className="border-brand-main/40 text-text-100 hover:bg-brand-main/10"
          >
            <IconHelpCircle className="w-4 h-4 mr-1.5" />
            Setup guide
          </Button>
          {isConfigured && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={refreshing || isLoading}
              onClick={handleRefresh}
              className="border-brand-main/40 text-text-100 hover:bg-brand-main/10"
            >
              <IconRefresh
                className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing…" : "Refresh balance"}
            </Button>
          )}
        </div>

        {/* Connected summary */}
        {isConfigured && (
          <div className="rounded-xl border border-success/25 bg-success/5 p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <IconCheck className="w-4 h-4 text-success shrink-0" />
              <p className="text-sm font-medium text-text-100">
                API key stored securely
              </p>
            </div>
            <p className="text-xs text-text-200/80 leading-relaxed">
              Your Reoon key is encrypted and only used from our servers. To
              rotate it, enter a new key below. To stop verification entirely,
              disconnect this integration.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-brand-main/15 bg-bg-300/50 px-3 py-3">
                <p className="text-text-200 text-xs mb-0.5">Daily credits</p>
                <p className="text-base font-semibold text-text-100 tabular-nums">
                  {formatCredits(status?.lastBalanceDailyCredits)}
                </p>
              </div>
              <div className="rounded-lg border border-brand-main/15 bg-bg-300/50 px-3 py-3">
                <p className="text-text-200 text-xs mb-0.5">Instant credits</p>
                <p className="text-base font-semibold text-text-100 tabular-nums">
                  {formatCredits(status?.lastBalanceInstantCredits)}
                </p>
              </div>
              <div className="rounded-lg border border-brand-main/15 bg-bg-300/50 px-3 py-3">
                <p className="text-text-200 text-xs mb-0.5">Last checked</p>
                <p className="text-sm font-medium text-text-100">
                  {formatLastChecked()}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-brand-main/15 bg-bg-300/40 px-3 py-3 space-y-2">
              <label
                htmlFor="reoon-reverification-interval"
                className="block text-sm font-medium text-text-100"
              >
                Re-verify leads every
              </label>
              <select
                id="reoon-reverification-interval"
                value={selectedIntervalDays}
                disabled={savingInterval || disconnecting}
                onChange={(e) =>
                  void handleIntervalChange(Number(e.target.value))
                }
                className="w-full sm:max-w-xs rounded-lg border border-brand-main/30 bg-bg-200 px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main disabled:opacity-60"
              >
                {intervalOptions.map((option) => (
                  <option key={option.days} value={option.days}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-200/80 leading-relaxed">
                Cached Reoon results older than this interval are treated as
                unverified. When campaign verification is enabled, those leads
                are sent to Reoon again so your data stays up to date. Default
                is 3 months.
                {savingInterval ? " Saving…" : null}
              </p>
            </div>
          </div>
        )}

        {!isConfigured && !isLoading && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-text-200 leading-relaxed">
              Add your Reoon API key to verify leads and campaign recipients.
              Without a key, Reoon verification steps in the app will be
              unavailable.
            </p>
          </div>
        )}

        {/* API key form */}
        <form
          onSubmit={handleSave}
          className="border-t border-brand-main/20 pt-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <IconKey className="w-4 h-4 text-text-200" />
            <h4 className="text-sm font-semibold text-text-100">
              {isConfigured ? "Update API key" : "Connect Reoon"}
            </h4>
          </div>
          <div>
            <label
              htmlFor="reoon-api-key-settings"
              className="block text-sm font-medium text-text-200 mb-2"
            >
              Reoon API key
            </label>
            <input
              id="reoon-api-key-settings"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                isConfigured
                  ? "Paste a new key to replace the stored key"
                  : "Paste your Reoon API key"
              }
              className="w-full px-4 py-2.5 bg-bg-300 border border-brand-main/30 rounded-lg text-text-100 placeholder-text-200/60 focus:outline-none focus:ring-2 focus:ring-brand-main"
            />
            <p className="text-xs text-text-200/70 mt-2 leading-relaxed">
              Encrypted at rest with KMS. Used only from the backend to call
              Reoon.{" "}
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-brand-main hover:underline"
              >
                How to get your API key
              </button>
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving || disconnecting || !apiKey.trim()}
              className="bg-brand-main hover:bg-brand-main/90 disabled:bg-brand-main/40 text-brand-white px-6"
            >
              {saving
                ? "Saving…"
                : isConfigured
                  ? "Save new key"
                  : "Connect Reoon"}
            </Button>
          </div>
        </form>

        {/* Disconnect */}
        {isConfigured && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 md:p-5 space-y-3">
            <p className="text-sm font-medium text-text-100">Disconnect Reoon</p>
            <p className="text-xs text-text-200/80 leading-relaxed">
              Removes your API key from LeadSnipper. Cached verification results
              stay in your account, but new Reoon checks will not run until you
              connect again. Revoke the key in Reoon&apos;s dashboard if you
              also want to block API access on their side.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disconnecting || saving}
              onClick={() => setShowDisconnectDialog(true)}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {disconnecting ? "Removing…" : "Remove API key"}
            </Button>
          </div>
        )}
      </div>

      <ReoonSetupGuideModal
        open={showGuideModal}
        onOpenChange={setShowGuideModal}
      />

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-text-100">
              Remove Reoon integration?
            </DialogTitle>
            <DialogDescription className="text-text-200/80 text-left text-sm leading-relaxed">
              Your stored API key will be deleted from LeadSnipper. Campaign and
              lead verification that requires Reoon will stop until you connect
              again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={disconnecting}
              onClick={() => setShowDisconnectDialog(false)}
              className="border-brand-main/40 text-text-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={disconnecting}
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-600/90 text-white"
            >
              {disconnecting ? "Removing…" : "Remove API key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadhubIntegrationsCard />
    </div>
  );
};

export default IntegrationsSection;
