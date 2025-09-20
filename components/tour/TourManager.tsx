"use client";

import React, { useState } from "react";

import PageTourModal from "@/components/tour/PageTourModal";
import { useTour } from "@/context/TourContext";
import { useTourState } from "@/hooks/useTourState";
import { IconHelp, IconRefresh, IconRoute, IconX } from "@tabler/icons-react";

interface TourManagerProps {
  className?: string;
}

const TourManager: React.FC<TourManagerProps> = ({ className = "" }) => {
  const { startTour, restartTour } = useTour();
  const { hasCompletedTour, resetTourProgress } = useTourState();
  const [isOpen, setIsOpen] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);

  const handleResetTour = () => {
    resetTourProgress();
    setIsOpen(false);
  };

  const handleStartTour = () => {
    // Show modal first, then start tour
    setShowTourModal(true);
    setIsOpen(false);
  };

  const handleModalStartTour = () => {
    setShowTourModal(false);
    restartTour();
  };

  const handleModalClose = () => {
    setShowTourModal(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        title="Tour Options"
      >
        <IconHelp className="w-4 h-4" />
        <span className="text-sm">Help</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Product Tour</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleStartTour}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <IconRoute className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-sm font-medium">Take Tour</div>
                    <div className="text-xs text-gray-400">
                      Learn how to use Leadsnipper
                    </div>
                  </div>
                </button>

                {hasCompletedTour && (
                  <button
                    onClick={handleResetTour}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <IconRefresh className="w-4 h-4 text-green-400" />
                    <div>
                      <div className="text-sm font-medium">Reset Tour</div>
                      <div className="text-xs text-gray-400">
                        Show tour for new users again
                      </div>
                    </div>
                  </button>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400">
                  {hasCompletedTour
                    ? "✅ You've completed the tour"
                    : "🎯 Take the tour to get started"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Page Tour Modal */}
      <PageTourModal
        isVisible={showTourModal}
        onClose={handleModalClose}
        onStartTour={handleModalStartTour}
      />
    </div>
  );
};

export default TourManager;
