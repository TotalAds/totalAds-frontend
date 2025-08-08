"use client";

import React, { useState } from "react";
import { useScraperContext } from "@/context/ScraperContext";
import { mapToLandingPageData, type LandingPageData } from "@/utils/scraper/landingPageMapper";

export default function LandingJsonPage() {
  const { state } = useScraperContext();
  const { result } = state;
  const [copied, setCopied] = useState(false);

  const landing: LandingPageData | null = result ? mapToLandingPageData(result) : null;

  const copy = async () => {
    if (!landing) return;
    await navigator.clipboard.writeText(JSON.stringify(landing, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Landing Page JSON</h1>
          <button
            onClick={copy}
            disabled={!landing}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
        </div>

        {!landing ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-gray-300">No scrape result available yet. Run a scrape first.</p>
          </div>
        ) : (
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 overflow-auto max-h-[75vh] text-sm">
            <pre>{JSON.stringify(landing, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

