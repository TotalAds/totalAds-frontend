"use client";

import React, { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getICPProfiles, ICPProfile } from "@/utils/api";

interface ScraperFormProps {
  onSubmit: (url: string, icpProfileId: string) => void;
  isLoading: boolean;
  onReset?: () => void;
  preselectedIcpProfileId?: string | null;
}

const ScraperForm: React.FC<ScraperFormProps> = ({
  onSubmit,
  isLoading,
  onReset,
  preselectedIcpProfileId,
}) => {
  const [url, setUrl] = useState<string>("");
  const [selectedICPProfile, setSelectedICPProfile] = useState<string>("");
  const [icpProfiles, setICPProfiles] = useState<ICPProfile[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [icpError, setICPError] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    fetchICPProfiles();
  }, []);

  // Set preselected ICP profile ID when provided
  useEffect(() => {
    if (preselectedIcpProfileId) {
      setSelectedICPProfile(preselectedIcpProfileId);
    }
  }, [preselectedIcpProfileId]);

  const fetchICPProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const response = await getICPProfiles("active");
      setICPProfiles(response.profiles);
      if (response.profiles.length > 0) {
        setSelectedICPProfile(response.profiles[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch ICP profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

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

    // Check if ICP profile is selected
    if (!selectedICPProfile) {
      setICPError("Please select an ICP profile");
      return;
    }

    setUrlError(null);
    setICPError(null);
    onSubmit(url, selectedICPProfile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          ICP-Enhanced Website Scraping
        </h2>

        <div className="space-y-6">
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
            {urlError && (
              <p className="text-sm text-red-400 mt-2">{urlError}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">
              Enter the full URL of the website you want to scrape, including
              the http:// or https:// prefix.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="icp-profile"
              className="text-lg font-medium text-gray-200"
            >
              ICP Profile
            </label>
            {loadingProfiles ? (
              <div className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-gray-400 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                Loading ICP profiles...
              </div>
            ) : icpProfiles.length === 0 ? (
              <div className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-gray-400">
                <p>No active ICP profiles found.</p>
                <p className="text-sm mt-1">
                  <a
                    href="/icp-profiles"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Create an ICP profile
                  </a>{" "}
                  to start intelligent lead qualification.
                </p>
              </div>
            ) : (
              <select
                id="icp-profile"
                value={selectedICPProfile}
                onChange={(e) => {
                  setSelectedICPProfile(e.target.value);
                  if (icpError) setICPError(null);
                }}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-lg"
                disabled={isLoading}
              >
                <option value="">Select an ICP profile...</option>
                {icpProfiles.map((profile) => (
                  <option
                    key={profile.id}
                    value={profile.id}
                    className="bg-gray-800"
                  >
                    {profile.name} (Min Score: {profile.minimumScore}%)
                  </option>
                ))}
              </select>
            )}
            {icpError && (
              <p className="text-sm text-red-400 mt-2">{icpError}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">
              Select an ICP profile to analyze the scraped data against your
              ideal customer criteria.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-white font-medium mb-3">ICP-Enhanced Scraping:</h3>

        {/* ICP Scraper Info */}
        <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mt-1">
            <span className="text-white text-xs">✓</span>
          </div>
          <div className="flex-1">
            <div className="text-white font-medium mb-2 flex items-center justify-between">
              <span>🎯 ICP-Enhanced Scraper</span>
              <span className="text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg">
                1.0 credits ($0.05)
              </span>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              AI-powered extraction with intelligent lead qualification based on
              your ICP criteria
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <div>✓ Complete company data extraction</div>
              <div>✓ ICP scoring and match analysis</div>
              <div>✓ Actionable recommendations</div>
              <div>✓ Business intelligence insights</div>
            </div>
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
              ICP Processing...
            </span>
          ) : (
            "🎯 Scrape with ICP Analysis"
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setUrl("");
            setSelectedICPProfile("");
            setUrlError(null);
            setICPError(null);
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
