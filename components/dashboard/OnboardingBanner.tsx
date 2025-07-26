"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { IconAlertTriangle, IconArrowRight, IconX } from "@tabler/icons-react";

interface OnboardingBannerProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export default function OnboardingBanner({ 
  onDismiss, 
  showDismiss = false 
}: OnboardingBannerProps) {
  const router = useRouter();

  const handleCompleteOnboarding = () => {
    router.push("/onboarding");
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <IconAlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800">
              Complete Your Setup
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              You haven&apos;t completed your onboarding yet. Complete your setup to unlock personalized features, get better recommendations, and access all platform capabilities.
            </p>
            <div className="mt-3">
              <button
                onClick={handleCompleteOnboarding}
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Complete Onboarding
                <IconArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md p-1"
            aria-label="Dismiss banner"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
