"use client";

import axios, { AxiosError } from "axios";

import {
  ScrapeHistoryItem,
  ScrapeResult,
  ScraperHealth,
} from "@/components/scraper/utils/scraperTypes";

import apiClient from "./apiClient";

/**
 * API client for scraper service
 * Uses axios for API calls instead of Next.js API routes
 */

// Custom error classes for better error handling
export class ScraperError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ScraperError";
    this.status = status;
  }
}

export class ScraperAuthError extends ScraperError {
  constructor(message: string) {
    super(message, 401);
    this.name = "ScraperAuthError";
  }
}

export class ScraperCreditError extends ScraperError {
  constructor(message: string) {
    super(message, 402);
    this.name = "ScraperCreditError";
  }
}

export class WebsiteInactiveError extends ScraperError {
  details?: {
    url: string;
    statusCode?: number;
    error?: string;
    responseTime?: number;
  };

  constructor(message: string, details?: any) {
    super(message, 422);
    this.name = "WebsiteInactiveError";
    this.details = details;
  }
}

// Helper function to handle errors
const handleApiError = (error: unknown, defaultMessage: string): never => {
  console.error(defaultMessage, error);

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data as any;
    const errorMessage =
      responseData?.message || responseData?.error || axiosError.message;

    if (status === 401) {
      throw new ScraperAuthError(
        errorMessage || "Authentication required. Please sign in to continue."
      );
    } else if (status === 402) {
      throw new ScraperCreditError(
        errorMessage ||
          "Insufficient credits available. Please add credits to your account to continue."
      );
    } else if (status === 422 && responseData?.error === "WEBSITE_INACTIVE") {
      throw new WebsiteInactiveError(
        errorMessage || "The website appears to be inactive or unreachable.",
        responseData?.details
      );
    } else {
      throw new ScraperError(errorMessage || defaultMessage, status);
    }
  }

  throw new ScraperError(defaultMessage);
};
// Normalize various backend response shapes into the UI-friendly ScrapeResult
const normalizeScrapeResponse = (responseData: any): ScrapeResult => {
  const topLevelMeta = responseData?.meta || {};
  const payload = responseData?.data ?? responseData;
  const nestedMeta = payload?.meta || {};
  const combinedMeta = { ...topLevelMeta, ...nestedMeta };

  // Unwrap common nesting: { data: { extractedData, processingTime } }
  const candidate = payload?.data ?? payload;
  const ed = candidate?.extractedData ?? null;

  // If extractedData present, map it into legacy/UI shape
  if (ed) {
    const industryList =
      typeof ed.industry === "string"
        ? ed.industry
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : Array.isArray(ed.industry)
        ? ed.industry
        : undefined;
    const targetMarketList =
      typeof ed.targetMarket === "string"
        ? ed.targetMarket
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : Array.isArray(ed.targetMarket)
        ? ed.targetMarket
        : undefined;

    const social = ed.socialPresence || {};

    const data = {
      title: ed.title || candidate.title,
      desc: ed.description || candidate.description || candidate.desc,
      nestedLinks: ed.nestedLinks || candidate.nestedLinks || [],
      text: candidate.text || undefined,
      contactDetails: {
        email: ed.contactInfo?.email
          ? Array.isArray(ed.contactInfo.email)
            ? ed.contactInfo.email
            : [ed.contactInfo.email]
          : undefined,
        phone: ed.contactInfo?.phone
          ? Array.isArray(ed.contactInfo.phone)
            ? ed.contactInfo.phone
            : [ed.contactInfo.phone]
          : undefined,
        address: Array.isArray(ed.contactInfo?.addresses)
          ? ed.contactInfo.addresses.join(", ")
          : (ed.contactInfo?.addresses as any),
        social_media: Object.fromEntries(
          Object.entries(social).filter(([, v]) => Boolean(v)) as [
            string,
            string
          ][]
        ),
      },
      aboutData: {
        companyDescription: ed.companyDescription || undefined,
        industries: industryList,
        keyPoints: [
          ...(ed.insights?.strengths || []),
          ...(ed.insights?.opportunities || []),
        ].slice(0, 8),
      },
      businessIntelligence: {
        industry: industryList,
        businessModel: ed.businessModel || undefined,
        targetMarket: targetMarketList,
        keyServices: ed.service || undefined,
        competitiveAdvantages: ed.insights?.strengths || undefined,
        fundingStage: ed.fundingStage || undefined,
        revenue: ed.monthlyRevenue || ed.revenue || undefined,
        employeeCount: ed.companySize || undefined,
        socialPresence: {
          platforms: Object.keys(social).filter((k) => (social as any)[k]),
        },
      },
      processingTime: candidate.processingTime || responseData?.processingTime,
      aiEnhanced: Boolean(combinedMeta?.icpEnhanced),
    } as ScrapeResult["data"];

    return {
      success: responseData?.success ?? true,
      data,
      meta: combinedMeta,
    } as ScrapeResult;
  }

  // Fallback: assume candidate already matches expected data shape
  return {
    success: responseData?.success ?? true,
    data: candidate as ScrapeResult["data"],
    meta: combinedMeta,
  } as ScrapeResult;
};
// Deeper unwrapping to handle nested { payload: { data: { payload: ... } } } formats
const normalizeScrapeResponseDeep = (responseData: any): ScrapeResult => {
  // helper to merge meta across layers
  const mergedMeta: Record<string, any> = {};
  const mergeMeta = (obj: any) => {
    if (
      obj &&
      typeof obj === "object" &&
      obj.meta &&
      typeof obj.meta === "object"
    ) {
      Object.assign(mergedMeta, obj.meta);
    }
  };

  // unwrap recursively across data/payload keys
  let current: any = responseData;
  mergeMeta(current);
  for (let i = 0; i < 6; i++) {
    if (current && typeof current === "object") {
      if (current.data && typeof current.data === "object") {
        current = current.data;
        mergeMeta(current);
        continue;
      }
      if (current.payload && typeof current.payload === "object") {
        current = current.payload;
        mergeMeta(current);
        continue;
      }
    }
    break;
  }

  const candidate = current;
  const ed = candidate?.extractedData ?? null;

  // Reuse mapping from the simpler normalizer
  if (ed) {
    const toList = (val: any): string[] | undefined => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val as string[];
      if (typeof val === "string")
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return undefined;
    };

    const industryList = toList(ed.industry);
    const targetMarketList = toList(ed.targetMarket);
    const servicesList = toList(ed.service);
    const social = ed.socialPresence || {};

    const data = {
      title: ed.title || candidate.title,
      desc: ed.description || candidate.description || candidate.desc,
      nestedLinks: ed.nestedLinks || candidate.nestedLinks || [],
      text: candidate.text || undefined,
      contactDetails: {
        email: ed.contactInfo?.email
          ? Array.isArray(ed.contactInfo.email)
            ? ed.contactInfo.email
            : [ed.contactInfo.email]
          : undefined,
        phone: ed.contactInfo?.phone
          ? Array.isArray(ed.contactInfo.phone)
            ? ed.contactInfo.phone
            : [ed.contactInfo.phone]
          : undefined,
        address: Array.isArray(ed.contactInfo?.addresses)
          ? ed.contactInfo.addresses.join(", ")
          : (ed.contactInfo?.addresses as any),
        social_media: Object.fromEntries(
          Object.entries(social).filter(([, v]) => Boolean(v)) as [
            string,
            string
          ][]
        ),
      },
      aboutData: {
        companyDescription: ed.companyDescription || undefined,
        industries: industryList,
        keyPoints: [
          ...(ed.insights?.strengths || []),
          ...(ed.insights?.opportunities || []),
        ].slice(0, 8),
      },
      businessIntelligence: {
        industry: industryList,
        businessModel: ed.businessModel || undefined,
        targetMarket: targetMarketList,
        keyServices: servicesList,
        competitiveAdvantages: ed.insights?.strengths || undefined,
        fundingStage: ed.fundingStage || undefined,
        revenue: ed.monthlyRevenue || ed.revenue || undefined,
        employeeCount: ed.companySize || undefined,
        companySize: ed.companySize || undefined,
        location: ed.location || candidate.location,
        socialPresence: {
          platforms: Object.keys(social).filter((k) => (social as any)[k]),
        },
      },
      processingTime: candidate.processingTime || responseData?.processingTime,
      aiEnhanced: Boolean(mergedMeta?.icpEnhanced || mergedMeta?.aiEnhanced),
    } as ScrapeResult["data"];

    return { success: true, data, meta: mergedMeta } as ScrapeResult;
  }

  return {
    success: true,
    data: candidate as ScrapeResult["data"],
    meta: mergedMeta,
  } as ScrapeResult;
};

