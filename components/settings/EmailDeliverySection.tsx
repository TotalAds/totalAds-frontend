"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { SesAwsIdentitiesImportSection } from "@/components/email/SesAwsIdentitiesImportSection";
import {
  deleteSesCredentials,
  getDomains,
  getEmailSendersTotalCount,
  getSesCredentialsStatus,
  saveManualConfigSet,
  setupSnsTracking,
  storeSesCredentials,
  testSesCredentials,
  verifySnsTracking,
} from "@/utils/api/emailClient";
import { getEmailProvider, type SesProvider } from "@/utils/api/apiClient";
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCircleDot,
  IconCopy,
  IconExternalLink,
  IconLock,
  IconMail,
  IconShieldCheck,
} from "@tabler/icons-react";

const SNS_WEBHOOK_EVENTS = [
  { key: "send", label: "Sends" },
  { key: "reject", label: "Rejects" },
  { key: "bounce", label: "Bounces" },
  { key: "complaint", label: "Complaints" },
  { key: "delivery", label: "Deliveries" },
] as const;

const AWS_REGIONS: { value: string; label: string }[] = [
  { value: "us-east-1", label: "US East (N. Virginia) — us-east-1" },
  { value: "us-east-2", label: "US East (Ohio) — us-east-2" },
  { value: "us-west-1", label: "US West (N. California) — us-west-1" },
  { value: "us-west-2", label: "US West (Oregon) — us-west-2" },
  { value: "af-south-1", label: "Africa (Cape Town) — af-south-1" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai) — ap-south-1" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo) — ap-northeast-1" },
  { value: "ap-northeast-2", label: "Asia Pacific (Seoul) — ap-northeast-2" },
  { value: "ap-northeast-3", label: "Asia Pacific (Osaka) — ap-northeast-3" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore) — ap-southeast-1" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney) — ap-southeast-2" },
  { value: "ca-central-1", label: "Canada (Central) — ca-central-1" },
  { value: "eu-central-1", label: "Europe (Frankfurt) — eu-central-1" },
  { value: "eu-west-1", label: "Europe (Ireland) — eu-west-1" },
  { value: "eu-west-2", label: "Europe (London) — eu-west-2" },
  { value: "eu-west-3", label: "Europe (Paris) — eu-west-3" },
  { value: "eu-north-1", label: "Europe (Stockholm) — eu-north-1" },
  { value: "eu-south-1", label: "Europe (Milan) — eu-south-1" },
  { value: "il-central-1", label: "Israel (Tel Aviv) — il-central-1" },
  { value: "me-south-1", label: "Middle East (Bahrain) — me-south-1" },
  { value: "me-central-1", label: "Middle East (UAE) — me-central-1" },
  { value: "sa-east-1", label: "South America (São Paulo) — sa-east-1" },
];

