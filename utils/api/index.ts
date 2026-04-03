/**
 * API Client Exports
 *
 * This file exports all API client functions for easy importing
 * All clients use axios for direct API calls to the backend
 */

// Base API client
export { default as apiClient } from "./apiClient";

// Authentication API
export * from "./authClient";

// Billing API
export * from "./billingClient";

// Usage Statistics API
export * from "./usageClient";

// Feedback API
export * from "./feedbackClient";

// Email Service API
export * from "./emailClient";

// WhatsApp Service API (namespaced — many symbols overlap with emailClient)
export * as whatsappApi from "./whatsappClient";

// Affiliate API
export * from "./affiliateClient";

// Re-export common types
export type {
  // Auth types
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
  AuthResponse,
  ChangePasswordData,
} from "./authClient";

// Scraper types are imported from components/scraper/utils/scraperTypes

export type {
  // Billing types
  PaymentIntent,
  BillingInfo,
  PaymentHistory,
  CreditPackage,
} from "./billingClient";

export type {
  // Usage types
  UsageStats,
  DailyUsage,
  UsageBreakdown,
  UsageResponse,
} from "./usageClient";

export type {
  // Feedback types
  FeedbackData,
  FeedbackResponse,
} from "./feedbackClient";
