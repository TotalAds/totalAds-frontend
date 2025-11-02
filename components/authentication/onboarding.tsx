"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

import GetLogo from "@/components/common/getLogo";

import OnboardingStep1 from "./onboarding/step1";
import OnboardingStep2 from "./onboarding/step2";
import OnboardingStep3 from "./onboarding/step3";
import OnboardingStep4 from "./onboarding/step4";

export interface OnboardingData {
  // Step 1
  firstName?: string;
  lastName?: string;
  company?: string;
  companyWebsite?: string;
  hasWebsite?: boolean;

  // Step 2
  teamSize?: string;
  contactsNeeded?: string;
  sellOnline?: boolean;
  marketingUpdatesOptIn?: boolean;

  // Step 3
  companyAddress?: string;
  companyZipcode?: string;
  companyCity?: string;
  companyCountry?: string;

  // Step 4
  phoneNumber?: string;
}

export function OnboardingComponent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({});

  const handleStepComplete = (stepData: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100 flex items-center justify-center p-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-main rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
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
            Step {currentStep} of 4 - Let's get you set up
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map((step) => (
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
            <OnboardingStep2
              onComplete={handleStepComplete}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
          {currentStep === 3 && (
            <OnboardingStep3
              onComplete={handleStepComplete}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
          {currentStep === 4 && (
            <OnboardingStep4
              onComplete={handleStepComplete}
              onBack={handleBack}
              isLoading={isLoading}
              formData={formData}
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
