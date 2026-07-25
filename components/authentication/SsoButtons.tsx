"use client";

import React, { useState } from "react";

import { LEGAL_VERSION } from "@/lib/legal";
import { getSsoStartUrl, type SsoProvider } from "@/utils/api/authClient";

type SsoButtonsProps = {
  /** When true, legal acceptance is required before starting SSO (signup / first-time). */
  requireLegal?: boolean;
  acceptedLegal?: boolean;
  referralCode?: string | null;
  inviteToken?: string | null;
  rememberMe?: boolean;
  returnTo?: string | null;
  disabled?: boolean;
  className?: string;
  onBlocked?: (message: string) => void;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M5.3 14.3l-.8.6-2.5 1.9C3.5 20 7.4 22.5 12 22.5c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4z"
      />
      <path
        fill="#4A90E2"
        d="M3.9 6.2C3.1 7.8 2.7 9.5 2.7 11.3c0 1.7.4 3.4 1.1 4.9l3.3-2.6c-.4-1.1-.6-2.2-.6-2.3 0-.8.2-1.6.4-2.3L3.9 6.2z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.4c1.5 0 2.8.5 3.9 1.5l2.9-2.9C16.9 2.3 14.7 1.5 12 1.5 7.4 1.5 3.5 4 1.9 8.1l3.4 2.6C6.1 7.3 8.5 5.4 12 5.4z"
      />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

export function SsoButtons({
  requireLegal = false,
  acceptedLegal = false,
  referralCode,
  inviteToken,
  rememberMe,
  returnTo,
  disabled,
  className,
  onBlocked,
}: SsoButtonsProps) {
  const [starting, setStarting] = useState<SsoProvider | null>(null);

  const startSso = (provider: SsoProvider) => {
    if (requireLegal && !acceptedLegal) {
      onBlocked?.(
        "You must accept our legal agreements before continuing with Google or Microsoft",
      );
      return;
    }

    setStarting(provider);
    const url = getSsoStartUrl(provider, {
      // Pass legal when checked so first-time SSO from /login can create an account
      acceptedLegal: acceptedLegal || undefined,
      acceptedLegalVersion: acceptedLegal ? LEGAL_VERSION : undefined,
      referralCode: referralCode || undefined,
      inviteToken: inviteToken || undefined,
      rememberMe,
      returnTo: returnTo || undefined,
    });
    window.location.href = url;
  };

  const busy = Boolean(starting) || disabled;

  return (
    <div className={className}>
      <div className="relative my-2.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-brand-main/20" />
        </div>
        <div className="relative flex justify-center text-[11px]">
          <span className="px-2 bg-white dark:bg-bg-100 text-gray-600 dark:text-text-200">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => startSso("google")}
          className="w-full py-2 px-3 bg-white dark:bg-brand-main/5 hover:bg-gray-50 dark:hover:bg-brand-main/10 text-gray-900 dark:text-text-100 font-medium rounded-lg text-sm transition-all border border-gray-300 dark:border-brand-main/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <GoogleIcon className="w-4 h-4" />
          {starting === "google" ? "…" : "Google"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => startSso("microsoft")}
          className="w-full py-2 px-3 bg-white dark:bg-brand-main/5 hover:bg-gray-50 dark:hover:bg-brand-main/10 text-gray-900 dark:text-text-100 font-medium rounded-lg text-sm transition-all border border-gray-300 dark:border-brand-main/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <MicrosoftIcon className="w-4 h-4" />
          {starting === "microsoft" ? "…" : "Microsoft"}
        </button>
      </div>
    </div>
  );
}
