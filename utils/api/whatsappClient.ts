/**
 * WhatsApp Service API Client
 * Handles all WhatsApp service API calls
 */

import axios, { AxiosError } from "axios";

import { refreshAccessToken } from "../auth/refreshAccessToken";
import { tokenStorage } from "../auth/tokenStorage";

// WhatsApp service base URL
const WHATSAPP_SERVICE_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_SERVICE_URL || "http://localhost:3004";

// Create axios instance for WhatsApp service
const whatsappClient = axios.create({
  baseURL: WHATSAPP_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 120000, // 120 second timeout
});

// Request interceptor to add auth headers
whatsappClient.interceptors.request.use(
  async (config) => {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: refresh access token on 401 (same pattern as api/email clients)
whatsappClient.interceptors.response.use(
  (response) => {
    refreshAttempts = 0;
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      tokenStorage.removeTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(
        new Error("Authentication failed. Please sign in again.")
      );
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return whatsappClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;
    refreshAttempts++;

    try {
      const accessToken = await refreshAccessToken();
      processQueue(null, accessToken);
      refreshAttempts = 0;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return whatsappClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.removeTokens();
      if (typeof window !== "undefined") {
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/signup")
        ) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Types
export interface WhatsAppCampaign {
  id: string;
  campaignId: string;
  campaignName: string;
  templateName: string;
  templateLanguage: string;
  templateCategory: "UTILITY" | "MARKETING" | "AUTH";
  totalRecords: number;
  status: "draft" | "scheduled" | "running" | "paused" | "completed" | "failed" | "cancelled";
  campaignStatus: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  templateId: string;
  templateName: string;
  category: string;
  templateCategory: "UTILITY" | "MARKETING" | "AUTH";
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  components: any;
}

export interface WhatsAppContact {
  id: string;
  phoneNumber: string;
  name?: string;
  tags?: string[];
  category?: string;
  optOut: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConversation {
  id: string;
  contactPhoneNumber: string;
  status: "open" | "closed";
  conversationType: "user_initiated" | "business_initiated";
  lastMessageAt: string;
  isWithin24HourWindow: boolean;
  unreadCount: number;
}

export interface WhatsAppMessage {
  id: string;
  messageId: string;
  direction: "inbound" | "outbound";
  type: string;
  content: any;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  sentAt: string;
}

// Campaign APIs
export const getCampaigns = async (
  phoneNumberId: string,
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append("search", search);

  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      campaigns: WhatsAppCampaign[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }>(`/api/v1/campaign?${params.toString()}`);

  return {
    data: response.data.data.campaigns,
    total: response.data.data.pagination.total,
    page: response.data.data.pagination.page,
    totalPages: response.data.data.pagination.totalPages,
  };
};

export const getCampaign = async (campaignId: string) => {
  const response = await whatsappClient.get<{
    success: boolean;
    data: WhatsAppCampaign;
  }>(`/api/v1/campaign/${campaignId}`);
  return response.data.data;
};

export const validateCampaign = async (csvData: any[]) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: {
      valid: boolean;
      totalRecords: number;
      validRecords: number;
      invalidRecords: number;
      errors: Array<{ row: number; phoneNumber?: string; error: string }>;
      sampleData?: any[];
    };
  }>("/api/v1/campaign/validate", { csvData });
  return response.data.data;
};

export const runCampaign = async (data: {
  campaignName: string;
  templateName: string;
  templateLanguage: string;
  csvData: any[];
}) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: {
      campaignId: string;
      id: string;
      status: string;
      totalRecords: number;
      message: string;
    };
  }>("/api/v1/campaign/run", data);
  return response.data.data;
};

export const pauseCampaign = async (campaignId: string) => {
  const response = await whatsappClient.patch<{
    success: boolean;
    data: { campaignId: string; status: string; message: string };
  }>(`/api/v1/campaign/${campaignId}/pause`);
  return response.data.data;
};

export const resumeCampaign = async (campaignId: string) => {
  const response = await whatsappClient.patch<{
    success: boolean;
    data: { campaignId: string; status: string; message: string };
  }>(`/api/v1/campaign/${campaignId}/resume`);
  return response.data.data;
};

export const deleteCampaign = async (campaignId: string) => {
  await whatsappClient.delete(`/api/v1/campaign/${campaignId}`);
};

// Template APIs
export const getTemplates = async (
  phoneNumberId: string,
  status?: "APPROVED" | "PENDING" | "REJECTED"
) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);

  const response = await whatsappClient.get<{
    success: boolean;
    data: { templates: WhatsAppTemplate[] };
  }>(`/api/v1/template?${params.toString()}`);
  return response.data.data.templates;
};

