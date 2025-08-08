import { Metadata } from "next";
import React from "react";

import ScrapeHistory from "@/components/scraper/ScrapeHistory";

export const metadata: Metadata = {
  title: "Profile History | Leadsnipper",
  description: "View your past profile enrichments and results",
};

export default function ScraperHistoryPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ScrapeHistory />
    </div>
  );
}
