"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import { useScraperContext } from "@/context/ScraperContext";
import { WebsiteInactiveError } from "@/utils/api/scraperClient";
import { IconHistory } from "@tabler/icons-react";

import BillingFeedback from "./BillingFeedback";
import ScraperForm from "./ScraperForm";
import ScraperHealthIndicator from "./ScraperHealthIndicator";
import ScraperResults from "./ScraperResults";
import WebsiteStatusAlert from "./WebsiteStatusAlert";

const ScraperContainer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: authState } = useAuthContext();
  const { state, scrapeWebsite, resetResult } = useScraperContext();
  const { isLoading, error, result, health } = state;
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [preselectedIcpProfileId, setPreselectedIcpProfileId] = useState<
    string | null
  >(null);
  const [prefillUrl, setPrefillUrl] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [websiteStatusError, setWebsiteStatusError] =
    useState<WebsiteInactiveError | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      setShowAuthWarning(true);
    } else {
      setShowAuthWarning(false);
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  // Read query params for ICP and prefilled URL
  useEffect(() => {
    const icpProfileId = searchParams.get("icpProfileId");
    if (icpProfileId) setPreselectedIcpProfileId(icpProfileId);
    const u = searchParams.get("url");
    if (u) setPrefillUrl(u);
  }, [searchParams]);

  // Detect website inactive errors
  useEffect(() => {
    if (
      (error && error.includes("Website domain not found")) ||
      (error && error.includes("Website Unavailable"))
    ) {
      // Try to extract details from the error message if it's a WebsiteInactiveError
      // This is a fallback since the error comes as a string from the context
      setWebsiteStatusError(new WebsiteInactiveError(error));
    } else {
      setWebsiteStatusError(null);
    }
  }, [error]);

  const handleScrapeSubmit = async (url: string, icpProfileId: string) => {
    // Clear any previous website status errors
    setWebsiteStatusError(null);
    // If not authenticated, redirect to login
    if (!authState.isAuthenticated) {
      router.push("/login?redirect=/scraper");
      return;
    }

    // Check if scraper service is healthy
    if (health && !health.healthy && health.status !== "healthy") {
      toast.error(
        `Enrichment engine is currently ${
          health.status || "unavailable"
        }. Please try again later.`,
        {
          duration: 6000,
          style: {
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
          },
        }
      );
      return;
    }

    // Use new unified scraping API
    await scrapeWebsite(url, icpProfileId);
  };

  const handleReset = () => {
    resetResult();
    setWebsiteStatusError(null);
  };

  // Auto-submit when URL is provided via query and user is authenticated
  useEffect(() => {
    if (!autoTriggered && prefillUrl && authState.isAuthenticated) {
      handleScrapeSubmit(prefillUrl, preselectedIcpProfileId || "");
      setAutoTriggered(true);
    }
  }, [
    prefillUrl,
    authState.isAuthenticated,
    preselectedIcpProfileId,
    autoTriggered,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Sales Intelligence
            </h1>
            <p className="text-gray-300">
              Turn websites into decision‑maker‑ready company profiles with our
              Sales Intelligence Engine
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/scraper/history"
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 backdrop-blur-sm"
            >
              <IconHistory className="h-5 w-5 mr-2" />
              View History
            </Link>
            <ScraperHealthIndicator />
          </div>
        </div>

        {showAuthWarning && (
          <div
            className="backdrop-blur-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 px-6 py-4 rounded-2xl mb-8 shadow-2xl"
            role="alert"
          >
            <div className="flex items-start">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-4 mt-0.5">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <p className="font-bold text-lg mb-2">
                  Authentication Required
                </p>
                <p className="text-yellow-100">
                  You need to be logged in to use the Sales Intelligence
                  features. Please
                  <button
                    onClick={() => router.push("/login?redirect=/scraper")}
                    className="font-bold underline ml-1 hover:text-white transition-colors"
                  >
                    login
                  </button>{" "}
                  or
                  <button
                    onClick={() => router.push("/signup?redirect=/scraper")}
                    className="font-bold underline ml-1 hover:text-white transition-colors"
                  >
                    create an account
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {health && !health.healthy && (
          <div
            className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-8 shadow-2xl"
            role="alert"
          >
            <div className="flex items-start">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-4 mt-0.5">
                <span className="text-white text-sm font-bold">⚠</span>
              </div>
              <div>
                <p className="font-bold text-lg mb-2">
                  Enrichment Engine Unavailable
                </p>
                <p className="text-red-100">
                  The enrichment engine is currently{" "}
                  {health.status || "unavailable"}.
                  {health.message && ` ${health.message}`}
                  Please try again later or contact support if the issue
                  persists.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 mb-8 shadow-2xl">
          <ScraperForm
            onSubmit={handleScrapeSubmit}
            isLoading={isLoading}
            onReset={handleReset}
            preselectedIcpProfileId={preselectedIcpProfileId}
            prefilledUrl={prefillUrl}
          />
        </div>

        {/* Success indicator */}
        {result && !error && !isLoading && (
          <div className="backdrop-blur-xl bg-green-500/20 border border-green-500/30 text-green-200 px-6 py-4 rounded-2xl mb-6 shadow-2xl">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-bold text-lg">
                  Profile Enrichment Complete!
                </p>
                <p className="text-green-100 text-sm">
                  Company profile is ready for review below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show billing feedback when authenticated and we have results */}
        {authState.isAuthenticated && result && (
          <BillingFeedback
            creditsUsed={result?.meta?.billing?.creditsUsed}
            isAIEnabled={Boolean(
              result?.meta?.billing?.scraperType &&
                /ai|icp/i.test(result?.meta?.billing?.scraperType)
            )}
            remainingCredits={result?.meta?.billing?.remainingCredits}
            scraperType={result?.meta?.billing?.scraperType}
          />
        )}

        {/* Website Status Alert for inactive websites */}
        {websiteStatusError && (
          <WebsiteStatusAlert
            error={{
              message: websiteStatusError.message,
              details: websiteStatusError.details,
            }}
            onClose={() => setWebsiteStatusError(null)}
          />
        )}

        {error && !websiteStatusError && (
          <div
            className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-8 shadow-2xl"
            role="alert"
          >
            <div className="flex items-start">
              <div className="flex-grow">
                <p className="font-bold text-lg mb-2">Error:</p>
                <p className="mb-4">{error}</p>

                {/* Credit-related error handling */}
                {error.toLowerCase().includes("credit") && (
                  <div className="mt-4 p-4 bg-red-600/20 rounded-xl border border-red-500/30">
                    <p className="text-sm mb-3">
                      You need more credits to use this feature. Please check
                      your account balance.
                    </p>
                    <button
                      onClick={() => router.push("/settings/billing")}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 text-sm rounded-xl transition-all duration-200"
                    >
                      Purchase Credits
                    </button>
                  </div>
                )}

                {/* Authentication error handling */}
                {(error.toLowerCase().includes("token") ||
                  error.toLowerCase().includes("auth") ||
                  error.toLowerCase().includes("permission")) && (
                  <div className="mt-4 p-4 bg-red-600/20 rounded-xl border border-red-500/30">
                    <p className="text-sm mb-3">
                      There might be an issue with your session. Please try
                      logging in again.
                    </p>
                    <button
                      onClick={() => router.push("/login?redirect=/scraper")}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 text-sm rounded-xl transition-all duration-200"
                    >
                      Login Again
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                className="text-red-200 hover:text-white text-xl font-bold ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {result && !error && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <ScraperResults result={result} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScraperContainer;