export const syncTemplates = async (phoneNumberId: string) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: {
      synced: number;
      updated: number;
      total: number;
      errors?: string[];
    };
  }>("/api/v1/template/sync");
  return response.data.data;
};

export const createTemplate = async (data: {
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  components?: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
    format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
    text?: string;
    buttons?: Array<{
      type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
}) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: WhatsAppTemplate;
    message: string;
  }>("/api/v1/template", data);
  return response.data;
};

export const getTemplateReference = async (
  phoneNumberId: string,
  templateName: string
) => {
  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      templateName: string;
      variables: string[];
      sampleData: any;
      csvHeaders: string[];
    };
  }>(`/api/v1/template/reference/${templateName}`);
  return response.data.data;
};

// Contact APIs
export const getContacts = async (
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append("search", search);

  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      contacts: WhatsAppContact[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }>(`/api/v1/contact?${params.toString()}`);
  return {
    data: response.data.data.contacts,
    total: response.data.data.pagination.total,
    page: response.data.data.pagination.page,
    totalPages: response.data.data.pagination.totalPages,
  };
};

export const getContact = async (contactId: string) => {
  const response = await whatsappClient.get<{
    success: boolean;
    data: WhatsAppContact;
  }>(`/api/v1/contact/${contactId}`);
  return response.data.data;
};

export const createContact = async (data: {
  phoneNumber: string;
  name?: string;
  tags?: string[];
  category?: string;
}) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: WhatsAppContact;
  }>("/api/v1/contact", data);
  return response.data.data;
};

export const updateContact = async (
  contactId: string,
  data: {
    name?: string;
    tags?: string[];
    category?: string;
  }
) => {
  const response = await whatsappClient.put<{
    success: boolean;
    data: WhatsAppContact;
  }>(`/api/v1/contact/${contactId}`, data);
  return response.data.data;
};

export const deleteContact = async (contactId: string) => {
  await whatsappClient.delete(`/api/v1/contact/${contactId}`);
};

export const optOutContact = async (contactId: string, reason?: string) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: { id: string; phoneNumber: string; optOut: boolean };
  }>(`/api/v1/contact/${contactId}/opt-out`, { reason });
  return response.data.data;
};

// Chat/Conversation APIs
export const getConversations = async (
  phoneNumberId: string,
  page: number = 1,
  limit: number = 10,
  status?: "open" | "closed"
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (status) params.append("status", status);

  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      conversations: WhatsAppConversation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }>(`/api/v1/chat/conversations?${params.toString()}`);
  return {
    data: response.data.data.conversations,
    total: response.data.data.pagination.total,
    page: response.data.data.pagination.page,
    totalPages: response.data.data.pagination.totalPages,
  };
};

export const getConversation = async (conversationId: string) => {
  const response = await whatsappClient.get<{
    success: boolean;
    data: WhatsAppConversation;
  }>(`/api/v1/chat/conversations/${conversationId}`);
  return response.data.data;
};

export const getMessages = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      messages: WhatsAppMessage[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }>(`/api/v1/chat/conversations/${conversationId}/messages?${params.toString()}`);
  return {
    data: response.data.data.messages,
    total: response.data.data.pagination.total,
    page: response.data.data.pagination.page,
    totalPages: response.data.data.pagination.totalPages,
  };
};

export const sendMessage = async (
  conversationId: string,
  data: {
    to: string;
    type: "text" | "template";
    message?: string;
    templateName?: string;
    templateLanguage?: string;
    templateVariables?: any;
  }
) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: {
      id: string;
      messageId: string;
      status: string;
      sentAt: string;
    };
  }>(`/api/v1/chat/conversations/${conversationId}/messages`, data);
  return response.data.data;
};

export const markAsRead = async (conversationId: string) => {
  const response = await whatsappClient.patch<{
    success: boolean;
    data: { id: string; unreadCount: number; message: string };
  }>(`/api/v1/chat/conversations/${conversationId}/read`);
  return response.data.data;
};

export const closeConversation = async (conversationId: string) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: { id: string; status: string; message: string };
  }>(`/api/v1/chat/conversations/${conversationId}/close`);
  return response.data.data;
};

// Analytics APIs
export const getDashboardAnalytics = async (
  phoneNumberId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate.toISOString());
  if (endDate) params.append("endDate", endDate.toISOString());

  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      totalCampaigns: number;
      dateRange: { start: string; end: string };
      statistics: {
        totalSent: number;
        totalDelivered: number;
        totalRead: number;
        totalFailed: number;
        deliveryRate: number;
        readRate: number;
        failureRate: number;
      };
    };
  }>(`/api/v1/analytics/dashboard?${params.toString()}`);
  return response.data.data;
};

