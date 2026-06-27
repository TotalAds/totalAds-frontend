"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import GetLogo from "@/components/common/getLogo";
import { useAuthContext } from "@/context/AuthContext";
import type { OnboardingGoal } from "@/utils/api/apiClient";
import {
  getStoredAuthProduct,
  isSocialSnipperUser,
} from "@/utils/auth/productIntent";

import GoalStep from "./onboarding/goalStep";
import { useOnboardingWizard } from "./onboarding/hooks/useOnboardingWizard";
import OnboardingStep1 from "./onboarding/step1";
import OnboardingStep2Combined from "./onboarding/step2Combined";
import OnboardingStep3Combined from "./onboarding/step3Combined";

export function OnboardingComponent() {
  const router = useRouter();
  const { state } = useAuthContext();
  const {
    currentStepIndex,
    totalSteps,
    isSubmitting,
    goals,
    setGoals,
    companyForm,
    setCompanyForm,
    goBack,
    goNext,
    saveGoals,
    saveCompany,
    completeWithSending,
    completeWithoutSending,
    skipAllOnboarding,
  } = useOnboardingWizard();

  useEffect(() => {
    if (state.isLoading) return;
    if (isSocialSnipperUser(state.user, getStoredAuthProduct())) {
      router.replace("/social/onboarding");
    }
  }, [state.isLoading, state.user, router]);

  const toggleGoal = (goal: OnboardingGoal) => {
    setGoals((prev) => {
      if (goal === "everything") {
        return prev.includes("everything") ? [] : ["everything"];
      }
      const next = prev.includes(goal)
        ? prev.filter((item) => item !== goal && item !== "everything")
        : [...prev.filter((item) => item !== "everything"), goal];
      return next;
    });
  };

  return (
    <div className="h-screen  bg-bg-100 flex items-center justify-center p-4 overflow-auto">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-main rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Main content */}
      <div
        className={`h-full relative z-10 w-full ${
          currentStepIndex === 3 ? "max-w-2xl" : "max-w-md"
        }`}
      >
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
            Step {currentStepIndex + 1} of {totalSteps} - Let&apos;s get you set up
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          {Array.from({ length: totalSteps }, (_, idx) => idx + 1).map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step <= currentStepIndex + 1 ? "bg-brand-main" : "bg-bg-200"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-bg-100 rounded-lg p-6 shadow-lg">
          {currentStepIndex === 0 && (
            <OnboardingStep1
              isLoading={isSubmitting}
              onContinue={goNext}
              onSkip={async () => {
                const redirectTo = await skipAllOnboarding();
                if (redirectTo) router.push(redirectTo);
              }}
            />
          )}
          {currentStepIndex === 1 && (
            <GoalStep
              goals={goals}
              onToggleGoal={toggleGoal}
              onBack={goBack}
              onContinue={saveGoals}
              isLoading={isSubmitting}
            />
          )}
          {currentStepIndex === 2 && (
            <OnboardingStep2Combined
              formData={companyForm}
              onChange={(data) => setCompanyForm((prev) => ({ ...prev, ...data }))}
              onComplete={saveCompany}
              onBack={goBack}
              isLoading={isSubmitting}
            />
          )}
          {currentStepIndex === 3 && (
            <OnboardingStep3Combined
              onBack={goBack}
              onCompleteWithMethod={completeWithSending}
              onSkipForNow={completeWithoutSending}
              isLoading={isSubmitting}
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
