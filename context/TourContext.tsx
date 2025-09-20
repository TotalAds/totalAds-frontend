"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useTourState } from "@/hooks/useTourState";

interface TourContextType {
  isActive: boolean;
  startTour: (tourType?: string, forceStart?: boolean) => void;
  endTour: () => void;
  restartTour: () => void;
  currentStep: number;
  totalSteps: number;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [tourInstance, setTourInstance] = useState<any>(null);
  const [isManuallyTriggered, setIsManuallyTriggered] = useState(false);

  const { shouldShowTour, markTourCompleted } = useTourState();

  const startTour = useCallback(
    (tourType: string = "main", forceStart: boolean = false) => {
      // If forceStart is true, always start the tour regardless of completion status
      if (forceStart || shouldShowTour) {
        setIsManuallyTriggered(forceStart);
        setIsActive(true);
        setCurrentStep(0);
      }
    },
    [shouldShowTour]
  );

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    markTourCompleted();
    if (tourInstance) {
      tourInstance.complete();
    }
  }, [tourInstance, markTourCompleted]);

  const restartTour = useCallback(() => {
    console.log("restartTour called");
    // Force restart the tour by ending it first, then starting again
    if (tourInstance) {
      console.log("Completing existing tour instance");
      tourInstance.complete();
      setTourInstance(null);
    }
    setIsActive(false);
    setCurrentStep(0);

    // Use a longer delay to ensure complete cleanup
    setTimeout(() => {
      console.log("Setting tour active");
      setIsActive(true);
      setCurrentStep(0);
    }, 200);
  }, [tourInstance]);

  // Remove auto-start from context - handle it in specific components instead

  const value: TourContextType = {
    isActive,
    startTour,
    endTour,
    restartTour,
    currentStep,
    totalSteps,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
