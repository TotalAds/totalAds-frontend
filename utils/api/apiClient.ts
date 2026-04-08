"use client";

import axios from "axios";

import { refreshAccessToken } from "../auth/refreshAccessToken";
import { tokenStorage } from "../auth/tokenStorage";

// API base URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable cookies for all requests
  timeout: 120000, // 120 second timeout
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config) => {
    // Add access token to Authorization header if available
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add request timestamp for debugging
    (config as any).metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

// Track refresh attempts to prevent infinite loops
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

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

// Response interceptor to handle token refresh and common errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === "development") {
      const duration =
        new Date().getTime() -
        (response.config as any).metadata?.startTime?.getTime();
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${
          response.status
        } (${duration}ms)`
      );
    }

    // Reset refresh attempts on successful response
    refreshAttempts = 0;

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      const duration = (error.config as any)?.metadata?.startTime
        ? new Date().getTime() -
          (error.config as any).metadata.startTime.getTime()
        : 0;
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${
          error.response?.status || "Network Error"
        } (${duration}ms)`
      );
    }

    // Handle email verification required errors
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.code;
      if (errorCode === "EMAIL_NOT_VERIFIED") {
        // Don't redirect automatically, let the component handle it
        // The error will be caught by the calling component
        return Promise.reject(error);
      }
    }

    // Handle specific auth errors that require token clearing
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || "";

      // If we get "Invalid token type" error, it means we have a malformed token
      // Clear tokens and redirect to login
      if (
        errorMessage.includes("Invalid token type") ||
        errorMessage.includes("jwt malformed")
      ) {
        console.log("Session expired. Redirecting to login...");
        tokenStorage.removeTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(
          new Error("Your session has expired. Please sign in again.")
        );
      }
    }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints; surface original 401 errors (e.g., invalid credentials)
      const url: string = originalRequest?.url || "";
      const isAuthEndpoint =
        url.includes("/auth/login") ||
        url.includes("/auth/signup") ||
        url.includes("/auth/reset-password") ||
        url.includes("/auth/email-verification");

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // Even if there was no Authorization header (e.g., token expired and was cleared on client),
      // attempt a refresh once using the refreshToken httpOnly cookie. This prevents unwanted logouts
      // when the access token expires and the client no longer attaches it.

      // Check if we've exceeded max refresh attempts
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.log("Authentication failed. Redirecting to login...");
        tokenStorage.removeTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(
          new Error("Authentication failed. Please sign in again.")
        );
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      refreshAttempts++;

      try {
        const accessToken = await refreshAccessToken();

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Reset refresh attempts on success
        refreshAttempts = 0;

        // Process the queue with the new token
        processQueue(null, accessToken);

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        console.log("Token refresh failed:", refreshError);
        processQueue(refreshError, null);
        tokenStorage.removeTokens();

        if (typeof window !== "undefined") {
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/signup") &&
            !window.location.pathname.includes("/forgot-password") &&
            !window.location.pathname.includes("/reset-password")
          ) {
            console.log("Token refresh failed, redirecting to login...");
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error types
    if (error.response?.status === 403) {
      console.error(
        "Access forbidden:",
        error.response.data?.message || "Insufficient permissions"
      );
    } else if (error.response?.status === 429) {
      console.error(
        "Rate limit exceeded:",
        error.response.data?.message || "Too many requests"
      );
    } else if (error.response?.status >= 500) {
      console.error(
        "Server error:",
        error.response.data?.message || "Internal server error"
      );
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout:", error.message);
    } else if (!error.response) {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/** Email delivery provider (onboarding step 5). One-time choice. */
export type SesProvider = "leadsnipper_managed" | "custom";

export interface EmailProviderStatus {
  sesProvider: SesProvider | null;
  sesProviderSetAt: string | null;
}

/** GET /onboarding/email-provider - current user's email delivery mode */
export const getEmailProvider = async (): Promise<EmailProviderStatus> => {
  const res = await apiClient.get("/onboarding/email-provider");
  const data = res.data;
  // Backend shape: { status, message, payload: { success, payload: { sesProvider, sesProviderSetAt } } }
  const inner =
    data?.payload?.payload ??
    data?.payload ??
    data;
  return inner as EmailProviderStatus;
};

/** POST /onboarding/step/5 - set email delivery and mark onboarding complete */
export const setEmailProviderStep5 = async (
  sesProvider: SesProvider
): Promise<{ redirectTo: string; onboardingCompleted: boolean }> => {
  const res = await apiClient.post("/onboarding/step/5", { sesProvider });
  return res.data?.payload ?? res.data;
};
