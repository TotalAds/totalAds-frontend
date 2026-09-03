"use client";

import axios from "axios";

import apiClient from "./apiClient";
import type { UserProfile } from "./authClient";

export interface RedeemAppsumoLicensePayload {
  redeemToken: string;
  /** `signup` creates a new account, `login` attaches via email/password. */
  mode: "signup" | "login";
  email: string;
  password: string;
  name?: string;
  acceptedLegal?: boolean;
  acceptedLegalVersion?: string;
}

export interface RedeemAppsumoLicenseResult {
  accessToken: string;
  expiresIn: number;
  user: UserProfile | null;
  tierName: string;
  isNewUser: boolean;
  redirectTo: string;
}

function parseRedeemResponse(response: {
  data: Record<string, any>;
}): RedeemAppsumoLicenseResult {
  const data = response.data.payload ?? response.data;
  return {
    accessToken: data.accessToken || "",
    expiresIn: data.expiresIn || 900,
    user: data.user ?? null,
    tierName: data.tierName,
    isNewUser: Boolean(data.isNewUser),
    redirectTo: data.redirectTo || "/email/dashboard",
  };
}

function redeemError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    throw new Error(
      error.response.data?.payload?.message ||
        error.response.data?.message ||
        error.response.data?.error ||
        "We could not redeem your AppSumo license."
    );
  }
  throw error;
}

/**
 * Redeem an AppSumo license after the OAuth redirect (signup or login).
 * The `redeemToken` comes from the `?token=` query param set by the API callback.
 */
export const redeemAppsumoLicense = async (
  payload: RedeemAppsumoLicensePayload
): Promise<RedeemAppsumoLicenseResult> => {
  try {
    const response = await apiClient.post("/appsumo/redeem", payload);
    return parseRedeemResponse(response);
  } catch (error: unknown) {
    return redeemError(error);
  }
};

/**
 * Attach the AppSumo license to the currently signed-in account.
 */
export const redeemAppsumoLicenseOnSession = async (
  redeemToken: string
): Promise<RedeemAppsumoLicenseResult> => {
  try {
    const response = await apiClient.post("/appsumo/redeem/session", {
      redeemToken,
    });
    return parseRedeemResponse(response);
  } catch (error: unknown) {
    return redeemError(error);
  }
};
