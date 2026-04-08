/**
 * Warmup API Client
 * Handles all warmup system API calls (accounts, statistics, pairs)
 */

import axios, { AxiosError } from "axios";

import { refreshAccessToken } from "../auth/refreshAccessToken";
import { tokenStorage } from "../auth/tokenStorage";

// API base URLs
const EMAIL_SERVICE_URL =
  process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";
const WARMUP_API_URL = `${EMAIL_SERVICE_URL}/api/warmup`;

// Create axios instance for warmup API
const warmupClient = axios.create({
  baseURL: WARMUP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 120000, // 120 second timeout
});

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth headers
warmupClient.interceptors.request.use(
  async (config) => {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    (config as any).metadata = { startTime: new Date() };
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh and error handling
warmupClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return warmupClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        isRefreshing = false;
        return warmupClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        tokenStorage.removeTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// WARMUP ACCOUNT MANAGEMENT
// ============================================================================

export interface WarmupAccount {
  id: string;
  email: string;
  provider: "gmail" | "outlook" | "yahoo" | "zoho" | "custom" | "ses_smtp";
  displayName: string;
  username?: string;
  mailDisplayName?: string;
  timezone?: string;
  warmupEnabled: boolean;
  dailyLimit: number;
  warmupStage: number;
  reputationScore: number;
  inboxRate: number;
  spamRate: number;
  replyRate: number;
  status: "active" | "paused" | "failed" | "disabled";
  lastActivityAt?: string;
  lastSentAt?: string;
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarmupAccountRequest {
  email: string;
  provider: "gmail" | "outlook" | "yahoo" | "zoho" | "custom" | "ses_smtp";
  displayName?: string;
  username?: string;
  mailDisplayName?: string;
  timezone?: string;
  dailyLimit?: number;
  adminBypass?: boolean;
}

export interface UpdateWarmupAccountRequest {
  displayName?: string;
  dailyLimit?: number;
}

export interface ToggleWarmupAccountRequest {
  warmupEnabled: boolean;
}

// Get all warmup accounts
export const getWarmupAccounts = async (): Promise<WarmupAccount[]> => {
  try {
    const response = await warmupClient.get("/accounts");
    return response.data?.data || [];
  } catch (error: any) {
    console.error("Failed to fetch warmup accounts:", error);
    throw error;
  }
};

// Get single warmup account
export const getWarmupAccount = async (
  accountId: string
): Promise<WarmupAccount> => {
  try {
    const response = await warmupClient.get(`/accounts/${accountId}`);
    return response.data?.data;
  } catch (error: any) {
    console.error("Failed to fetch warmup account:", error);
    throw error;
  }
};

// Create warmup account
export const createWarmupAccount = async (
  data: CreateWarmupAccountRequest
): Promise<WarmupAccount> => {
  try {
    const response = await warmupClient.post("/accounts", data);
    return response.data?.data;
  } catch (error: any) {
    console.error("Failed to create warmup account:", error);
    throw error;
  }
};

// Update warmup account
export const updateWarmupAccount = async (
  accountId: string,
  data: UpdateWarmupAccountRequest
): Promise<WarmupAccount> => {
  try {
    const response = await warmupClient.put(`/accounts/${accountId}`, data);
    return response.data?.data;
  } catch (error: any) {
    console.error("Failed to update warmup account:", error);
    throw error;
  }
};

// Toggle warmup for account
export const toggleWarmupAccount = async (
  accountId: string,
  warmupEnabled: boolean
): Promise<WarmupAccount> => {
  try {
    const response = await warmupClient.patch(`/accounts/${accountId}/toggle`, {
      warmupEnabled,
    });
    return response.data?.data;
  } catch (error: any) {
    console.error("Failed to toggle warmup account:", error);
    throw error;
  }
};

// Delete warmup account
export const deleteWarmupAccount = async (accountId: string): Promise<void> => {
  try {
    await warmupClient.delete(`/accounts/${accountId}`);
  } catch (error: any) {
    console.error("Failed to delete warmup account:", error);
    throw error;
  }
};

// ============================================================================
// WARMUP STATISTICS
// ============================================================================

export interface WarmupStats {
  id: string;
  accountId: string;
  date: string;
  sentCount: number;
  inboxCount: number;
  spamCount: number;
  replyCount: number;
  openCount: number;
  inboxRate: number;
  spamRate: number;
  replyRate: number;
  openRate: number;
}

export interface WarmupStatsSummary {
  totalSent: number;
  totalInbox: number;
  totalSpam: number;
  totalReplies: number;
  totalOpens: number;
  averageInboxRate: number;
  averageSpamRate: number;
  averageReplyRate: number;
  averageOpenRate: number;
}

// Get warmup statistics
export const getWarmupStats = async (
  accountId?: string,
  days: number = 7
): Promise<WarmupStats[]> => {
  try {
    const params = new URLSearchParams();
    if (accountId) params.append("accountId", accountId);
    params.append("days", days.toString());

    const response = await warmupClient.get(`/stats?${params.toString()}`);
    return response.data?.data || [];
  } catch (error: any) {
    console.error("Failed to fetch warmup stats:", error);
    throw error;
  }
};

// Get warmup statistics summary
export const getWarmupStatsSummary = async (
  accountId?: string,
  days: number = 30
): Promise<WarmupStatsSummary> => {
  try {
    const params = new URLSearchParams();
    if (accountId) params.append("accountId", accountId);
    params.append("days", days.toString());

    const response = await warmupClient.get(
      `/stats/summary?${params.toString()}`
    );
    return response.data?.data;
  } catch (error: any) {
    console.error("Failed to fetch warmup stats summary:", error);
    throw error;
  }
};

// ============================================================================
// WARMUP PAIRS
// ============================================================================

export interface WarmupPair {
  id: string;
  senderId: string;
  receiverId: string;
  senderEmail: string;
  receiverEmail: string;
  status: "scheduled" | "sent" | "delivered" | "opened" | "replied" | "failed";
  sendAt: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  repliedAt?: string;
  messageId?: string;
  providerMessageId?: string;
  spamDetected: boolean;
  inboxDetected: boolean;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WarmupPairsResponse {
  pairs: WarmupPair[];
  total: number;
  limit: number;
  offset: number;
}

export interface WarmupPairStats {
  totalPairs: number;
  scheduledCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  repliedCount: number;
  failedCount: number;
  deliveryRate: number;
  openRate: number;
  replyRate: number;
}

// Get warmup pairs
export const getWarmupPairs = async (
  accountId?: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<WarmupPairsResponse> => {
  try {
    const params = new URLSearchParams();
    if (accountId) params.append("accountId", accountId);
    if (status) params.append("status", status);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    const response = await warmupClient.get(`/pairs?${params.toString()}`);
    return response.data?.data;
  } catch (error: any) {
    console.error("Failed to fetch warmup pairs:", error);
    throw error;
  }
};

// Get warmup pair statistics
export const getWarmupPairStats = async (
  accountId: string
): Promise<WarmupPairStats> => {
  try {
    const response = await warmupClient.get(`/pairs/${accountId}/stats`);
    return response.data?.data;
  } catch (error: any) {
    console.error("Failed to fetch warmup pair stats:", error);
    throw error;
  }
};

// ============================================================================
// WARMUP STATUS
// ============================================================================
export interface WarmupStatusResponse {
  account: {
    id: string;
    email: string;
    displayName: string;
    timezone?: string;
    spamRate: number;
    reputationScore: number;
    warmupEnabled: boolean;
  };
  scalingProfile: any | null;
  health: {
    clampedByHealth: boolean;
    spamRate: number;
    reputationScore: number;
    paused: boolean;
  };
  today: {
    plannedInitials: number;
    sentInitials: number;
    remainingInitials: number;
  };
  tomorrow: {
    tdws: number;
    headroomPct: number;
    plannedInitials: number;
    expectedReplies: number;
    newInitialsBudget: number;
  };
  updatedAt: string;
}

export const getWarmupStatus = async (
  accountId: string
): Promise<WarmupStatusResponse> => {
  const response = await warmupClient.get(`/status/${accountId}`);
  return response.data?.data;
};

export default warmupClient;
