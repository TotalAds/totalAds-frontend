/**
 * Email Service API Client
 * Handles all email service API calls (domains, campaigns, analytics, credits)
 */

import axios, { AxiosError } from "axios";

import { tokenStorage } from "../auth/tokenStorage";

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
  verificationStatus: "verified" | "pending";
  dkimStatus: "verified" | "pending";
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

export interface CampaignSequenceStep {
  subject: string;
  body: string;
  delayMinutes?: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject?: string;
  status: string;
  domainId: string;
  createdAt: string;
  updatedAt: string;
  sequence?: CampaignSequenceStep[];
  queuedForTodayCount?: number;
  scheduledForTomorrowCount?: number;
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

// ============ LEADS API ============

export interface Lead {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  tags?: string;
  category?: string;
  campaignId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const getLeads = async (
  page: number = 1,
  limit: number = 10,
  status?: string,
  tags?: string,
  category?: string,
  campaignId?: string,
  search?: string
): Promise<{ data: { leads: Lead[]; pagination: any } }> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);
    if (tags) params.append("tags", tags);
    if (category) params.append("category", category);
    if (campaignId) params.append("campaignId", campaignId);
    if (search) params.append("search", search);

    const response = await emailClient.get(`/api/leads?${params.toString()}`);
    return response.data || { data: { leads: [], pagination: {} } };
  } catch (error: any) {
    console.error("Failed to fetch leads:", error);
    throw error;
  }
};

export const getLeadById = async (leadId: string): Promise<Lead> => {
  try {
    const response = await emailClient.get(`/api/leads/${leadId}`);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to fetch lead:", error);
    throw error;
  }
};

export const createLead = async (leadData: any): Promise<Lead> => {
  try {
    const response = await emailClient.post("/api/leads", leadData);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to create lead:", error);
    throw error;
  }
};

export const updateLead = async (
  leadId: string,
  leadData: any
): Promise<Lead> => {
  try {
    const response = await emailClient.put(`/api/leads/${leadId}`, leadData);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to update lead:", error);
    throw error;
  }
};

