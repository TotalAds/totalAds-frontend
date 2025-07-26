"use client";

import { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";

interface OnboardingStatus {
  isCompleted: boolean;
  isSkipped: boolean;
  isLoading: boolean;
}

export const useOnboardingStatus = (): OnboardingStatus => {
  const { state } = useAuthContext();
  const [status, setStatus] = useState<OnboardingStatus>({
    isCompleted: false,
    isSkipped: false,
    isLoading: true,
  });

  useEffect(() => {
    if (state.isLoading) {
      return;
    }

    if (!state.isAuthenticated || !state.user) {
      setStatus({
        isCompleted: false,
        isSkipped: false,
        isLoading: false,
      });
      return;
    }

    // Check onboarding status from user data
    const isCompleted = state.user.onboardingCompleted || false;
    const isSkipped = state.user.onboardingSkipped || false;

    setStatus({
      isCompleted,
      isSkipped,
      isLoading: false,
    });
  }, [state.isLoading, state.isAuthenticated, state.user]);

  return status;
};
