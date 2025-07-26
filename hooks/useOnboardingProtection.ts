"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { protectRoute, OnboardingStatus } from "@/utils/onboarding/onboardingCheck";

interface UseOnboardingProtectionReturn {
  isLoading: boolean;
  shouldRedirect: boolean;
  redirectPath: string;
  onboardingStatus: OnboardingStatus | null;
}

/**
 * Hook to protect routes that require onboarding completion
 * Automatically redirects users to onboarding if not completed
 */
export const useOnboardingProtection = (): UseOnboardingProtectionReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  useEffect(() => {
    const checkAndProtect = async () => {
      // Wait for auth context to finish loading
      if (state.isLoading) {
        return;
      }

      setIsLoading(true);
      
      try {
        const status = await protectRoute(pathname);
        setOnboardingStatus(status);
        
        // If protection is needed, redirect
        if (status && status.shouldRedirect) {
          router.push(status.redirectPath);
        }
      } catch (error) {
        console.error("Error in onboarding protection:", error);
        // On error, redirect to login for safety
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAndProtect();
  }, [pathname, state.isLoading, router]);

  return {
    isLoading,
    shouldRedirect: onboardingStatus?.shouldRedirect || false,
    redirectPath: onboardingStatus?.redirectPath || "",
    onboardingStatus
  };
};

export default useOnboardingProtection;
