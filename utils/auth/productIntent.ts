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
export function getSafeRedirectPath(
  searchParams: URLSearchParams | { get: (key: string) => string | null }
): string | null {
  const raw = searchParams.get("redirect");
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
}

export function buildInviteAuthQuery(token: string, email?: string) {
  const invitePath = `/email/workspaces/invite?token=${encodeURIComponent(token)}`;
  const params = new URLSearchParams();
  params.set("redirect", invitePath);
  params.set("product", "leadsnipper");
  params.set("inviteToken", token);
  if (email) params.set("inviteEmail", email);
  return params;
}

/**
 * Prefer explicit redirect (e.g. workspace invite) over default product onboarding.
 */
export function resolvePostAuthPath(
  searchParams: URLSearchParams,
  product: ProductType,
  user: {
    emailVerified: boolean;
    onboardingCompleted: boolean;
    socialOnboardingCompleted?: boolean;
  }
): string {
  const redirect = getSafeRedirectPath(searchParams);
  if (redirect) return redirect;
  return getPostAuthRedirectPath(product, user);
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
    return buildUrlWithProduct("/verify-email", "leadsnipper");
  }

  // Treat all products as LeadSnipper to bypass SocialSnipper flow
  if (!user.onboardingCompleted) {
    return buildUrlWithProduct("/onboarding", "leadsnipper");
  }
  return "/email/dashboard";
  /*
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

  // Unknown product — redirect to email dashboard since hub is disabled
  return "/email/dashboard";
  */
}

/**
 * Paths that require LeadSnipper email onboarding to be complete
 */
export function requiresLeadSnipperOnboarding(pathname: string): boolean {
  return pathname.startsWith("/email");
}

/**
 * Whether the user signed up for / is using SocialSnipper (not LeadSnipper-only)
 */
export function isSocialSnipperUser(
  user?: { signupProduct?: string | null } | null,
  sessionProduct?: ProductType
): boolean {
  // Force all checks to return false to hide SocialSnipper content
  return false;
  /*
  const product =
    sessionProduct || parseProduct(user?.signupProduct ?? null);
  return product === "socialsnipper";
  */
}
