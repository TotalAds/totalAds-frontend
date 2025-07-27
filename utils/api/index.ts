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

// Scraper API
export * from "./scraperClient";

// Token Management API
export * from "./tokenClient";

// Billing API
export * from "./billingClient";

// Usage Statistics API
export * from "./usageClient";

// ICP Management API
export * from "./icpClient";

// Re-export common types
export type {
  // Auth types
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
  AuthResponse,
  ChangePasswordData,
} from "./authClient";

export type {
  // ICP types
  ICPProfile,
  CreateICPProfileRequest,
  UpdateICPProfileRequest,
  ICPProfilesResponse,
} from "./icpClient";

// Scraper types are imported from components/scraper/utils/scraperTypes

export type {
  // Token types
  ApiToken,
  TokenUsage,
  CreateTokenRequest,
} from "./tokenClient";

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
