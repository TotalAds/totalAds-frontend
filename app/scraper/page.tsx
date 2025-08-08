import React, { Suspense } from "react";

import ScraperContainer from "@/components/scraper/ScraperContainer";

export const metadata = {
  title: "Leadsnipper - Sales Intelligence",
  description:
    "Turn websites into decision‑maker‑ready company profiles with our Sales Intelligence Engine",
};

const ScraperPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
              <div
                className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-pink-500 mx-auto"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Loading Sales Intelligence
            </h3>
            <p className="text-gray-400">
              Preparing your Sales Intelligence workspace...
            </p>
          </div>
        </div>
      }
    >
      <ScraperContainer />
    </Suspense>
  );
};

export default ScraperPage;
