"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { appendUtmToPath } from "@/utils/analytics/utm";
import {
  buildUrlWithProduct,
  getStoredAuthProduct,
  parseProduct,
  ProductType,
} from "@/utils/auth/productIntent";

/**
 * Home page - Smart redirect based on user's product access and onboarding status
 * Users can access BOTH LeadSnipper and SocialSnipper - not limited to one product
 */
export default function Home() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading, user } = state;
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // First check: Email verification required for all products
        if (!user.emailVerified) {
          router.push("/verify-email");
          return;
        }

        // Force user to LeadSnipper onboarding or email dashboard
        const emailOnboardingComplete = user.onboardingCompleted;

        if (!emailOnboardingComplete) {
          router.push("/onboarding");
        } else {
          router.push("/email/dashboard");
        }
      } else {
        router.push(appendUtmToPath("/login"));
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Redirecting...
        </h3>
      </div>
    </div>
  );
}
