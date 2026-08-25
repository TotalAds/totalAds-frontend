"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy, KeyRound, Loader2, Webhook } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  disableCampaignWebhook,
  enableOrRotateCampaignWebhook,
  getCampaignWebhookStatus,
  getEmailServiceErrorMessage,
} from "@/utils/api/emailClient";

interface CampaignWebhookPanelProps {
  campaignId: string;
  domainId: string;
  isContinuous: boolean;
}

export function CampaignWebhookPanel({
  campaignId,
  domainId,
  isContinuous,
}: CampaignWebhookPanelProps) {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [plaintextSecret, setPlaintextSecret] = useState<string | null>(null);
  const [queueDelayMinutes, setQueueDelayMinutes] = useState(5);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const status = await getCampaignWebhookStatus(domainId, campaignId);
      setEnabled(Boolean(status.enabled));
      setWebhookUrl(status.webhookUrl || null);
      setQueueDelayMinutes(
        typeof status.queueDelayMinutes === "number"
          ? status.queueDelayMinutes
          : typeof status.holdMinutes === "number"
            ? status.holdMinutes
            : 5
      );
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to load webhook"));
    } finally {
      setLoading(false);
    }
  }, [campaignId, domainId]);

  useEffect(() => {
    if (!isContinuous) return;
    void refresh();
  }, [isContinuous, refresh]);

  if (!isContinuous) return null;

  const handleEnable = async (rotate: boolean) => {
    setBusy(true);
    try {
      const data = await enableOrRotateCampaignWebhook(domainId, campaignId, rotate);
      setEnabled(true);
      setWebhookUrl(data.webhookUrl);
      setPlaintextSecret(data.ingestSecret);
      setQueueDelayMinutes(
        typeof data.queueDelayMinutes === "number"
          ? data.queueDelayMinutes
          : typeof data.holdMinutes === "number"
            ? data.holdMinutes
            : 5
      );
      toast.success(
        rotate
          ? "Token rotated — copy the new secret now"
          : "Webhook enabled — copy the API token now"
      );
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to enable webhook"));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await disableCampaignWebhook(domainId, campaignId);
      setEnabled(false);
      setWebhookUrl(null);
      setPlaintextSecret(null);
      toast.success("Webhook disabled");
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to disable webhook"));
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white">
          <Webhook className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900">API / Webhook</h4>
          <p className="mt-0.5 text-xs text-slate-500">
            POST leads to a unique URL with your API token.{" "}
            <strong>name</strong> and <strong>email</strong> are required. Extra
            fields are saved as custom data. On a running continuous campaign,
            leads appear in the pending queue immediately and send after{" "}
            {queueDelayMinutes} minute{queueDelayMinutes === 1 ? "" : "s"} — no
            Restart Campaign needed. Optional <strong>tags</strong>,{" "}
            <strong>categories</strong>, and <strong>lists</strong> are created
            if missing and applied to the lead. Duplicate queue submissions
            return an error.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-slate-500">
          <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
          Loading…
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {!enabled ? (
            <Button
              type="button"
              className="bg-violet-600 text-white hover:bg-violet-700"
              disabled={busy}
              onClick={() => void handleEnable(false)}
            >
              {busy ? "Enabling…" : "Enable webhook"}
            </Button>
          ) : (
            <>
              {webhookUrl && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Webhook URL
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-800">
                      {webhookUrl}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copy(webhookUrl)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              {plaintextSecret && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <KeyRound className="h-3.5 w-3.5" />
                    API token (shown once)
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 truncate rounded border border-amber-200 bg-white px-2 py-1.5 text-[11px]">
                      {plaintextSecret}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copy(plaintextSecret)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-amber-800">
                    Use as{" "}
                    <code className="rounded bg-white px-1">
                      Authorization: Bearer &lt;token&gt;
                    </code>
                  </p>
                </div>
              )}
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700">{`POST ${webhookUrl || "<webhook-url>"}
Authorization: Bearer <api-token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Acme",
  "tags": ["webinar"],
  "categories": ["SaaS"],
  "lists": ["Inbound Webhook"],
  "queueDelayMinutes": ${queueDelayMinutes}
}`}</pre>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void handleEnable(true)}
                >
                  Rotate token
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-rose-700"
                  disabled={busy}
                  onClick={() => void handleDisable()}
                >
                  Disable
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
