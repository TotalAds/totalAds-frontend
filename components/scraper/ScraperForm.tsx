"use client";

import React, { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScraperFormProps {
  onSubmit: (url: string, enableAI: boolean) => void;
  isLoading: boolean;
  onReset?: () => void;
}

const ScraperForm: React.FC<ScraperFormProps> = ({
  onSubmit,
  isLoading,
  onReset,
}) => {
  const [url, setUrl] = useState<string>("");
  const [enableAI, setEnableAI] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!url.trim()) {
      setUrlError("URL is required");
      return;
    }

    // Check if URL is valid
    if (!validateUrl(url)) {
      setUrlError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setUrlError(null);
    onSubmit(url, enableAI);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          Extract Website Data
        </h2>

        <div className="space-y-2">
          <label htmlFor="url" className="text-lg font-medium text-gray-200">
            Website URL
          </label>
          <input
            id="url"
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) setUrlError(null);
            }}
            className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-lg"
            disabled={isLoading}
          />
          {urlError && <p className="text-sm text-red-400 mt-2">{urlError}</p>}
          <p className="text-sm text-gray-400 mt-2">
            Enter the full URL of the website you want to scrape, including the
            http:// or https:// prefix.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-white font-medium mb-3">Choose Scraper Type:</h3>

        {/* Normal Scraper Option */}
        <div className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <input
            type="radio"
            id="normal-scraper"
            name="scraperType"
            checked={!enableAI}
            onChange={() => setEnableAI(false)}
            disabled={isLoading}
            className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2 mt-1"
          />
          <div className="flex-1">
            <label
              htmlFor="normal-scraper"
              className="text-white font-medium cursor-pointer mb-2 flex items-center justify-between"
            >
              <span>🚀 Normal Scraper</span>
              <span className="text-sm bg-green-500/20 text-green-300 px-2 py-1 rounded-lg">
                0.5 credits ($0.025)
              </span>
            </label>
            <p className="text-gray-400 text-sm">
              Fast extraction of basic company information, contact details, and
              structured data
            </p>
          </div>
        </div>

        {/* AI Enhanced Option */}
        <div className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <input
            type="radio"
            id="ai-scraper"
            name="scraperType"
            checked={enableAI}
            onChange={() => setEnableAI(true)}
            disabled={isLoading}
            className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2 mt-1"
          />
          <div className="flex-1">
            <label
              htmlFor="ai-scraper"
              className="text-white font-medium cursor-pointer mb-2 flex items-center justify-between"
            >
              <span>🤖 AI Enhanced Scraper</span>
              <span className="text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg">
                1.0 credit ($0.05)
              </span>
            </label>
            <p className="text-gray-400 text-sm">
              Advanced AI processing with content summarization and
              comprehensive business intelligence extraction
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {enableAI ? "AI Processing..." : "Scraping..."}
            </span>
          ) : (
            "🚀 Scrape Website"
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setUrl("");
            setEnableAI(false);
            setUrlError(null);
            if (onReset) onReset();
          }}
          disabled={isLoading || !url}
          className="py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>

      <div className="text-sm text-gray-400 p-4 bg-white/5 rounded-xl border border-white/10">
        <p>
          <strong className="text-white">💡 Note:</strong> Scraping may use
          credits from your account. AI processing uses additional credits for
          enhanced data extraction.
        </p>
      </div>
    </form>
  );
};

export default ScraperForm;
