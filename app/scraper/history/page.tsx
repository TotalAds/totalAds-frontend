import { Metadata } from "next";
import React from "react";

import ScrapeHistory from "@/components/scraper/ScrapeHistory";

export const metadata: Metadata = {
  title: "Scrape History | Leadsnipper",
  description: "View your past scraping jobs and results",
};

export default function ScraperHistoryPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Scrape History</h1>
        <p className="text-text-300">
          View your past scraping jobs and their results. You can check the
          status of your scrapes, see credits used, and access completed
          results.
        </p>
      </div>

      <ScrapeHistory />
    </div>
  );
}
