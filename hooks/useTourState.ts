"use client";

import { useState, useEffect } from 'react';

interface TourState {
  hasCompletedTour: boolean;
  shouldShowTour: boolean;
  isFirstVisit: boolean;
}

export const useTourState = () => {
  const [tourState, setTourState] = useState<TourState>({
    hasCompletedTour: false,
    shouldShowTour: false,
    isFirstVisit: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('leadsnipper-tour-completed') === 'true';
      const visitCount = parseInt(localStorage.getItem('leadsnipper-visit-count') || '0');
      const isFirst = visitCount === 0;
      
      // Increment visit count
      localStorage.setItem('leadsnipper-visit-count', (visitCount + 1).toString());
      
      setTourState({
        hasCompletedTour: completed,
        shouldShowTour: !completed && isFirst,
        isFirstVisit: isFirst,
      });
    }
  }, []);

  const markTourCompleted = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadsnipper-tour-completed', 'true');
      setTourState(prev => ({
        ...prev,
        hasCompletedTour: true,
        shouldShowTour: false,
      }));
    }
  };

  const resetTourProgress = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leadsnipper-tour-completed');
      localStorage.removeItem('leadsnipper-visit-count');
      setTourState({
        hasCompletedTour: false,
        shouldShowTour: true,
        isFirstVisit: true,
      });
    }
  };

  const skipTour = () => {
    markTourCompleted();
  };

  return {
    ...tourState,
    markTourCompleted,
    resetTourProgress,
    skipTour,
  };
};
