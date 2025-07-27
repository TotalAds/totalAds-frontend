"use client";

import axios from "axios";

import apiClient from "./apiClient";

/**
 * Type definitions for ICP management
 */
export interface ICPProfile {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "draft" | "archived";
  scoringMethod:
    | "weighted_average"
    | "threshold_based"
    | "ai_powered"
    | "custom";
  minimumScore: number;
  customPrompts?: {
    businessModel?: string;
    targetMarket?: string;
    companySize?: string;
    technology?: string;
    industry?: string;
    userRemarks?: string;
    customFields?: Array<{
      name: string;
      prompt: string;
      weight: number;
    }>;
  };
  requiredDataPoints?: {
    contactInfo: boolean;
    companySize: boolean;
    industry: boolean;
    revenue: boolean;
    location: boolean;
    technology: boolean;
    socialPresence: boolean;
    fundingStage: boolean;
    businessModel: boolean;
    targetMarket: boolean;
  };
  criteria?: Array<{
    id: string;
    category: string;
    field: string;
    operator: string;
    value: any;
    weight: number;
    isRequired: boolean;
    scoreIfMatch: number;
    scoreIfNoMatch: number;
    description?: string;
  }>;
  totalScrapes: number;
  successfulMatches: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateICPProfileRequest {
  name: string;
  description?: string;
  scoringMethod?:
    | "weighted_average"
    | "threshold_based"
    | "ai_powered"
    | "custom";
  minimumScore?: number;
  customPrompts?: {
    businessModel?: string;
    targetMarket?: string;
    companySize?: string;
    technology?: string;
    industry?: string;
    userRemarks?: string;
    customFields?: Array<{
      name: string;
      prompt: string;
      weight: number;
    }>;
  };
  requiredDataPoints?: {
    contactInfo: boolean;
    companySize: boolean;
    industry: boolean;
    revenue: boolean;
    location: boolean;
    technology: boolean;
    socialPresence: boolean;
    fundingStage: boolean;
    businessModel: boolean;
    targetMarket: boolean;
  };
  criteria?: Array<{
    category: string;
    field: string;
    operator: string;
    value: any;
    weight: number;
    isRequired: boolean;
    scoreIfMatch: number;
    scoreIfNoMatch: number;
    description?: string;
  }>;
}

export interface UpdateICPProfileRequest
  extends Partial<CreateICPProfileRequest> {
  status?: "active" | "inactive" | "draft" | "archived";
}

export interface ICPProfilesResponse {
  profiles: ICPProfile[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Custom error classes for better error handling
 */
export class ICPError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ICPError";
    this.status = status;
  }
}

export class ICPAuthError extends ICPError {
  constructor(message: string) {
    super(message, 401);
    this.name = "ICPAuthError";
  }
}

// Helper function to handle errors
const handleICPError = (error: unknown, defaultMessage: string): never => {
  console.error(defaultMessage, error);

  if (axios.isAxiosError(error)) {
    const axiosError = error;
    const status = axiosError.response?.status;
    const errorMessage =
      (axiosError.response?.data as any)?.message ||
      (axiosError.response?.data as any)?.error ||
      axiosError.message;

    if (status === 401) {
      throw new ICPAuthError(
        errorMessage || "Authentication required. Please sign in to continue."
      );
    } else {
      throw new ICPError(errorMessage || defaultMessage, status);
    }
  }

  throw new ICPError(defaultMessage);
};

/**
 * Get all ICP profiles for the current user
 */
export const getICPProfiles = async (
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<ICPProfilesResponse> => {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    // Add cache-busting parameter to force fresh response
    params.append("_t", Date.now().toString());

    const url = `/icp-management/profiles?${params.toString()}`;

    const response = await apiClient.get(url);

    // The server wraps responses in { status, message, payload } format
    // The ICP data is nested at payload.data
    return response.data.payload.data;
  } catch (error: unknown) {
    console.error("🚨 API Error in getICPProfiles:", error);
    return handleICPError(error, "Failed to fetch ICP profiles");
  }
};

/**
 * Get a specific ICP profile by ID
 */
export const getICPProfile = async (id: string): Promise<ICPProfile> => {
  try {
    const response = await apiClient.get(`/icp-management/profiles/${id}`);
    return response.data.data;
  } catch (error: unknown) {
    return handleICPError(error, "Failed to fetch ICP profile");
  }
};

/**
 * Create a new ICP profile
 */
export const createICPProfile = async (
  profileData: CreateICPProfileRequest
): Promise<ICPProfile> => {
  try {
    const response = await apiClient.post(
      "/icp-management/profiles",
      profileData
    );
    return response.data.data;
  } catch (error: unknown) {
    return handleICPError(error, "Failed to create ICP profile");
  }
};

/**
 * Update an existing ICP profile
 */
export const updateICPProfile = async (
  id: string,
  profileData: UpdateICPProfileRequest
): Promise<ICPProfile> => {
  try {
    const response = await apiClient.put(
      `/icp-management/profiles/${id}`,
      profileData
    );
    return response.data.payload.data;
  } catch (error: unknown) {
    return handleICPError(error, "Failed to update ICP profile");
  }
};

/**
 * Delete an ICP profile
 */
export const deleteICPProfile = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/icp-management/profiles/${id}`);
  } catch (error: unknown) {
    return handleICPError(error, "Failed to delete ICP profile");
  }
};

/**
 * Activate an ICP profile
 */
export const activateICPProfile = async (id: string): Promise<ICPProfile> => {
  try {
    const response = await apiClient.patch(
      `/icp-management/profiles/${id}/activate`
    );
    return response.data.payload.data;
  } catch (error: unknown) {
    return handleICPError(error, "Failed to activate ICP profile");
  }
};

/**
 * Deactivate an ICP profile
 */
export const deactivateICPProfile = async (id: string): Promise<ICPProfile> => {
  try {
    const response = await apiClient.patch(
      `/icp-management/profiles/${id}/deactivate`
    );
    return response.data.payload.data;
  } catch (error: unknown) {
    return handleICPError(error, "Failed to deactivate ICP profile");
  }
};

/**
 * Scrape a URL using an ICP profile
 */
export const scrapeUrlWithICP = async (
  url: string,
  icpProfileId: string
): Promise<any> => {
  try {
    // Convert icpProfileId to number for backend validation
    const profileId = parseInt(icpProfileId, 10);
    if (isNaN(profileId)) {
      throw new Error("Invalid ICP profile ID");
    }

    const response = await apiClient.post("/icp-scraper", {
      url,
      icpProfileId: profileId,
    });
    return response.data.data;
  } catch (error: unknown) {
    return handleICPError(error, "Failed to scrape with ICP profile");
  }
};