export const getCampaignAnalytics = async (campaignId: string) => {
  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      campaign: {
        id: string;
        name: string;
        templateName: string;
        status: string;
        totalRecords: number;
      };
      summary: {
        totalSent: number;
        totalDelivered: number;
        totalRead: number;
        totalFailed: number;
        totalPending: number;
      };
      rates: {
        deliveryRate: number;
        readRate: number;
        failureRate: number;
      };
      statusBreakdown: {
        sent: number;
        delivered: number;
        read: number;
        failed: number;
        pending: number;
      };
    };
  }>(`/api/v1/analytics/campaign/${campaignId}`);
  return response.data.data;
};

// Reputation Metrics API
export const getReputationMetrics = async () => {
  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      phoneNumberId: string;
      warmup: {
        stage: string;
        day: number;
        maxDailySend: number;
        warmupStartDate?: string;
        schedule: any;
        nextMilestone: string;
        nextMilestoneDay: number;
        messagesUntilNextMilestone: number;
        progress: number;
      };
      quality: {
        rating: string;
        score: number;
        banStatus: string;
        qualityGuardStatus: string;
        qualityGuardLastChecked?: string;
      };
      messageLimits: {
        daily: number;
        last24Hours: number;
        last7Days: number;
        last30Days: number;
        totalVolume: number;
        metaLimit?: number;
      };
      metrics: {
        deliveryRate: number;
        readRate: number;
        replyRate: number;
        blockRate: number;
        spamRate: number;
        complaintRate: number;
        optOutRate: number;
      };
      autoPausedCampaigns: any[];
      lastUpdated: string;
    };
  }>("/api/v1/analytics/reputation");
  return response.data.data;
};

// Cost Tracking API
export const getCostTracking = async (
  startDate?: Date,
  endDate?: Date
) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate.toISOString());
  if (endDate) params.append("endDate", endDate.toISOString());

  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      summary: {
        totalSpent: number;
        totalMessages: number;
        avgCostPerMessage: number;
        currency: string;
        dateRange: { start: string; end: string };
      };
      breakdown: {
        byCategory: Record<string, number>;
        byConversationType: Record<string, number>;
        byPricingTier: Record<string, number>;
      };
      trends: {
        dailySpending: Array<{ date: string; amount: number }>;
      };
      topCampaigns: Array<{
        campaignId: string;
        campaignName: string;
        cost: number;
      }>;
      billingEvents: Array<{
        id: string;
        category: string;
        conversationType: string;
        cost: number;
        currency: string;
        pricingTier?: string;
        campaignId?: string;
        createdAt: string;
      }>;
    };
  }>(`/api/v1/analytics/cost-tracking?${params.toString()}`);
  return response.data.data;
};

// CSV Template Download
export const downloadCSVTemplate = async () => {
  const response = await whatsappClient.get("/api/v1/campaign/csv-template", {
    responseType: "blob",
  });
  
  // Create blob and download
  const blob = new Blob([response.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "whatsapp-campaign-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export Reputation Metrics
export const exportReputationMetrics = async (format: "csv" | "json" = "csv") => {
  const response = await whatsappClient.get(
    `/api/v1/analytics/reputation/export?format=${format}`,
    {
      responseType: "blob",
    }
  );

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers["content-disposition"];
  let filename = `reputation-metrics-${new Date().toISOString().split("T")[0]}.${format}`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  // Create blob and download
  const blob = new Blob([response.data], {
    type: format === "json" ? "application/json" : "text/csv",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Opt-in APIs
export const createOptinEvent = async (data: {
  phoneNumber: string;
  source: "website" | "form" | "crm" | "import" | "api" | "manual";
  proofText?: string;
  ipAddress?: string;
  userAgent?: string;
  consentMethod: "checkbox" | "button" | "sms" | "api" | "import" | "manual";
  metadata?: Record<string, any>;
}) => {
  const response = await whatsappClient.post<{
    success: boolean;
    data: {
      id: string;
      phoneNumber: string;
      source: string;
      consentTimestamp: string;
      verified: boolean;
    };
  }>("/api/v1/optin/record", data);
  return response.data.data;
};

export const getOptinEvent = async (contactId: string) => {
  const response = await whatsappClient.get<{
    success: boolean;
    data: {
      id: string;
      phoneNumber: string;
      source: string;
      proofText?: string;
      consentTimestamp: string;
      verified: boolean;
    };
  }>(`/api/v1/optin/${contactId}`);
  return response.data.data;
};

export default whatsappClient;

