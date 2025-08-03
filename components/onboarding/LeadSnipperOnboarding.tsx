"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconApi,
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconCode,
  IconCopy,
  IconKey,
  IconRocket,
  IconTarget,
  IconX,
} from "@tabler/icons-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface LeadSnipperOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function LeadSnipperOnboarding({
  onComplete,
  onSkip,
}: LeadSnipperOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiToken, setApiToken] = useState("ls_demo_token_12345");

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to LeadSnipper! 🎯",
      description: "Transform any website into actionable lead intelligence with our AI-powered API",
      icon: <IconTarget className="w-8 h-8" />,
      completed: false,
    },
    {
      id: "api-token",
      title: "Get Your API Token",
      description: "Your secure token for accessing the LeadSnipper API",
      icon: <IconKey className="w-8 h-8" />,
      completed: false,
    },
    {
      id: "first-call",
      title: "Make Your First API Call",
      description: "Test the API with a sample request",
      icon: <IconApi className="w-8 h-8" />,
      completed: false,
    },
    {
      id: "explore",
      title: "Explore Features",
      description: "Discover lead scoring, AI enhancement, and more",
      icon: <IconRocket className="w-8 h-8" />,
      completed: false,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "welcome":
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <IconTarget className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Welcome to LeadSnipper!
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                LeadSnipper is an AI-powered API that transforms any website into actionable lead intelligence. 
                Extract business data, score leads, and identify decision makers with simple API calls.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/5 rounded-xl p-4">
                <IconBolt className="w-6 h-6 text-blue-400 mb-2" />
                <h4 className="font-semibold text-white">AI-Enhanced</h4>
                <p className="text-sm text-gray-400">Smart business intelligence extraction</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <IconCode className="w-6 h-6 text-green-400 mb-2" />
                <h4 className="font-semibold text-white">Developer-First</h4>
                <p className="text-sm text-gray-400">RESTful API with great docs</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <IconTarget className="w-6 h-6 text-purple-400 mb-2" />
                <h4 className="font-semibold text-white">Lead Scoring</h4>
                <p className="text-sm text-gray-400">Automatic lead qualification</p>
              </div>
            </div>
          </div>
        );

      case "api-token":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconKey className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Your API Token
              </h3>
              <p className="text-gray-300">
                Use this token to authenticate your API requests
              </p>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-300">API Token</label>
                <button
                  onClick={() => copyToClipboard(apiToken)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <IconCopy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <div className="bg-black/30 rounded-lg p-3 font-mono text-sm text-green-400 break-all">
                {apiToken}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h4 className="font-semibold text-blue-400 mb-2">🔒 Keep it secure!</h4>
              <p className="text-sm text-gray-300">
                Never share your API token publicly. Store it securely in your environment variables.
              </p>
            </div>
          </div>
        );

      case "first-call":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconApi className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Make Your First API Call
              </h3>
              <p className="text-gray-300">
                Try extracting lead intelligence from a website
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-300">Sample Request</label>
                <button
                  onClick={() => copyToClipboard(`curl -X POST https://api.leadsnipper.com/v1/extract \\
  -H "Authorization: Bearer ${apiToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example-company.com",
    "enableAI": true
  }'`)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <IconCopy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <pre className="bg-black/30 rounded-lg p-4 text-sm text-green-400 overflow-x-auto">
{`curl -X POST https://api.leadsnipper.com/v1/extract \\
  -H "Authorization: Bearer ${apiToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example-company.com",
    "enableAI": true
  }'`}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <h4 className="font-semibold text-green-400 mb-2">✅ What you'll get:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Company information</li>
                  <li>• Contact details</li>
                  <li>• Lead score (0-100)</li>
                  <li>• Decision makers</li>
                  <li>• Business signals</li>
                </ul>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="font-semibold text-blue-400 mb-2">📚 Next steps:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Check API documentation</li>
                  <li>• Explore lead scoring</li>
                  <li>• Set up webhooks</li>
                  <li>• Monitor usage</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "explore":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconRocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                You're All Set! 🚀
              </h3>
              <p className="text-gray-300">
                Explore these features to get the most out of LeadSnipper
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                <IconTarget className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="font-semibold text-white mb-2">Lead Scoring</h4>
                <p className="text-sm text-gray-400">
                  Automatically score leads based on company size, industry, and business signals
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                <IconBolt className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="font-semibold text-white mb-2">AI Enhancement</h4>
                <p className="text-sm text-gray-400">
                  Extract business intelligence, pain points, and buying signals with AI
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                <IconApi className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="font-semibold text-white mb-2">API Documentation</h4>
                <p className="text-sm text-gray-400">
                  Comprehensive docs with examples for all endpoints and features
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                <IconKey className="w-8 h-8 text-orange-400 mb-3" />
                <h4 className="font-semibold text-white mb-2">Token Management</h4>
                <p className="text-sm text-gray-400">
                  Create, manage, and monitor your API tokens and usage statistics
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-white">
              LeadSnipper Onboarding
            </div>
            <div className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index <= currentStep
                    ? "bg-gradient-to-r from-blue-500 to-purple-600"
                    : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
