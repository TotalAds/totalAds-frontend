"use client";

import axios from "axios";

import { tokenStorage } from "./tokenStorage";

const ACCESS_TOKEN_KEY = "leadsnipper_access_token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Prefer the same storage the user chose at login (session vs local). */
function getRememberMeForRefresh(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    return false;
  }
  if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
    return true;
  }
  return true;
}

/**
 * POST /auth/refresh on the main API (httpOnly refresh cookie).
 * Parses the standard totalads-api envelope: { status, message, payload: { accessToken, expiresIn } }.
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshResponse = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );

  const d = refreshResponse.data as {
    payload?: { accessToken?: string; expiresIn?: number; payload?: { accessToken?: string; expiresIn?: number } };
  };
  const p = d?.payload;
  const accessToken =
    p?.accessToken ?? p?.payload?.accessToken;
  const expiresInRaw = p?.expiresIn ?? p?.payload?.expiresIn;

  const expiresIn =
    typeof expiresInRaw === "number"
      ? expiresInRaw
      : typeof expiresInRaw === "string"
        ? parseInt(expiresInRaw, 10)
        : NaN;

  if (
    !accessToken ||
    typeof accessToken !== "string" ||
    !Number.isFinite(expiresIn)
  ) {
    throw new Error("Invalid refresh response");
  }

  tokenStorage.setTokens(accessToken, expiresIn, getRememberMeForRefresh());
  return accessToken;
}
