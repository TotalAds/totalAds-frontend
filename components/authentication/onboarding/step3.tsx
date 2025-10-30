"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';

import apiClient from '@/utils/api/apiClient';

import { OnboardingData } from '../onboarding';

interface Step3Props {
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function OnboardingStep3({ onComplete, onBack, isLoading }: Step3Props) {
  const [formData, setFormData] = useState({
    companyAddress: "",
    companyZipcode: "",
    companyCity: "",
    companyCountry: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyAddress.trim()) {
      toast.error("Address is required");
      return;
    }
    if (!formData.companyZipcode.trim()) {
      toast.error("Zipcode is required");
      return;
    }
    if (!formData.companyCity.trim()) {
      toast.error("City is required");
      return;
    }
    if (!formData.companyCountry.trim()) {
      toast.error("Country is required");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/onboarding/step/3", {
        companyAddress: formData.companyAddress,
        companyZipcode: formData.companyZipcode,
        companyCity: formData.companyCity,
        companyCountry: formData.companyCountry,
      });

      toast.success("Step 3 completed!");
      onComplete(formData);
    } catch (error: any) {
      console.error("Step 3 error:", error);
      toast.error(error.response?.data?.message || "Failed to save step 3");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100 mb-4">
        Company Address
      </h2>

      <div>
        <label className="block text-sm font-medium text-text-100 mb-1">
          Street Address
        </label>
        <input
          type="text"
          name="companyAddress"
          value={formData.companyAddress}
          onChange={handleChange}
          placeholder="123 Main Street"
          className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-text-100 mb-1">
            Zipcode
          </label>
          <input
            type="text"
            name="companyZipcode"
            value={formData.companyZipcode}
            onChange={handleChange}
            placeholder="12345"
            className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-100 mb-1">
            City
          </label>
          <input
            type="text"
            name="companyCity"
            value={formData.companyCity}
            onChange={handleChange}
            placeholder="New York"
            className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-100 mb-1">
          Country
        </label>
        <input
          type="text"
          name="companyCountry"
          value={formData.companyCountry}
          onChange={handleChange}
          placeholder="United States"
          className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
        />
      </div>

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
          type="submit"
          disabled={isLoading || submitting}
          className="flex-1 py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Next"}
        </button>
      </div>
    </form>
  );
}

export default OnboardingStep3;
