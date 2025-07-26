"use client";

import axios from "axios";

import { tokenStorage } from "../auth/tokenStorage";
import apiClient from "./apiClient";

/**
 * Type definitions for authentication
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  accountCreatedAt: string;
  onboardingCompleted: boolean;
  onboardingStep: number | null;
  onboardingSkipped: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Login user with email and password
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post("/auth/login", credentials);

    const { accessToken, expiresIn, user } = response.data.payload;

    // Store the access token
    if (accessToken && expiresIn) {
      tokenStorage.setTokens(accessToken, expiresIn, credentials.rememberMe);
    }

    return {
      token: accessToken || "",
      user: user,
    };
  } catch (error: unknown) {
    console.error("Login error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Authentication failed"
      );
    }
    throw error;
  }
};

/**
 * Register a new user
 */
export const register = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post("/auth/signup", credentials);

    const { accessToken, expiresIn, user } = response.data.payload;

    // Store the access token if provided
    if (accessToken && expiresIn) {
      tokenStorage.setTokens(accessToken, expiresIn, true); // Default to remember me for signup
    }

    return {
      token: accessToken || "",
      user: user,
    };
  } catch (error: unknown) {
    console.error("Registration error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Registration failed"
      );
    }
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<UserProfile> => {
  try {
    const response = await apiClient.get("/users/me");
    return response.data.payload || response.data;
  } catch (error: unknown) {
    console.error("Error getting current user:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to get user"
      );
    }
    throw error;
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.delete("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Always clear tokens and redirect to login page
    tokenStorage.removeTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
};

/**
 * Change user password
 */
export const changePassword = async (
  passwordData: ChangePasswordData
): Promise<void> => {
  try {
    await apiClient.post("/auth/change-password", passwordData);
  } catch (error: unknown) {
    console.error("Error changing password:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to change password"
      );
    }
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // First check if we have a valid access token
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      return false;
    }

    // Then verify with the server
    await getCurrentUser();
    return true;
  } catch {
    // If getCurrentUser fails, clear tokens and return false
    tokenStorage.removeTokens();
    return false;
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await apiClient.post("/auth/reset-password/send-code", { email });
  } catch (error: unknown) {
    console.error("Error requesting password reset:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to send password reset email. Please check your email address and try again."
      );
    }
    throw error;
  }
};

/**
 * Validate reset password code
 */
export const validateResetCode = async (
  code: string
): Promise<{
  valid: boolean;
  userId?: string;
}> => {
  try {
    const response = await apiClient.get("/auth/reset-password/validate-code", {
      params: { code },
    });
    return response.data.payload;
  } catch (error: unknown) {
    console.error("Error validating reset code:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "This password reset link is invalid or has expired. Please request a new password reset."
      );
    }
    throw error;
  }
};

/**
 * Reset password with code
 */
export const resetPassword = async (
  code: string,
  newPassword: string
): Promise<void> => {
  try {
    await apiClient.patch("/auth/reset-password/reset", {
      code,
      newPassword,
    });
  } catch (error: unknown) {
    console.error("Error resetting password:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "Failed to update password. Please try again or request a new reset link."
      );
    }
    throw error;
  }
};
