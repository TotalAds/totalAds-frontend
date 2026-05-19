"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { IconCreditCard, IconX } from "@tabler/icons-react";

interface PaywallBannerProps {
  variant?: "full" | "compact" | "inline";
  onDismiss?: () => void;
  className?: string;
}

export function PaywallBanner({
  variant = "full",
  onDismiss,
  className = "",
}: PaywallBannerProps) {
  const router = useRouter();

  if (variant === "compact") {
    return (
      <div
        className={`bg-gradient-to-r from-brand-main/20 to-brand-secondary/20 border border-brand-main/30 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-main/10 rounded-lg">
              <IconCreditCard className="w-5 h-5 text-brand-main" />
            </div>
            <div>
              <p className="font-medium text-text-100">Unlock SocialSnipper</p>
              <p className="text-sm text-text-200">₹99/month for full access</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/social/pricing")}
            className="px-4 py-2 bg-brand-main text-white text-sm font-medium rounded-lg hover:bg-brand-main/90 transition-colors"
          >
            Subscribe
          </button>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={`bg-bg-200 border border-bg-300 rounded-lg p-4 text-center ${className}`}
      >
        <p className="text-text-200 text-sm mb-2">
          This feature requires an active subscription
        </p>
        <button
          onClick={() => router.push("/social/pricing")}
          className="text-brand-main hover:underline text-sm font-medium"
        >
          Subscribe now →
        </button>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div
      className={`relative bg-gradient-to-br from-brand-main/10 via-brand-secondary/10 to-brand-main/10 border border-brand-main/30 rounded-2xl p-8 ${className}`}
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-text-300 hover:text-text-100 transition-colors"
        >
          <IconX className="w-5 h-5" />
        </button>
      )}

      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-main/20 rounded-2xl mb-4">
          <IconCreditCard className="w-8 h-8 text-brand-main" />
        </div>

        <h3 className="text-xl font-bold text-text-100 mb-2">
          Unlock SocialSnipper
        </h3>

        <p className="text-text-200 mb-6">
          Subscribe to ₹99/month plan to access AI-powered LinkedIn automation,
          scheduling, and analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/social/pricing")}
            className="px-6 py-3 bg-brand-main text-white font-semibold rounded-xl hover:bg-brand-main/90 transition-colors"
          >
            Subscribe - ₹99/month
          </button>
          <button
            onClick={() => router.push("/email/dashboard")}
            className="px-6 py-3 bg-transparent border border-bg-300 text-text-200 font-semibold rounded-xl hover:bg-bg-200 transition-colors"
          >
            Back to LeadSnipper
          </button>
        </div>

        <p className="mt-4 text-xs text-text-300">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}

export default PaywallBanner;
