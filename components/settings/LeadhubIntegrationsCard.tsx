"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  connectLeadhub,
  disconnectLeadhub,
  getLeadhubStatus,
  LeadhubConnectionStatus,
} from "@/utils/api/leadhubClient";
import {
  IconAlertCircle,
  IconCheck,
  IconKey,
} from "@tabler/icons-react";

export default function LeadhubIntegrationsCard({
  embedded = false,
}: {
  /** Render without the outer card chrome and title, for use inside a detail modal. */
  embedded?: boolean;
} = {}) {
  const [status, setStatus] = useState<LeadhubConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [leadhubWorkspaceId, setLeadhubWorkspaceId] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:4001");

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const s = await getLeadhubStatus();
      setStatus(s);
      if (s.baseUrl) setBaseUrl(s.baseUrl);
      if (s.leadhubWorkspaceId) setLeadhubWorkspaceId(s.leadhubWorkspaceId);
    } catch (error: any) {
      console.error("Failed to fetch LeadHub status", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch LeadHub status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!apiKey.trim() || !leadhubWorkspaceId.trim() || !baseUrl.trim()) {
      toast.error("API key, workspace ID, and base URL are required");
      return;
    }
    try {
      setSaving(true);
      const s = await connectLeadhub({
        apiKey: apiKey.trim(),
        leadhubWorkspaceId: leadhubWorkspaceId.trim(),
        baseUrl: baseUrl.trim(),
      });
      setStatus(s);
      setApiKey("");
      toast.success("LeadHub connected");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to connect LeadHub"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const s = await disconnectLeadhub();
      setStatus(s);
      toast.success("LeadHub disconnected");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to disconnect LeadHub"
      );
    } finally {
      setDisconnecting(false);
    }
  };

  const isConfigured = status?.isConfigured;

  return (
    <div
      className={
        embedded
          ? "flex flex-col gap-6"
          : "backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 md:p-8 flex flex-col gap-6 max-w-3xl"
      }
    >
      {embedded ? null : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-main/15 border border-brand-main/25">
              <Zap className="h-5 w-5 text-brand-main" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-text-100">LeadHub Autopilot</h3>
              <p className="text-text-200 text-sm mt-1 leading-relaxed">
                Connect your LeadHub workspace to sync enriched leads, skip duplicate
                verification when LeadHub already validated the email, and auto-enrich
                before sending.
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
      )}

      {isConfigured && (
        <div className="rounded-lg border border-brand-main/15 bg-bg-100/50 p-4 text-sm text-text-200 space-y-1">
          <p>
            Workspace:{" "}
            <span className="text-text-100 font-mono text-xs">
              {status?.leadhubWorkspaceId}
            </span>
          </p>
          <p>
            API:{" "}
            <span className="text-text-100 font-mono text-xs">{status?.baseUrl}</span>
          </p>
          {status?.lastSyncAt && (
            <p>Last sync: {new Date(status.lastSyncAt).toLocaleString()}</p>
          )}
          {status?.lastError && (
            <p className="text-amber-700">Last error: {status.lastError}</p>
          )}
        </div>
      )}

      {!isConfigured ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-100 mb-1.5">
              LeadHub API base URL
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.leadhub.example"
              className="w-full rounded-lg border border-brand-main/25 bg-bg-100 px-3 py-2 text-sm text-text-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-100 mb-1.5">
              LeadHub workspace ID
            </label>
            <input
              type="text"
              value={leadhubWorkspaceId}
              onChange={(e) => setLeadhubWorkspaceId(e.target.value)}
              placeholder="UUID from LeadHub → Settings → Workspace"
              className="w-full rounded-lg border border-brand-main/25 bg-bg-100 px-3 py-2 text-sm text-text-100 font-mono"
            />
            <p className="text-xs text-text-200 mt-1.5">
              Find this under LeadHub → Settings → Workspace → Workspace ID.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-100 mb-1.5">
              Service API key
            </label>
            <div className="relative">
              <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-200" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="lh_..."
                className="w-full rounded-lg border border-brand-main/25 bg-bg-100 pl-10 pr-3 py-2 text-sm text-text-100 font-mono"
              />
            </div>
            <p className="text-xs text-text-200 mt-1.5">
              Create a service API key in LeadHub → Settings → Service API keys.
            </p>
          </div>
          <Button type="submit" disabled={saving || isLoading}>
            {saving ? "Connecting…" : "Connect LeadHub"}
          </Button>
        </form>
      ) : (
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={disconnecting}
            onClick={handleDisconnect}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        </div>
      )}
    </div>
  );
}
