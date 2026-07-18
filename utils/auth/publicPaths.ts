/**
 * Paths that must remain usable without an authenticated session.
 * Used by API clients to avoid bouncing visitors to /login on 401s.
 */
const AUTH_FREE_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/email/unsubscribe",
  "/unsubscribe",
  "/email/workspaces/invite",
] as const;

export function isAuthFreePath(pathname?: string | null): boolean {
  if (!pathname) return false;
  return AUTH_FREE_PATH_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isCurrentPathAuthFree(): boolean {
  if (typeof window === "undefined") return false;
  return isAuthFreePath(window.location.pathname);
}
