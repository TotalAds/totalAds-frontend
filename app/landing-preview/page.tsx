"use client";

import React from "react";
import { useScraperContext } from "@/context/ScraperContext";
import { mapToLandingPageData } from "@/utils/scraper/landingPageMapper";
import LandingPreview from "@/components/landing/LandingPreview";
import Link from "next/link";

export default function LandingPreviewPage() {
  const { state } = useScraperContext();
  const { result } = state;

  const landing = result ? mapToLandingPageData(result) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Landing Preview</h1>
          <div className="flex gap-3">
            <Link href="/scraper" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Open Scraper</Link>
            <Link href="/landing-json" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">View JSON</Link>
          </div>
        </div>

        {!landing ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-gray-300">No scrape result available yet. Run a scrape first.</p>
          </div>
        ) : (
          <LandingPreview data={landing} />
        )}
      </div>
    </div>
  );
}

