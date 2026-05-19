/**
 * Product intent utilities for LeadSnipper and SocialSnipper
 * Handles product detection from URL params, session storage, and user data
 */

export type ProductType = "leadsnipper" | "socialsnipper" | null;

const VALID_LEADSNIPPER_ALIASES = ["leadsnipper", "email"];
const VALID_SOCIALSNIPPER_ALIASES = ["socialsnipper", "social", "socialsniper"];

const AUTH_PRODUCT_KEY = "authProduct";

/**
 * Parse product from query parameter value
 */
export function parseProduct(value: string | null): ProductType {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();

  if (VALID_LEADSNIPPER_ALIASES.includes(normalized)) {
    return "leadsnipper";
  }

  if (VALID_SOCIALSNIPPER_ALIASES.includes(normalized)) {
    return "socialsnipper";
  }

  return null;
}

/**
 * Check if a raw product string indicates SocialSnipper intent
 */
export function isSocialProductOnboardingIntent(
  raw: string | null | undefined
): boolean {
  const t = (raw || "").toLowerCase();
  return VALID_SOCIALSNIPPER_ALIASES.includes(t);
}

/**
 * Check if a raw product string indicates LeadSnipper intent
 */
export function isLeadSnipperProductOnboardingIntent(
  raw: string | null | undefined
): boolean {
  const t = (raw || "").toLowerCase();
  return VALID_LEADSNIPPER_ALIASES.includes(t);
}

/**
 * Store selected product in sessionStorage for persistence across auth flow
 */
export function storeAuthProduct(product: ProductType): void {
  if (typeof window === "undefined") return;

  if (product) {
    sessionStorage.setItem(AUTH_PRODUCT_KEY, product);
  }
}

/**
 * Get stored auth product from sessionStorage
 */
export function getStoredAuthProduct(): ProductType {
  if (typeof window === "undefined") return null;

  const stored = sessionStorage.getItem(AUTH_PRODUCT_KEY);
  return parseProduct(stored);
}

/**
 * Clear stored auth product
 */
export function clearStoredAuthProduct(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(AUTH_PRODUCT_KEY);
}

/**
 * Build URL with product query param preserved
 */
export function buildUrlWithProduct(
  basePath: string,
  product: ProductType,
  existingParams?: URLSearchParams
): string {
  const params = new URLSearchParams(existingParams?.toString() || "");

  if (product) {
    params.set("product", product);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Get redirect path after successful auth based on product
 */
export function getPostAuthRedirectPath(
  product: ProductType,
  user: {
    emailVerified: boolean;
    onboardingCompleted: boolean;
    socialOnboardingCompleted?: boolean;
  }
): string {
  // Not verified - go to verify email
  if (!user.emailVerified) {
    return buildUrlWithProduct("/verify-email", product);
  }

  // LeadSnipper flow
  if (product === "leadsnipper") {
    if (!user.onboardingCompleted) {
      return buildUrlWithProduct("/onboarding", product);
    }
    return "/email/dashboard";
  }

  // SocialSnipper flow
  if (product === "socialsnipper") {
    if (!user.socialOnboardingCompleted) {
      return buildUrlWithProduct("/social/onboarding", product);
    }
    return "/social/dashboard";
  }

  // Default to LeadSnipper
  if (!user.onboardingCompleted) {
    return "/onboarding";
  }
  return "/email/dashboard";
}
