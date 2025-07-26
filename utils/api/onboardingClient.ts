import axios from "axios";

import { tokenStorage } from "../auth/tokenStorage";

// Create a simple axios instance for onboarding
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const onboardingApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor to add auth headers
onboardingApiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types for onboarding data
export interface OnboardingOptions {
  companySizes: string[];
  industries: string[];
  useCases: string[];
  hearAboutUsOptions: string[];
}

export interface OnboardingStep1Data {
  company: string;
  jobTitle: string;
  industry: string;
  companySize: string;
  companyWebsite?: string;
  phoneNumber?: string;
}

export interface OnboardingStep2Data {
  useCase: string;
  businessGoals: string;
  hearAboutUs: string;
}

export interface CompleteOnboardingData
  extends OnboardingStep1Data,
    OnboardingStep2Data {}

export interface OnboardingResponse {
  message: string;
  nextStep?: number;
  redirectTo?: string;
  onboardingCompleted?: boolean;
}

/**
 * Get onboarding form options
 */
export const getOnboardingOptions = async (): Promise<{
  payload: OnboardingOptions;
}> => {
  try {
    const response = await onboardingApiClient.get("/onboarding/options");
    return response.data.payload;
  } catch (error: unknown) {
    console.error("Get onboarding options error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to load onboarding options"
      );
    }
    throw error;
  }
};

/**
 * Save onboarding step 1 data
 */
export const saveOnboardingStep1 = async (
  data: OnboardingStep1Data
): Promise<OnboardingResponse> => {
  try {
    const response = await onboardingApiClient.post("/onboarding/step/1", data);
    return response.data.payload;
  } catch (error: unknown) {
    console.error("Save onboarding step 1 error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to save step 1 data"
      );
    }
    throw error;
  }
};

/**
 * Save onboarding step 2 data
 */
export const saveOnboardingStep2 = async (
  data: OnboardingStep2Data
): Promise<OnboardingResponse> => {
  try {
    const response = await onboardingApiClient.post("/onboarding/step/2", data);
    return response.data.payload;
  } catch (error: unknown) {
    console.error("Save onboarding step 2 error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to save step 2 data"
      );
    }
    throw error;
  }
};

/**
 * Complete onboarding process
 */
export const completeOnboarding = async (
  data: CompleteOnboardingData
): Promise<OnboardingResponse> => {
  try {
    const response = await onboardingApiClient.post(
      "/onboarding/complete",
      data
    );
    return response.data.payload;
  } catch (error: unknown) {
    console.error("Complete onboarding error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to complete onboarding"
      );
    }
    throw error;
  }
};

/**
 * Skip onboarding process
 */
export const skipOnboarding = async (): Promise<OnboardingResponse> => {
  try {
    const response = await onboardingApiClient.post("/onboarding/skip");
    return response.data.payload;
  } catch (error: unknown) {
    console.error("Skip onboarding error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to skip onboarding"
      );
    }
    throw error;
  }
};
