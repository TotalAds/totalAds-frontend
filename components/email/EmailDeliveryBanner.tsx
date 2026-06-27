"use client";

import Link from "next/link";
import type { SesProvider } from "@/utils/api/apiClient";

interface EmailDeliveryBannerProps {
  sesProvider: SesProvider | null;
  sesConnected?: boolean;
}

export function EmailDeliveryBanner({
  sesProvider,
  sesConnected = true,
}: EmailDeliveryBannerProps) {
  if (!sesProvider) return null;

  if (sesProvider === "custom" && !sesConnected) {
    return (
      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-text-100">
        <strong>AWS SES not connected.</strong> You must add your credentials
        before adding domains or senders.{" "}
        <Link
          href="/email/sending-accounts?showSes=true"
          className="text-brand-main hover:underline font-medium"
        >
          Connect now
        </Link>
      </div>
    );
  }

  if (sesProvider === "custom") {
    return (
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Domains and senders are verified in your own AWS SES account. You manage
        reputation and limits.{" "}
        <Link
          href="/email/settings?tab=email-delivery"
          className="font-semibold text-amber-800 underline-offset-2 hover:underline"
        >
          Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 rounded-lg bg-brand-main/10 border border-brand-main/20 text-sm text-text-200">
      LeadSnipper manages reputation and throttling for your sending.
    </div>
  );
}
