/**
 * Utility functions for tour management
 */

export const resetTourForTesting = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tour-completed');
    localStorage.removeItem('tour-visit-count');
    console.log('Tour state reset for testing');
  }
};

export const simulateFirstTimeUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tour-completed');
    localStorage.setItem('tour-visit-count', '1');
    console.log('Simulated first-time user state');
  }
};

export const getTourState = () => {
  if (typeof window !== 'undefined') {
    return {
      completed: localStorage.getItem('tour-completed') === 'true',
      visitCount: parseInt(localStorage.getItem('tour-visit-count') || '0'),
    };
  }
  return { completed: false, visitCount: 0 };
};

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).tourUtils = {
    reset: resetTourForTesting,
    simulateFirstTime: simulateFirstTimeUser,
    getState: getTourState,
  };
}
