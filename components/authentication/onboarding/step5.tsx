"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import { setEmailProviderStep5, type SesProvider } from "@/utils/api/apiClient";

interface Step5Props {
  onBack: () => void;
  isLoading: boolean;
}

export function OnboardingStep5({ onBack, isLoading }: Step5Props) {
  const router = useRouter();
  const { refreshUser } = useAuthContext();
  const [selected, setSelected] = useState<SesProvider | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      toast.error("Please select an email delivery option");
      return;
    }

    try {
      setSubmitting(true);
      await setEmailProviderStep5(selected);
      await refreshUser();
      toast.success("Setup complete! Welcome to LeadSnipper.");
      router.push("/email/dashboard");
    } catch (error: any) {
      console.error("Set email provider error:", error);
      toast.error(
        error.response?.data?.message || "Failed to save. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100 mb-2">
        Email delivery
      </h2>
      <p className="text-sm text-text-200 mb-4">
        Choose how you want to send campaign emails. This is a one-time setup
        and cannot be changed later.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelected("leadsnipper_managed")}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            selected === "leadsnipper_managed"
              ? "border-brand-main bg-brand-main/10"
              : "border-bg-200 hover:border-bg-300 bg-bg-100"
          }`}
        >
          <div className="font-medium text-text-100">
            LeadSnipper Managed
          </div>
          <div className="text-sm text-text-200 mt-1">
            We manage your sending reputation, throttling, and safety. Add your
            domain and sender and run campaigns.
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelected("custom")}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            selected === "custom"
              ? "border-brand-main bg-brand-main/10"
              : "border-bg-200 hover:border-bg-300 bg-bg-100"
          }`}
        >
          <div className="font-medium text-text-100">
            Bring your own SES
          </div>
          <div className="text-sm text-text-200 mt-1">
            Use your own AWS SES account. You manage reputation and limits; we
            provide the tools. Popular with agencies.
          </div>
        </button>
      </div>

      <p className="text-xs text-text-200 mt-2">
        Once you continue, this email delivery choice is locked for your
        account and cannot be edited later. If you need a different setup,
        create a new account with the desired option.
      </p>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading || submitting}
          className="flex-1 py-3 px-4 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || isLoading || submitting}
          className="flex-1 py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Completing..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

export default OnboardingStep5;
