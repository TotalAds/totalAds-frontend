"use client";

import axios from "axios";

import apiClient from "./apiClient";
import emailClient from "./emailClient";

/**
 * Type definitions for subscription
 */
export interface SubscriptionStatus {
  subscriptionId: string | null;
  status: string;
  tier: {
    id: string;
    name: string;
    displayName: string;
    monthlyPriceInPaise: number;
  } | null;
  autoRenew: boolean;
  nextBillingDate: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  pausedAt: string | null;
  cancelAtCycleEnd: boolean;
  failedPaymentCount: number;
  gracePeriodEndsAt: string | null;
  // Early signup bonus (formerly founding member)
  foundingMember: boolean; // Kept for backward compatibility
  earlySignupBonus?: boolean;
  lockedPrice: number | null; // Deprecated, use discountedPrice
  discountedPrice?: number | null;
}

export interface PaymentHistoryRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  description: string;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  razorpaySubscriptionId: string | null;
  razorpayInvoiceId: string | null;
  isSubscriptionPayment: boolean;
  subscriptionCycle: number | null;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
}

/**
 * API client for subscription operations
 * Uses axios for direct API calls to backend
 */

// Helper function to handle errors
const handleSubscriptionError = (
  error: unknown,
  defaultMessage: string
): never => {
  console.error(defaultMessage, error);

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    if (status === 401) {
      throw new Error("Authentication required. Please sign in to continue.");
    } else if (status === 404) {
      throw new Error("Subscription not found.");
    } else if (status === 400) {
      throw new Error(errorMessage || "Invalid request.");
    } else {
      throw new Error(errorMessage || defaultMessage);
    }
  }

  throw new Error(defaultMessage);
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    const response = await emailClient.get("/api/subscription/status", {
      withCredentials: true,
    });
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    return handleSubscriptionError(error, "Failed to get subscription status");
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (
  cancelAtCycleEnd: boolean = false,
  reason?: string
): Promise<{ success: boolean; message: string; data: any }> => {
  try {
    const response = await emailClient.post(
      "/api/subscription/cancel",
      {
        cancelAtCycleEnd,
        reason,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: unknown) {
    return handleSubscriptionError(error, "Failed to cancel subscription");
  }
};

/**
 * Pause subscription
 */
export const pauseSubscription = async (): Promise<{
  success: boolean;
  message: string;
  data: any;
}> => {
  try {
    const response = await emailClient.post(
      "/api/subscription/pause",
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: unknown) {
    return handleSubscriptionError(error, "Failed to pause subscription");
  }
};

/**
 * Resume subscription
 */
export const resumeSubscription = async (): Promise<{
  success: boolean;
  message: string;
  data: any;
}> => {
  try {
    const response = await apiClient.post(
      "/subscription/resume",
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: unknown) {
    return handleSubscriptionError(error, "Failed to resume subscription");
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (
  limit: number = 10,
  offset: number = 0
): Promise<PaymentHistoryRecord[]> => {
  try {
    const response = await emailClient.get(
      `/api/subscription/payment-history?limit=${limit}&offset=${offset}`,
      {
        withCredentials: true,
      }
    );
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    return handleSubscriptionError(error, "Failed to get payment history");
  }
};