/**
 * Submit a URL to scrape with ICP analysis
 * @param url - The URL to scrape
 * @param icpProfileId - The ICP profile ID to use for analysis
 * @returns Promise with the scrape result
 */
export const scrapeWithICP = async (
  url: string,
  icpProfileId: string
): Promise<ScrapeResult> => {
  try {
    const profileId = parseInt(icpProfileId, 10);
    if (isNaN(profileId)) throw new Error("Invalid ICP profile ID");

    const response = await apiClient.post(
      "/frontend/scraper",
      { url, enableAI: true, icpProfileId: profileId },
      { withCredentials: true }
    );

    return normalizeScrapeResponseDeep(response.data);
  } catch (error: unknown) {
    return handleApiError(error, `Failed to scrape URL with ICP: ${url}`);
  }
};

/**
 * Submit a URL to scrape - UPDATED FOR NEW API SCHEMA
 * @param url - The URL to scrape
 * @param icpProfileId - Optional ICP profile ID for enhanced scraping
 * @returns Promise with the scrape result
 */
export const scrapeUrl = async (
  url: string,
  icpProfileId?: string
): Promise<ScrapeResult> => {
  try {
    const response = await apiClient.post(
      "/frontend/scraper",
      { url, icpProfileId },
      { withCredentials: true }
    );

    return normalizeScrapeResponseDeep(response.data);
  } catch (error: unknown) {
    return handleApiError(error, `Failed to scrape URL: ${url}`);
  }
};

