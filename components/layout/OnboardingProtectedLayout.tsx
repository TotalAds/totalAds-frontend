"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";

interface OnboardingProtectedLayoutProps {
  children: React.ReactNode;
  requireOnboarding?: boolean; // Whether this page requires onboarding completion
}

export default function OnboardingProtectedLayout({
  children,
  requireOnboarding = true,
}: OnboardingProtectedLayoutProps) {
  const router = useRouter();
  const { state } = useAuthContext();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = () => {
      // Wait for auth context to finish loading
      if (state.isLoading) {
        return;
      }

      // If user is not authenticated, let auth context handle redirect
      if (!state.isAuthenticated) {
        setIsChecking(false);
        return;
      }

      // If this page doesn't require onboarding, allow access
      if (!requireOnboarding) {
        setIsChecking(false);
        return;
      }

      // Check onboarding status from AuthContext user data
      if (!state.user) {
        // If no user data, redirect to login
        router.push("/login");
        return;
      }

      // If onboarding is not completed, redirect to onboarding
      if (!state.user.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }

      // Onboarding is completed, allow access
      setIsChecking(false);
    };

    checkOnboarding();
  }, [
    state.isLoading,
    state.isAuthenticated,
    state.user,
    requireOnboarding,
    router,
  ]);

  // Show loading while checking authentication and onboarding
  if (state.isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children (auth context will handle redirect)
  if (!state.isAuthenticated) {
    return null;
  }

  // If onboarding is required but not completed, don't render children (redirect is in progress)
  if (requireOnboarding && state.user && !state.user.onboardingCompleted) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}
