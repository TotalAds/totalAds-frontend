"use client";

import React, { createContext, ReactNode, useContext, useReducer } from "react";

import {
  ScrapeResult,
  ScraperHealth,
} from "@/components/scraper/utils/scraperTypes";
import {
  checkScraperHealth,
  ScraperAuthError,
  ScraperCreditError,
  scrapeUrl,
  WebsiteInactiveError,
} from "@/utils/api/scraperClient";

// Define the state type
interface ScraperState {
  isLoading: boolean;
  error: string | null;
  result: ScrapeResult | null;
  health: ScraperHealth | null;
}

// Define action types
type ScraperAction =
  | { type: "SCRAPE_START" }
  | { type: "SCRAPE_SUCCESS"; payload: ScrapeResult }
  | { type: "SCRAPE_ERROR"; payload: string }
  | { type: "HEALTH_CHECK_START" }
  | { type: "HEALTH_CHECK_SUCCESS"; payload: ScraperHealth }
  | { type: "HEALTH_CHECK_ERROR"; payload: string }
  | { type: "RESET_RESULT" };

// Initial state
const initialState: ScraperState = {
  isLoading: false,
  error: null,
  result: null,
  health: null,
};

// Create context
interface ScraperContextType {
  state: ScraperState;
  scrapeWebsite: (url: string, icpProfileId?: string) => Promise<void>;
  checkHealth: () => Promise<void>;
  resetResult: () => void;
}

const ScraperContext = createContext<ScraperContextType | undefined>(undefined);

// Reducer function
const scraperReducer = (
  state: ScraperState,
  action: ScraperAction
): ScraperState => {
  switch (action.type) {
    case "SCRAPE_START":
      return { ...state, isLoading: true, error: null };
    case "SCRAPE_SUCCESS":
      return {
        ...state,
        isLoading: false,
        result: action.payload,
        error: null,
      };
    case "SCRAPE_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "HEALTH_CHECK_START":
      return { ...state, isLoading: true, error: null };
    case "HEALTH_CHECK_SUCCESS":
      return {
        ...state,
        isLoading: false,
        health: (action.payload as any).payload || action.payload, // Handle nested payload structure
        error: null,
      };
    case "HEALTH_CHECK_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "RESET_RESULT":
      return { ...state, result: null, error: null };
    default:
      return state;
  }
};

// Provider component
export const ScraperProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(scraperReducer, initialState);

  // Function to scrape a website - UPDATED FOR NEW API
  const scrapeWebsite = async (url: string, icpProfileId?: string) => {
    try {
      dispatch({ type: "SCRAPE_START" });
      const result = await scrapeUrl(url, icpProfileId);
      dispatch({ type: "SCRAPE_SUCCESS", payload: result });

      // Show success toast notification
      if (typeof window !== "undefined") {
        const { toast } = await import("react-hot-toast");
        const scrapeType = icpProfileId
          ? "with ICP analysis"
          : "standard scraping";
        toast.success(`Successfully scraped ${url} ${scrapeType}!`, {
          duration: 4000,
          style: {
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#22c55e",
          },
        });
      }
    } catch (error) {
      dispatch({
        type: "SCRAPE_ERROR",
        payload:
          error instanceof Error ? error.message : "An unknown error occurred",
      });

      // Show error toast notification with specific messaging
      if (typeof window !== "undefined") {
        const { toast } = await import("react-hot-toast");

        if (error instanceof WebsiteInactiveError) {
          // Special handling for inactive websites
          toast.error(`Website Unavailable: ${error.message}`, {
            duration: 8000,
            style: {
              background: "rgba(251, 146, 60, 0.1)",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              color: "#fb923c",
            },
          });
        } else if (error instanceof ScraperAuthError) {
          // Authentication error
          toast.error(`Authentication Required: ${error.message}`, {
            duration: 6000,
            style: {
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
            },
          });
        } else if (error instanceof ScraperCreditError) {
          // Credit error
          toast.error(`Insufficient Credits: ${error.message}`, {
            duration: 8000,
            style: {
              background: "rgba(168, 85, 247, 0.1)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              color: "#c084fc",
            },
          });
        } else {
          // Generic error
          toast.error(
            `Scraping Failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            {
              duration: 6000,
              style: {
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
              },
            }
          );
        }
      }
    }
  };

  // Function to check scraper health
  const checkHealth = async () => {
    try {
      dispatch({ type: "HEALTH_CHECK_START" });
      const health = await checkScraperHealth();
      dispatch({ type: "HEALTH_CHECK_SUCCESS", payload: health });
    } catch (error) {
      dispatch({
        type: "HEALTH_CHECK_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to check health status",
      });
    }
  };

  // Function to reset the result
  const resetResult = () => {
    dispatch({ type: "RESET_RESULT" });
  };

  return (
    <ScraperContext.Provider
      value={{ state, scrapeWebsite, checkHealth, resetResult }}
    >
      {children}
    </ScraperContext.Provider>
  );
};

// Custom hook to use the context
export const useScraperContext = () => {
  const context = useContext(ScraperContext);
  if (context === undefined) {
    throw new Error("useScraperContext must be used within a ScraperProvider");
  }
  return context;
};
