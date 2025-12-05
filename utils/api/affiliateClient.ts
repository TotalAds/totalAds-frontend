"use client";

import apiClient from "./apiClient";

// Types
export interface AffiliateLinkResponse {
  referralCode: string;
  referralLink: string;
  isNewAffiliate: boolean;
}

export interface ReferredUser {
  email: string;
  signupDate: string;
  hasPaid: boolean;
  commission: {
    amount: string;
    status: string;
    availableDate: string;
  } | null;
}

export interface AffiliateDashboardResponse {
  referralCode: string;
  referralLink: string;
  stats: {
    totalEarnings: string;
    availableBalance: string;
    pendingBalance: string;
    withdrawnAmount: string;
    totalReferrals: number;
    successfulReferrals: number;
  };
  paymentDetails: {
    hasPaymentDetails: boolean;
    paymentMethod: "upi" | "bank" | null;
    upiId: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    accountHolderName: string | null;
  };
  referredUsers: ReferredUser[];
}

export interface Transaction {
  id: number;
  type: "commission" | "withdrawal";
  amount: string;
  status: string;
  createdAt: string;
  referredUserEmail?: string;
  withdrawalId?: number;
  availableDate?: string;
  // Withdrawal-specific fields
  paymentMethod?: string;
  processedAt?: string | null;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  hasPendingWithdrawal: boolean;
  pendingWithdrawalAmount?: string;
}

// Helper to extract data from API response
// API returns: { status, message, payload: { success, data } }
// So we need response.data.payload.data OR response.data.data (for some endpoints)
function extractData<T>(response: any): T {
  // Check if response has payload wrapper (standard API format)
  if (response.data?.payload?.data !== undefined) {
    return response.data.payload.data;
  }
  // Fallback to direct data access
  if (response.data?.data !== undefined) {
    return response.data.data;
  }
  // Return payload directly if no nested data
  if (response.data?.payload !== undefined) {
    return response.data.payload;
  }
  return response.data;
}

// API Functions

/**
 * Get or create affiliate link for current user
 */
export async function getAffiliateLink(): Promise<AffiliateLinkResponse> {
  const response = await apiClient.get("/affiliate/link");
  return extractData<AffiliateLinkResponse>(response);
}

/**
 * Get affiliate dashboard data (stats, referrals, payment details)
 */
export async function getAffiliateDashboard(): Promise<AffiliateDashboardResponse> {
  const response = await apiClient.get("/affiliate/dashboard");
  return extractData<AffiliateDashboardResponse>(response);
}

/**
 * Update affiliate payment details
 */
export async function updatePaymentDetails(data: {
  paymentMethod: "upi" | "bank";
  upiId?: string;
  accountHolderName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}): Promise<{ message: string }> {
  const response = await apiClient.put("/affiliate/payment-details", data);
  return extractData<{ message: string }>(response);
}

/**
 * Request withdrawal of available balance
 */
export async function requestWithdrawal(
  paymentMethod: "upi" | "bank"
): Promise<{
  success: boolean;
  message: string;
  withdrawalId?: number;
  amount?: string;
}> {
  const response = await apiClient.post("/affiliate/withdraw", {
    paymentMethod,
  });
  return extractData<{
    success: boolean;
    message: string;
    withdrawalId?: number;
    amount?: string;
  }>(response);
}

/**
 * Get transaction history
 */
export async function getTransactions(
  page: number = 1,
  limit: number = 10
): Promise<TransactionsResponse> {
  const response = await apiClient.get("/affiliate/transactions", {
    params: { page, limit },
  });
  return extractData<TransactionsResponse>(response);
}

/**
 * Track referral link click (public endpoint)
 */
export async function trackReferralClick(
  referralCode: string,
  referrer?: string
): Promise<{ success: boolean }> {
  const response = await apiClient.post("/affiliate/click", {
    referralCode,
    referrer,
  });
  return extractData<{ success: boolean }>(response);
}