export const deleteLead = async (leadId: string): Promise<void> => {
  try {
    await emailClient.delete(`/api/leads/${leadId}`);
  } catch (error: any) {
    console.error("Failed to delete lead:", error);
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

// ============ REPUTATION (QUOTA) API ============

export interface ReputationStatus {
  allowed: boolean;
  cap: number;
  remaining: number;
  used: number;
  resetAt: string;
  override?: number | null;
}

export type QuotaCardData = ReputationStatus;

export const getReputationStatus = async (): Promise<ReputationStatus> => {
  try {
    const response = await emailClient.get(`/api/reputation/me`);
    const data = response.data || {};
    return {
      allowed: !!data.allowed,
      cap: Number(data.cap || 0),
      remaining: Number(data.remaining || 0),
      used: Number(data.used || 0),
      resetAt: data.resetAt || new Date().toISOString(),
      override: data.override ?? null,
    };
  } catch (error: any) {
    console.error("Failed to fetch reputation status:", error);
    throw error;
  }
};

export const getQuotaCardData = async (): Promise<QuotaCardData> => {
  try {
    const resp = await emailClient.get(`/api/reputation/quota-card`);
    const d = resp.data?.data || resp.data || {};
    return {
      allowed: !!d.allowed,
      cap: Number(d.cap || 0),
      remaining: Number(d.remaining || 0),
      used: Number(d.used || 0),
      resetAt: d.resetAt || new Date().toISOString(),
      override: d.override ?? null,
    };
  } catch (error: any) {
    console.error("Failed to fetch quota card data:", error);
    throw error;
  }
};

// ============ SUBSCRIPTION INFO ==========
export interface SubscriptionInfo {
  tierName: string;
  tierDisplayName: string;
  monthlyEmailLimit: number;
  monthlyCredits: number;
  monthlyAllocated: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  dailyCap: number;
  dailyRemaining: number;
  dailyResetAt: string;
  status?: "active" | "paused" | "cancelled" | "expired" | "trial" | string;
}

export const getSubscriptionInfo = async (): Promise<SubscriptionInfo> => {
  try {
    const resp = await emailClient.get(`/api/payment/subscription/me`);
    const d = resp.data?.data || resp.data || {};
    const tier = d.tier || {};
    const credits = d.credits || {};
    const quota = d.quota || {};
    const subscription = d.subscription || {};
    return {
      tierName: tier.name || d.tierName || "free_trial",
      tierDisplayName:
        tier.displayName || d.tierDisplayName || tier.name || "Free Trial",
      monthlyEmailLimit: Number(
        tier.monthlyEmailLimit ?? d.monthlyEmailLimit ?? 0
      ),
      monthlyCredits: Number(tier.monthlyCredits ?? d.monthlyCredits ?? 0),
      monthlyAllocated: Number(
        credits.allocated ?? credits.allocatedCredits ?? d.monthlyAllocated ?? 0
      ),
      monthlyUsed: Number(
        credits.used ?? credits.usedCredits ?? d.monthlyUsed ?? 0
      ),
      monthlyRemaining: Number(
        credits.remaining ?? credits.remainingCredits ?? d.monthlyRemaining ?? 0
      ),
      dailyCap: Number(quota.cap ?? d.dailyCap ?? 0),
      dailyRemaining: Number(quota.remaining ?? d.dailyRemaining ?? 0),
      dailyResetAt: quota.resetAt || d.dailyResetAt || new Date().toISOString(),
      status: subscription.status || d.subscription?.status,
    };
  } catch (error: any) {
    console.error("Failed to fetch subscription info:", error);
    throw error;
  }
};

export interface ContactMetrics {
  tier: {
    id: string;
    name: string;
    displayName: string;
    monthlyEmailLimit: number;
    monthlyCredits: number;
  } | null;
  contacts: {
    total: number;
    limit: number;
  };
  emails: {
    used: number;
    allocated: number;
    remaining: number;
  };
}

export const getContactMetrics = async (): Promise<ContactMetrics> => {
  try {
    const resp = await emailClient.get(`/api/payment/contact-metrics`);
    return (
      resp.data?.data || {
        tier: null,
        contacts: { total: 0, limit: 0 },
        emails: { used: 0, allocated: 0, remaining: 0 },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch contact metrics:", error);
    throw error;
  }
};

// Lead Categories
export interface LeadCategory {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

export const getLeadCategories = async (): Promise<LeadCategory[]> => {
  try {
    const resp = await emailClient.get(`/api/lead-categories`);
    return resp.data?.data || [];
  } catch (error: any) {
    console.error("Failed to fetch lead categories:", error);
    throw error;
  }
};

export const createLeadCategory = async (
  name: string
): Promise<LeadCategory> => {
  try {
    const resp = await emailClient.post(`/api/lead-categories`, { name });
    return resp.data?.data || { id: "", name };
  } catch (error: any) {
    console.error("Failed to create lead category:", error);
    throw error;
  }
};

// Lead Tags
export interface LeadTag {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

export const getLeadTags = async (): Promise<LeadTag[]> => {
  try {
    const resp = await emailClient.get(`/api/lead-tags`);
    return resp.data?.data || [];
  } catch (error: any) {
    console.error("Failed to fetch lead tags:", error);
    throw error;
  }
};

export const createLeadTag = async (name: string): Promise<LeadTag> => {
  try {
    const resp = await emailClient.post(`/api/lead-tags`, { name });
    return resp.data?.data || { id: "", name };
  } catch (error: any) {
    console.error("Failed to create lead tag:", error);
    throw error;
  }
};

export interface DailyCounterRow {
  date: string; // YYYY-MM-DD
  sentCount: number;
  bounceCount: number;
  complaintCount: number;
}

export const getDailyCounters = async (
  days: number = 7
): Promise<DailyCounterRow[]> => {
  try {
    const resp = await emailClient.get(`/api/reputation/daily-counters`, {
      params: { days },
    });
    return resp.data?.data || [];
  } catch (error: any) {
    console.error("Failed to fetch daily counters:", error);
    throw error;
  }
};

// Campaigns
export interface Campaign {
  id: string;
  name: string;
  status: string;
  totalLeads: number;
}

export const getUserCampaigns = async (): Promise<Campaign[]> => {
  try {
    const resp = await emailClient.get(`/api/leads/campaigns/list`);
    return resp.data?.data || [];
  } catch (error: any) {
    console.error("Failed to fetch campaigns:", error);
    throw error;
  }
};

export const startCampaignFromLeads = async (
  domainId: string,
  campaignData: {
    name: string;
    description?: string;
    sequence: any[];
    leadIds: string[];
    senderId: string;
  }
): Promise<any> => {
  try {
    const resp = await emailClient.post(
      `/api/domains/${domainId}/campaigns/send`,
      campaignData
    );
    return resp.data?.data || resp.data;
  } catch (error: any) {
    console.error("Failed to start campaign:", error);
    throw error;
  }
};

export interface CampaignEligibility {
  eligible: boolean;
  verifiedDomainCount: number;
  verifiedSenderCount: number;
}

export const getCampaignEligibility =
  async (): Promise<CampaignEligibility> => {
    try {
      const resp = await emailClient.get(`/api/eligibility/campaign`);
      return resp.data?.data || resp.data;
    } catch (error: any) {
      console.error("Failed to check campaign eligibility:", error);
      throw error;
    }
  };

// Enhanced Campaign Analytics Types
export interface TimeSeriesDataPoint {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
}

export interface EnhancedCampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    status: string;
    createdAt: string | null;
    startedAt: string | null;
    updatedAt: string | null;
  };
  summary: {
    totalLeads: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalFailed: number;
    totalComplained: number;
    totalUnsubscribed: number;
    pending: number;
    processing: number;
  };
  rates: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
    deliveryRate: number;
    unsubscribeRate: number;
    ctrRate: number;
  };
  timeSeries: TimeSeriesDataPoint[];
  appliedFilters: {
    dateRange: string;
    startDate?: string;
    endDate?: string;
    tagIds?: string[];
    categoryIds?: string[];
    statuses?: string[];
  };
}

export interface EnhancedAnalyticsFilters {
  dateRange?: "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
  tagIds?: string[];
  categoryIds?: string[];
  status?: string[];
}

export const getEnhancedCampaignAnalytics = async (
  campaignId: string,
  filters?: EnhancedAnalyticsFilters
): Promise<EnhancedCampaignAnalytics> => {
  try {
    const params = new URLSearchParams();
    if (filters?.dateRange) params.append("dateRange", filters.dateRange);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.tagIds) {
      filters.tagIds.forEach((id) => params.append("tagIds", id));
    }
    if (filters?.categoryIds) {
      filters.categoryIds.forEach((id) => params.append("categoryIds", id));
    }
    if (filters?.status) {
      filters.status.forEach((s) => params.append("status", s));
    }

    const queryString = params.toString();
    const url = `/api/analytics/campaigns/${campaignId}/analytics/enhanced${
      queryString ? `?${queryString}` : ""
    }`;
    const resp = await emailClient.get(url);
    return resp.data?.data || resp.data;
  } catch (error: any) {
    console.error("Failed to fetch enhanced campaign analytics:", error);
    throw error;
  }
};

// Reoon Verification Analytics
export interface ReoonVerificationAnalytics {
  used: boolean;
  totalVerified: number;
  breakdown: {
    valid: number;
    invalid: number;
    risky: number;
    catchAll: number;
    unknown: number;
  };
  percentages: {
    valid: number;
    invalid: number;
    risky: number;
    catchAll: number;
    unknown: number;
  };
  flags: {
    disposable: number;
    spamtrap: number;
    roleAccount: number;
    inboxFull: number;
    disabled: number;
    smtpConnectable: number;
    mxValid: number;
  };
  lastVerifiedAt: string | null;
  mode: string | null;
  creditsUsed: number;
}

export const getReoonVerificationAnalytics = async (
  campaignId: string
): Promise<ReoonVerificationAnalytics> => {
  try {
    const resp = await emailClient.get(
      `/api/analytics/campaigns/${campaignId}/analytics/reoon`
    );
    return resp.data?.data || resp.data;
  } catch (error: any) {
    console.error("Failed to fetch Reoon verification analytics:", error);
    throw error;
  }
};

// ============ LISTS API ============

export interface EmailList {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
  count?: number;
}

export const getLists = async (
  page: number = 1,
  limit: number = 50
): Promise<{
  data: {
    lists: EmailList[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}> => {
  try {
    const response = await emailClient.get("/api/lists", {
      params: { page, limit },
    });
    return response.data || { data: { lists: [], pagination: {} } };
  } catch (error: any) {
    console.error("Failed to fetch lists:", error);
    throw error;
  }
};

export const getListById = async (listId: string): Promise<EmailList> => {
  try {
    const response = await emailClient.get(`/api/lists/${listId}`);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to fetch list:", error);
    throw error;
  }
};

export const createList = async (listData: {
  name: string;
  description?: string;
}): Promise<EmailList> => {
  try {
    const response = await emailClient.post("/api/lists", listData);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to create list:", error);
    throw error;
  }
};

export const updateList = async (
  listId: string,
  listData: { name?: string; description?: string }
): Promise<EmailList> => {
  try {
    const response = await emailClient.put(`/api/lists/${listId}`, listData);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to update list:", error);
    throw error;
  }
};

export const deleteList = async (listId: string): Promise<void> => {
  try {
    await emailClient.delete(`/api/lists/${listId}`);
  } catch (error: any) {
    console.error("Failed to delete list:", error);
    throw error;
  }
};

export const addContactsToList = async (
  listId: string,
  leadIds: string[]
): Promise<{ added: number; skipped: number; total: number }> => {
  try {
    const response = await emailClient.post(`/api/lists/${listId}/contacts`, {
      leadIds,
    });
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to add contacts to list:", error);
    throw error;
  }
};

export const removeContactsFromList = async (
  listId: string,
  leadIds: string[]
): Promise<{ removed: number }> => {
  try {
    const response = await emailClient.delete(`/api/lists/${listId}/contacts`, {
      data: { leadIds },
    });
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Failed to remove contacts from list:", error);
    throw error;
  }
};

export const getListContacts = async (
  listId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  data: {
    contacts: Array<{
      id: string;
      email: string;
      name?: string;
      status: string;
      addedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}> => {
  try {
    const response = await emailClient.get(`/api/lists/${listId}/contacts`, {
      params: { page, limit },
    });
    return response.data || { data: { contacts: [], pagination: {} } };
  } catch (error: any) {
    console.error("Failed to fetch list contacts:", error);
    throw error;
  }
};

export const filterLeadsByCriteria = async (filters: {
  tagIds?: string[];
  categoryIds?: string[];
  campaignIds?: string[];
  statuses?: string[];
}): Promise<{ data: { leadIds: string[]; count: number; total: number } }> => {
  try {
    const response = await emailClient.post("/api/lists/filter-leads", filters);
    return response.data || { data: { leadIds: [], count: 0, total: 0 } };
  } catch (error: any) {
    console.error("Failed to filter leads:", error);
    throw error;
  }
};

export interface FilterOptions {
  categories: Array<{ id: string; name: string; color: string; count: number }>;
  tags: Array<{ id: string; name: string; color: string; count: number }>;
  campaigns: Array<{ id: string; name: string; count: number }>;
  statuses: Array<{ value: string; label: string; count: number }>;
}

export const getFilterOptions = async (filters?: {
  categoryIds?: string[];
  tagIds?: string[];
  campaignIds?: string[];
  statuses?: string[];
}): Promise<FilterOptions> => {
  try {
    const params = new URLSearchParams();
    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      params.append("categoryIds", filters.categoryIds.join(","));
    }
    if (filters?.tagIds && filters.tagIds.length > 0) {
      params.append("tagIds", filters.tagIds.join(","));
    }
    if (filters?.campaignIds && filters.campaignIds.length > 0) {
      params.append("campaignIds", filters.campaignIds.join(","));
    }
    if (filters?.statuses && filters.statuses.length > 0) {
      params.append("statuses", filters.statuses.join(","));
    }
    const response = await emailClient.get<{ data: FilterOptions }>(
      `/api/leads/filter-options?${params.toString()}`
    );
    return response.data?.data || {
      categories: [],
      tags: [],
      campaigns: [],
      statuses: [],
    };
  } catch (error: any) {
    console.error("Failed to fetch filter options:", error);
    throw error;
  }
};

/**
 * Bulk Upload Job API
 */

export interface BulkUploadJobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalRows: number;
  processedRows: number;
  progress: number;
  result?: {
    statistics?: {
      total: number;
      valid: number;
      invalid: number;
      duplicatesInBatch: number;
      duplicatesInDatabase: number;
      created: number;
      updated: number;
      skipped: number;
      invalidEmails: string[];
      duplicateEmails: string[];
    };
    leadIds?: string[];
  };
  error?: string;
  errorDetails?: any;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

/**
 * Create a bulk upload job
 */
export const createBulkUploadJob = async (
  csvData: Record<string, any>[],
  options?: {
    tags?: string[];
    categories?: string[];
    listIds?: string[];
  }
): Promise<{ jobId: string; status: string; totalRows: number }> => {
  try {
    const response = await emailClient.post<{
      success: boolean;
      data: {
        jobId: string;
        status: string;
        totalRows: number;
        message: string;
      };
    }>("/api/leads/bulk-upload", {
      csvData,
      tags: options?.tags || [],
      categories: options?.categories || [],
      listIds: options?.listIds || [],
    });
    return response.data.data;
  } catch (error: any) {
    console.error("Failed to create bulk upload job:", error);
    throw error;
  }
};

/**
 * Get bulk upload job status
 */
export const getBulkUploadJobStatus = async (
  jobId: string
): Promise<BulkUploadJobStatus> => {
  try {
    const response = await emailClient.get<{
      success: boolean;
      data: BulkUploadJobStatus;
    }>(`/api/leads/bulk-upload/${jobId}`);
    return response.data.data;
  } catch (error: any) {
    console.error("Failed to get bulk upload job status:", error);
    throw error;
  }
};

/**
 * Check for active bulk upload jobs for current user
 */
export const checkActiveBulkUploadJobs = async (): Promise<{
  hasActiveJobs: boolean;
  activeJobs: Array<{
    jobId: string;
    status: string;
    totalRows: number;
    processedRows: number;
    progress: number;
    createdAt: string;
  }>;
}> => {
  try {
    const response = await emailClient.get<{
      success: boolean;
      data: {
        hasActiveJobs: boolean;
        activeJobs: Array<{
          jobId: string;
          status: string;
          totalRows: number;
          processedRows: number;
          progress: number;
          createdAt: string;
        }>;
      };
    }>("/api/leads/bulk-upload/active");
    return response.data.data;
  } catch (error: any) {
    console.error("Failed to check active bulk upload jobs:", error);
    throw error;
  }
};

export default emailClient;
