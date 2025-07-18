"use client";

import axios from "axios";

import apiClient from "./apiClient";

/**
 * Type definitions for usage statistics
 */
export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCreditsUsed: number;
  creditsRemaining: number;
  lastRequestDate: string | null;
}

export interface DailyUsage {
  date: string;
  requests: number;
  creditsUsed: number;
  successRate: number;
}

export interface UsageBreakdown {
  scraper: {
    requests: number;
    creditsUsed: number;
    aiRequests: number;
  };
  api: {
    requests: number;
    creditsUsed: number;
  };
  total: {
    requests: number;
    creditsUsed: number;
  };
}

export interface UsageResponse {
  stats: UsageStats;
  daily: DailyUsage[];
  breakdown: UsageBreakdown;
  period: {
    start: string;
    end: string;
  };
}

/**
 * API client for usage statistics
 * Uses axios for direct API calls to backend
 */

// Helper function to handle errors
const handleUsageError = (error: unknown, defaultMessage: string): never => {
  console.error(defaultMessage, error);

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    if (status === 401) {
      throw new Error("Authentication required. Please sign in to continue.");
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
 * Get overall usage statistics
 */
export const getUsageStats = async (
  period: "daily" | "weekly" | "monthly" = "monthly"
): Promise<UsageResponse> => {
  try {
    const response = await apiClient.get(`/usage?period=${period}`);
    return response.data;
  } catch (error: unknown) {
    return handleUsageError(error, "Failed to get usage statistics");
  }
};

/**
 * Get daily usage for a specific date range
 */
export const getDailyUsage = async (
  startDate: string,
  endDate: string
): Promise<DailyUsage[]> => {
  try {
    const response = await apiClient.get(
      `/usage/daily?start=${startDate}&end=${endDate}`
    );
    return response.data;
  } catch (error: unknown) {
    return handleUsageError(error, "Failed to get daily usage");
  }
};

/**
 * Get usage breakdown by service
 */
export const getUsageBreakdown = async (
  period: "daily" | "weekly" | "monthly" = "monthly"
): Promise<UsageBreakdown> => {
  try {
    const response = await apiClient.get(`/usage/breakdown?period=${period}`);
    return response.data;
  } catch (error: unknown) {
    return handleUsageError(error, "Failed to get usage breakdown");
  }
};

/**
 * Get current credit balance
 */
export const getCreditBalance = async (): Promise<{
  credits: number;
  lastUpdated: string;
}> => {
  try {
    const response = await apiClient.get("/usage/credits");
    return response.data;
  } catch (error: unknown) {
    return handleUsageError(error, "Failed to get credit balance");
  }
};

/**
 * Get usage alerts and notifications
 */
export const getUsageAlerts = async (): Promise<{
  lowCredits: boolean;
  highUsage: boolean;
  quotaExceeded: boolean;
  alerts: Array<{
    type: string;
    message: string;
    severity: "info" | "warning" | "error";
    timestamp: string;
  }>;
}> => {
  try {
    const response = await apiClient.get("/usage/alerts");
    return response.data;
  } catch (error: unknown) {
    return handleUsageError(error, "Failed to get usage alerts");
  }
};

/**
 * Export usage data as CSV
 */
export const exportUsageData = async (
  startDate: string,
  endDate: string,
  format: "csv" | "json" = "csv"
): Promise<Blob> => {
  try {
    const response = await apiClient.get(
      `/usage/export?start=${startDate}&end=${endDate}&format=${format}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error: unknown) {
    return handleUsageError(error, "Failed to export usage data");
  }
};

/**
 * Get usage limits and quotas
 */
export const getUsageLimits = async (): Promise<{
  dailyLimit: number;
  monthlyLimit: number;
  currentDaily: number;
  currentMonthly: number;
  resetDate: string;
}> => {
  try {
    const response = await apiClient.get("/usage/limits");
    return response.data;
  } catch (error: unknown) {
    return handleUsageError(error, "Failed to get usage limits");
  }
};
