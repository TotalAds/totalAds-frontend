"use client";

// Keys for storing tokens
const ACCESS_TOKEN_KEY = "leadsnipper_access_token";
const TOKEN_EXPIRY_KEY = "leadsnipper_token_expiry";

/**
 * Utility for handling token storage
 * Provides methods to store, retrieve, and remove authentication tokens
 * Note: Refresh tokens are stored as httpOnly cookies on the server side
 */
export const tokenStorage = {
  /**
   * Store access token with expiry
   * @param accessToken Access token to store
   * @param expiresIn Expiry time in seconds
   * @param rememberMe Whether to store in localStorage (persistent) or sessionStorage (session only)
   */
  setTokens(
    accessToken: string,
    expiresIn: number,
    rememberMe: boolean = true
  ): void {
    try {
      if (typeof window !== "undefined") {
        const storage = rememberMe ? localStorage : sessionStorage;
        const expiryTime = Date.now() + expiresIn * 1000;

        storage.setItem(ACCESS_TOKEN_KEY, accessToken);
        storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
    } catch (error) {
      console.error("Error storing tokens:", error);
    }
  },

  /**
   * Get stored access token
   * @returns The stored access token or null if not found or expired
   */
  getAccessToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      // Try to get token from sessionStorage first
      let token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      let expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

      // If not found in sessionStorage, try localStorage
      if (!token) {
        token = localStorage.getItem(ACCESS_TOKEN_KEY);
        expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      }

      if (!token || !expiry) {
        return null;
      }

      // Check if token is expired
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() >= expiryTime) {
        this.removeTokens();
        return null;
      }

      // Validate token format - should be a JWT with 3 parts
      if (!this.isValidJWTFormat(token)) {
        console.warn("Invalid token format detected, clearing tokens");
        this.removeTokens();
        return null;
      }

      // Check if token is a refresh token (should not be stored as access token)
      if (this.isRefreshToken(token)) {
        console.warn(
          "Refresh token found in access token storage, clearing tokens"
        );
        this.removeTokens();
        return null;
      }

      return token;
    } catch (error) {
      console.error("Error retrieving access token:", error);
      return null;
    }
  },

  /**
   * Check if access token is expired or will expire soon
   * @param bufferSeconds Buffer time in seconds before considering token expired (default: 60)
   * @returns True if token is expired or will expire soon
   */
  isTokenExpired(bufferSeconds: number = 60): boolean {
    if (typeof window === "undefined") {
      return true;
    }

    try {
      let expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiry) {
        expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      }

      if (!expiry) {
        return true;
      }

      const expiryTime = parseInt(expiry, 10);
      const bufferTime = bufferSeconds * 1000;
      return Date.now() >= expiryTime - bufferTime;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  },

  /**
   * Remove stored authentication tokens
   */
  removeTokens(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Remove from both storages to ensure it's completely cleared
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error("Error removing tokens:", error);
    }
  },

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getAccessToken() instead
   */
  getToken(): string | null {
    return this.getAccessToken();
  },

  /**
   * Legacy method for backward compatibility
   * @deprecated Use removeTokens() instead
   */
  removeToken(): void {
    this.removeTokens();
  },

  /**
   * Check if a token has valid JWT format
   * @param token Token to validate
   * @returns True if token has valid JWT format
   */
  isValidJWTFormat(token: string): boolean {
    try {
      const parts = token.split(".");
      return parts.length === 3;
    } catch {
      return false;
    }
  },

  /**
   * Check if a token is a refresh token by decoding its payload
   * @param token Token to check
   * @returns True if token is a refresh token
   */
  isRefreshToken(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      return payload.type === "refresh";
    } catch {
      return false;
    }
  },
};
