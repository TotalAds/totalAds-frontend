"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { setOnboardingOAuthReturnPath } from "@/lib/senderDisplayName";
import {
  getCampaignGmailOAuthUrl,
  getCampaignOutlookOAuthUrl,
  getCampaignZohoOAuthUrl,
  listSendingAccounts,
  type SendingAccount,
} from "@/utils/api/emailClient";
import { type OnboardingSendingMethod } from "@/utils/api/apiClient";
import {
  IconBrandGoogle,
  IconBrandWindows,
  IconCheck,
  IconMail,
} from "@tabler/icons-react";
import { SmtpAccountConnectWizard } from "@/components/email/SmtpAccountConnectWizard";

interface Step3CombinedProps {
  onBack: () => void;
  onCompleteWithMethod: (method: OnboardingSendingMethod) => Promise<string | null>;
  onSkipForNow: () => Promise<string | null>;
  isLoading: boolean;
}

const SENDING_OPTIONS: {
  id: OnboardingSendingMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "gmail",
    title: "Continue with Google",
    description: "Connect Gmail or Google Workspace and start sending safely.",
    icon: <IconBrandGoogle className="h-5 w-5 text-brand-main" />,
  },
  {
    id: "outlook",
    title: "Continue with Microsoft",
    description: "Connect Outlook or Microsoft 365 for campaign delivery.",
    icon: <IconBrandWindows className="h-5 w-5 text-brand-main" />,
  },
  {
    id: "zoho",
    title: "Continue with Zoho",
    description: "Connect Zoho Mail or Zoho Workplace for campaign delivery.",
    icon: <IconMail className="h-5 w-5 text-orange-600" />,
  },
  {
    id: "smtp",
    title: "Custom SMTP",
    description: "Use any SMTP provider with your own host and credentials.",
    icon: <IconMail className="h-5 w-5 text-brand-main" />,
  },
];

function isSocialProductOnboardingIntent(raw: string | null | undefined): boolean {
  const t = (raw || "").toLowerCase();
  return t === "socialsnipper" || t === "socialsniper" || t === "social";
}

export function OnboardingStep3Combined({
  onBack,
  onCompleteWithMethod,
  onSkipForNow,
  isLoading,
}: Step3CombinedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState<OnboardingSendingMethod>("gmail");
  const [showSmtpWizard, setShowSmtpWizard] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<SendingAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const connectedProvider = searchParams.get("connected");

  useEffect(() => {
    if (!connectedProvider) return;
    listSendingAccounts()
      .then((accounts) => {
        const target = accounts.find((account) => account.provider === connectedProvider);
        if (target) {
          setConnectedAccount(target);
        }
      })
      .catch(() => undefined);
  }, [connectedProvider]);

  const connectedMessage = useMemo(() => {
    if (!connectedAccount) return null;
    return {
      email: connectedAccount.email,
      dailyLimit: connectedAccount.campaignDailyLimit ?? 50,
      score: connectedAccount.healthScore ?? 98,
    };
  }, [connectedAccount]);

  const startProviderConnection = async (method: OnboardingSendingMethod) => {
    if (method === "smtp") {
      setSelected("smtp");
      setShowSmtpWizard(true);
      return;
    }

    try {
      setSubmitting(true);
      setSelected(method);
      setOnboardingOAuthReturnPath("/onboarding?step=connect");
      if (method === "gmail") {
        const { authUrl } = await getCampaignGmailOAuthUrl();
        window.location.href = authUrl;
        return;
      }
      if (method === "zoho") {
        const { authUrl } = await getCampaignZohoOAuthUrl();
        window.location.href = authUrl;
        return;
      }
      const { authUrl } = await getCampaignOutlookOAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start connection flow");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    const redirectTo = await onCompleteWithMethod(selected);
    if (!redirectTo) return;
    const product =
      searchParams.get("product") || searchParams.get("app") || undefined;
    if (isSocialProductOnboardingIntent(product)) {
      router.push("/social/dashboard");
      return;
    }
    router.push(redirectTo);
  };

  const handleSkipForNow = async () => {
    const redirectTo = await onSkipForNow();
    if (!redirectTo) return;
    router.push(redirectTo);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100 mb-2">Connect your sending account</h2>
      <p className="text-sm text-text-200 mb-4">
        Choose Google, Microsoft, or Custom SMTP. You can also skip for now and
        connect later from Sending Accounts.
      </p>

      <div className="space-y-3">
        {SENDING_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => startProviderConnection(option.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected === option.id
                ? "border-brand-main bg-brand-main/10"
                : "border-bg-200 hover:border-bg-300 bg-bg-100"
            }`}
            disabled={submitting || isLoading}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{option.icon}</div>
              <div>
                <div className="font-medium text-text-100">{option.title}</div>
                <div className="text-sm text-text-200 mt-1">{option.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {showSmtpWizard ? (
        <div className="rounded-lg border border-bg-200 p-3">
          <SmtpAccountConnectWizard
            onBack={() => setShowSmtpWizard(false)}
            onComplete={() => {
              setShowSmtpWizard(false);
              listSendingAccounts()
                .then((accounts) => {
                  const latest = [...accounts]
                    .filter((acc) => acc.provider === "smtp")
                    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))[0];
                  if (latest) setConnectedAccount(latest);
                })
                .catch(() => undefined);
            }}
          />
        </div>
      ) : null}

      {connectedMessage ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-800 font-medium">
            <IconCheck className="h-4 w-4" />
            Connected
          </div>
          <p className="mt-1 text-sm text-green-900">{connectedMessage.email}</p>
          <p className="mt-2 text-sm text-green-800">
            Your daily recommended limit: {connectedMessage.dailyLimit} emails/day
          </p>
          <p className="text-sm text-green-800">
            Deliverability score: {connectedMessage.score}%
          </p>
        </div>
      ) : null}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading || submitting}
          className="flex-1 py-3 px-4 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleFinish}
          disabled={isLoading || submitting}
          className="flex-1 py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
        >
          Finish setup
        </button>
      </div>
      <button
        type="button"
        onClick={handleSkipForNow}
        className="w-full text-sm text-text-200 hover:text-text-100 transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}

export default OnboardingStep3Combined;