export default function EmailDeliverySection() {
  const [sesProvider, setSesProvider] = useState<SesProvider | null>(null);
  const [providerSetAt, setProviderSetAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creds, setCreds] = useState<{
    connected: boolean;
    awsRegion?: string;
    accessKeyIdHint?: string;
    isVerified?: boolean;
    verifiedAt?: string | null;
    snsSetupComplete?: boolean;
    configurationSetName?: string | null;
    snsTopicArn?: string | null;
  }>({ connected: false });
  const [form, setForm] = useState({
    awsRegion: "us-east-1",
    accessKeyId: "",
    secretAccessKey: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // SNS setup state
  const [settingUpSns, setSettingUpSns] = useState(false);
  const [verifyingSns, setVerifyingSns] = useState(false);
  const [showManualSns, setShowManualSns] = useState(false);
  const [manualConfigSetName, setManualConfigSetName] = useState("");
  const [savingConfigSet, setSavingConfigSet] = useState(false);
  /** Full multiline error from auto-setup (toast is too short for IAM instructions) */
  const [snsSetupError, setSnsSetupError] = useState<string | null>(null);

  const [appDomainCount, setAppDomainCount] = useState(0);
  const [appSenderCount, setAppSenderCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const status = await getEmailProvider();
      setSesProvider((status.sesProvider as SesProvider) || null);
      setProviderSetAt(status.sesProviderSetAt || null);
      if (status.sesProvider === "custom") {
        try {
          const c = await getSesCredentialsStatus();
          setCreds(c);
          try {
            const domResp = await getDomains(1, 1);
            const d =
              (domResp as { data?: { pagination?: { total?: number } } } | null)?.data
                ?.pagination?.total ?? 0;
            setAppDomainCount(Number(d) || 0);
          } catch {
            setAppDomainCount(0);
          }
          try {
            const n = await getEmailSendersTotalCount();
            setAppSenderCount(n);
          } catch {
            setAppSenderCount(0);
          }
        } catch {
          setCreds({ connected: false });
        }
      }
    } catch (e) {
      toast.error("Failed to load email delivery settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!form.accessKeyId.trim() || !form.secretAccessKey.trim()) {
      toast.error("Access key and secret are required");
      return;
    }
    setSaving(true);
    try {
      await storeSesCredentials(form);
      toast.success(
        "AWS credentials saved and validated. Run “Test connection” to mark them verified."
      );
      setForm((f) => ({ ...f, secretAccessKey: "" }));
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testSesCredentials();
      if (result.success) {
        toast.success("Connection successful");
        load();
      } else {
        toast.error(result.message || "Connection failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Remove stored AWS credentials? You will need to add them again to send campaigns.")) return;
    setSaving(true);
    try {
      await deleteSesCredentials();
      toast.success("Credentials removed");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSetupSns = async () => {
    setSettingUpSns(true);
    setSnsSetupError(null);
    try {
      const result = await setupSnsTracking();
      if (result.success) {
        setSnsSetupError(null);
        toast.success("SNS event tracking configured successfully");
        load();
      } else {
        const msg = result.message || "SNS setup failed";
        setSnsSetupError(msg);
        toast.error("SNS auto-setup failed — see instructions below.");
        const failed = result.data?.steps?.some((s) => s.status === "failed");
        if (failed) setShowManualSns(true);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "SNS setup failed";
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
        load();
      } else {
        const issues: string[] = [];
        if (!result.data?.configurationSetExists) issues.push("Configuration Set not found");
        if (!result.data?.eventDestinationExists) issues.push("Event destination not configured");
        if (!result.data?.snsTopicExists) issues.push("SNS topic not found");
        if (!result.data?.subscriptionConfirmed) issues.push("Webhook subscription pending");
        toast.error(`Issues: ${issues.join(", ")}`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
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
        load();
      } else {
        toast.error(result.message || "Failed to verify Configuration Set");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to save");
    } finally {
      setSavingConfigSet(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-brand-main border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-100 flex items-center gap-2">
          <IconMail className="w-5 h-5" />
          Email delivery
        </h2>
        <p className="text-sm text-text-200 mt-1">
          {sesProvider === "leadsnipper_managed" &&
            "You selected LeadSnipper Managed SES during onboarding. We manage SES, reputation, throttling, and safety. This is a one-time choice and cannot be changed later."}
          {sesProvider === "custom" &&
            "You selected Bring Your Own SES during onboarding. You connect your own AWS SES account and manage reputation and limits. This is a one-time choice and cannot be changed later."}
          {sesProvider === null &&
            "Complete onboarding to choose your email delivery option. Once selected, it cannot be changed later."}
        </p>
        {providerSetAt && (
          <p className="text-xs text-text-300 mt-1">
            Selected on {new Date(providerSetAt).toLocaleString()}
          </p>
        )}
      </div>

      {sesProvider === null && (
        <p className="text-sm text-text-200">
          Complete onboarding to set your email delivery option.
        </p>
      )}

      {sesProvider === "leadsnipper_managed" && (
        <div className="p-4 rounded-lg bg-brand-main/10 border border-brand-main/20 space-y-2">
          <p className="font-medium text-text-100">LeadSnipper Managed SES</p>
          <p className="text-sm text-text-200">
            LeadSnipper manages your SES integration, reputation, throttling, and safety.
            We automatically ramp up your sending limits based on bounce/complaint rates,
            engagement, domain age, and global SES health.
          </p>
          <p className="text-xs text-text-300">
            Each verified sender has its own smart daily cap. If reputation drops or global SES
            risk increases, we automatically slow or pause sending to protect your deliverability.
          </p>
        </div>
      )}

      {sesProvider === "custom" && (
        <>
          <div className="p-4 rounded-lg bg-bg-300 border border-bg-200">
            <div className="flex items-center gap-2 mb-1">
              <IconShieldCheck className="w-4 h-4 text-brand-main" />
              <p className="font-medium text-text-100">Bring Your Own SES</p>
            </div>
            <p className="text-sm text-text-200">
              Access keys are stored with AWS KMS envelope encryption (same as our
              other secrets). They are never returned in API responses; only the
              sending engine decrypts them at runtime.
            </p>
          </div>

          {/* Setup checklist */}
          <div className="p-4 rounded-lg border border-bg-200 bg-bg-100 space-y-3">
            <p className="text-sm font-medium text-text-100">Setup checklist</p>
            <div className="space-y-2">
              {[
                { done: creds.connected, label: "Connect AWS SES API credentials" },
                { done: creds.isVerified, label: "Test and verify the connection" },
                { done: !!creds.snsSetupComplete, label: "Set up SNS event tracking (for analytics)" },
                { done: appDomainCount > 0, label: "Add and verify a sending domain" },
                {
                  done: appSenderCount > 0,
                  label: "Create and verify an email sender",
                },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {step.done ? (
                    <IconCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <IconCircleDot className="w-4 h-4 text-text-300 flex-shrink-0" />
                  )}
                  <span className={step.done ? "text-text-200 line-through" : "text-text-100"}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!creds.connected ? (
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-2">
                <IconLock className="w-4 h-4 text-brand-main" />
                <p className="text-sm text-text-100 font-medium">
                  Connect your AWS SES credentials
                </p>
              </div>

              <p className="text-xs text-text-300">
                Create an IAM user with <code className="bg-bg-300 px-1 py-0.5 rounded text-xs">AmazonSESFullAccess</code> policy
                and paste the credentials below.{" "}
                <a
                  href="https://docs.aws.amazon.com/ses/latest/dg/setting-up.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-main hover:underline inline-flex items-center gap-0.5"
                >
                  AWS SES docs <IconExternalLink className="w-3 h-3" />
                </a>
              </p>

              <div>
                <label className="block text-sm text-text-200 mb-1">
                  AWS Region
                </label>
                <select
                  value={form.awsRegion}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, awsRegion: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-bg-200 rounded-lg bg-bg-100 text-text-100 text-sm"
                >
                  {AWS_REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-200 mb-1">
                  Access Key ID
                </label>
                <input
                  type="text"
                  value={form.accessKeyId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accessKeyId: e.target.value }))
                  }
                  placeholder="AKIA..."
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-bg-200 rounded-lg bg-bg-100 text-text-100 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-text-200 mb-1">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  value={form.secretAccessKey}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, secretAccessKey: e.target.value }))
                  }
                  placeholder="••••••••"
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-bg-200 rounded-lg bg-bg-100 text-text-100 text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save credentials"}
                </button>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={saving || !form.accessKeyId || !form.secretAccessKey}
                  className="px-4 py-2 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 disabled:opacity-50"
                >
                  {testing ? "Testing..." : "Test connection"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-lg">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <IconCheck className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-text-100">
                    AWS SES connected
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-text-300">Region</span>
                  <span className="text-text-100">
                    {AWS_REGIONS.find((r) => r.value === creds.awsRegion)?.label || creds.awsRegion}
                  </span>
                  {creds.accessKeyIdHint && (
                    <>
                      <span className="text-text-300">Access key ID</span>
                      <span className="text-text-100 font-mono text-xs">
                        {creds.accessKeyIdHint}
                      </span>
                    </>
                  )}
                  <span className="text-text-300">Status</span>
                  <span className={creds.isVerified ? "text-green-600" : "text-amber-600"}>
                    {creds.isVerified ? "Verified" : "Not verified"}
                  </span>
                  {creds.isVerified && creds.verifiedAt && (
                    <>
                      <span className="text-text-300">Verified at</span>
                      <span className="text-text-100">
                        {new Date(creds.verifiedAt).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="px-4 py-2 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 disabled:opacity-50"
                >
                  {testing ? "Testing..." : "Re-test connection"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, awsRegion: creds.awsRegion || "us-east-1" }));
                    setCreds({ ...creds, connected: false });
                  }}
                  className="text-sm text-brand-main hover:underline"
                >
                  Update credentials
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={saving}
                  className="text-sm text-red-500 hover:underline disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {/* Import domains & senders from AWS */}
          {creds.connected && creds.isVerified && (
            <SesAwsIdentitiesImportSection
              className="border-t border-bg-200 pt-5 max-w-3xl"
              onImportComplete={() => void load()}
            />
          )}

          {/* ── SNS Event Tracking Setup ── */}
          {creds.connected && creds.isVerified && (
            <div className="space-y-4 max-w-lg">
              <div className="border-t border-bg-200 pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <IconActivityHeartbeat className="w-5 h-5 text-brand-main" />
                  <h3 className="font-medium text-text-100">
                    SNS event tracking
                  </h3>
                </div>
                <p className="text-sm text-text-200 mb-3">
                  Required for email analytics — bounces, complaints, deliveries,
                  and reputation metrics are tracked through AWS SNS notifications
                  to our HTTPS webhook.
                </p>

                {/* Webhook endpoint (same URL auto-setup subscribes for SNS → SES events) */}
                <div className="p-3 rounded-lg bg-bg-300/50 border border-bg-200 mb-4 space-y-2">
                  <p className="text-xs font-medium text-text-100">
                    SNS HTTPS subscription (send, reject, bounce, complaint, delivery)
                  </p>
                  <p className="text-[11px] text-text-300">
                    Auto-setup creates an SNS topic and subscribes this endpoint so SES
                    can publish delivery events we use for analytics and suppression.
                    Events: {SNS_WEBHOOK_EVENTS.map((e) => e.label).join(", ")}.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-[11px] break-all bg-bg-100 px-2 py-1.5 rounded border border-bg-200 flex-1 min-w-0">
                      {typeof window !== "undefined"
                        ? `${process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001"}/api/webhooks/sns`
                        : "/api/webhooks/sns"}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001"}/api/webhooks/sns`;
                        void navigator.clipboard.writeText(url).then(
                          () => toast.success("Webhook URL copied"),
                          () => toast.error("Could not copy")
                        );
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 shrink-0"
                    >
                      <IconCopy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>
                </div>

                {!creds.snsSetupComplete ? (
                  <>
                    {/* Warning banner */}
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                      <div className="flex gap-2">
                        <IconAlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-text-100">
                            Analytics not available yet
                          </p>
                          <p className="text-xs text-text-200">
                            Without SNS event tracking, you won&apos;t see bounce rates,
                            complaint rates, or delivery confirmations. This also affects
                            sender reputation tracking and warm-up accuracy.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Why this is needed */}
                    <div className="p-3 rounded-lg bg-bg-300/50 border border-bg-200 mb-4 space-y-2">
                      <p className="text-xs font-medium text-text-100">Why is this required?</p>
                      <ul className="text-xs text-text-200 space-y-1 list-disc pl-4">
                        <li>AWS SES sends bounce, complaint, and delivery events via SNS</li>
                        <li>We need an SNS topic in your account subscribed to our webhook</li>
                        <li>A Configuration Set in SES routes events to that SNS topic</li>
                        <li>This lets us track delivery stats, protect your sender reputation, and auto-suppress bad addresses</li>
                      </ul>
                    </div>

                    {/* What it creates */}
                    <div className="p-3 rounded-lg bg-bg-300/50 border border-bg-200 mb-4 space-y-2">
                      <p className="text-xs font-medium text-text-100">What auto-setup creates in your AWS account</p>
                      <ol className="text-xs text-text-200 space-y-1 list-decimal pl-4">
                        <li>An SNS topic named <code className="bg-bg-300 px-1 py-0.5 rounded">leadsniper-ses-events</code></li>
                        <li>An HTTPS subscription pointing to our webhook endpoint</li>
                        <li>An SES Configuration Set named <code className="bg-bg-300 px-1 py-0.5 rounded">{process.env.AWS_SES_CONFIGURATION_SET_NAME || 'leadsnipper'}</code></li>
                        <li>Event destinations for bounces, complaints, deliveries, sends, and rejects</li>
                      </ol>
                      <p className="text-[11px] text-text-300 mt-1">
                        Your IAM user needs both <code className="bg-bg-300 px-1 py-0.5 rounded text-[11px]">AmazonSESFullAccess</code> and{" "}
                        <code className="bg-bg-300 px-1 py-0.5 rounded text-[11px]">AmazonSNSFullAccess</code> policies for auto-setup.
                      </p>
                    </div>

                    {/* Auto-setup button */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={handleAutoSetupSns}
                        disabled={settingUpSns}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 disabled:opacity-50"
                      >
                        {settingUpSns ? "Setting up..." : "Auto-setup SNS tracking"}
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifySns}
                        disabled={verifyingSns}
                        className="px-4 py-2 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 disabled:opacity-50"
                      >
                        {verifyingSns ? "Verifying..." : "Verify setup"}
                      </button>
                    </div>

                    {snsSetupError && (
                      <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
                        <div className="flex gap-2">
                          <IconAlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-text-100 mb-2">
                              SNS auto-setup could not finish
                            </p>
                            <pre className="text-xs text-text-200 whitespace-pre-wrap font-sans break-words m-0">
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

                    {/* Manual setup toggle */}
                    <button
                      type="button"
                      onClick={() => setShowManualSns(!showManualSns)}
                      className="flex items-center gap-1 text-xs text-text-300 hover:text-text-100 transition-colors"
                    >
                      {showManualSns ? <IconChevronUp className="w-3 h-3" /> : <IconChevronDown className="w-3 h-3" />}
                      {showManualSns ? "Hide manual setup" : "Set up manually instead"}
                    </button>

                    {showManualSns && (
                      <div className="mt-3 p-4 rounded-lg border border-bg-200 bg-bg-100 space-y-3">
                        <p className="text-sm font-medium text-text-100">Manual setup instructions</p>
                        <div className="text-xs text-text-200 space-y-3">
                          <div>
                            <p className="font-medium text-text-100 mb-1">Step 1: Create an SNS topic</p>
                            <ol className="list-decimal pl-4 space-y-0.5">
                              <li>Go to <a href="https://console.aws.amazon.com/sns/v3/home" target="_blank" rel="noopener noreferrer" className="text-brand-main hover:underline">AWS SNS Console <IconExternalLink className="w-3 h-3 inline" /></a></li>
                              <li>Make sure you&apos;re in the same region as your SES ({creds.awsRegion || "your region"})</li>
                              <li>Click &quot;Create topic&quot; → Type: Standard → Name: <code className="bg-bg-300 px-1 py-0.5 rounded">leadsniper-ses-events</code></li>
                              <li>Click &quot;Create topic&quot; and copy the Topic ARN</li>
                            </ol>
                          </div>
                          <div>
                            <p className="font-medium text-text-100 mb-1">Step 2: Subscribe our webhook</p>
                            <ol className="list-decimal pl-4 space-y-0.5">
                              <li>On the topic page, click &quot;Create subscription&quot;</li>
                              <li>Protocol: <strong>HTTPS</strong></li>
                              <li>Endpoint: <code className="bg-bg-300 px-1 py-0.5 rounded break-all">{typeof window !== "undefined" ? `${process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || ""}/api/webhooks/sns` : "/api/webhooks/sns"}</code></li>
                              <li>Click &quot;Create subscription&quot; — we auto-confirm it</li>
                            </ol>
                          </div>
                          <div>
                            <p className="font-medium text-text-100 mb-1">Step 3: Create SES Configuration Set</p>
                            <ol className="list-decimal pl-4 space-y-0.5">
                              <li>Go to <a href="https://console.aws.amazon.com/ses/home#/configuration-sets" target="_blank" rel="noopener noreferrer" className="text-brand-main hover:underline">SES Configuration Sets <IconExternalLink className="w-3 h-3 inline" /></a></li>
                              <li>Click &quot;Create set&quot; → Name it (e.g., <code className="bg-bg-300 px-1 py-0.5 rounded">{process.env.AWS_SES_CONFIGURATION_SET_NAME || 'leadsnipper'}</code>)</li>
                              <li>Add an event destination → SNS → select the topic from Step 1</li>
                              <li>Enable events: Sends, Rejects, Bounces, Complaints, Deliveries</li>
                            </ol>
                          </div>
                          <div>
                            <p className="font-medium text-text-100 mb-1">Step 4: Enter your Configuration Set name below</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualConfigSetName}
                            onChange={(e) => setManualConfigSetName(e.target.value)}
                            placeholder={`e.g. ${process.env.AWS_SES_CONFIGURATION_SET_NAME || 'leadsnipper'}`}
                            className="flex-1 px-3 py-2 border border-bg-200 rounded-lg bg-bg-100 text-text-100 text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleSaveManualConfigSet}
                            disabled={savingConfigSet || !manualConfigSetName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 disabled:opacity-50"
                          >
                            {savingConfigSet ? "Verifying..." : "Save & verify"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* SNS setup complete */
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <IconCheck className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-text-100">
                        SNS event tracking active
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {creds.configurationSetName && (
                        <>
                          <span className="text-text-300">Configuration Set</span>
                          <span className="text-text-100 font-mono text-xs">
                            {creds.configurationSetName}
                          </span>
                        </>
                      )}
                      {creds.snsTopicArn && (
                        <>
                          <span className="text-text-300">SNS Topic</span>
                          <span className="text-text-100 font-mono text-xs truncate" title={creds.snsTopicArn}>
                            {creds.snsTopicArn.split(":").pop()}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-text-300 mt-2">
                      Bounces, complaints, and deliveries are being tracked via SNS webhooks.
                    </p>
                    <button
                      type="button"
                      onClick={handleVerifySns}
                      disabled={verifyingSns}
                      className="mt-2 text-xs text-brand-main hover:underline disabled:opacity-50"
                    >
                      {verifyingSns ? "Verifying..." : "Re-verify setup"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
