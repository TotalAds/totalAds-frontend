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

        // Get product preference from URL, storage, or signup
        const preferredProduct: ProductType =
          parseProduct(user?.signupProduct || null) || getStoredAuthProduct();

        // Check onboarding status for BOTH products independently
        const emailOnboardingComplete = user.onboardingCompleted;
        const socialOnboardingComplete = user.socialOnboardingCompleted;

        // If user has completed both onboardings, go to product hub
        if (emailOnboardingComplete && socialOnboardingComplete) {
          router.push("/dashboard");
          return;
        }

        // If user started with SocialSnipper and hasn't completed social onboarding
        if (preferredProduct === "socialsnipper" && !socialOnboardingComplete) {
          router.push("/social/onboarding");
          return;
        }

        // If user started with LeadSnipper and hasn't completed email onboarding
        if (preferredProduct === "leadsnipper" && !emailOnboardingComplete) {
          router.push("/onboarding");
          return;
        }

        // If user has completed one onboarding but not the other
        if (emailOnboardingComplete && !socialOnboardingComplete) {
          // Can go to social onboarding or email dashboard
          router.push("/dashboard");
          return;
        }

        if (socialOnboardingComplete && !emailOnboardingComplete) {
          // Can go to email onboarding or social dashboard
          router.push("/dashboard");
          return;
        }

        // Default fallback
        router.push("/dashboard");
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
