"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { SENDER_PACING_DEFAULTS } from "@/lib/senderPacing";

import { SesConnectionStep } from "@/components/email/SesConnectionStep";
import { SenderTrustIndicators } from "@/components/email/SenderTrustIndicators";
import { SmtpAccountConnectWizard } from "@/components/email/SmtpAccountConnectWizard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEmailProvider } from "@/hooks/useEmailProvider";
import {
  formatSenderFromPreview,
  isValidSenderDisplayName,
  normalizeSenderDisplayName,
  saveCampaignOAuthSettings,
} from "@/lib/senderDisplayName";
import { CONNECT_FLOW_CATEGORIES } from "@/lib/senderTrustTypes";
import {
  getCampaignGmailOAuthUrl,
  getCampaignOutlookOAuthUrl,
} from "@/utils/api/emailClient";
import {
  IconBrandGoogle,
  IconBrandWindows,
  IconCheck,
  IconCloud,
  IconMail,
  IconAlertTriangle,
} from "@tabler/icons-react";

export type AddSendingAccountModalStep = "pick" | "oauth" | "smtp" | "ses";

interface AddSendingAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded?: () => void;
  initialStep?: AddSendingAccountModalStep;
  initialOAuthProvider?: "gmail" | "outlook" | null;
}

function ProviderCard({
  icon,
  brand,
  title,
  categoryBadge,
  categoryLimit,
  categorySubtitle,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  brand: string;
  title: string;
  categoryBadge?: string;
  categoryLimit?: string;
  categorySubtitle?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-brand-main/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex w-20 shrink-0 items-center justify-center border-r border-slate-100 bg-slate-50">
        {icon}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-4">
        <span className="text-xs text-slate-500">{brand}</span>
        <span className="text-base font-semibold text-slate-900">{title}</span>
        {categoryBadge && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              {categoryBadge}
            </span>
            {categoryLimit && (
              <span className="text-[10px] font-medium text-slate-500">
                {categoryLimit}
              </span>
            )}
          </div>
        )}
        {categorySubtitle && (
          <span className="text-[11px] text-slate-500 leading-snug">
            {categorySubtitle}
          </span>
        )}
      </div>
    </button>
  );
}

function SenderNameField({
  value,
  onChange,
  emailPreview,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  emailPreview?: string;
  id: string;
}) {
  const previewEmail = emailPreview || "you@company.com";

  return (
    <div className="space-y-2">
      <div>
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Sender name
        </label>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Sarah from Acme"
          maxLength={100}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
        <p className="mt-1 text-xs text-slate-500">
          Shown to recipients in the From field — use a person or team name, not
          the email address.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Preview
        </p>
        <p className="font-mono text-sm text-slate-800">
          {formatSenderFromPreview(
            previewEmail,
            isValidSenderDisplayName(value) ? value : "Your Name",
          )}
        </p>
      </div>
    </div>
  );
}

