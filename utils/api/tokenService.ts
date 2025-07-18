/**
 * @deprecated This file is deprecated. Use the functions from @/utils/api/tokenClient instead.
 *
 * This file is kept for backward compatibility but should be replaced with:
 * - listTokens from @/utils/api/tokenClient
 * - createToken from @/utils/api/tokenClient
 * - deleteToken from @/utils/api/tokenClient
 * - getTokenUsage from @/utils/api/tokenClient
 * - updateToken from @/utils/api/tokenClient
 */

"use client";

// Re-export types and functions from the new API client
export type { ApiToken, TokenUsage, CreateTokenRequest } from "./tokenClient";

import {
  createToken,
  deleteToken,
  getTokenUsage,
  listTokens,
  updateToken,
} from "./tokenClient";

// Legacy interfaces for backward compatibility
export interface TokenCreateParams {
  name: string;
  expiresIn?: number; // expiration in days, optional
  scopes?: string[];
  permissions?: string[];
}

export interface TokenUsageStats {
  totalRequests: number;
  lastUsed?: string;
  dailyUsage: { date: string; count: number }[];
  monthlyUsage: { month: string; count: number }[];
}

/**
 * Service for managing API tokens for third-party access
 */
export const tokenService = {
  /**
   * @deprecated Use listTokens from tokenClient instead
   */
  async getTokens() {
    return listTokens();
  },

  /**
   * @deprecated Use createToken from tokenClient instead
   */
  async createToken(params: TokenCreateParams) {
    return createToken({
      name: params.name,
      expireIn: params.expiresIn,
    });
  },

  /**
   * @deprecated Use deleteToken from tokenClient instead
   */
  async deleteToken(tokenId: string) {
    await deleteToken(tokenId);
    return { success: true };
  },

  /**
   * Get usage statistics for an API token
   * @param tokenId ID of the token to get stats for
   * @returns Token usage statistics
   */
  async getTokenUsage(tokenId: string) {
    const usage = await getTokenUsage(tokenId);
    // Convert to legacy format
    return {
      totalRequests: usage[0]?.requests || 0,
      lastUsed: usage[0]?.date,
      dailyUsage: usage.map((u) => ({ date: u.date, count: u.requests })),
      monthlyUsage: [],
    };
  },

  /**
   * @deprecated Use updateToken from tokenClient instead
   */
  async updateTokenName(tokenId: string, name: string) {
    return updateToken(tokenId, name);
  },
};
