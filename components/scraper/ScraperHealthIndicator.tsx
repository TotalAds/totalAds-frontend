"use client";

import React, { useEffect } from "react";

import { useScraperContext } from "@/context/ScraperContext";

const ScraperHealthIndicator: React.FC = () => {
  const { state, checkHealth } = useScraperContext();
  const { health, isLoading, error } = state;

  // Check health on component mount and set up polling
  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up polling every 60 seconds
    const intervalId = setInterval(() => {
      checkHealth();
    }, 60000); // 60 seconds

    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Helper function to get status colors
  const getStatusColor = () => {
    if (!health) return "bg-gray-400"; // Unknown status

    switch (health.status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  // Helper function to get status text
  const getStatusText = () => {
    if (isLoading) return "Checking...";
    if (error) return "Error";
    if (!health) return "Unknown";

    return health.status;
  };

  return (
    <div className="flex items-center">
      <div className="relative flex items-center">
        <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor()}`} />
        <div className="text-sm text-text-200">Scraper: {getStatusText()}</div>
      </div>
    </div>
  );
};

export default ScraperHealthIndicator;
