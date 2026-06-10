"use client";

import apiClient from "./apiClient";

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
  maxMonthlyPosts: number | null;
  maxMonthlyImages: number | null;
  imageTier: "tier_1" | "tier_2" | null;
  includesByok: boolean;
  includesArticles: boolean;
  includesAdvancedAnalytics: boolean;
  isFreeTier: boolean;
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

export interface CreateSocialOrderResponse {
  orderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
  email?: string;
  name?: string;
  tierId: number;
  freeTier?: boolean;
  promoApplied?: boolean;
  freeMonths?: number;
  subscriptionId?: number;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  tierId: number;
  paidAmountInPaise?: number;
  lockedPriceInPaise?: number | null;
}

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function unwrapEnvelope<T>(response: { data?: Record<string, unknown> }): ApiEnvelope<T> {
  const body = response.data;
  const payload = (body?.payload ?? body) as ApiEnvelope<T> | undefined;
  return payload ?? {};
}

function unwrapPayload<T>(response: { data?: Record<string, unknown> }): T {
  return unwrapEnvelope<T>(response).data as T;
}

export const getSocialPricing = async (): Promise<SocialPricingTier[]> => {
  const response = await apiClient.get("/social/billing/pricing");
  return unwrapPayload<SocialPricingTier[]>(response) || [];
};

export const getSocialSubscription = async (): Promise<SocialSubscriptionResponse | null> => {
  const response = await apiClient.get("/social/billing/subscription");
  return unwrapPayload<SocialSubscriptionResponse | null>(response) ?? null;
};

export const createSocialSubscription = async (
  tierId: number,
  promoCode?: string
): Promise<CreateSocialOrderResponse> => {
  const response = await apiClient.post("/social/billing/create-order", {
    tierId,
    promoCode,
  });
  const envelope = unwrapEnvelope<CreateSocialOrderResponse>(response);
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.message || "Failed to create payment order");
  }
  return envelope.data;
};

export const validateSocialCoupon = async (code: string, tierId?: number) => {
  const response = await apiClient.post("/social/billing/validate-coupon", {
    code,
    tierId,
  });
  return unwrapPayload<{ valid: boolean; message?: string; freeMonths?: number }>(response);
};

export const redeemSocialCoupon = async (code: string) => {
  const response = await apiClient.post("/social/billing/redeem-coupon", { code });
  return unwrapPayload<{ subscriptionId: number; freeMonths: number }>(response);
};

export const verifySocialPayment = async (
  data: VerifyPaymentRequest
): Promise<{ subscriptionId: number; status: string }> => {
  const response = await apiClient.post("/social/billing/verify-payment", data);
  const envelope = unwrapEnvelope<{ subscriptionId: number; status: string }>(response);
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.message || "Failed to verify payment");
  }
  return envelope.data;
};
