"use client";

import React from "react";

import { useAuthContext } from "@/context/AuthContext";

interface BillingFeedbackProps {
  creditsUsed?: number;
  isAIEnabled?: boolean;
  remainingCredits?: number;
  scraperType?: string;
}

const BillingFeedback: React.FC<BillingFeedbackProps> = ({
  creditsUsed,
  isAIEnabled,
  remainingCredits,
  scraperType,
}) => {
  const { state } = useAuthContext();
  const { user } = state;

  // Credit pricing information
  const normalScraperCredits = 0.5;
  const aiScraperCredits = 1.0;
  const creditValue = 0.05; // $0.05 per credit

  // Calculate cost
  const currentCreditsUsed =
    creditsUsed || (isAIEnabled ? aiScraperCredits : normalScraperCredits);
  const cost = currentCreditsUsed * creditValue;

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white flex items-center">
          💳 Credit Usage
        </h3>
        <div className="text-xs text-gray-400">
          {scraperType || (isAIEnabled ? "AI Enhanced" : "Normal")} •{" "}
          {currentCreditsUsed} credits • ${cost.toFixed(3)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {/* Current Request - Compact */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">This Request:</span>
            <span className="font-medium text-white">
              {currentCreditsUsed} credits
            </span>
          </div>
        </div>

        {/* Account Balance - Compact */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Remaining:</span>
            <span className="font-medium text-white">
              {remainingCredits !== undefined
                ? `${remainingCredits.toFixed(1)} credits`
                : "Loading..."}
            </span>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Free Tier:</span>
            <span className="font-medium text-white">10/month</span>
          </div>
        </div>
      </div>

      {/* Warnings - Only show if critical */}
      {remainingCredits !== undefined && remainingCredits < 1 && (
        <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center">
            <span className="text-red-400 mr-2 text-sm">⚠️</span>
            <div>
              <p className="text-xs font-medium text-red-300">
                Low Credit Balance - {remainingCredits.toFixed(1)} credits
                remaining
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingFeedback;
