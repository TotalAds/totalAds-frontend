"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconExternalLink,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  saveManualConfigSet,
  setupSnsTracking,
  type SesCredentialsStatus,
  verifySnsTracking,
} from "@/utils/api/emailClient";

const SNS_WEBHOOK_EVENTS = [
  { key: "send", label: "Sends" },
  { key: "reject", label: "Rejects" },
  { key: "bounce", label: "Bounces" },
  { key: "complaint", label: "Complaints" },
  { key: "delivery", label: "Deliveries" },
] as const;

const webhookUrl =
  typeof window !== "undefined"
    ? `${process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001"}/api/webhooks/sns`
    : "/api/webhooks/sns";

export interface SesSnsTrackingSectionProps {
  creds: Pick<
    SesCredentialsStatus,
    | "awsRegion"
    | "snsSetupComplete"
    | "configurationSetName"
    | "snsTopicArn"
  >;
  onStatusChange?: () => void | Promise<void>;
  className?: string;
  compact?: boolean;
}

export function SesSnsTrackingSection({
  creds,
  onStatusChange,
  className = "",
  compact = false,
}: SesSnsTrackingSectionProps) {
  const [settingUpSns, setSettingUpSns] = useState(false);
  const [verifyingSns, setVerifyingSns] = useState(false);
  const [showManualSns, setShowManualSns] = useState(false);
  const [manualConfigSetName, setManualConfigSetName] = useState("");
  const [savingConfigSet, setSavingConfigSet] = useState(false);
  const [snsSetupError, setSnsSetupError] = useState<string | null>(null);

  const handleAutoSetupSns = async () => {
    setSettingUpSns(true);
    setSnsSetupError(null);
    try {
      const result = await setupSnsTracking();
      if (result.success) {
        setSnsSetupError(null);
        toast.success("SNS event tracking configured successfully");
        await onStatusChange?.();
      } else {
        const msg = result.message || "SNS setup failed";
        setSnsSetupError(msg);
        toast.error("SNS auto-setup failed — see instructions below.");
        const failed = result.data?.steps?.some((s) => s.status === "failed");
        if (failed) setShowManualSns(true);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message || err?.message || "SNS setup failed";
      setSnsSetupError(typeof msg === "string" ? msg : String(msg));
      toast.error("SNS auto-setup failed — see instructions below.");
      setShowManualSns(true);
    } finally {
      setSettingUpSns(false);
    }
  };

  const handleVerifySns = async () => {
    setVerifyingSns(true);
    try {
      const result = await verifySnsTracking();
      if (result.data?.configurationSetExists && result.data?.eventDestinationExists) {
        toast.success("SNS event tracking verified successfully");
        await onStatusChange?.();
      } else {
        const issues: string[] = [];
        if (!result.data?.configurationSetExists) issues.push("Configuration Set not found");
        if (!result.data?.eventDestinationExists) issues.push("Event destination not configured");
        if (!result.data?.snsTopicExists) issues.push("SNS topic not found");
        if (!result.data?.subscriptionConfirmed) issues.push("Webhook subscription pending");
        toast.error(`Issues: ${issues.join(", ")}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      toast.error(msg);
    } finally {
      setVerifyingSns(false);
    }
  };

  const handleSaveManualConfigSet = async () => {
    if (!manualConfigSetName.trim()) {
      toast.error("Enter a Configuration Set name");
      return;
    }
    setSavingConfigSet(true);
    try {
      const result = await saveManualConfigSet(manualConfigSetName.trim());
      if (result.success) {
        toast.success("Configuration Set saved and verified");
        setShowManualSns(false);
        await onStatusChange?.();
      } else {
        toast.error(result.message || "Failed to verify Configuration Set");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Failed to save");
    } finally {
      setSavingConfigSet(false);
    }
  };

  const configSetName = process.env.AWS_SES_CONFIGURATION_SET_NAME || "leadsnipper";

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="mb-1 flex items-center gap-2">
          <IconActivityHeartbeat className="h-5 w-5 text-brand-main" />
          <h3 className="font-medium text-text-100">SNS event tracking</h3>
        </div>
        <p className="text-sm text-text-200">
          Required for email analytics — bounces, complaints, deliveries, and reputation
          metrics are tracked through AWS SNS notifications to our HTTPS webhook.
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-bg-200 bg-bg-300/50 p-3">
        <p className="text-xs font-medium text-text-100">
          SNS HTTPS subscription (send, reject, bounce, complaint, delivery)
        </p>
        <p className="text-[11px] text-text-300">
          Auto-setup creates an SNS topic and subscribes this endpoint so SES can publish
          delivery events we use for analytics and suppression. Events:{" "}
          {SNS_WEBHOOK_EVENTS.map((e) => e.label).join(", ")}.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 break-all rounded border border-bg-200 bg-bg-100 px-2 py-1.5 text-[11px] text-text-100">
            {webhookUrl}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(webhookUrl).then(
                () => toast.success("Webhook URL copied"),
                () => toast.error("Could not copy")
              );
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-bg-200 px-2 py-1.5 text-xs font-medium text-text-100 hover:bg-bg-300"
          >
            <IconCopy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
      </div>

      {!creds.snsSetupComplete ? (
        <>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex gap-2">
              <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-100">Analytics not available yet</p>
                <p className="text-xs text-text-200">
                  Without SNS event tracking, you won&apos;t see bounce rates, complaint rates,
                  or delivery confirmations. This also affects sender reputation tracking.
                </p>
              </div>
            </div>
          </div>

          {!compact && (
            <>
              <div className="space-y-2 rounded-lg border border-bg-200 bg-bg-300/50 p-3">
                <p className="text-xs font-medium text-text-100">Why is this required?</p>
                <ul className="list-disc space-y-1 pl-4 text-xs text-text-200">
                  <li>AWS SES sends bounce, complaint, and delivery events via SNS</li>
                  <li>We need an SNS topic in your account subscribed to our webhook</li>
                  <li>A Configuration Set in SES routes events to that SNS topic</li>
                  <li>
                    This lets us track delivery stats, protect sender reputation, and
                    auto-suppress bad addresses
                  </li>
                </ul>
              </div>

              <div className="space-y-2 rounded-lg border border-bg-200 bg-bg-300/50 p-3">
                <p className="text-xs font-medium text-text-100">
                  What auto-setup creates in your AWS account
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-xs text-text-200">
                  <li>
                    An SNS topic named{" "}
                    <code className="rounded bg-bg-300 px-1 py-0.5">leadsniper-ses-events</code>
                  </li>
                  <li>An HTTPS subscription pointing to our webhook endpoint</li>
                  <li>
                    An SES Configuration Set named{" "}
                    <code className="rounded bg-bg-300 px-1 py-0.5">{configSetName}</code>
                  </li>
                  <li>Event destinations for bounces, complaints, deliveries, sends, and rejects</li>
                </ol>
                <p className="mt-1 text-[11px] text-text-300">
                  Your IAM user needs both{" "}
                  <code className="rounded bg-bg-300 px-1 py-0.5 text-[11px]">
                    AmazonSESFullAccess
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-bg-300 px-1 py-0.5 text-[11px]">
                    AmazonSNSFullAccess
                  </code>{" "}
                  policies for auto-setup.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleAutoSetupSns()} disabled={settingUpSns}>
              {settingUpSns ? "Setting up…" : "Auto-setup SNS tracking"}
            </Button>
            <Button variant="outline" onClick={() => void handleVerifySns()} disabled={verifyingSns}>
              {verifyingSns ? "Verifying…" : "Verify setup"}
            </Button>
          </div>

          {snsSetupError && (
            <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex gap-2">
                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-sm font-medium text-text-100">
                    SNS auto-setup could not finish
                  </p>
                  <pre className="m-0 whitespace-pre-wrap break-words font-sans text-xs text-text-200">
                    {snsSetupError}
                  </pre>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSnsSetupError(null)}
                className="text-xs text-text-300 hover:text-text-100"
              >
                Dismiss
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowManualSns(!showManualSns)}
            className="flex items-center gap-1 text-xs text-text-300 transition-colors hover:text-text-100"
          >
            {showManualSns ? (
              <IconChevronUp className="h-3 w-3" />
            ) : (
              <IconChevronDown className="h-3 w-3" />
            )}
            {showManualSns ? "Hide manual setup" : "Set up manually instead"}
          </button>

          {showManualSns && (
            <div className="space-y-3 rounded-lg border border-bg-200 bg-bg-100 p-4">
              <p className="text-sm font-medium text-text-100">Manual setup instructions</p>
              <div className="space-y-3 text-xs text-text-200">
                <div>
                  <p className="mb-1 font-medium text-text-100">Step 1: Create an SNS topic</p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    <li>
                      Go to{" "}
                      <a
                        href="https://console.aws.amazon.com/sns/v3/home"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-main hover:underline"
                      >
                        AWS SNS Console <IconExternalLink className="inline h-3 w-3" />
                      </a>
                    </li>
                    <li>
                      Make sure you&apos;re in the same region as your SES (
                      {creds.awsRegion || "your region"})
                    </li>
                    <li>
                      Click &quot;Create topic&quot; → Type: Standard → Name:{" "}
                      <code className="rounded bg-bg-300 px-1 py-0.5">leadsniper-ses-events</code>
                    </li>
                    <li>Click &quot;Create topic&quot; and copy the Topic ARN</li>
                  </ol>
                </div>
                <div>
                  <p className="mb-1 font-medium text-text-100">Step 2: Subscribe our webhook</p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    <li>On the topic page, click &quot;Create subscription&quot;</li>
                    <li>Protocol: <strong>HTTPS</strong></li>
                    <li>
                      Endpoint:{" "}
                      <code className="break-all rounded bg-bg-300 px-1 py-0.5">{webhookUrl}</code>
                    </li>
                    <li>Click &quot;Create subscription&quot; — we auto-confirm it</li>
                  </ol>
                </div>
                <div>
                  <p className="mb-1 font-medium text-text-100">
                    Step 3: Create SES Configuration Set
                  </p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    <li>
                      Go to{" "}
                      <a
                        href="https://console.aws.amazon.com/ses/home#/configuration-sets"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-main hover:underline"
                      >
                        SES Configuration Sets <IconExternalLink className="inline h-3 w-3" />
                      </a>
                    </li>
                    <li>
                      Click &quot;Create set&quot; → Name it (e.g.,{" "}
                      <code className="rounded bg-bg-300 px-1 py-0.5">{configSetName}</code>)
                    </li>
                    <li>Add an event destination → SNS → select the topic from Step 1</li>
                    <li>Enable events: Sends, Rejects, Bounces, Complaints, Deliveries</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium text-text-100">
                    Step 4: Enter your Configuration Set name below
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualConfigSetName}
                  onChange={(e) => setManualConfigSetName(e.target.value)}
                  placeholder={`e.g. ${configSetName}`}
                  className="flex-1 rounded-lg border border-bg-200 bg-bg-100 px-3 py-2 font-mono text-sm text-text-100"
                />
                <Button
                  onClick={() => void handleSaveManualConfigSet()}
                  disabled={savingConfigSet || !manualConfigSetName.trim()}
                >
                  {savingConfigSet ? "Verifying…" : "Save & verify"}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <IconCheck className="h-4 w-4 text-green-600" />
            <p className="text-sm font-medium text-text-100">SNS event tracking active</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {creds.configurationSetName && (
              <>
                <span className="text-text-300">Configuration Set</span>
                <span className="font-mono text-xs text-text-100">{creds.configurationSetName}</span>
              </>
            )}
            {creds.snsTopicArn && (
              <>
                <span className="text-text-300">SNS Topic</span>
                <span
                  className="truncate font-mono text-xs text-text-100"
                  title={creds.snsTopicArn}
                >
                  {creds.snsTopicArn.split(":").pop()}
                </span>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-text-300">
            Bounces, complaints, and deliveries are being tracked via SNS webhooks.
          </p>
          <button
            type="button"
            onClick={() => void handleVerifySns()}
            disabled={verifyingSns}
            className="mt-2 text-xs text-brand-main hover:underline disabled:opacity-50"
          >
            {verifyingSns ? "Verifying…" : "Re-verify setup"}
          </button>
        </div>
      )}
    </div>
  );
}
