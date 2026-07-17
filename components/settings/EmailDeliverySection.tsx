"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { SesAwsIdentitiesImportSection } from "@/components/email/SesAwsIdentitiesImportSection";
import { SesSnsTrackingSection } from "@/components/email/SesSnsTrackingSection";
import emailClient, {
  deleteSesCredentials,
  getDomains,
  getEmailSendersTotalCount,
  getSesCredentialsStatus,
  storeSesCredentials,
  testSesCredentials,
} from "@/utils/api/emailClient";
import { getEmailProvider, type PrimarySendingMethod, type SesProvider } from "@/utils/api/apiClient";
import { AWS_SES_REGIONS, getAwsSesRegionLabel } from "@/lib/awsSesRegions";
import {
  IconCheck,
  IconCircleDot,
  IconExternalLink,
  IconLock,
  IconMail,
  IconShieldCheck,
} from "@tabler/icons-react";

export default function EmailDeliverySection() {
  const [sesProvider, setSesProvider] = useState<SesProvider | null>(null);
  const [primarySendingMethod, setPrimarySendingMethod] =
    useState<PrimarySendingMethod | null>(null);
  const [sesServiceEnabled, setSesServiceEnabled] = useState(false);
  const [sesServiceMode, setSesServiceMode] = useState<"managed_ses" | "byo_ses" | null>(null);
  const [customPlanLimits, setCustomPlanLimits] = useState<{
    monthlyEmailLimit: number;
    maxContacts: number;
    planName: string | null;
  } | null>(null);
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

  const [appDomainCount, setAppDomainCount] = useState(0);
  const [appSenderCount, setAppSenderCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const status = await getEmailProvider();
      setSesProvider((status.sesProvider as SesProvider) || null);
      setPrimarySendingMethod(status.primarySendingMethod ?? null);
      setSesServiceEnabled(!!status.sesServiceEnabled);
      setSesServiceMode(status.sesServiceMode ?? null);
      setCustomPlanLimits(status.customPlanLimits ?? null);
      setProviderSetAt(
        status.sesServiceEnabledAt ||
          status.primarySendingMethodSetAt ||
          status.sesProviderSetAt ||
          null
      );
      const isByoSes =
        (status.sesServiceEnabled && status.sesServiceMode === "byo_ses") ||
        status.primarySendingMethod === "byo_ses" ||
        status.sesProvider === "custom";
      if (isByoSes) {
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

  const isManagedSesActive =
    (sesServiceEnabled && sesServiceMode === "managed_ses") ||
    primarySendingMethod === "managed_ses" ||
    sesProvider === "leadsnipper_managed";
  const isByoSesActive =
    (sesServiceEnabled && sesServiceMode === "byo_ses") ||
    primarySendingMethod === "byo_ses" ||
    sesProvider === "custom";
  const isInboxOnly =
    !sesServiceEnabled &&
    (primarySendingMethod === "gmail" ||
      primarySendingMethod === "outlook" ||
      primarySendingMethod === "zoho" ||
      primarySendingMethod === "smtp");

  const [sesRequestOpen, setSesRequestOpen] = useState(false);
  const [sesRequestSubmitting, setSesRequestSubmitting] = useState(false);
  const [sesRequestForm, setSesRequestForm] = useState({
    requestedSesMode: "managed_ses" as "managed_ses" | "byo_ses",
    expectedMonthlyEmails: "10000",
    expectedContacts: "5000",
    useCase: "",
    budgetRange: "₹5,000 - ₹10,000/month",
    contactPhone: "",
  });

  const submitSesRequest = async () => {
    if (!sesRequestForm.useCase.trim() || sesRequestForm.useCase.trim().length < 10) {
      toast.error("Describe your use case (at least 10 characters).");
      return;
    }
    setSesRequestSubmitting(true);
    try {
      await emailClient.post("/api/custom-plan/ses-request", {
        requestedSesMode: sesRequestForm.requestedSesMode,
        expectedMonthlyEmails: Number(sesRequestForm.expectedMonthlyEmails),
        expectedContacts: Number(sesRequestForm.expectedContacts),
        useCase: sesRequestForm.useCase.trim(),
        budgetRange: sesRequestForm.budgetRange,
        contactPhone: sesRequestForm.contactPhone || undefined,
      });
      toast.success("SES service request submitted. Our team will contact you shortly.");
      setSesRequestOpen(false);
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : undefined;
      toast.error(msg || "Failed to submit request");
    } finally {
      setSesRequestSubmitting(false);
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
          {isManagedSesActive &&
            "LeadSnipper Managed SES is enabled for your account. We manage reputation, throttling, and safety."}
          {isByoSesActive &&
            !isManagedSesActive &&
            "Bring Your Own SES is enabled. Connect AWS credentials below, then add domains and senders."}
          {isInboxOnly &&
            "You send through connected inboxes (Gmail, Outlook, or SMTP). AWS SES is available as a paid add-on — request access below."}
        </p>
        {customPlanLimits && sesServiceEnabled && (
          <p className="text-xs text-text-300 mt-2">
            Your SES plan: {customPlanLimits.planName || "Custom"} — up to{" "}
            {customPlanLimits.monthlyEmailLimit.toLocaleString()} emails/month and{" "}
            {customPlanLimits.maxContacts.toLocaleString()} contacts.
          </p>
        )}
        {providerSetAt && (
          <p className="text-xs text-text-300 mt-1">
            Selected on {new Date(providerSetAt).toLocaleString()}
          </p>
        )}
      </div>

      {isInboxOnly && (
        <div className="p-4 rounded-lg bg-bg-300 border border-bg-200 space-y-3">
          <p className="font-medium text-text-100">Connected inbox sending</p>
          <p className="text-sm text-text-200">
            Add or manage Gmail, Outlook, and SMTP accounts from Sending Accounts.
          </p>
          <a
            href="/email/sending-accounts"
            className="inline-flex items-center gap-1 text-sm text-brand-main hover:underline font-medium"
          >
            Open Sending Accounts
            <IconExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {!sesServiceEnabled && (
        <div className="p-4 rounded-lg border border-dashed border-brand-main/40 bg-brand-main/5 space-y-3">
          <p className="font-medium text-text-100">Request AWS SES access</p>
          <p className="text-sm text-text-200">
            High-volume sending through LeadSnipper Managed SES or your own AWS account
            is a custom service. Tell us your volume needs and we will enable SES on your account.
          </p>
          {!sesRequestOpen ? (
            <button
              type="button"
              onClick={() => setSesRequestOpen(true)}
              className="text-sm font-medium text-brand-main hover:underline"
            >
              Request SES service →
            </button>
          ) : (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-text-200">Preferred SES type</label>
                <select
                  value={sesRequestForm.requestedSesMode}
                  onChange={(e) =>
                    setSesRequestForm((f) => ({
                      ...f,
                      requestedSesMode: e.target.value as "managed_ses" | "byo_ses",
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-bg-200 bg-bg-100 px-3 py-2 text-sm"
                >
                  <option value="managed_ses">LeadSnipper Managed SES</option>
                  <option value="byo_ses">Bring Your Own SES</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-200">Monthly emails</label>
                  <input
                    type="number"
                    min={1}
                    value={sesRequestForm.expectedMonthlyEmails}
                    onChange={(e) =>
                      setSesRequestForm((f) => ({
                        ...f,
                        expectedMonthlyEmails: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-bg-200 bg-bg-100 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-200">Contacts</label>
                  <input
                    type="number"
                    min={1}
                    value={sesRequestForm.expectedContacts}
                    onChange={(e) =>
                      setSesRequestForm((f) => ({
                        ...f,
                        expectedContacts: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-bg-200 bg-bg-100 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-200">Use case</label>
                <textarea
                  rows={3}
                  value={sesRequestForm.useCase}
                  onChange={(e) =>
                    setSesRequestForm((f) => ({ ...f, useCase: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-bg-200 bg-bg-100 px-3 py-2 text-sm"
                  placeholder="Describe your outreach volume, domains, and deliverability needs…"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={sesRequestSubmitting}
                  onClick={submitSesRequest}
                  className="px-4 py-2 rounded-md bg-brand-main text-white text-sm font-medium disabled:opacity-50"
                >
                  {sesRequestSubmitting ? "Submitting…" : "Submit request"}
                </button>
                <button
                  type="button"
                  onClick={() => setSesRequestOpen(false)}
                  className="px-4 py-2 rounded-md border border-bg-200 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isManagedSesActive && (
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
          <a
            href="/email/domains"
            className="inline-flex items-center gap-1 text-sm text-brand-main hover:underline font-medium"
          >
            Manage domains & senders
            <IconExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {isByoSesActive && (
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
                  {AWS_SES_REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.value}
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
                    {getAwsSesRegionLabel(creds.awsRegion)}
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
            <SesSnsTrackingSection
              creds={creds}
              onStatusChange={load}
              className="max-w-lg border-t border-bg-200 pt-5"
            />
          )}
        </>
      )}
    </div>
  );
}
