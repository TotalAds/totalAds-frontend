"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useRef } from "react";
import Shepherd from "shepherd.js";

import {
  dashboardTourSteps,
  icpTourSteps,
  scraperTourSteps,
  tourOptions,
} from "@/config/tourSteps";
import { useTour } from "@/context/TourContext";

const ProductTour: React.FC = () => {
  const { isActive, endTour } = useTour();
  const pathname = usePathname();
  const tourRef = useRef<any | null>(null);

  // Get appropriate tour steps based on current page
  const getTourSteps = () => {
    switch (pathname) {
      case "/dashboard":
        return dashboardTourSteps;
      case "/scraper":
        return scraperTourSteps;
      case "/icp-profiles":
        return icpTourSteps;
      default:
        return dashboardTourSteps;
    }
  };

  const handleTourComplete = () => {
    endTour();
  };

  const handleTourCancel = () => {
    endTour();
  };

  useEffect(() => {
    if (isActive && typeof window !== "undefined") {
      // Only create tour if we don't have an active one
      if (!tourRef.current) {
        // Create new Shepherd tour instance
        const tour = new Shepherd.Tour({
          ...tourOptions,
          defaultStepOptions: {
            ...(tourOptions.defaultStepOptions as any),
            when: {
              complete: handleTourComplete,
              cancel: handleTourCancel,
            },
          },
        });

        // Add steps to tour based on current page
        const steps = getTourSteps();
        steps.forEach((step) => {
          tour.addStep(step);
        });

        tourRef.current = tour;

        // Small delay to ensure DOM elements are rendered
        const timer = setTimeout(() => {
          if (tour && tourRef.current === tour) {
            tour.start();
          }
        }, 500);

        return () => {
          clearTimeout(timer);
        };
      }
    } else if (!isActive && tourRef.current) {
      // Clean up tour when not active
      tourRef.current.complete();
      tourRef.current = null;
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.complete();
      }
    };
  }, []);

  if (!isActive) {
    return null;
  }

  return null; // Shepherd manages its own DOM
};

export default ProductTour;
