"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import CampaignStep1CSVUpload from "@/components/campaign-builder/Step1CSVUpload";
import CampaignStep2EmailTemplate from "@/components/campaign-builder/Step2EmailTemplate";
import CampaignStep3Preview from "@/components/campaign-builder/Step3Preview";
import CampaignStep4Send from "@/components/campaign-builder/Step4Send";
import CampaignStep5Status from "@/components/campaign-builder/Step5Status";

export interface CampaignBuilderState {
  step: number;
  csvData: Array<Record<string, string>>;
  columns: string[];
  emailTemplate: {
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      file: File;
    }>;
  };
  variables: string[];
  campaignName: string;
  campaignDescription: string;
  senderId: string;
  domainId: string;
  campaignId?: string;
  sendingStatus?: {
    total: number;
    sent: number;
    bounced: number;
    opened: number;
    clicked: number;
  };
}

const STEPS = [
  { number: 1, title: "Upload CSV", description: "Upload your leads" },
  { number: 2, title: "Email Template", description: "Create your email" },
  { number: 3, title: "Preview", description: "Review sample email" },
  { number: 4, title: "Send", description: "Configure & send" },
  { number: 5, title: "Status", description: "Track results" },
];

export default function CampaignBuilderPage() {
  const router = useRouter();
  const [state, setState] = useState<CampaignBuilderState>({
    step: 1,
    csvData: [],
    columns: [],
    emailTemplate: {
      subject: "",
      htmlContent: "",
      textContent: "",
      attachments: [],
    },
    variables: [],
    campaignName: "",
    campaignDescription: "",
    senderId: "",
    domainId: "",
  });

  const handleNextStep = () => {
    if (state.step < 5) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePreviousStep = () => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancel = () => {
    if (
      confirm("Are you sure you want to cancel? All progress will be lost.")
    ) {
      router.push("/email/campaigns");
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return (
          <CampaignStep1CSVUpload
            state={state}
            setState={setState}
            onNext={handleNextStep}
          />
        );
      case 2:
        return (
          <CampaignStep2EmailTemplate
            state={state}
            setState={setState}
            onNext={handleNextStep}
            onPrev={handlePreviousStep}
          />
        );
      case 3:
        return (
          <CampaignStep3Preview
            state={state}
            setState={setState}
            onNext={handleNextStep}
            onPrev={handlePreviousStep}
          />
        );
      case 4:
        return (
          <CampaignStep4Send
            state={state}
            setState={setState}
            onNext={handleNextStep}
            onPrev={handlePreviousStep}
          />
        );
      case 5:
        return (
          <CampaignStep5Status
            state={state}
            setState={setState}
            onPrev={handlePreviousStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-xl font-bold text-white">Campaign Builder</h1>
              <p className="text-gray-400 text-sm mt-1">
                Create and send professional email campaigns
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold transition ${
                    state.step >= step.number
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {state.step > step.number ? "✓" : step.number}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white m-0 mb-1">
                    {step.title}
                  </p>
                  <p className="text-xs m-0 text-gray-400">
                    {step.description}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition ${
                      state.step > step.number ? "bg-purple-600" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}
      </main>
    </div>
  );
}
