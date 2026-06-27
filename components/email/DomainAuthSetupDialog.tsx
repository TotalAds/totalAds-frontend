"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DomainAuthRecord } from "@/lib/senderTrustTypes";
import type { SendingAccount } from "@/utils/api/emailClient";
import { getSendingAccountDomainAuthGuide } from "@/utils/api/emailClient";
import { IconCheck, IconCopy, IconExternalLink, IconRefresh } from "@tabler/icons-react";

type DnsFieldGuide = {
  label: string;
  value: string;
  hint?: string;
};

type DnsSetupStep = {
  stepNumber: number;
  title: string;
  summary: string;
  whatThisMeans?: string;
  instructions: string[];
  recordType?: "TXT" | "CNAME";
  host?: string;
  copyValue?: string;
  fields?: DnsFieldGuide[];
  existingValue?: string;
  externalUrl?: string;
  externalLabel?: string;
  warning?: string;
  completed?: boolean;
};

type DomainAuthGuide = {
  email: string;
  domain: string;
  provider: string;
  providerLabel: string;
  canAutoConfigure: boolean;
  autoConfigureReason: string;
  spfPlainEnglish?: string;
  domainAuth: DomainAuthRecord;
  existingRecords?: { spf?: string[]; dmarc?: string | null };
  steps: DnsSetupStep[];
  adminUrl?: string;
  adminLabel?: string;
  refreshNote?: string;
  supportedProviders?: string[];
  missingRecords?: string[];
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()} className="gap-1 shrink-0">
      {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
      Copy
    </Button>
  );
}

function authMark(ok: boolean | null | undefined) {
  if (ok === null || ok === undefined) return "—";
  return ok ? "✅" : "❌";
}

