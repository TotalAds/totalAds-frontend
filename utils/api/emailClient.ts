/**
 * Email Service API Client
 * Handles all email service API calls (domains, campaigns, analytics, credits)
 */

import axios, { AxiosError } from 'axios';

import { tokenStorage } from '../auth/tokenStorage';

// API base URL for token refresh
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Email service base URL
const EMAIL_SERVICE_URL =
  process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";

// Create axios instance for email service
const emailClient = axios.create({
  baseURL: EMAIL_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 120000, // 120 second timeout
});

// CSRF token cache (valid for current session)
let csrfToken: string | null = null;
let csrfTokenFetchPromise: Promise<string | null> | null = null;

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];
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

const ensureCsrfToken = async (): Promise<string | null> => {
  try {
    if (csrfToken) return csrfToken;

    // Prevent multiple concurrent CSRF token fetches
    if (csrfTokenFetchPromise) {
      return csrfTokenFetchPromise;
    }

    // Fetch a fresh CSRF token using axios directly to avoid interceptor loop
    const accessToken = tokenStorage.getAccessToken();
    csrfTokenFetchPromise = axios
      .get(`${EMAIL_SERVICE_URL}/api/csrf-token`, {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
        withCredentials: true,
      })
      .then((resp) => {
        csrfToken = resp.data?.data?.csrfToken || null;
        csrfTokenFetchPromise = null;
        return csrfToken;
      })
      .catch((e) => {
        csrfTokenFetchPromise = null;
        // If we can't get CSRF, we still proceed; server will reject unsafe methods
        console.warn("Failed to fetch CSRF token:", e.message);
        return null;
      });

    return csrfTokenFetchPromise;
  } catch (e) {
    // If we can't get CSRF, we still proceed; server will reject unsafe methods
    console.warn("CSRF token error:", e);
    return null;
  }
};

