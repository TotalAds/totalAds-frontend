"use client";

import apiClient from "./apiClient";

export interface FeedbackData {
  type: "positive" | "negative" | "suggestion" | "bug";
  rating: number;
  accuracy?: number;
  completeness?: number;
  relevance?: number;
  message: string;
  category: string;
  context?: {
    url?: string;
    extractionId?: string;
    feature?: string;
    page?: string;
    timestamp?: string;
    userAgent?: string;
  };
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    status: string;
  };
}

/**
 * Submit user feedback
 */
export const submitFeedback = async (
  feedbackData: FeedbackData
): Promise<FeedbackResponse> => {
  try {
    const response = await apiClient.post("/feedback", feedbackData);
    // Server wraps responses as { status, message, payload }
    return response.data?.payload || response.data;
  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    throw new Error(
      error.response?.data?.message || "Failed to submit feedback"
    );
  }
};

/**
 * Get feedback history for the current user
 */
export const getFeedbackHistory = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get("/feedback/history");
    return response.data?.payload?.data || response.data?.payload || [];
  } catch (error: any) {
    console.error("Error fetching feedback history:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch feedback history"
    );
  }
};

/**
 * Get feedback statistics
 */
export const getFeedbackStats = async (): Promise<any> => {
  try {
    const response = await apiClient.get("/feedback/stats");
    return response.data?.payload?.data || response.data?.payload;
  } catch (error: any) {
    console.error("Error fetching feedback stats:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch feedback stats"
    );
  }
};
