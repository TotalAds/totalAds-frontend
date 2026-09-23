"use client";

import axios from "axios";

import { clearActiveWorkspaceId } from "../workspace/storage";
import { isCurrentPathAuthFree } from "./publicPaths";
import { tokenStorage } from "./tokenStorage";

export const ACCOUNT_INACTIVE_CODE = "ACCOUNT_INACTIVE";
export const ACCOUNT_INACTIVE_MESSAGE =
  "This account has been suspended. Contact support if you believe this is a mistake.";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let isForceLoggingOut = false;

function extractResponseData(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== "object") return null;
  const response = (error as { response?: { data?: unknown; status?: number } })
    .response;
  if (!response || response.status !== 403) return null;
  const data = response.data;
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

/** True when API rejected the session because the account is blocked/suspended. */
export function isAccountInactiveError(error: unknown): boolean {
  const data = extractResponseData(error);
  if (!data) return false;

  if (data.code === ACCOUNT_INACTIVE_CODE) return true;

  const reason = data.reason;
  if (
    reason &&
    typeof reason === "object" &&
    (reason as { code?: string }).code === ACCOUNT_INACTIVE_CODE
  ) {
    return true;
  }

  const msg = String(data.message || data.error || "");
  return msg.toLowerCase().includes("account has been suspended");
}

/**
 * Clear session and send the user to login with a suspended-account message.
 * Safe to call multiple times; skips redirect on auth-free public pages (except login).
 */
export function forceLogoutAccountInactive(): void {
  if (typeof window === "undefined") return;
  if (isForceLoggingOut) return;
  isForceLoggingOut = true;

  try {
    tokenStorage.removeTokens();
    clearActiveWorkspaceId();
  } catch {
    // ignore storage errors
  }

  // Best-effort: clear httpOnly refresh cookie (logout does not require auth middleware)
  void axios
    .delete(`${API_BASE_URL}/auth/logout`, { withCredentials: true })
    .catch(() => undefined);

  const path = window.location.pathname;
  const alreadyOnLogin = path === "/login" || path.startsWith("/login/");
  if (alreadyOnLogin) {
    if (!window.location.search.includes("reason=suspended")) {
      window.location.replace("/login?reason=suspended");
    } else {
      isForceLoggingOut = false;
    }
    return;
  }

  if (isCurrentPathAuthFree()) {
    isForceLoggingOut = false;
    return;
  }

  window.location.href = "/login?reason=suspended";
}