// Request interceptor to add auth headers and CSRF for unsafe methods
emailClient.interceptors.request.use(
  async (config) => {
    // Add access token to Authorization header if available
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add CSRF token for state-changing requests
    const method = (config.method || "GET").toUpperCase();
    const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (needsCsrf && !config.headers["X-CSRF-Token"]) {
      const token = await ensureCsrfToken();
      if (token) {
        config.headers["X-CSRF-Token"] = token;
      }
    }

    // Add request timestamp for debugging
    (config as any).metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error("Email service request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
emailClient.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === "development") {
      const duration =
        new Date().getTime() -
        (response.config as any).metadata?.startTime?.getTime();
      console.log(
        `✅ Email Service: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${response.status} (${duration}ms)`
      );
    }

    // Reset refresh attempts on successful response
    refreshAttempts = 0;

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      const duration = (error.config as any)?.metadata?.startTime
        ? new Date().getTime() -
          (error.config as any).metadata.startTime.getTime()
        : 0;
      console.error(
        `❌ Email Service: ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        } - ${error.response?.status || "Network Error"} (${duration}ms)`
      );
    }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if we've exceeded max refresh attempts
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.log(
          "Email service authentication failed. Redirecting to login..."
        );
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
            return emailClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      refreshAttempts++;

      try {
        // Attempt to refresh the token using the main API
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        const { accessToken, expiresIn } = refreshResponse.data.payload;

        // Store the new access token
        tokenStorage.setTokens(accessToken, expiresIn);

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Reset refresh attempts on success
        refreshAttempts = 0;

        // Process the queue with the new token
        processQueue(null, accessToken);

        // Retry the original request
        return emailClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        console.log("Email service token refresh failed:", refreshError);
        processQueue(refreshError, null);
        tokenStorage.removeTokens();

        if (typeof window !== "undefined") {
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/signup") &&
            !window.location.pathname.includes("/forgot-password") &&
            !window.location.pathname.includes("/reset-password")
          ) {
            console.log(
              "Email service token refresh failed, redirecting to login..."
            );
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 errors - forbidden
    if (error.response?.status === 403) {
      console.log("Email service access forbidden");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// ============ DOMAINS API ============

export interface Domain {
  id: string;
  domain: string;
  verificationStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getDomains = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  data: {
    domains: Domain[];
    pagination: { page: number; limit: number; total: number };
  };
}> => {
  try {
    const response = await emailClient.get("/api/domains", {
      params: { page, limit },
    });
    return response.data || { data: [], total: 0, page };
  } catch (error: any) {
    console.error("Failed to fetch domains:", error);
    throw error;
  }
};

export const getDomainById = async (domainId: string): Promise<Domain> => {
  try {
    const response = await emailClient.get(`/api/domains/${domainId}`);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to fetch domain:", error);
    throw error;
  }
};

export const createDomain = async (domainData: {
  domain: string;
}): Promise<Domain> => {
  try {
    const response = await emailClient.post("/api/domains", domainData);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to create domain:", error);
    throw error;
  }
};

export const verifyDomain = async (domainId: string): Promise<Domain> => {
  try {
    const response = await emailClient.post(`/api/domains/${domainId}/verify`);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to verify domain:", error);
    throw error;
  }
};

export const deleteDomain = async (domainId: string): Promise<void> => {
  try {
    await emailClient.delete(`/api/domains/${domainId}`);
  } catch (error: any) {
    console.error("Failed to delete domain:", error);
    throw error;
  }
};

// ============ CAMPAIGNS API ============

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  domainId: string;
  createdAt: string;
  updatedAt: string;
}

export const getCampaigns = async (
  domainId: string,
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<{ data: Campaign[]; total: number; page: number }> => {
  try {
    const response = await emailClient.get(
      `/api/domains/${domainId}/campaigns`,
      {
        params: { page, limit, ...(status && { status }) },
      }
    );
    return response.data || { data: [], total: 0, page };
  } catch (error: any) {
    console.error("Failed to fetch campaigns:", error);
    throw error;
  }
};

export const getCampaignById = async (
  domainId: string,
  campaignId: string
): Promise<Campaign> => {
  try {
    const response = await emailClient.get(
      `/api/domains/${domainId}/campaigns/${campaignId}`
    );
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to fetch campaign:", error);
    throw error;
  }
};

export const createCampaign = async (
  domainId: string,
  campaignData: any
): Promise<Campaign> => {
  try {
    const response = await emailClient.post(
      `/api/domains/${domainId}/campaigns`,
      campaignData
    );
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to create campaign:", error);
    throw error;
  }
};

export const updateCampaign = async (
  domainId: string,
  campaignId: string,
  campaignData: any
): Promise<Campaign> => {
  try {
    const response = await emailClient.put(
      `/api/domains/${domainId}/campaigns/${campaignId}`,
      campaignData
    );
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to update campaign:", error);
    throw error;
  }
};

export const deleteCampaign = async (
  domainId: string,
  campaignId: string
): Promise<void> => {
  try {
    await emailClient.delete(
      `/api/domains/${domainId}/campaigns/${campaignId}`
    );
  } catch (error: any) {
    console.error("Failed to delete campaign:", error);
    throw error;
  }
};

export const startCampaign = async (
  domainId: string,
  campaignId: string,
  leadIds: string[]
): Promise<any> => {
  try {
    const response = await emailClient.post(
      `/api/domains/${domainId}/campaigns/${campaignId}/start`,
      { leadIds }
    );
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to start campaign:", error);
    throw error;
  }
};

// ============ ANALYTICS API ============

export interface Analytics {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}

export const getAnalytics = async (): Promise<Analytics> => {
  try {
    const response = await emailClient.get("/api/analytics/summary");
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to fetch analytics:", error);
    throw error;
  }
};

export const getCampaignAnalytics = async (
  campaignId: string
): Promise<Analytics> => {
  try {
    const response = await emailClient.get(
      `/api/analytics/campaigns/${campaignId}`
    );
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to fetch campaign analytics:", error);
    throw error;
  }
};

// ============ CREDITS API ============

export interface Credits {
  balance: number;
  used: number;
  total: number;
}

export const getCredits = async (): Promise<Credits> => {
  try {
    const response = await emailClient.get("/api/credits/balance");
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to fetch credits:", error);
    throw error;
  }
};

export const purchaseCredits = async (amount: number): Promise<any> => {
  try {
    const response = await emailClient.post("/api/credits/purchase", {
      amount,
    });
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to purchase credits:", error);
    throw error;
  }
};

export default emailClient;
