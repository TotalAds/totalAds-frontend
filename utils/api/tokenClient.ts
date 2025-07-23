"use client";

import axios from "axios";

import apiClient from "./apiClient";

/**
 * Type definitions for API tokens
 */
export interface ApiToken {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  active: boolean;
  token?: string; // Only provided when token is first created
}

export interface TokenUsage {
  id: string;
  tokenId: string;
  requests: number;
  successfulRequests: number;
  failedRequests: number;
  period: string; // 'daily', 'weekly', 'monthly'
  date: string;
}

export interface CreateTokenRequest {
  name: string;
  expireIn?: number | null; // In days, null for no expiration
}

/**
 * List all API tokens for the current user
 */
export const listTokens = async (): Promise<{ data: ApiToken[] }> => {
  try {
    const response = await apiClient.get("/api-management/tokens", {
      withCredentials: true,
    });
    // Handle different response structures
    if (response.data.payload?.data) {
      return { data: response.data.payload.data };
    } else if (response.data.data) {
      return { data: response.data.data };
    } else {
      return { data: response.data.payload || response.data || [] };
    }
  } catch (error: unknown) {
    console.error("Error listing tokens:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to list tokens"
      );
    }
    throw error;
  }
};

/**
 * Get details for a specific token
 */
export const getToken = async (id: string): Promise<ApiToken> => {
  try {
    const response = await apiClient.get(`/api-management/tokens/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error getting token ${id}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to get token"
      );
    }
    throw error;
  }
};

/**
 * Create a new API token
 * Returns the newly created token with the actual token string (shown only once)
 */
export const createToken = async (
  tokenData: CreateTokenRequest
): Promise<ApiToken> => {
  try {
    const response = await apiClient.post("/api-management/tokens", tokenData, {
      withCredentials: true,
    });
    // Handle different response structures for create token
    console.log("Create token response:", response.data);

    if (response.data.payload?.data) {
      console.log("Using payload.data:", response.data.payload.data);
      return response.data.payload.data;
    } else if (response.data.data) {
      console.log("Using data:", response.data.data);
      return response.data.data;
    } else {
      console.log("Using fallback:", response.data.payload || response.data);
      return response.data.payload || response.data;
    }
  } catch (error: unknown) {
    console.error("Error creating token:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to create token"
      );
    }
    throw error;
  }
};

/**
 * Update an API token's name
 */
export const updateToken = async (
  id: string,
  name: string
): Promise<ApiToken> => {
  try {
    const response = await apiClient.patch(`/api-management/tokens/${id}`, {
      name,
    });
    return response.data;
  } catch (error: unknown) {
    console.error(`Error updating token ${id}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to update token"
      );
    }
    throw error;
  }
};

/**
 * Delete an API token
 */
export const deleteToken = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api-management/tokens/${id}`, {
      withCredentials: true,
    });
  } catch (error: unknown) {
    console.error(`Error deleting token ${id}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to delete token"
      );
    }
    throw error;
  }
};

/**
 * Get usage statistics for a token
 */
export const getTokenUsage = async (
  id: string,
  period: string = "monthly"
): Promise<TokenUsage[]> => {
  try {
    const response = await apiClient.get(
      `/api-management/tokens/${id}/usage?period=${period}`
    );
    return response.data;
  } catch (error: unknown) {
    console.error(`Error getting token usage for ${id}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to get token usage"
      );
    }
    throw error;
  }
};

/**
 * Validate an API token
 */
export const validateToken = async (
  token: string
): Promise<{ valid: boolean; message: string }> => {
  try {
    const response = await apiClient.post("/api-management/validate-token", {
      token,
    });
    return {
      valid: response.data.valid,
      message: response.data.message,
    };
  } catch (error: unknown) {
    console.error("Error validating token:", error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        valid: false,
        message:
          error.response.data?.message ||
          error.response.data?.error ||
          "Failed to validate token",
      };
    }
    return {
      valid: false,
      message: "Failed to validate token",
    };
  }
};
