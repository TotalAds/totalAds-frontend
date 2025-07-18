"use client";

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';

interface BillingFeedbackProps {
  creditsUsed?: number;
  isAIEnabled?: boolean;
}

const BillingFeedback: React.FC<BillingFeedbackProps> = ({ 
  creditsUsed, 
  isAIEnabled 
}) => {
  const { state } = useAuthContext();
  const { user } = state;
  
  // Safe access to credits with type checking
  const userCredits = user ? (user as any).credits : undefined;

  return (
    <div className="bg-bg-50 border border-bg-200 rounded-lg p-4 my-4">
      <h3 className="text-md font-medium text-text mb-2">Credits Information</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-200">Available Credits:</span>
          <span className="font-medium text-text">
            {userCredits !== undefined ? userCredits : 'Unknown'}
          </span>
        </div>
        
        {creditsUsed !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-text-200">Credits Used For This Request:</span>
            <span className="font-medium text-text">{creditsUsed}</span>
          </div>
        )}
        
        {isAIEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800 mt-2">
            <span className="font-bold">Note:</span> AI processing uses additional credits.
          </div>
        )}
        
        {userCredits !== undefined && userCredits < 50 && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800 mt-2">
            <span className="font-bold">Warning:</span> Your credit balance is running low. 
            Please consider purchasing additional credits.
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingFeedback;
