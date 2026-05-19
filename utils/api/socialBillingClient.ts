"use client";

import apiClient from "./apiClient";
import emailClient from "./emailClient";

export interface SocialPricingTier {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  monthlyPriceInPaise: number;
  originalPriceInPaise: number | null;
  includesLinkedIn: boolean;
  includesTwitter: boolean;
  includesAgent: boolean;
  maxDailyPosts: number;
  includesImageGeneration: boolean;
  includesApprovalWorkflows: boolean;
  includesAnalytics: boolean;
}

export interface SocialSubscription {
  id: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  lockedPriceInPaise: number | null;
  isTrial: boolean;
}

export interface SocialSubscriptionResponse {
  subscription: SocialSubscription;
  tier: {
    id: number;
    name: string;
    displayName: string;
    maxDailyPosts: number;
  } | null;
}

/** Razorpay order checkout payload (same pattern as LeadSnipper) */
export interface CreateSocialOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  email: string;
  name?: string;
  tierId: number;
  foundingMemberDiscount?: boolean;
  lockedPriceInPaise?: number | null;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  tierId: number;
  paidAmountInPaise?: number;
  lockedPriceInPaise?: number | null;
}

/** Unwrap API envelope: { payload: { success, data } } or { success, data } */
function unwrapPayload<T>(response: { data?: Record<string, unknown> }): T {
  const body = response.data;
  const payload = (body?.payload ?? body) as { data?: T; success?: boolean } | undefined;
  return payload?.data as T;
}

/**
 * Get SocialSnipper pricing tiers (totalads-api)
 */
export const getSocialPricing = async (): Promise<SocialPricingTier[]> => {
  const response = await apiClient.get("/social/billing/pricing");
  return unwrapPayload<SocialPricingTier[]>(response) || [];
};

/**
 * Get current user's social subscription (totalads-api)
 */
export const getSocialSubscription = async (): Promise<SocialSubscriptionResponse | null> => {
  const response = await apiClient.get("/social/billing/subscription");
  return unwrapPayload<SocialSubscriptionResponse | null>(response) ?? null;
};

/**
 * Create Razorpay order via email-service (same Razorpay path as LeadSnipper)
 */
export const createSocialSubscription = async (
  tierId: number
): Promise<CreateSocialOrderResponse> => {
  const response = await emailClient.post("/api/payment/social/create-order", {
    tierId,
  });
  if (!response.data?.success) {
    throw new Error(response.data?.error || "Failed to create payment order");
  }
  return response.data.data;
};

/**
 * Verify Razorpay payment after successful checkout (email-service)
 */
export const verifySocialPayment = async (
  data: VerifyPaymentRequest
): Promise<{ subscriptionId: number; status: string }> => {
  const response = await emailClient.post("/api/payment/social/verify-payment", data);
  if (!response.data?.success) {
    throw new Error(response.data?.error || "Failed to verify payment");
  }
  return response.data.data;
};