function StepCard({ step }: { step: DnsSetupStep }) {
  const isIntro = step.stepNumber === 0;

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        step.completed
          ? "border-emerald-200 bg-emerald-50/40"
          : isIntro
            ? "border-blue-200 bg-blue-50/50"
            : "border-border-100 bg-bg-200/50"
      }`}
    >
      <div className="flex items-start gap-2">
        {!isIntro && step.stepNumber < 90 && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-main/15 text-[11px] font-bold text-brand-main">
            {step.stepNumber}
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text-100">{step.title}</p>
            {step.completed && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Done
              </span>
            )}
          </div>
          <p className="text-xs text-text-200 leading-relaxed">{step.summary}</p>
        </div>
      </div>

      {step.whatThisMeans && (
        <div className="rounded-md border border-blue-100 bg-blue-50/80 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-900/70 mb-1">
            What this means
          </p>
          <p className="text-xs text-blue-950/90 leading-relaxed">{step.whatThisMeans}</p>
        </div>
      )}

      {step.instructions.length > 0 && (
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-text-200 leading-relaxed pl-1">
          {step.instructions.map((line, i) => (
            <li key={i} className="pl-1">
              {line}
            </li>
          ))}
        </ol>
      )}

      {step.warning && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
          {step.warning}
        </p>
      )}

      {step.existingValue && (
        <div className="rounded-md border border-amber-200 bg-amber-50/80 p-2.5 space-y-1">
          <p className="text-[10px] font-semibold text-amber-900">Your current SPF (edit this — do not add another)</p>
          <code className="block text-[11px] font-mono text-amber-950 break-all">{step.existingValue}</code>
        </div>
      )}

      {step.fields && step.fields.length > 0 && (
        <div className="rounded-md border border-border-100 bg-bg-100 overflow-hidden">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-300 px-2.5 py-1.5 border-b border-border-100">
            What to enter in DNS
          </p>
          <dl className="divide-y divide-border-100">
            {step.fields.map((field) => (
              <div key={field.label} className="px-2.5 py-2 grid grid-cols-[88px_1fr] gap-2 text-[11px]">
                <dt className="font-medium text-text-300">{field.label}</dt>
                <dd>
                  <span className="font-mono text-text-100 break-all">{field.value}</span>
                  {field.hint && (
                    <p className="text-text-300 mt-0.5 leading-snug">{field.hint}</p>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {step.copyValue && (
        <div className="rounded-md bg-bg-100 border border-border-100 p-2.5 space-y-1.5">
          <p className="text-[10px] font-medium text-text-300">Copy this value</p>
          <div className="flex items-start gap-2">
            <code className="flex-1 break-all text-[11px] font-mono text-text-100">{step.copyValue}</code>
            <CopyButton value={step.copyValue} />
          </div>
        </div>
      )}

      {step.externalUrl && (
        <a
          href={step.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-brand-main/30 bg-brand-main/5 px-3 py-2 text-xs font-medium text-brand-main hover:bg-brand-main/10"
        >
          {step.externalLabel ?? "Open admin console"}
          <IconExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

export function DomainAuthSetupDialog({
  account,
  open,
  onOpenChange,
  onRechecked,
}: {
  account: SendingAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRechecked?: () => void;
}) {
  const [guide, setGuide] = useState<DomainAuthGuide | null>(null);
  const [loading, setLoading] = useState(false);

  const loadGuide = useCallback(async () => {
    if (!account?.id) return;
    try {
      setLoading(true);
      const data = await getSendingAccountDomainAuthGuide(account.id);
      setGuide(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load DNS guide";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [account?.id]);

  useEffect(() => {
    if (open && account?.id) {
      void loadGuide();
    } else if (!open) {
      setGuide(null);
    }
  }, [open, account?.id, loadGuide]);

  const handleRecheck = async () => {
    await loadGuide();
    onRechecked?.();
    toast.success("DNS status refreshed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set up domain authentication</DialogTitle>
          <DialogDescription>
            {guide?.providerLabel ?? "Workspace inbox"} · {account?.email}
            {guide?.domain ? ` · DNS on ${guide.domain}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loading && !guide ? (
          <p className="text-sm text-text-200 py-6 text-center">Loading step-by-step guide…</p>
        ) : guide ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 leading-relaxed">
              {guide.autoConfigureReason}
            </div>

            {guide.spfPlainEnglish && (
              <div className="rounded-lg border border-border-100 bg-bg-100 p-3 text-xs text-text-200 leading-relaxed">
                <p className="font-semibold text-text-100 mb-1">About SPF (not LeadSnipper&apos;s SPF)</p>
                <p>{guide.spfPlainEnglish}</p>
              </div>
            )}

            {guide.missingRecords && guide.missingRecords.length > 0 && (
              <div className="rounded-lg border border-brand-main/20 bg-brand-main/5 p-3 text-xs text-text-200">
                <p className="font-medium text-text-100">
                  Showing steps for: {guide.missingRecords.join(', ')}
                </p>
                {guide.domainAuth.dmarc && !guide.missingRecords.includes('DMARC') && (
                  <p className="mt-1 text-text-300">DMARC is already configured — hidden from this guide.</p>
                )}
              </div>
            )}

            <div className="rounded-lg border border-border-100 bg-bg-100 p-3 text-xs">
              <p className="font-medium text-text-100 mb-1">Live check on {guide.domain}</p>
              <p className="text-text-200">
                SPF {authMark(guide.domainAuth.spf)} · DKIM {authMark(guide.domainAuth.dkim)} ·
                DMARC {authMark(guide.domainAuth.dmarc)}
              </p>
            </div>

            {guide.steps.length === 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                All domain authentication records are set up. Click Re-check DNS to refresh status.
              </div>
            ) : (
              <div className="space-y-3">
                {guide.steps.map((step) => (
                  <StepCard key={`${step.stepNumber}-${step.title}`} step={step} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-100">
              <Button type="button" variant="outline" onClick={() => void handleRecheck()} disabled={loading}>
                <IconRefresh className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Re-check DNS
              </Button>
              {guide.refreshNote && (
                <p className="text-[11px] text-text-300">{guide.refreshNote}</p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function needsDomainAuthSetup(domainAuth?: DomainAuthRecord | null): boolean {
  if (!domainAuth?.applicable) return false;
  return !domainAuth.spf || !domainAuth.dkim || !domainAuth.dmarc;
}
