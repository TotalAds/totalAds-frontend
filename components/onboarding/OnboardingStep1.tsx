"use client";

import React, { useState } from "react";

import {
  OnboardingOptions,
  OnboardingStep1Data,
} from "@/utils/api/onboardingClient";
import {
  IconBuilding,
  IconPhone,
  IconUser,
  IconWorld,
} from "@tabler/icons-react";

interface OnboardingStep1Props {
  options: OnboardingOptions;
  onSubmit: (data: OnboardingStep1Data) => void;
  isLoading: boolean;
  onSkip: () => void;
  initialData?: OnboardingStep1Data | null;
}

export default function OnboardingStep1({
  options,
  onSubmit,
  isLoading,
  onSkip,
  initialData,
}: OnboardingStep1Props) {
  const [formData, setFormData] = useState<OnboardingStep1Data>({
    company: initialData?.company || "",
    jobTitle: initialData?.jobTitle || "",
    industry: initialData?.industry || "",
    companySize: initialData?.companySize || "",
    companyWebsite: initialData?.companyWebsite || "",
    phoneNumber: initialData?.phoneNumber || "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.company.trim()) {
      newErrors.company = "Company name is required";
    }

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required";
    }

    if (!formData.industry) {
      newErrors.industry = "Please select your industry";
    }

    if (!formData.companySize) {
      newErrors.companySize = "Please select your company size";
    }

    if (formData.companyWebsite && formData.companyWebsite.trim()) {
      try {
        new URL(formData.companyWebsite);
      } catch {
        newErrors.companyWebsite = "Please enter a valid website URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (
    field: keyof OnboardingStep1Data,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Tell us about your business
        </h2>
        <p className="text-gray-300">
          Help us understand your company and role so we can personalize your
          experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200 flex items-center">
            <IconBuilding className="w-4 h-4 mr-2" />
            Company Name *
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            placeholder="Enter your company name"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          />
          {errors.company && (
            <p className="text-red-400 text-xs">{errors.company}</p>
          )}
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200 flex items-center">
            <IconUser className="w-4 h-4 mr-2" />
            Job Title *
          </label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => handleInputChange("jobTitle", e.target.value)}
            placeholder="e.g., Marketing Manager, CEO, Data Analyst"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          />
          {errors.jobTitle && (
            <p className="text-red-400 text-xs">{errors.jobTitle}</p>
          )}
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200">
            Industry *
          </label>
          <select
            value={formData.industry}
            onChange={(e) => handleInputChange("industry", e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          >
            <option value="" className="bg-gray-800">
              Select your industry
            </option>
            {options.industries?.map((industry) => (
              <option key={industry} value={industry} className="bg-gray-800">
                {industry}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="text-red-400 text-xs">{errors.industry}</p>
          )}
        </div>

        {/* Company Size */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200">
            Company Size *
          </label>
          <select
            value={formData.companySize}
            onChange={(e) => handleInputChange("companySize", e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          >
            <option value="" className="bg-gray-800">
              Select company size
            </option>
            {options.companySizes?.map((size) => (
              <option key={size} value={size} className="bg-gray-800">
                {size} employees
              </option>
            ))}
          </select>
          {errors.companySize && (
            <p className="text-red-400 text-xs">{errors.companySize}</p>
          )}
        </div>

        {/* Company Website (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200 flex items-center">
            <IconWorld className="w-4 h-4 mr-2" />
            Company Website
            <span className="text-gray-400 ml-1">(optional)</span>
          </label>
          <input
            type="url"
            value={formData.companyWebsite}
            onChange={(e) =>
              handleInputChange("companyWebsite", e.target.value)
            }
            placeholder="https://yourcompany.com"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          />
          {errors.companyWebsite && (
            <p className="text-red-400 text-xs">{errors.companyWebsite}</p>
          )}
        </div>

        {/* Phone Number (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200 flex items-center">
            <IconPhone className="w-4 h-4 mr-2" />
            Phone Number
            <span className="text-gray-400 ml-1">(optional)</span>
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            placeholder="+1 (555) 123-4567"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="px-6 py-3 text-gray-300 hover:text-white transition-colors duration-200 disabled:opacity-50"
          >
            Skip for now
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
