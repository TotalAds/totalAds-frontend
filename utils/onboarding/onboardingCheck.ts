import { getCurrentUser } from "@/utils/api/authClient";
import { getSocialAccess } from "@/utils/api/socialClient";
import {
  getStoredAuthProduct,
  isSocialSnipperUser,
  parseProduct,
  ProductType,
  requiresLeadSnipperOnboarding,
} from "@/utils/auth/productIntent";

export interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
  shouldRedirect: boolean;
  redirectPath: string;
  product?: ProductType;
}

/**
 * Check if user has completed onboarding
 * Now handles both LeadSnipper (email) and SocialSnipper onboarding flows
 * @returns OnboardingStatus object with completion status and redirect info
 */
export const checkOnboardingStatus = async (
  productContext?: ProductType
): Promise<OnboardingStatus> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        isCompleted: false,
        currentStep: 0,
        shouldRedirect: true,
        redirectPath: "/login",
      };
    }

    // Check email verification first (required for both products)
    if (!user.emailVerified) {
      return {
        isCompleted: false,
        currentStep: 0,
        shouldRedirect: true,
        redirectPath: "/verify-email",
        product: productContext || parseProduct(user.signupProduct ?? null),
      };
    }

    // Determine product context
    const product = productContext || parseProduct(user.signupProduct ?? null);

    // SOCIALSNIPPER FLOW: Check social onboarding separately
    if (product === "socialsnipper") {
      if (user.socialOnboardingCompleted) {
        return {
          isCompleted: true,
          currentStep: 3,
          shouldRedirect: false,
          redirectPath: "",
          product: "socialsnipper",
        };
      }

      return {
        isCompleted: false,
        currentStep: 1,
        shouldRedirect: true,
        redirectPath: "/social/onboarding",
        product: "socialsnipper",
      };
    }

    // LEADSNIPPER FLOW: Check email onboarding (default)
    if (user.onboardingCompleted) {
      return {
        isCompleted: true,
        currentStep: 3,
        shouldRedirect: false,
        redirectPath: "",
        product: "leadsnipper",
      };
    }

    return {
      isCompleted: false,
      currentStep: user.onboardingStep || 0,
      shouldRedirect: true,
      redirectPath: "/onboarding",
      product: "leadsnipper",
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return {
      isCompleted: false,
      currentStep: 0,
      shouldRedirect: true,
      redirectPath: "/login",
    };
  }
};

/**
 * Check if current path requires onboarding completion
 * Now includes social onboarding paths
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
    "/social/onboarding", // Social onboarding is the onboarding for social users
    "/verify-email",
    "/appsumo",
    "/auth/sso/callback",
    // Public one-click / consent unsubscribe (no account login)
    "/email/unsubscribe",
    "/unsubscribe",
  ];

  // Check if current path is in allowed paths or starts with allowed path
  return !allowedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
};

/**
 * Check if current path requires email verification
 * @param pathname Current page path
 * @returns boolean indicating if email verification is required
 */
export const requiresEmailVerification = (pathname: string): boolean => {
  // Paths that don't require email verification
  const allowedPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/appsumo",
    "/auth/sso/callback",
    // Public one-click / consent unsubscribe (no account login)
    "/email/unsubscribe",
    "/unsubscribe",
  ];

  // Check if current path is in allowed paths or starts with allowed path
  return !allowedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
};

/**
 * Check if path is a social path that requires subscription
 * @param pathname Current page path
 * @returns boolean indicating if path requires social subscription
 */
export const requiresSocialSubscription = (pathname: string): boolean => {
  // Social paths that require active subscription
  if (!pathname.startsWith("/social")) return false;

  // These paths are allowed without subscription
  const exemptPaths = [
    "/social/pricing",
    "/social/billing",
    "/social/onboarding",
    "/social/linkedin/callback",
    "/social/settings", // Allow settings for subscription management
  ];

  return !exemptPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
};

/**
 * Higher-order function to protect routes that require onboarding completion
 * Now handles both LeadSnipper and SocialSnipper product flows
 * @param pathname Current page path
 * @returns Promise<OnboardingStatus | null> - null if no redirect needed
 */
export const protectRoute = async (
  pathname: string
): Promise<OnboardingStatus | null> => {
  // Redirect all social paths immediately to leadsnipper dashboard
  if (pathname.startsWith("/social")) {
    return {
      isCompleted: true,
      currentStep: 1,
      shouldRedirect: true,
      redirectPath: "/email/dashboard",
      product: "leadsnipper",
    };
  }

  // If the current path doesn't require email verification, allow access
  if (!requiresEmailVerification(pathname)) {
    return null;
  }

  // Determine product context from path
  const productContext: ProductType = "leadsnipper";

  // Check onboarding status with product context
  const status = await checkOnboardingStatus(productContext);

  // If user is not authenticated, redirect to login
  if (status.redirectPath === "/login") {
    return status;
  }

  // If email is not verified, redirect to email verification
  if (status.redirectPath === "/verify-email") {
    return status;
  }

  // SOCIAL PATHS: Check social subscription and onboarding
  if (pathname.startsWith("/social")) {
    // Check subscription-based access
    if (requiresSocialSubscription(pathname)) {
      try {
        const access = await getSocialAccess();

        if (!access.enabled) {
          // No active subscription - redirect to pricing
          return {
            isCompleted: status.isCompleted,
            currentStep: status.currentStep,
            shouldRedirect: true,
            redirectPath: "/social/pricing",
            product: "socialsnipper",
          };
        }
      } catch (error) {
        console.error("Error checking social subscription:", error);
        // On error, allow access (fail open for better UX)
      }
    }

    // Check social onboarding completion
    if (!status.isCompleted && status.product === "socialsnipper") {
      // Allow certain paths during onboarding
      const allowedDuringOnboarding = [
        "/social/onboarding",
        "/social/linkedin",
        "/social/linkedin/callback",
        "/social/memory/onboarding",
        "/social/post-studio",
        "/social/dashboard",
      ];

      const isAllowedDuringOnboarding = allowedDuringOnboarding.some(
        (path) => pathname === path || pathname.startsWith(path + "/")
      );

      if (!isAllowedDuringOnboarding) {
        return status;
      }
    }

    return null;
  }

  // SocialSnipper users should never see LeadSnipper email onboarding
  const user = await getCurrentUser();
  const sessionProduct = getStoredAuthProduct();
  if (
    (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) &&
    isSocialSnipperUser(user, sessionProduct)
  ) {
    return {
      isCompleted: false,
      currentStep: 1,
      shouldRedirect: true,
      redirectPath: "/social/onboarding",
      product: "socialsnipper",
    };
  }

  // LeadSnipper email onboarding is only required when accessing /email/* routes
  if (!requiresLeadSnipperOnboarding(pathname)) {
    return null;
  }

  // If the current path doesn't require onboarding, allow access
  if (!requiresOnboarding(pathname)) {
    return null;
  }

  // If onboarding is completed, allow access
  if (status.isCompleted) {
    return null;
  }

  // If onboarding is not completed, redirect to LeadSnipper onboarding
  return status;
};
