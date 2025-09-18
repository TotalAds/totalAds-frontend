"use client";

import React from "react";

import {
  OnboardingStep1Data,
  OnboardingStep2Data,
} from "@/utils/api/onboardingClient";
import {
  IconCheck,
  IconRocket,
  IconTarget,
  IconUsers,
} from "@tabler/icons-react";

interface OnboardingWelcomeProps {
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
  step1Data: OnboardingStep1Data | null;
  step2Data: OnboardingStep2Data | null;
}

export default function OnboardingWelcome({
  onComplete,
  onBack,
  isLoading,
  step1Data,
  step2Data,
}: OnboardingWelcomeProps) {
  const features = [
    {
      icon: IconRocket,
      title: "AI-Powered Scraping",
      description:
        "Extract comprehensive business data with our advanced AI technology",
    },
    {
      icon: IconTarget,
      title: "Targeted Results",
      description: "Get precisely the data you need for your specific use case",
    },
    {
      icon: IconUsers,
      title: "Expert Support",
      description:
        "Our team is here to help you succeed with your data extraction goals",
    },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <IconCheck className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          You&apos;re all set!
        </h2>
        <p className="text-gray-300 text-lg">
          Welcome to Leadsnipper,{" "}
          {step1Data?.company ? `${step1Data.company} team` : "there"}!
        </p>
      </div>

      {/* Summary of provided information */}
      <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Profile Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {step1Data && (
            <>
              <div>
                <span className="text-gray-400">Company:</span>
                <span className="text-white ml-2">{step1Data.company}</span>
              </div>
              <div>
                <span className="text-gray-400">Role:</span>
                <span className="text-white ml-2">{step1Data.jobTitle}</span>
              </div>
              <div>
                <span className="text-gray-400">Industry:</span>
                <span className="text-white ml-2">{step1Data.industry}</span>
              </div>
              <div>
                <span className="text-gray-400">Company Size:</span>
                <span className="text-white ml-2">
                  {step1Data.companySize} employees
                </span>
              </div>
            </>
          )}
          {step2Data && (
            <>
              <div className="md:col-span-2">
                <span className="text-gray-400">Primary Use Case:</span>
                <span className="text-white ml-2">{step2Data.useCase}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-400">Goals:</span>
                <span className="text-white ml-2">
                  {step2Data.businessGoals}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Features showcase */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          What you can do with Leadsnipper
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">
                  {feature.title}
                </h4>
                <p className="text-gray-300 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 mb-8 border border-purple-500/30">
        <h3 className="text-lg font-semibold text-white mb-3">
          🎉 What&apos;s Next?
        </h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Start with 20 free API calls to test our platform
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Explore our dashboard and try scraping your first website
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Check out our API documentation for integration
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Upgrade to Pro for unlimited access and advanced features
          </li>
        </ul>
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
          type="button"
          onClick={onComplete}
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              Completing...
            </span>
          ) : (
            <span className="flex items-center">
              <IconRocket className="w-5 h-5 mr-2" />
              Get Started
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
