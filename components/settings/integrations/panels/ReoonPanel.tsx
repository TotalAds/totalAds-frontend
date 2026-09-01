"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { IconCheck, IconKey, IconRefresh } from "@tabler/icons-react";

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

export default function ReoonPanel() {
  const [status, setStatus] = useState<ReoonStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingInterval, setSavingInterval] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const loadStatus = async (opts?: { refresh?: boolean }) => {
    try {
      if (opts?.refresh) setRefreshing(true);
      else setIsLoading(true);
      const s = await getReoonStatus(opts?.refresh ?? false);
      setStatus(s);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      console.error("Failed to fetch Reoon status", error);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch Reoon status"
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStatus();
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
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
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
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
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
      const s = await updateReoonSettings({ reverificationIntervalDays: days });
      setStatus(s);
      toast.success("Re-verification interval updated");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update re-verification interval"
      );
    } finally {
      setSavingInterval(false);
    }
  };

  const isConfigured = Boolean(status?.isConfigured);
  const intervalOptions = status?.reverificationIntervalOptions?.length
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
    <div className="space-y-5">
      {isConfigured ? (
        <div className="space-y-4 rounded-xl border border-success/25 bg-success/5 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconCheck className="w-4 h-4 shrink-0 text-success" />
              <p className="text-sm font-medium text-text-100">
                API key stored securely
              </p>
            </div>
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
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-brand-main/15 bg-bg-100/50 px-3 py-3">
              <p className="mb-0.5 text-xs text-text-300">Daily credits</p>
              <p className="text-base font-semibold tabular-nums text-text-100">
                {formatCredits(status?.lastBalanceDailyCredits)}
              </p>
            </div>
            <div className="rounded-lg border border-brand-main/15 bg-bg-100/50 px-3 py-3">
              <p className="mb-0.5 text-xs text-text-300">Instant credits</p>
              <p className="text-base font-semibold tabular-nums text-text-100">
                {formatCredits(status?.lastBalanceInstantCredits)}
              </p>
            </div>
            <div className="rounded-lg border border-brand-main/15 bg-bg-100/50 px-3 py-3">
              <p className="mb-0.5 text-xs text-text-300">Last checked</p>
              <p className="text-sm font-medium text-text-100">
                {formatLastChecked()}
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-brand-main/15 bg-bg-100/40 px-3 py-3">
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
              onChange={(e) => void handleIntervalChange(Number(e.target.value))}
              className="w-full rounded-lg border border-brand-main/30 bg-bg-200 px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main disabled:opacity-60 sm:max-w-xs"
            >
              {intervalOptions.map((option) => (
                <option key={option.days} value={option.days}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-relaxed text-text-300">
              Cached Reoon results older than this interval are treated as
              unverified and sent to Reoon again when campaign verification runs.
              Default is 3 months.
              {savingInterval ? " Saving…" : null}
            </p>
          </div>
        </div>
      ) : null}

      {!isConfigured && !isLoading ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-text-200">
            Add your Reoon API key to verify leads and campaign recipients. Without
            a key, Reoon verification steps in the app are unavailable.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-2">
          <IconKey className="w-4 h-4 text-text-300" />
          <h4 className="text-sm font-semibold text-text-100">
            {isConfigured ? "Update API key" : "Connect Reoon"}
          </h4>
        </div>
        <div>
          <label
            htmlFor="reoon-api-key-settings"
            className="mb-2 block text-sm font-medium text-text-200"
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
            className="w-full rounded-lg border border-brand-main/30 bg-bg-100 px-4 py-2.5 text-text-100 placeholder-text-400 focus:outline-none focus:ring-2 focus:ring-brand-main"
          />
          <p className="mt-2 text-xs leading-relaxed text-text-300">
            Encrypted at rest with KMS and used only from our backend to call Reoon.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving || disconnecting || !apiKey.trim()}
            className="bg-brand-main px-6 text-white hover:bg-brand-main/90 disabled:bg-brand-main/40"
          >
            {saving ? "Saving…" : isConfigured ? "Save new key" : "Connect Reoon"}
          </Button>
        </div>
      </form>

      {isConfigured ? (
        <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 md:p-5">
          <p className="text-sm font-medium text-text-100">Disconnect Reoon</p>
          <p className="text-xs leading-relaxed text-text-300">
            Removes your API key from LeadSnipper. Cached verification results stay
            in your account, but new Reoon checks will not run until you connect
            again. Revoke the key in Reoon&apos;s dashboard if you also want to block
            API access on their side.
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
      ) : null}

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-text-100">
              Remove Reoon integration?
            </DialogTitle>
            <DialogDescription className="text-text-200/80 text-left text-sm leading-relaxed">
              Your stored API key will be deleted from LeadSnipper. Campaign and lead
              verification that requires Reoon will stop until you connect again.
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
              className="bg-red-600 text-white hover:bg-red-600/90"
            >
              {disconnecting ? "Removing…" : "Remove API key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