export function AddSendingAccountModal({
  open,
  onOpenChange,
  onAccountAdded,
  initialStep = "pick",
  initialOAuthProvider = null,
}: AddSendingAccountModalProps) {
  const { isManagedSes, isByoSes, usesSesDomains, isConnectedInboxUser, loading: providerLoading } =
    useEmailProvider();
  const [step, setStep] = useState<AddSendingAccountModalStep>(initialStep);
  const [oauthProvider, setOauthProvider] = useState<
    "gmail" | "outlook" | null
  >(initialOAuthProvider);
  const [senderDisplayName, setSenderDisplayName] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setOauthProvider(initialOAuthProvider);
      if (!initialOAuthProvider) {
        setSenderDisplayName("");
      }
    }
  }, [open, initialStep, initialOAuthProvider]);

  const resetAndClose = () => {
    setStep("pick");
    setOauthProvider(null);
    setSenderDisplayName("");
    setConnecting(null);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep("pick");
      setOauthProvider(null);
      setSenderDisplayName("");
      setConnecting(null);
    }
    onOpenChange(next);
  };

  const startOAuthStep = (provider: "gmail" | "outlook") => {
    setOauthProvider(provider);
    setSenderDisplayName("");
    setStep("oauth");
  };

  const handleOAuthConnect = async () => {
    if (!oauthProvider) return;
    const normalized = normalizeSenderDisplayName(senderDisplayName);
    if (!isValidSenderDisplayName(normalized)) {
      toast.error("Enter a sender name before connecting");
      return;
    }

    try {
      setConnecting(oauthProvider);
      saveCampaignOAuthSettings(oauthProvider, { displayName: normalized });
      const { authUrl } =
        oauthProvider === "gmail"
          ? await getCampaignGmailOAuthUrl()
          : await getCampaignOutlookOAuthUrl();
      window.location.href = authUrl;
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : `Failed to connect ${oauthProvider}`;
      toast.error(msg);
      setConnecting(null);
    }
  };

  const dialogWidth =
    step === "ses"
      ? "max-w-4xl"
      : step === "smtp"
        ? "max-w-xl"
        : step === "oauth"
          ? "max-w-lg"
          : "max-w-md";

  const visibleConnectOptions = CONNECT_FLOW_CATEGORIES.filter((item) => {
    if (item.provider === "ses") return usesSesDomains;
    // SES is an add-on — inbox providers stay available alongside it
    return true;
  });

  const pickStepDescription = usesSesDomains
    ? "Connect Gmail, Outlook, SMTP, or AWS SES. Inbox and SES can both be active on the same account."
    : "Connect Gmail, Outlook, or SMTP — campaigns send from the inbox you connect.";

  const oauthTitle =
    oauthProvider === "gmail"
      ? "Connect Gmail"
      : oauthProvider === "outlook"
        ? "Connect Outlook"
        : "Connect account";

  const oauthBrand =
    oauthProvider === "gmail"
      ? "Google"
      : oauthProvider === "outlook"
        ? "Microsoft"
        : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`${dialogWidth} max-h-[90vh] overflow-y-auto border-slate-200 bg-white p-0 text-slate-900 sm:rounded-2xl`}
      >
        {step === "pick" ? (
          <>
            <DialogHeader className="space-y-4 px-6 pt-6 text-left">
              <div>
                <DialogTitle className="text-xl text-slate-900">
                  Add sending account
                </DialogTitle>
                <DialogDescription className="mt-1 text-slate-500">
                  {pickStepDescription}
                </DialogDescription>
              </div>
              <ul className="space-y-2 border-b border-slate-100 pb-4">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <IconCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  {usesSesDomains
                    ? "Use connected inboxes and/or AWS SES — add whichever you need"
                    : "Connect Google, Microsoft, or custom SMTP"}
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <IconCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  Set a clear From name for every connected account
                </li>
              </ul>
            </DialogHeader>

            <div className="space-y-3 px-6 pb-6">
              {visibleConnectOptions.map((item) => {
                const meta = {
                  ses: {
                    icon: <IconCloud className="h-7 w-7 text-brand-main" />,
                    brand: "Amazon",
                    title: "AWS SES",
                    onClick: () => setStep("ses"),
                  },
                  gmail: {
                    icon: <IconBrandGoogle className="h-7 w-7" />,
                    brand: "Google",
                    title: "Gmail / Google Workspace",
                    onClick: () => startOAuthStep("gmail"),
                  },
                  outlook: {
                    icon: <IconBrandWindows className="h-7 w-7 text-sky-600" />,
                    brand: "Microsoft",
                    title: "Office 365 / Outlook",
                    onClick: () => startOAuthStep("outlook"),
                  },
                  smtp: {
                    icon: <IconMail className="h-7 w-7 text-slate-500" />,
                    brand: "Any provider",
                    title: "IMAP / SMTP",
                    onClick: () => setStep("smtp"),
                  },
                }[item.provider];

                return (
                  <ProviderCard
                    key={item.provider}
                    icon={meta.icon}
                    brand={meta.brand}
                    title={meta.title}
                    categoryBadge={item.badge}
                    categoryLimit={item.limit}
                    categorySubtitle={item.subtitle}
                    onClick={meta.onClick}
                  />
                );
              })}
            </div>
          </>
        ) : step === "oauth" && oauthProvider ? (
          <div className="space-y-4 px-6 py-6">
            <DialogHeader className="space-y-1 p-0 text-left">
              <DialogTitle className="text-xl text-slate-900">
                {oauthTitle}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Choose the sender name first, then sign in with {oauthBrand} to
                authorize sending.
              </DialogDescription>
            </DialogHeader>

            <SenderNameField
              id="oauth-sender-name"
              value={senderDisplayName}
              onChange={setSenderDisplayName}
            />

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex gap-2">
                <IconAlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-900">
                  <p className="font-medium">Personal inbox limits</p>
                  <p>
                    {oauthProvider === "gmail"
                      ? "Free @gmail.com accounts are not meant for large cold campaigns — only warm mail to people who know you. Set your daily email cap in inbox settings after connecting. For cold outreach, use Google Workspace or Microsoft 365 mailbox."
                      : "Personal Outlook/Hotmail has strict limits and is not ideal for cold campaigns. Set your daily email cap in inbox settings after connecting. For cold outreach, use AWS SES or a work domain inbox."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-xs font-medium text-slate-700">
                After connecting
              </p>
              <SenderTrustIndicators
                senderCategory={{
                  category: oauthProvider === "gmail" ? "personal" : "personal",
                  badge: "Personal or Business",
                  dailyLimitLabel: `${SENDER_PACING_DEFAULTS.campaignDailyLimit}/day`,
                  subtitle: "Category is detected from your mailbox domain",
                }}
                reputation={{
                  level: "good",
                  label: "Good",
                  emoji: "🟡",
                }}
                domainAuth={{
                  applicable: false,
                  spf: null,
                  dkim: null,
                  dmarc: null,
                  note: "Work domains show SPF/DKIM/DMARC on your dashboard after connect",
                }}
                compact
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => void handleOAuthConnect()}
                disabled={connecting === oauthProvider}
              >
                {connecting === oauthProvider
                  ? "Redirecting…"
                  : `Continue to ${oauthBrand}`}
              </Button>
              <Button variant="outline" onClick={() => setStep("pick")}>
                Back
              </Button>
            </div>
          </div>
        ) : step === "ses" ? (
          <div className="space-y-4 px-6 py-6">
            <DialogHeader className="space-y-1 p-0 text-left">
              <DialogTitle className="text-xl text-slate-900">
                AWS SES
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Connect AWS credentials, set up SNS tracking, and import
                verified senders — all without leaving this dialog.
              </DialogDescription>
            </DialogHeader>
            <SesConnectionStep
              isManagedSes={isManagedSes}
              isByoSes={isByoSes}
              isConnectedInboxUser={isConnectedInboxUser}
              providerLoading={providerLoading}
              onBack={() => setStep("pick")}
              onComplete={() => {
                onAccountAdded?.();
                resetAndClose();
              }}
            />
            <p className="text-xs text-slate-500">
              After importing SES senders, set each sender&apos;s display name
              from the Sending Accounts list.
            </p>
          </div>
        ) : (
          <SmtpAccountConnectWizard
            onBack={() => setStep("pick")}
            onComplete={() => {
              onAccountAdded?.();
              resetAndClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
