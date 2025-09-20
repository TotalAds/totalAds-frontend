"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useTour } from "@/context/TourContext";
import { useTourState } from "@/hooks/useTourState";
import { IconRoute, IconSparkles, IconX } from "@tabler/icons-react";

interface WelcomeModalProps {
  isNewUser?: boolean;
  showOnDashboardOnly?: boolean;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isNewUser = false,
  showOnDashboardOnly = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { startTour } = useTour();
  const { shouldShowTour, markTourCompleted } = useTourState();
  const pathname = usePathname();

  useEffect(() => {
    // Only show welcome modal for new users who haven't seen the tour
    // and only on dashboard if showOnDashboardOnly is true
    const shouldShow = isNewUser && shouldShowTour;
    const isOnCorrectPage = showOnDashboardOnly
      ? pathname === "/dashboard"
      : true;

    if (shouldShow && isOnCorrectPage) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000); // Show after 1 second

      return () => clearTimeout(timer);
    }
  }, [isNewUser, shouldShowTour, pathname, showOnDashboardOnly]);

  const handleStartTour = () => {
    setIsVisible(false);
    // Force start tour when user chooses to take it
    startTour("main", true);
  };

  const handleSkipTour = () => {
    setIsVisible(false);
    markTourCompleted();
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <IconSparkles className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-4">
              🎉 Welcome to Leadsnipper!
            </h2>

            {/* Description */}
            <p className="text-gray-300 mb-6 leading-relaxed">
              You&apos;re all set up! Would you like a quick 2-minute tour to
              learn how to find leads from any website in seconds?
            </p>

            {/* Benefits */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">
                You&apos;ll learn how to:
              </p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>🔍 Extract business data from any website</li>
                <li>🎯 Create ideal customer profiles</li>
                <li>📊 Get AI-powered lead scoring</li>
                <li>⚡ Save hours of manual research</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSkipTour}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                Skip for Now
              </button>
              <button
                onClick={handleStartTour}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <IconRoute className="w-4 h-4" />
                Take Tour
              </button>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-500 mt-4">
              You can always access the tour later from the Help menu
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeModal;
