"use client";

import React, { useState } from "react";

import type { CompanyFormState } from "./hooks/useOnboardingWizard";

interface Step2CombinedProps {
  formData: CompanyFormState;
  onChange: (data: Partial<CompanyFormState>) => void;
  onComplete: () => void;
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
  formData,
  onChange,
  onComplete,
  onBack,
  isLoading,
}: Step2CombinedProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    onChange({
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
  };

  return (
    <form onSubmit={handleContinue} className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100 mb-4">
        Company details
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
          placeholder="Your company"
          className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-100 mb-1">
          Website
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

      <div>
        <label className="block text-sm font-medium text-text-100 mb-2">
          Industry (optional)
        </label>
        <select
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
        >
          <option value="">Select industry</option>
          {[
            "Technology",
            "Healthcare",
            "Finance",
            "E-commerce",
            "Marketing & Advertising",
            "Real Estate",
            "Education",
            "Manufacturing",
            "Consulting",
            "Media & Entertainment",
            "Non-profit",
            "Government",
            "Other",
          ].map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-semibold text-text-100 mb-2">
          Mailing address (required)
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

      <button
        type="button"
        onClick={() => setShowAdvanced((prev) => !prev)}
        className="text-sm text-brand-main"
      >
        {showAdvanced ? "Hide" : "Add"} business details (optional)
      </button>

      {showAdvanced && (
        <div className="space-y-4 rounded-lg border border-bg-200 p-3">
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
                I&apos;d like to receive marketing updates and tips
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3 px-4 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Continue"}
        </button>
      </div>
    </form>
  );
}

export default OnboardingStep2Combined;

