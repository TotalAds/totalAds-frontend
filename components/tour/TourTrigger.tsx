"use client";

import React, { useState } from "react";

import PageTourModal from "@/components/tour/PageTourModal";
import { useTour } from "@/context/TourContext";
import { IconHelp, IconRoute } from "@tabler/icons-react";

interface TourTriggerProps {
  variant?: "button" | "help" | "floating";
  className?: string;
  children?: React.ReactNode;
}

const TourTrigger: React.FC<TourTriggerProps> = ({
  variant = "button",
  className = "",
  children,
}) => {
  const { restartTour } = useTour();
  const [showTourModal, setShowTourModal] = useState(false);

  const handleStartTour = () => {
    // Show modal first for better UX
    setShowTourModal(true);
  };

  const handleModalStartTour = () => {
    setShowTourModal(false);
    restartTour();
  };

  const handleModalClose = () => {
    setShowTourModal(false);
  };

  if (variant === "floating") {
    return (
      <button
        onClick={handleStartTour}
        className={`fixed z-50 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 group ${
          className || "bottom-6 right-6"
        }`}
        title="Take Product Tour"
      >
        <IconRoute className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" />
      </button>
    );
  }

  if (variant === "help") {
    return (
      <button
        onClick={handleStartTour}
        className={`flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 ${className}`}
        title="Take Product Tour"
      >
        <IconHelp className="w-4 h-4" />
        <span className="text-sm">Take Tour</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleStartTour}
        className={`flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-200 group ${className}`}
      >
        <IconRoute className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
        {children || "Take Product Tour"}
      </button>

      {/* Page Tour Modal */}
      <PageTourModal
        isVisible={showTourModal}
        onClose={handleModalClose}
        onStartTour={handleModalStartTour}
      />
    </>
  );
};

export default TourTrigger;
