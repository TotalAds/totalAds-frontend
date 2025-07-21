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

// Helper function to handle errors
const handleApiError = (error: unknown, defaultMessage: string): never => {
  console.error(defaultMessage, error);

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const errorMessage =
      (axiosError.response?.data as any)?.error || axiosError.message;

    if (status === 401) {
      throw new ScraperAuthError(
        errorMessage || "Authentication required. Please sign in to continue."
      );
    } else if (status === 402) {
      throw new ScraperCreditError(
        errorMessage ||
          "Insufficient credits available. Please add credits to your account to continue."
      );
    } else {
      throw new ScraperError(errorMessage || defaultMessage, status);
    }
  }

  throw new ScraperError(defaultMessage);
};

/**
 * Submit a URL to scrape
 * @param url - The URL to scrape
 * @param enableAI - Whether to enable AI processing of the scraped data
 * @param options - Additional options for the scrape job
 * @returns Promise with the scrape result
 */
export const scrapeUrl = async (
  url: string,
  enableAI: boolean = false,
  options: { deepScrape?: boolean; maxPages?: number } = {}
): Promise<ScrapeResult> => {
  try {
    const response = await apiClient.post(
      "/frontend/scraper",
      {
        url,
        enableAI,
        deepScrape: options.deepScrape || false,
        maxPages: options.maxPages || 1,
      },
      {
        withCredentials: true,
      }
    );

    // Handle nested response structure
    const responseData = response.data;

    // Check if response has nested payload structure
    if (responseData.payload && responseData.payload.payload) {
      // Extract the actual scraper result from nested payload
      const scraperResult = responseData.payload.payload;
      const billingMeta = responseData.payload.meta;

      // Merge billing information into the result meta
      if (billingMeta?.billing && scraperResult.meta) {
        scraperResult.meta.billing = billingMeta.billing;
      } else if (billingMeta?.billing) {
        scraperResult.meta = {
          ...scraperResult.meta,
          billing: billingMeta.billing,
        };
      }

      return scraperResult;
    }

    // Fallback to direct response if no nested structure
    return responseData;
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
