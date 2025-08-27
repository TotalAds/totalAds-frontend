"use client";

import axios from 'axios';

import apiClient from './apiClient';

export interface CreditBalance {
  userId: string;
  currentBalance: number; // credits
  totalEarned: number;
  totalUsed: number;
  lastUpdate: string | null;
}

const handleCreditsError = (error: unknown, defaultMessage: string): never => {
  console.error(defaultMessage, error);
  if (axios.isAxiosError(error)) {
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;
    throw new Error(msg || defaultMessage);
  }
  throw new Error(defaultMessage);
};

// Get real credit balance from the credits system
export const getCreditBalance = async (): Promise<CreditBalance> => {
  try {
    const response = await apiClient.get("/credits/balance", {
      withCredentials: true,
    });
    // Normalize shape to support both {payload:{data}} and {data}
    const payload = (response.data?.payload?.data ??
      response.data?.data ??
      response.data) as CreditBalance;
    return payload;
  } catch (error: unknown) {
    return handleCreditsError(error, "Failed to fetch credit balance");
  }
};

// Optional: get pricing info for credits (credits per request, value, etc.)
export const getCreditPricing = async (): Promise<{
  normalScrapingCredits: number;
  aiScrapingCredits: number;
  creditValue: number;
  freeCreditsPerMonth?: number; // legacy field (may be 0)
  freeCallsPerMonth?: number; // new field backed by FREE_TIER_CALLS
  currency: string;
  description: Record<string, string>;
}> => {
  try {
    const response = await apiClient.get("/credits/pricing", {
      withCredentials: true,
    });
    const payload =
      response.data?.payload?.data ?? response.data?.data ?? response.data;
    return payload;
  } catch (error: unknown) {
    return handleCreditsError(error, "Failed to fetch credit pricing");
  }
};
