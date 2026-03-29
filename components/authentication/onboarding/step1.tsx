"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";

import { OnboardingData } from "../onboarding";

interface Step1Props {
  onComplete: (data: Partial<OnboardingData>) => void;
  isLoading: boolean;
}

export function OnboardingStep1({ onComplete, isLoading }: Step1Props) {
  const { refreshUser } = useAuthContext();
  const [formData, setFormData] = useState({
    company: "",
    companyWebsite: "",
    hasWebsite: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (
      formData.hasWebsite &&
      formData.companyWebsite &&
      !formData.companyWebsite.startsWith("http")
    ) {
      toast.error("Please enter a valid website URL");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/onboarding/step/1", {
        company: formData.company,
        companyWebsite: formData.hasWebsite ? formData.companyWebsite : "",
        hasWebsite: formData.hasWebsite,
      });

      await refreshUser();
      toast.success("Step 1 completed!");
      onComplete(formData);
    } catch (error: any) {
      console.error("Step 1 error:", error);
      toast.error(error.response?.data?.message || "Failed to save step 1");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100 mb-4">
        Tell us about your company
      </h2>

      <div>
        <label className="block text-sm font-medium text-text-100 mb-1">
          Company Name
        </label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Your Company"
          className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
        />
      </div>

      <div className="flex items-center gap-2 py-2">
        <input
          type="checkbox"
          id="hasWebsite"
          name="hasWebsite"
          checked={formData.hasWebsite}
          onChange={handleChange}
          className="w-4 h-4 rounded border-bg-200 text-brand-main focus:ring-brand-main"
        />
        <label htmlFor="hasWebsite" className="text-sm text-text-100">
          My company has a website
        </label>
      </div>

      {formData.hasWebsite && (
        <div>
          <label className="block text-sm font-medium text-text-100 mb-1">
            Website URL
          </label>
          <input
            type="url"
            name="companyWebsite"
            value={formData.companyWebsite}
            onChange={handleChange}
            placeholder="https://example.com"
            className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading || submitting}
          className="w-full py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Next"}
        </button>
      </div>
    </form>
  );
}

export default OnboardingStep1;
