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
  email?: string | string[];
  phone?: string | string[];
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

// Business Intelligence data (AI Enhanced)
export interface BusinessIntelligence {
  companyType?: string;
  industry?: string[];
  businessModel?: string;
  targetMarket?: string[];
  keyServices?: string[];
  competitiveAdvantages?: string[];
  marketPosition?: string;
  fundingStage?: string;
  revenue?: string | null;
  employeeCount?: string;
  technologies?: string[];
  partnerships?: string[];
  certifications?: string[];
  awards?: string[];
  socialPresence?: {
    platforms?: string[];
    engagement?: string;
  };
  riskFactors?: string[];
  opportunities?: string[];
  confidence?: number;
}

// Enhanced contact info (AI Enhanced)
export interface EnhancedContactInfo {
  email?: string[];
  phone?: string[];
}

// Extracted entities (AI Enhanced)
export interface ExtractedEntities {
  people?: string[];
  organizations?: string[];
  locations?: string[];
  products?: string[];
}

// Sentiment analysis (AI Enhanced)
export interface Sentiment {
  overall?: string;
  confidence?: number;
}

// About data structure from API
export interface AboutData {
  companyDescription?: string;
  companyValues?: string[];
  awards?: string[];
  industries?: string[];
  globalPresence?: boolean;
  officeLocations?: string[];
  certifications?: string[];
  keyPoints?: string[];
  teamMembers?: string[];
  foundingInfo?: {
    description?: string;
  };
}

// Contact information for new payload structure
export interface ContactInfo {
  email?: string;
  addresses?: string[];
  phone?: string[];
}

// Social presence information
export interface SocialPresence {
  linkedin?: string;
  youtube?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  twitter?: string;
}

// Insights structure
export interface Insights {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  redFlags?: string[];
}

// Extracted data structure from new payload
export interface ExtractedData {
  _extractionMode?: string;
  title?: string;
  description?: string;
  nestedLinks?: string[];
  service?: string[];
  companyDescription?: string;
  contactInfo?: ContactInfo;
  companySize?: string;
  industry?: string;
  location?: string;
  revenue?: string;
  socialPresence?: SocialPresence;
  fundingStage?: string;
  businessModel?: string;
  targetMarket?: string;
  productType?: string;
  monthlyRevenue?: string;
  insights?: Insights;
  businessIntelligence?: BusinessIntelligence;
  actionableRecommendations?: string[];
  allPagesCorpus?: string;
  icpFields?: any;
}

// New payload structure
export interface NewScrapePayload {
  success: boolean;
  data: {
    extractedData: ExtractedData;
    icpScore?: number;
    icpMatchLevel?: string;
    processingTime?: number;
  };
  meta: {
    requestId: string;
    icpEnhanced?: boolean;
    timestamp: string;
  };
}

// Full scrape result from the API (updated for new structure)
export interface ScrapeResult {
  success: boolean;
  data: {
    status?: number;
    message?: string;
    payload?: NewScrapePayload;
    // Legacy fields for backward compatibility
    title?: string;
    desc?: string;
    nestedLinks?: string[];
    text?: string;
    contactDetails?: ContactDetails;
    aboutData?: AboutData;
    businessIntelligence?: BusinessIntelligence;
    enhancedContactInfo?: EnhancedContactInfo;
    extractedEntities?: ExtractedEntities;
    sentiment?: Sentiment;
    aiProcessingTime?: number;
    aiCost?: number;
    processingTime?: number;
    aiEnhanced?: boolean;
    url?: string;
    company_info?: CompanyInfo;
    tables?: Table[];
    raw_text?: string;
    ai_summary?: string;
    // New structure fields
    extractedData?: ExtractedData;
    icpScore?: number;
    icpMatchLevel?: string;
  };
  meta?: {
    requestId?: string;
    aiEnhanced?: boolean;
    icpEnhanced?: boolean;
    processingTime?: number;
    aiProcessingTime?: number;
    aiCost?: number;
    timestamp?: string;
    processing_time_ms?: number;
    creditsUsed?: number;
    jobId?: string;
    billing?: {
      charged: boolean;
      creditsUsed: number;
      creditValue: number;
      cost: number;
      remainingCredits: number;
      scraperType: string;
      rate?: number;
      apiCall?: number;
    };
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
