/**
 * Types for the scraper functionality
 */

// Base company information
export interface AboutInfo {
  company_name?: string;
  description?: string;
  founded_year?: string;
  industry?: string;
  headquarters?: string;
  company_size?: string;
  revenue?: string;
  website?: string;
}

// Contact information
export interface ContactDetails {
  email?: string;
  phone?: string;
  address?: string;
  social_media?: {
    [key: string]: string;
  };
  contact_form_url?: string;
}

// Company information combining about and contact
export interface CompanyInfo {
  about: AboutInfo;
  contact: ContactDetails;
}

// Tables extracted from the website
export interface Table {
  headers: string[];
  rows: string[][];
  caption?: string;
}

// Full scrape result from the API
export interface ScrapeResult {
  success: boolean;
  data: {
    url: string;
    company_info?: CompanyInfo;
    tables?: Table[];
    raw_text?: string;
    ai_summary?: string;
  };
  meta?: {
    processing_time_ms?: number;
    billing?: {
      charged: boolean;
      rate?: number;
      apiCall?: number;
    };
    timestamp?: string;
  };
  error?: string;
}

// Health status from the scraper service
export interface ScraperHealth {
  success: boolean;
  status: "healthy" | "degraded" | "down" | "unhealthy" | "error";
  message?: string;
  healthy: boolean;
  last_check: string;
  version?: string;
}

// History item for past scrapes
export interface ScrapeHistoryItem {
  id: string;
  url: string;
  status: "completed" | "failed" | "processing" | "canceled";
  enabledAI: boolean;
  createdAt: string;
  completedAt?: string;
  error?: string;
  creditsUsed: number;
  resultPreview?: {
    companyName?: string;
    description?: string;
  };
}