/**
 * Check the health of the scraper service
 * @returns Promise with the scraper health status
 */
export const checkScraperHealth = async (): Promise<ScraperHealth> => {
  try {
    const response = await apiClient.get("/frontend/scraper/health");
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, "Failed to check scraper health");
  }
};

/**
 * Get scraper usage information
 * @returns Promise with the user's scraper usage statistics
 */
export interface ScraperUsage {
  totalCreditsUsed: number;
  scrapeCount: number;
  aiProcessingCount: number;
  lastScrapeDate: string | null;
  usage7d: { date: string; count: number; creditsUsed: number }[];
  usage30d: { date: string; count: number; creditsUsed: number }[];
}

export const getScraperUsage = async (): Promise<ScraperUsage> => {
  try {
    const response = await apiClient.get("/frontend/scraper/usage");
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, "Failed to get usage data");
  }
};

/**
 * Get history of scrapes
 * @param page - Page number for pagination
 * @param limit - Number of items per page
 * @returns Promise with the user's scrape history
 */
export const getScrapeHistory = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  data: ScrapeHistoryItem[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const response = await apiClient.get(
      `/frontend/scraper/history?page=${page}&limit=${limit}`
    );

    // Handle both wrapped and unwrapped response formats
    if (response.data.payload) {
      return response.data.payload;
    }

    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, "Failed to fetch scrape history");
  }
};

/**
 * Cancel an active scrape job
 * @param jobId - ID of the scrape job to cancel
 * @returns Promise with the cancellation result
 */
export const cancelScrapeJob = async (
  jobId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post(
      `/frontend/scraper/job/${jobId}/cancel`
    );
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, `Failed to cancel scrape job: ${jobId}`);
  }
};

/**
 * Get details of a specific scrape job
 * @param jobId - ID of the scrape job
 * @returns Promise with the scrape job details
 */
export const getScrapeJobDetails = async (
  jobId: string
): Promise<ScrapeResult> => {
  try {
    const response = await apiClient.get(`/frontend/scraper/job/${jobId}`);
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, `Failed to get scrape job details: ${jobId}`);
  }
};
