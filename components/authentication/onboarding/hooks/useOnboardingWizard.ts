"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import {
  default as apiClient,
  completeOnboardingWithoutSending,
  type OnboardingGoal,
  saveOnboardingGoals,
  setPrimarySendingMethodStep5,
  skipOnboarding,
  type OnboardingSendingMethod,
} from "@/utils/api/apiClient";

export type CompanyFormState = {
  company: string;
  companyWebsite: string;
  industry: string;
  teamSize: string;
  contactsNeeded: string;
  sellOnline: boolean;
  marketingUpdatesOptIn: boolean;
  companyAddress: string;
  companyZipcode: string;
  companyCity: string;
  companyCountry: string;
};

const DEFAULT_COMPANY_FORM: CompanyFormState = {
  company: "",
  companyWebsite: "",
  industry: "",
  teamSize: "",
  contactsNeeded: "",
  sellOnline: false,
  marketingUpdatesOptIn: false,
  companyAddress: "",
  companyZipcode: "",
  companyCity: "",
  companyCountry: "",
};

const ONBOARDING_STEPS = ["welcome", "goal", "company", "connect"] as const;
export type OnboardingUiStep = (typeof ONBOARDING_STEPS)[number];

export function useOnboardingWizard() {
  const { state, refreshUser } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(DEFAULT_COMPANY_FORM);

  const user = state.user;
  const initialStep = useMemo(() => {
    const step = user?.onboardingStep ?? 0;
    if (step >= 3) return 3;
    if (step >= 2) return 2;
    if (step >= 1) return 1;
    return 0;
  }, [user?.onboardingStep]);

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const currentStep = ONBOARDING_STEPS[currentStepIndex];

  useEffect(() => {
    setCurrentStepIndex((prev) => (prev === 0 ? initialStep : prev));
  }, [initialStep]);

  const goNext = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
  };

  const goBack = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const saveGoals = async () => {
    if (!goals.length) {
      toast.error("Please select at least one goal");
      return false;
    }
    try {
      setIsSubmitting(true);
      await saveOnboardingGoals(goals);
      await refreshUser();
      goNext();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save goals");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCompany = async () => {
    if (!companyForm.company.trim()) {
      toast.error("Company name is required");
      return false;
    }
    if (!companyForm.companyAddress.trim()) {
      toast.error("Company street address is required");
      return false;
    }
    if (!companyForm.companyZipcode.trim()) {
      toast.error("Company zipcode is required");
      return false;
    }
    if (!companyForm.companyCity.trim()) {
      toast.error("Company city is required");
      return false;
    }
    if (!companyForm.companyCountry.trim()) {
      toast.error("Company country is required");
      return false;
    }

    try {
      setIsSubmitting(true);
      if (companyForm.teamSize || companyForm.contactsNeeded) {
        await apiClient.post("/onboarding/step/2", {
          teamSize: companyForm.teamSize,
          contactsNeeded: companyForm.contactsNeeded,
          sellOnline: companyForm.sellOnline,
          marketingUpdatesOptIn: companyForm.marketingUpdatesOptIn,
        });
      }

      await apiClient.post("/onboarding/step/1", {
        company: companyForm.company,
        companyWebsite: companyForm.companyWebsite,
        industry: companyForm.industry,
        hasWebsite: Boolean(companyForm.companyWebsite),
      });

      await apiClient.post("/onboarding/step/3", {
        companyAddress: companyForm.companyAddress,
        companyZipcode: companyForm.companyZipcode,
        companyCity: companyForm.companyCity,
        companyCountry: companyForm.companyCountry,
      });

      await refreshUser();
      goNext();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save company details");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeWithSending = async (method: OnboardingSendingMethod) => {
    try {
      setIsSubmitting(true);
      const result = await setPrimarySendingMethodStep5(method);
      await refreshUser();
      return result.redirectTo || "/email/dashboard";
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to complete onboarding");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeWithoutSending = async () => {
    try {
      setIsSubmitting(true);
      const result = await completeOnboardingWithoutSending({
        company: companyForm.company || undefined,
        companyWebsite: companyForm.companyWebsite || undefined,
        industry: companyForm.industry || undefined,
        companyAddress: companyForm.companyAddress || undefined,
        companyZipcode: companyForm.companyZipcode || undefined,
        companyCity: companyForm.companyCity || undefined,
        companyCountry: companyForm.companyCountry || undefined,
      });
      await refreshUser();
      return result.redirectTo || "/email/dashboard";
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to complete onboarding");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipAllOnboarding = async () => {
    try {
      setIsSubmitting(true);
      const result = await skipOnboarding();
      await refreshUser();
      return result.redirectTo || "/email/dashboard";
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to skip setup");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    currentStepIndex,
    totalSteps: ONBOARDING_STEPS.length,
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
  };
}
