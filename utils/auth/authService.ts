"use client";

import { tokenStorage } from "./tokenStorage";

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  message?: string;
}

/**
 * Authentication service for handling user authentication
 */
export const authService = {
  /**
   * Login with email and password
   * @param credentials User credentials
   * @returns Authentication response
   */
  async login(credentials: UserCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in the request
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Sign in failed. Please check your credentials and try again."
        );
      }

      // No need to store tokens - authentication is handled via cookies
      return {
        success: true,
        token: "", // Not used with cookie auth
        user: data.user || data,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  /**
   * Register a new user
   * @param userData User registration data
   * @returns Authentication response
   */
  async register(userData: UserRegistration): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Account creation failed. Please try again."
        );
      }

      // Store token if auto-login after registration
      if (data.token) {
        tokenStorage.setTokens(data.token, 3600); // 1 hour expiry
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  /**
   * Request password reset
   * @param email User email
   * @returns Response message
   */
  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Password reset request failed. Please try again."
        );
      }

      return data;
    } catch (error) {
      console.error("Password reset request error:", error);
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param token Reset token
   * @param newPassword New password
   * @returns Response message
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      return data;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },

  /**
   * Get current authenticated user
   * @returns User data
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await fetch("/api/users/me", {
        method: "GET",
        credentials: "include", // Include cookies in the request
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication failed
          return null;
        }
        throw new Error(
          "Unable to retrieve account information. Please try again."
        );
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call the logout endpoint to clear server-side cookies
      await fetch("/api/auth/logout", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Redirect to login page
    window.location.href = "/login";
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!tokenStorage.getToken();
  },
};
