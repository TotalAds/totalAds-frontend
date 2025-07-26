import { getCurrentUser } from "@/utils/api/authClient";

export interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
  shouldRedirect: boolean;
  redirectPath: string;
}

/**
 * Check if user has completed onboarding
 * @returns OnboardingStatus object with completion status and redirect info
 */
export const checkOnboardingStatus = async (): Promise<OnboardingStatus> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        isCompleted: false,
        currentStep: 0,
        shouldRedirect: true,
        redirectPath: "/login"
      };
    }

    // If onboarding is completed, user can access all pages
    if (user.onboardingCompleted) {
      return {
        isCompleted: true,
        currentStep: 3,
        shouldRedirect: false,
        redirectPath: ""
      };
    }

    // If onboarding is not completed, redirect to onboarding
    return {
      isCompleted: false,
      currentStep: user.onboardingStep || 0,
      shouldRedirect: true,
      redirectPath: "/onboarding"
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return {
      isCompleted: false,
      currentStep: 0,
      shouldRedirect: true,
      redirectPath: "/login"
    };
  }
};

/**
 * Check if current path requires onboarding completion
 * @param pathname Current page path
 * @returns boolean indicating if onboarding is required
 */
export const requiresOnboarding = (pathname: string): boolean => {
  // Paths that don't require onboarding completion
  const allowedPaths = [
    "/login",
    "/signup", 
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/verify-email"
  ];

  // Check if current path is in allowed paths or starts with allowed path
  return !allowedPaths.some(path => 
    pathname === path || pathname.startsWith(path + "/")
  );
};

/**
 * Higher-order function to protect routes that require onboarding completion
 * @param pathname Current page path
 * @returns Promise<OnboardingStatus | null> - null if no redirect needed
 */
export const protectRoute = async (pathname: string): Promise<OnboardingStatus | null> => {
  // If the current path doesn't require onboarding, allow access
  if (!requiresOnboarding(pathname)) {
    return null;
  }

  // Check onboarding status
  const status = await checkOnboardingStatus();
  
  // If onboarding is completed, allow access
  if (status.isCompleted) {
    return null;
  }

  // If user is not authenticated, redirect to login
  if (status.redirectPath === "/login") {
    return status;
  }

  // If onboarding is not completed, redirect to onboarding
  return status;
};
