"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { IconCheck, IconCircleDot } from "@tabler/icons-react";

import { SesAwsIdentitiesImportSection } from "@/components/email/SesAwsIdentitiesImportSection";
import { SesSnsTrackingSection } from "@/components/email/SesSnsTrackingSection";
import { Button } from "@/components/ui/button";
import { AWS_SES_REGIONS, getAwsSesRegionLabel } from "@/lib/awsSesRegions";
import {
  getSesCredentialsStatus,
  storeSesCredentials,
  testSesCredentials,
  type SesCredentialsStatus,
} from "@/utils/api/emailClient";

interface SesConnectionStepProps {
  isManagedSes: boolean;
  isByoSes: boolean;
  isConnectedInboxUser: boolean;
  providerLoading?: boolean;
  onBack: () => void;
  onComplete?: () => void;
}

export function SesConnectionStep({
  isManagedSes,
  isByoSes,
  isConnectedInboxUser,
  providerLoading = false,
  onBack,
  onComplete,
}: SesConnectionStepProps) {
  const credentialsRef = useRef<HTMLDivElement>(null);
  const snsRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [creds, setCreds] = useState<SesCredentialsStatus>({ connected: false });
  const [form, setForm] = useState({
    awsRegion: "us-east-1",
    accessKeyId: "",
    secretAccessKey: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const loadCreds = useCallback(async () => {
    if (!isByoSes) {
      setLoading(false);
      return;
    }
    try {
      const status = await getSesCredentialsStatus();
      setCreds(status);
      if (status.awsRegion) {
        setForm((f) => ({ ...f, awsRegion: status.awsRegion! }));
      }
    } catch {
      setCreds({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [isByoSes]);

  useEffect(() => {
    void loadCreds();
  }, [loadCreds]);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    if (!form.accessKeyId.trim() || !form.secretAccessKey.trim()) {
      toast.error("Access key and secret are required");
      return;
    }
    setSaving(true);
    try {
      await storeSesCredentials(form);
      toast.success("AWS credentials saved");
      setForm((f) => ({ ...f, secretAccessKey: "" }));
      await loadCreds();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save credentials";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testSesCredentials();
      if (result.success) {
        toast.success("AWS SES connection verified");
        await loadCreds();
        scrollTo(snsRef);
      } else {
        toast.error(result.message || "Connection failed");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Test failed";
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const checklist = [
    {
      done: creds.connected,
      label: "Connect AWS SES API credentials",
      onClick: () => scrollTo(credentialsRef),
    },
    {
      done: creds.isVerified,
      label: "Test and verify the connection",
      onClick: () => scrollTo(credentialsRef),
    },
    {
      done: !!creds.snsSetupComplete,
      label: "Set up SNS event tracking",
      onClick: () => creds.isVerified && scrollTo(snsRef),
      disabled: !creds.isVerified,
    },
    {
      done: false,
      label: "Import domains and senders",
      onClick: () => creds.isVerified && scrollTo(importRef),
      disabled: !creds.isVerified,
    },
  ];

  if (providerLoading || (isByoSes && loading)) {
    return <p className="text-sm text-slate-500">Loading SES setup…</p>;
  }

  if (isConnectedInboxUser) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Your account sends through connected inboxes (Gmail, Outlook, or SMTP).
          Campaigns use those mailboxes directly — AWS SES credentials are not used.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back to inbox options
          </Button>
        </div>
      </div>
    );
  }

  if (isManagedSes) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Your account uses LeadSnipper managed AWS SES. Verify domains and add senders from the
          Domains page — no AWS credentials needed.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/email/domains" onClick={() => onComplete?.()}>
              Go to Domains
            </Link>
          </Button>
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (!isByoSes) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Bring Your Own AWS SES is not enabled for your account. Connect Gmail, Outlook, or SMTP
          instead — campaigns send directly from the inbox you connect.
        </p>
        <Button variant="outline" onClick={onBack}>
          Back to inbox options
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-900">Setup checklist</p>
        <div className="space-y-2">
          {checklist.map((step, i) => (
            <button
              key={i}
              type="button"
              onClick={step.onClick}
              disabled={step.disabled}
              className="flex w-full items-center gap-2 text-left text-sm disabled:cursor-default disabled:opacity-60"
            >
              {step.done ? (
                <IconCheck className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <IconCircleDot className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <span
                className={
                  step.done
                    ? "text-slate-500 line-through"
                    : "text-slate-700 hover:text-brand-main"
                }
              >
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div ref={credentialsRef} className="space-y-4 scroll-mt-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">1. AWS credentials</h3>
          <p className="mt-1 text-sm text-slate-600">
            Connect your AWS account so LeadSnipper can send through your verified SES identities.
          </p>
        </div>

        {creds.connected && creds.isVerified && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <IconCheck className="h-4 w-4" />
              AWS SES connected
              {creds.accessKeyIdHint ? (
                <span className="font-mono text-xs font-normal text-emerald-700">
                  ({creds.accessKeyIdHint})
                </span>
              ) : null}
            </div>
            {creds.awsRegion ? (
              <p className="mt-1 text-xs text-emerald-700">
                Region: {getAwsSesRegionLabel(creds.awsRegion)}
              </p>
            ) : null}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-slate-600">AWS Region</label>
          <select
            value={form.awsRegion}
            onChange={(e) => setForm((f) => ({ ...f, awsRegion: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {AWS_SES_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Access Key ID</label>
          <input
            type="text"
            value={form.accessKeyId}
            onChange={(e) => setForm((f) => ({ ...f, accessKeyId: e.target.value }))}
            placeholder="AKIA..."
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Secret Access Key</label>
          <input
            type="password"
            value={form.secretAccessKey}
            onChange={(e) => setForm((f) => ({ ...f, secretAccessKey: e.target.value }))}
            placeholder={creds.connected ? "Enter new secret to update" : "••••••••"}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save credentials"}
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleTest()}
            disabled={testing || (!creds.connected && !form.accessKeyId)}
          >
            {testing ? "Testing…" : "Test connection"}
          </Button>
        </div>
      </div>

      {creds.isVerified && (
        <>
          <div ref={snsRef} className="space-y-4 border-t border-slate-200 pt-6 scroll-mt-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">2. SNS event tracking</h3>
              <p className="mt-1 text-sm text-slate-600">
                Required for bounce, complaint, and delivery analytics.
              </p>
            </div>
            <SesSnsTrackingSection creds={creds} onStatusChange={loadCreds} />
          </div>

          <div ref={importRef} className="space-y-4 border-t border-slate-200 pt-6 scroll-mt-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                3. Import domains and senders
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Load verified SES identities from your AWS account into LeadSnipper.
              </p>
            </div>
            {!creds.snsSetupComplete && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                SNS tracking is not set up yet. You can import senders now, but analytics will be
                limited until SNS is configured above.
              </div>
            )}
            <SesAwsIdentitiesImportSection
              onImportComplete={() => {
                onComplete?.();
              }}
            />
          </div>
        </>
      )}

      {!creds.isVerified && creds.connected && (
        <p className="text-sm text-amber-700">
          Save credentials, then run <strong>Test connection</strong> to unlock SNS setup and
          identity import below.
        </p>
      )}

      <div className="flex gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
