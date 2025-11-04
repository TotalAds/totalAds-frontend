"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import warmupClient from "@/utils/api/warmupClient";
import { IconArrowLeft, IconArrowRight, IconCheck } from "@tabler/icons-react";

interface WarmupWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
  verifiedDomains: Array<{
    id: string;
    domain: string;
    verifiedEmails: Array<{
      id: string;
      email: string;
    }>;
  }>;
}

type WizardStep = "settings" | "strategy" | "content" | "review";

interface WarmupFormData {
  email: string;
  provider: "gmail" | "outlook" | "yahoo" | "zoho" | "custom";
  displayName: string;
  dailyLimit: number;
  strategyType: "aggressive" | "moderate" | "conservative";
  emailContent: string;
}

export function WarmupWizard({
  onSuccess,
  onCancel,
  verifiedDomains,
}: WarmupWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("settings");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WarmupFormData>({
    email: "",
    provider: "gmail",
    displayName: "",
    dailyLimit: 50,
    strategyType: "moderate",
    emailContent: "",
  });

  const steps: WizardStep[] = ["settings", "strategy", "content", "review"];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await warmupClient.post("/accounts", {
        email: formData.email,
        provider: formData.provider,
        displayName: formData.displayName,
        dailyLimit: formData.dailyLimit,
      });
      toast.success("Warmup account created successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Failed to create warmup account:", error);
      toast.error(
        error.response?.data?.message || "Failed to create warmup account"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = (step: WizardStep) => {
    const titles: Record<WizardStep, string> = {
      settings: "Warmup Settings",
      strategy: "Strategy Type",
      content: "Email Content",
      review: "Review",
    };
    return titles[step];
  };

  const getStepNumber = (step: WizardStep) => {
    return steps.indexOf(step) + 1;
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-text-200 hover:text-text-100 transition mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-text-100">
            Add Warmup Account
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Set up your email warmup in 4 simple steps
          </p>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-bg-200 border-b border-bg-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    index <= currentStepIndex
                      ? "bg-brand-main text-text-100"
                      : "bg-bg-300 text-text-200"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <IconCheck className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStepIndex
                      ? "text-text-100"
                      : "text-text-200"
                  }`}
                >
                  {getStepTitle(step)}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-4 transition ${
                      index < currentStepIndex ? "bg-brand-main" : "bg-bg-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === "settings" && (
          <div className="space-y-6">
            <div>
              <label className="block text-text-100 font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
                placeholder="sender@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-text-100 font-medium mb-2">
                Email Provider *
              </label>
              <select
                value={formData.provider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    provider: e.target.value as any,
                  })
                }
                className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="yahoo">Yahoo</option>
                <option value="zoho">Zoho</option>
                <option value="custom">Custom SMTP</option>
              </select>
            </div>

            <div>
              <label className="block text-text-100 font-medium mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-text-100 font-medium mb-2">
                Daily Warmup Limit
              </label>
              <input
                type="number"
                value={formData.dailyLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyLimit: parseInt(e.target.value),
                  })
                }
                min="10"
                max="500"
                className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
              />
              <p className="text-text-200 text-sm mt-2">
                Recommended: 50-100 emails per day for best deliverability
              </p>
            </div>
          </div>
        )}

        {currentStep === "strategy" && (
          <div className="space-y-6">
            <p className="text-text-200">
              Choose your warmup strategy based on your goals
            </p>

            {[
              {
                value: "conservative",
                title: "Conservative",
                description: "Slow and steady - 20-50 emails/day",
              },
              {
                value: "moderate",
                title: "Moderate",
                description: "Balanced approach - 50-100 emails/day",
              },
              {
                value: "aggressive",
                title: "Aggressive",
                description: "Fast growth - 100-200 emails/day",
              },
            ].map((strategy) => (
              <div
                key={strategy.value}
                onClick={() =>
                  setFormData({
                    ...formData,
                    strategyType: strategy.value as any,
                  })
                }
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  formData.strategyType === strategy.value
                    ? "border-brand-main bg-brand-main/10"
                    : "border-bg-300 bg-bg-300 hover:border-brand-main/50"
                }`}
              >
                <h3 className="font-bold text-text-100">{strategy.title}</h3>
                <p className="text-text-200 text-sm mt-1">
                  {strategy.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {currentStep === "content" && (
          <div className="space-y-6">
            <div>
              <label className="block text-text-100 font-medium mb-2">
                Email Content Template
              </label>
              <textarea
                value={formData.emailContent}
                onChange={(e) =>
                  setFormData({ ...formData, emailContent: e.target.value })
                }
                className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main h-40"
                placeholder="Enter your warmup email template..."
              />
              <p className="text-text-200 text-sm mt-2">
                This template will be used for warmup emails
              </p>
            </div>
          </div>
        )}

        {currentStep === "review" && (
          <div className="space-y-6">
            <div className="bg-bg-300 rounded-lg p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-text-200">Email:</span>
                <span className="text-text-100 font-medium">
                  {formData.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-200">Provider:</span>
                <span className="text-text-100 font-medium capitalize">
                  {formData.provider}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-200">Daily Limit:</span>
                <span className="text-text-100 font-medium">
                  {formData.dailyLimit} emails/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-200">Strategy:</span>
                <span className="text-text-100 font-medium capitalize">
                  {formData.strategyType}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-12">
          <Button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex-1 bg-bg-300 hover:bg-bg-300/80 text-text-100 px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <IconArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStepIndex < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex-1 bg-brand-main hover:bg-brand-main/80 text-text-100 px-6 py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              Next
              <IconArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-text-100 px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Creating..." : "Create Account"}
              <IconCheck className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
