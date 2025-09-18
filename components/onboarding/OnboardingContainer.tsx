"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import GetLogo from "@/components/common/getLogo";
import { useAuthContext } from "@/context/AuthContext";
import {
  completeOnboarding,
  CompleteOnboardingData,
  getOnboardingOptions,
  OnboardingOptions,
  OnboardingStep1Data,
  OnboardingStep2Data,
  saveOnboardingStep1,
  saveOnboardingStep2,
  skipOnboarding,
} from "@/utils/api/onboardingClient";

import OnboardingStep1 from "./OnboardingStep1";
import OnboardingStep2 from "./OnboardingStep2";
import OnboardingWelcome from "./OnboardingWelcome";
import ProgressIndicator from "./ProgressIndicator";

const TOTAL_STEPS = 3;

export default function OnboardingContainer() {
  const router = useRouter();
  const { refreshUser } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [step1Data, setStep1Data] = useState<OnboardingStep1Data | null>(null);
  const [step2Data, setStep2Data] = useState<OnboardingStep2Data | null>(null);

  // Load onboarding options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const onboardingOptions = await getOnboardingOptions();
        console.log(onboardingOptions);
        setOptions(onboardingOptions.payload);
      } catch (error) {
        console.error("Failed to load onboarding options:", error);
        toast.error("Failed to load form options. Please refresh the page.");
      }
    };

    loadOptions();
  }, []);

  const handleStep1Submit = async (data: OnboardingStep1Data) => {
    setIsLoading(true);
    try {
      await saveOnboardingStep1(data);
      setStep1Data(data);
      setCurrentStep(1);
      toast.success("Business information saved!");
    } catch (error) {
      console.error("Step 1 error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (data: OnboardingStep2Data) => {
    setIsLoading(true);
    try {
      await saveOnboardingStep2(data);
      setStep2Data(data);
      setCurrentStep(2);
      toast.success("Goals and preferences saved!");
    } catch (error) {
      console.error("Step 2 error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!step1Data || !step2Data) {
      toast.error("Please complete all previous steps");
      return;
    }

    setIsLoading(true);
    try {
      const completeData: CompleteOnboardingData = {
        ...step1Data,
        ...step2Data,
      };

      const response = await completeOnboarding(completeData);
      toast.success(response.message);

      // Refresh user data to update onboarding status
      await refreshUser();

      // Redirect to dashboard after completion
      setTimeout(() => {
        router.push(response.redirectTo || "/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Complete onboarding error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to complete onboarding"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    try {
      setIsLoading(true);

      // Skip onboarding and send reminder email
      const result = await skipOnboarding();

      // Show success message
      toast.success(result.message || "Onboarding skipped successfully");

      // Refresh user data to update onboarding status
      await refreshUser();

      // Redirect to dashboard after refreshing user data
      setTimeout(() => {
        router.push(result.redirectTo || "/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      toast.error("Failed to skip onboarding. Please try again.");

      // Try to refresh user data and redirect anyway
      try {
        await refreshUser();
        router.push("/dashboard");
      } catch (refreshError) {
        console.error("Failed to refresh user data:", refreshError);
        // Force a page reload as fallback
        window.location.href = "/dashboard";
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!options) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl">
              <GetLogo className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to Leadsnipper
          </h1>
          <p className="text-gray-300 text-lg">
            Let&apos;s get you set up in just a few steps
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Step Content */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {currentStep === 0 && (
            <OnboardingStep1
              options={options}
              onSubmit={handleStep1Submit}
              isLoading={isLoading}
              onSkip={handleSkip}
              initialData={step1Data}
            />
          )}

          {currentStep === 1 && (
            <OnboardingStep2
              options={options}
              onSubmit={handleStep2Submit}
              onBack={handleBack}
              isLoading={isLoading}
              initialData={step2Data}
            />
          )}

          {currentStep === 2 && (
            <OnboardingWelcome
              onComplete={handleComplete}
              onBack={handleBack}
              isLoading={isLoading}
              step1Data={step1Data}
              step2Data={step2Data}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Need help? Contact our support team at{" "}
            <a
              href="mailto:hello@leadsnipper.com"
              className="text-purple-400 hover:text-purple-300"
            >
              hello@leadsnipper.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
