"use client";

import React, { useEffect, useRef, useState } from "react";

import GetLogo from "@/components/common/getLogo";
import { useAuthContext } from "@/context/AuthContext";

import OnboardingStep1 from "./onboarding/step1";
import OnboardingStep2Combined from "./onboarding/step2Combined";
import OnboardingStep3Combined from "./onboarding/step3Combined";

export interface OnboardingData {
  // Step 1
  company?: string;
  companyWebsite?: string;
  hasWebsite?: boolean;

  // Step 2 (combined)
  teamSize?: string;
  contactsNeeded?: string;
  sellOnline?: boolean;
  marketingUpdatesOptIn?: boolean;

  // Step 2 (combined)
  companyAddress?: string;
  companyZipcode?: string;
  companyCity?: string;
  companyCountry?: string;

  // Step 3 (combined)
  phoneNumber?: string;
}

export function OnboardingComponent() {
  const { state } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading] = useState(false);

  const totalSteps = 3;
  const didInitFromUser = useRef(false);

  useEffect(() => {
    if (didInitFromUser.current) return;
    if (state.isLoading) return;
    const step = state.user?.onboardingStep ?? 0;

    // Backend step mapping -> UI steps (3-step wizard)
    // 0: nothing saved -> UI 1
    // 1 or 2: step 1/2 saved -> UI 2 (our combined step)
    // 3+: address saved (and beyond) -> UI 3 (phone + email)
    const uiStep = step >= 3 ? 3 : step >= 1 ? 2 : 1;
    setCurrentStep(uiStep);
    didInitFromUser.current = true;
  }, [state.isLoading, state.user]);

  const handleStepComplete = (_stepData: Partial<OnboardingData>) => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="h-screen  bg-bg-100 flex items-center justify-center p-4 overflow-auto">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-main rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Main content */}
      <div className="h-full relative z-10 w-full max-w-md ">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-brand-main rounded-lg">
              <GetLogo className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-100 mb-2">
            Welcome to LeadSnipper
          </h1>
          <p className="text-text-200 text-sm">
            Step {currentStep} of {totalSteps} - Let’s get you set up
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          {Array.from({ length: totalSteps }, (_, idx) => idx + 1).map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step <= currentStep ? "bg-brand-main" : "bg-bg-200"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-bg-100 rounded-lg p-6 shadow-lg">
          {currentStep === 1 && (
            <OnboardingStep1
              onComplete={handleStepComplete}
              isLoading={isLoading}
            />
          )}
          {currentStep === 2 && (
            <OnboardingStep2Combined
              onComplete={handleStepComplete}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
          {currentStep === 3 && (
            <OnboardingStep3Combined
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-text-200 text-xs mt-6">
          Your data is secure and encrypted
        </p>
      </div>
    </div>
  );
}

export default OnboardingComponent;
