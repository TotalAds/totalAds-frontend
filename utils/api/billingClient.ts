"use client";

import axios from "axios";

import apiClient from "./apiClient";

/**
 * Type definitions for billing
 */
export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface BillingInfo {
  id: string;
  userId: string;
  credits: number;
  totalSpent: number;
  lastPaymentDate: string | null;
  paymentMethod: string | null;
  subscriptionStatus: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  paymentMethod: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  description: string;
  popular?: boolean;
}

/**
 * API client for billing operations
 * Uses axios for direct API calls to backend
 */

// Helper function to handle errors
const handleBillingError = (error: unknown, defaultMessage: string): never => {
  console.error(defaultMessage, error);

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    if (status === 401) {
      throw new Error("Authentication required. Please sign in to continue.");
    } else if (status === 402) {
      throw new Error(
        "Payment required. Please add credits to your account to continue."
      );
    } else if (status === 403) {
      throw new Error(
        "Access denied. You don't have permission to perform this action."
      );
    } else {
      throw new Error(errorMessage || defaultMessage);
    }
  }

  throw new Error(defaultMessage);
};

/**
 * Get user's billing information
 */
export const getBillingInfo = async (): Promise<any> => {
  try {
    // Use settings-specific endpoint which includes subscription tier mapping
    const response = await apiClient.get("/settings/billing", {
      withCredentials: true,
    });
    // Handle multiple server envelopes
    const data =
      response.data?.payload?.data ?? response.data?.data ?? response.data;
    return data;
  } catch (error: unknown) {
    return handleBillingError(error, "Failed to get billing information");
  }
};

/**
 * Get available credit packages
 */
export const getCreditPackages = async (): Promise<CreditPackage[]> => {
  try {
    const response = await apiClient.get("/billing/packages");
    return response.data;
  } catch (error: unknown) {
    return handleBillingError(error, "Failed to get credit packages");
  }
};

/**
 * Create payment intent for purchasing credits
 */
export const createPaymentIntent = async (
  packageId: string,
  amount: number
): Promise<PaymentIntent> => {
  try {
    const response = await apiClient.post("/billing/create-payment-intent", {
      packageId,
      amount,
    });
    return response.data;
  } catch (error: unknown) {
    return handleBillingError(error, "Failed to create payment intent");
  }
};

/**
 * Confirm payment and add credits
 */
export const confirmPayment = async (
  paymentIntentId: string,
  packageId: string
): Promise<{ success: boolean; credits: number; message: string }> => {
  try {
    const response = await apiClient.post("/billing/confirm-payment", {
      paymentIntentId,
      packageId,
    });
    return response.data;
  } catch (error: unknown) {
    return handleBillingError(error, "Failed to confirm payment");
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  data: PaymentHistory[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const response = await apiClient.get(
      `/billing/history?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error: unknown) {
    return handleBillingError(error, "Failed to get payment history");
  }
};

/**
 * Get usage statistics for billing
 */
export const getBillingUsageStats = async (): Promise<{
  totalCreditsUsed: number;
  creditsRemaining: number;
  usage7d: { date: string; creditsUsed: number }[];
  usage30d: { date: string; creditsUsed: number }[];
}> => {
  try {
    const response = await apiClient.get("/billing/usage");
    return response.data;
  } catch (error: unknown) {
    return handleBillingError(error, "Failed to get usage statistics");
  }
};

/**
 * Cancel subscription (if applicable)
 */
export const cancelSubscription = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await apiClient.post("/billing/cancel-subscription");
    return response.data;
  } catch (error: unknown) {
    return handleBillingError(error, "Failed to cancel subscription");
  }
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (
  paymentMethodId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post("/billing/update-payment-method", {
      paymentMethodId,
    });
    return response.data;
  } catch (error: unknown) {
    return handleBillingError(error, "Failed to update payment method");
  }
};
