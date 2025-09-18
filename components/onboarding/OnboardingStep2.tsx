"use client";

import React, { useState } from "react";

import {
  OnboardingOptions,
  OnboardingStep2Data,
} from "@/utils/api/onboardingClient";
import { IconBulb, IconSpeakerphone, IconTarget } from "@tabler/icons-react";

interface OnboardingStep2Props {
  options: OnboardingOptions;
  onSubmit: (data: OnboardingStep2Data) => void;
  onBack: () => void;
  isLoading: boolean;
  initialData?: OnboardingStep2Data | null;
}

export default function OnboardingStep2({
  options,
  onSubmit,
  onBack,
  isLoading,
  initialData,
}: OnboardingStep2Props) {
  const [formData, setFormData] = useState<OnboardingStep2Data>({
    useCase: initialData?.useCase || "",
    businessGoals: initialData?.businessGoals || "",
    hearAboutUs: initialData?.hearAboutUs || "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.useCase) {
      newErrors.useCase = "Please select your primary use case";
    }

    if (!formData.businessGoals.trim()) {
      newErrors.businessGoals = "Please describe your business goals";
    } else if (formData.businessGoals.trim().length < 10) {
      newErrors.businessGoals = "Please provide more details about your goals";
    }

    if (!formData.hearAboutUs) {
      newErrors.hearAboutUs = "Please tell us how you heard about us";
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
    field: keyof OnboardingStep2Data,
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
          What brings you to Leadsnipper?
        </h2>
        <p className="text-gray-300">
          Understanding your goals helps us provide the best experience and
          recommendations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary Use Case */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200 flex items-center">
            <IconTarget className="w-4 h-4 mr-2" />
            Primary Use Case *
          </label>
          <select
            value={formData.useCase}
            onChange={(e) => handleInputChange("useCase", e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          >
            <option value="" className="bg-gray-800">
              Select your primary use case
            </option>
            {options.useCases.map((useCase) => (
              <option key={useCase} value={useCase} className="bg-gray-800">
                {useCase}
              </option>
            ))}
          </select>
          {errors.useCase && (
            <p className="text-red-400 text-xs">{errors.useCase}</p>
          )}
        </div>

        {/* Business Goals */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200 flex items-center">
            <IconBulb className="w-4 h-4 mr-2" />
            Business Goals *
          </label>
          <textarea
            value={formData.businessGoals}
            onChange={(e) => handleInputChange("businessGoals", e.target.value)}
            placeholder="Tell us what you want to achieve with our platform. For example: 'Generate leads for our SaaS product', 'Research competitors in the fintech space', 'Extract contact information for outreach campaigns'..."
            disabled={isLoading}
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm resize-none"
          />
          <div className="flex justify-between items-center">
            {errors.businessGoals && (
              <p className="text-red-400 text-xs">{errors.businessGoals}</p>
            )}
            <p className="text-gray-400 text-xs ml-auto">
              {formData.businessGoals.length}/500 characters
            </p>
          </div>
        </div>

        {/* How did you hear about us */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200 flex items-center">
            <IconSpeakerphone className="w-4 h-4 mr-2" />
            How did you hear about us? *
          </label>
          <select
            value={formData.hearAboutUs}
            onChange={(e) => handleInputChange("hearAboutUs", e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          >
            <option value="" className="bg-gray-800">
              Select how you found us
            </option>
            {options.hearAboutUsOptions.map((option) => (
              <option key={option} value={option} className="bg-gray-800">
                {option}
              </option>
            ))}
          </select>
          {errors.hearAboutUs && (
            <p className="text-red-400 text-xs">{errors.hearAboutUs}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 text-gray-300 hover:text-white transition-colors duration-200 disabled:opacity-50 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
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
