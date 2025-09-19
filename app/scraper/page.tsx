import React, { Suspense } from "react";

import ScraperContainer from "@/components/scraper/ScraperContainer";

export const metadata = {
  title: "Scraper - Find Leads",
  description: "Find leads from any website in seconds",
};

const ScraperPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Loading...
            </h3>
          </div>
        </div>
      }
    >
      <ScraperContainer />
    </Suspense>
  );
};

export default ScraperPage;
