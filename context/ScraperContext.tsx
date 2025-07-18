"use client";

import React, { createContext, ReactNode, useContext, useReducer } from "react";

import {
  ScrapeResult,
  ScraperHealth,
} from "@/components/scraper/utils/scraperTypes";
import { checkScraperHealth, scrapeUrl } from "@/utils/api/scraperClient";

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
  scrapeWebsite: (url: string, enableAI: boolean) => Promise<void>;
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
        health: action.payload,
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

  // Function to scrape a website
  const scrapeWebsite = async (url: string, enableAI: boolean) => {
    try {
      dispatch({ type: "SCRAPE_START" });
      const result = await scrapeUrl(url, enableAI);
      dispatch({ type: "SCRAPE_SUCCESS", payload: result });
    } catch (error) {
      dispatch({
        type: "SCRAPE_ERROR",
        payload:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
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
