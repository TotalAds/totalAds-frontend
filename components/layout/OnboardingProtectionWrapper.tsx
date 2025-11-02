"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  OnboardingStatus,
  protectRoute,
} from "@/utils/onboarding/onboardingCheck";

/**
 * Global wrapper component that ensures onboarding is mandatory for all protected routes
 * This component redirects users to onboarding if they haven't completed it
 */
export const OnboardingProtectionWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useAuthContext();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndProtect = async () => {
      // Wait for auth context to finish loading
      if (state.isLoading) {
        return;
      }
      setIsChecking(true);

      try {
        const status = await protectRoute(pathname);

        // If protection is needed, redirect
        if (status && status.shouldRedirect) {
          router.push(status.redirectPath);
        }
      } catch (error) {
        console.error("Error in onboarding protection:", error);
        // On error, redirect to login for safety
        router.push("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAndProtect();
  }, [pathname, state.isLoading, router]);

  // Show loading state while checking
  if (isChecking && state.isLoading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-main mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-text-100 mb-2">
            Loading...
          </h3>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OnboardingProtectionWrapper;
