"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

import { resetIdentity, trackEvent } from "@/utils/analytics/track";
import {
  getCurrentUser,
  isAuthenticated,
  login,
  logout,
  register,
  UserProfile,
} from "@/utils/api/authClient";

// Define the state type
interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  error: string | null;
}

// Define action types
type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: UserProfile }
  | { type: "LOGIN_ERROR"; payload: string }
  | { type: "REGISTER_START" }
  | { type: "REGISTER_SUCCESS"; payload: UserProfile }
  | { type: "REGISTER_ERROR"; payload: string }
  | { type: "LOGOUT" }
  | { type: "FETCH_USER_START" }
  | { type: "FETCH_USER_SUCCESS"; payload: UserProfile }
  | { type: "FETCH_USER_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

// Initial state
const initialState: AuthState = {
  isLoading: true, // Start with loading to check authentication on mount
  isAuthenticated: false,
  user: null,
  error: null,
};

// Create context
interface AuthContextType {
  state: AuthState;
  loginUser: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<UserProfile>;
  registerUser: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    referralCode?: string
  ) => Promise<UserProfile>;
  logoutUser: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
    case "REGISTER_START":
    case "FETCH_USER_START":
      return { ...state, isLoading: true, error: null };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
    case "FETCH_USER_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case "LOGIN_ERROR":
    case "REGISTER_ERROR":
    case "FETCH_USER_ERROR":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        dispatch({ type: "FETCH_USER_START" });
        const user = await getCurrentUser();
        dispatch({ type: "FETCH_USER_SUCCESS", payload: user });
      } catch (error) {
        // Don't show authentication errors on initial load
        // These are expected when user is not logged in
        dispatch({
          type: "FETCH_USER_ERROR",
          payload: "", // Clear error message for initial auth check
        });
      }
    };

    checkAuthStatus();
  }, []);

  const loginUser = async (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => {
    try {
      dispatch({ type: "LOGIN_START" });
      trackEvent("login_attempt");
      const { user } = await login({ email, password, rememberMe });
      dispatch({ type: "LOGIN_SUCCESS", payload: user });
      trackEvent("login_success", { email: user.email });
      return user; // Return user data for successful redirect
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      dispatch({
        type: "LOGIN_ERROR",
        payload: message,
      });
      trackEvent("login_error", { reason: message });
      throw error;
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    referralCode?: string
  ) => {
    try {
      dispatch({ type: "REGISTER_START" });
      trackEvent("register_attempt", { hasReferralCode: !!referralCode });
      const { user } = await register({
        name,
        email,
        password,
        confirmPassword,
        referralCode,
      });
      dispatch({ type: "REGISTER_SUCCESS", payload: user });
      trackEvent("register_success", { email: user.email });
      return user; // Return user data for successful redirect
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      dispatch({
        type: "REGISTER_ERROR",
        payload: message,
      });
      trackEvent("register_error", { reason: message });
      throw error;
    }
  };

  const logoutUser = async () => {
    await logout();
    dispatch({ type: "LOGOUT" });
    trackEvent("logout");
    resetIdentity();
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const refreshUser = async () => {
    try {
      dispatch({ type: "FETCH_USER_START" });
      const user = await getCurrentUser();
      dispatch({ type: "FETCH_USER_SUCCESS", payload: user });
    } catch (error) {
      dispatch({
        type: "FETCH_USER_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to refresh user data",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        loginUser,
        registerUser,
        logoutUser,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
