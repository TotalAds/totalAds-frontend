"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";

import { OnboardingData } from "../onboarding";

interface Step2CombinedProps {
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const TEAM_SIZES = [
  "Just me",
  "2-5",
  "6-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+",
];

const CONTACTS_NEEDED = [
  "Less than 100",
  "100-500",
  "500-1000",
  "1000-5000",
  "5000-10000",
  "10000+",
];

export function OnboardingStep2Combined({
  onComplete,
  onBack,
  isLoading,
}: Step2CombinedProps) {
  const { refreshUser } = useAuthContext();
  const [formData, setFormData] = useState({
    teamSize: "",
    contactsNeeded: "",
    sellOnline: false,
    marketingUpdatesOptIn: false,
    companyAddress: "",
    companyZipcode: "",
    companyCity: "",
    companyCountry: "",
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

    if (!formData.teamSize) {
      toast.error("Please select team size");
      return;
    }
    if (!formData.contactsNeeded) {
      toast.error("Please select contacts needed");
      return;
    }
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

      // Persist the exact same data as before, just from one screen.
      await apiClient.post("/onboarding/step/2", {
        teamSize: formData.teamSize,
        contactsNeeded: formData.contactsNeeded,
        sellOnline: formData.sellOnline,
        marketingUpdatesOptIn: formData.marketingUpdatesOptIn,
      });

      await apiClient.post("/onboarding/step/3", {
        companyAddress: formData.companyAddress,
        companyZipcode: formData.companyZipcode,
        companyCity: formData.companyCity,
        companyCountry: formData.companyCountry,
      });

      await refreshUser();
      toast.success("Saved!");
      onComplete(formData);
    } catch (error: any) {
      console.error("Step 2 (combined) error:", error);
      toast.error(error.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100 mb-4">
        Your setup details
      </h2>

      <div>
        <label className="block text-sm font-medium text-text-100 mb-2">
          Team Size
        </label>
        <select
          name="teamSize"
          value={formData.teamSize}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
        >
          <option value="">Select team size</option>
          {TEAM_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-100 mb-2">
          How many contacts do you need?
        </label>
        <select
          name="contactsNeeded"
          value={formData.contactsNeeded}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
        >
          <option value="">Select range</option>
          {CONTACTS_NEEDED.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sellOnline"
            name="sellOnline"
            checked={formData.sellOnline}
            onChange={handleChange}
            className="w-4 h-4 rounded border-bg-200 text-brand-main focus:ring-brand-main"
          />
          <label htmlFor="sellOnline" className="text-sm text-text-100">
            Do you sell online?
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="marketingUpdates"
            name="marketingUpdatesOptIn"
            checked={formData.marketingUpdatesOptIn}
            onChange={handleChange}
            className="w-4 h-4 rounded border-bg-200 text-brand-main focus:ring-brand-main"
          />
          <label htmlFor="marketingUpdates" className="text-sm text-text-100">
            I’d like to receive marketing updates and tips
          </label>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-medium text-text-100 mb-2">
          Company address
        </h3>

        <div className="space-y-3">
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
        </div>
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

export default OnboardingStep2Combined;

