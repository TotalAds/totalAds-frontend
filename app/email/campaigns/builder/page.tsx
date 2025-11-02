"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import CampaignStep1CSVUpload from "@/components/campaign-builder/Step1CSVUpload";
import CampaignStep2EmailTemplate from "@/components/campaign-builder/Step2EmailTemplate";
import CampaignStep4Send from "@/components/campaign-builder/Step4Send";
import CampaignStep5Status from "@/components/campaign-builder/Step5Status";
import emailClient, { LeadCategory, LeadTag } from "@/utils/api/emailClient";

export interface CampaignBuilderState {
  step: number;
  csvData: Array<Record<string, string>>;
  columns: string[];
  emailColumn: string; // which column contains the email
  emailTemplate: {
    subject: string;
    previewText?: string;
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
  physicalAddress: string;
  selectedTags: LeadTag[];
  selectedCategories: LeadCategory[]; // aka segmentation
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
  { number: 3, title: "Send", description: "Configure & send" },
  { number: 4, title: "Status", description: "Track results" },
];

export default function CampaignBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("id");
  const [isLoading, setIsLoading] = useState(!!campaignIdParam);

  const [state, setState] = useState<CampaignBuilderState>({
    step: 1,
    csvData: [],
    columns: [],
    emailColumn: "email",
    emailTemplate: {
      subject: "",
      previewText: "",
      htmlContent: "",
      textContent: "",
      attachments: [],
    },
    variables: [],
    campaignName: "",
    campaignDescription: "",
    senderId: "",
    domainId: "",
    physicalAddress: "",
    selectedTags: [],
    selectedCategories: [],
  });

  // Load campaign data if editing
  useEffect(() => {
    if (!campaignIdParam) {
      setIsLoading(false);
      return;
    }

    const loadCampaignData = async () => {
      try {
        setIsLoading(true);
        const response = await emailClient.get(
          `/api/campaigns/${campaignIdParam}`
        );
        const campaign = response.data?.data;

        if (campaign) {
          setState((prev) => ({
            ...prev,
            campaignId: campaign.id,
            campaignName: campaign.name || "",
            campaignDescription: campaign.description || "",
            emailTemplate: {
              subject: campaign.subject || "",
              previewText:
                (campaign.sequence?.[0]?.previewText as string) ||
                (campaign.previewText as string) ||
                "",
              htmlContent: campaign.htmlContent || "",
              textContent: campaign.textContent || "",
              attachments: [],
            },
            domainId: campaign.domainId || "",
            senderId: campaign.senderId || "",
            variables: campaign.variables || [],
          }));
        }
      } catch (error: any) {
        console.error("Failed to load campaign:", error);
        toast.error("Failed to load campaign data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignData();
  }, [campaignIdParam]);

  const handleNextStep = () => {
    if (state.step < 4) {
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
          <CampaignStep4Send
            state={state}
            setState={setState}
            onNext={handleNextStep}
            onPrev={handlePreviousStep}
          />
        );
      case 4:
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-main mx-auto mb-4"></div>
          <p className="text-text-100 text-lg">Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-lg font-bold text-text-100">
                Campaign Builder
              </h1>
            </div>
            <button
              onClick={handleCancel}
              className="text-text-200 hover:text-text-100 transition"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className="flex items-center flex-1 min-w-0"
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs transition flex-shrink-0 ${
                    state.step >= step.number
                      ? "bg-brand-main text-text-100"
                      : "bg-brand-main/10 text-text-200"
                  }`}
                >
                  {state.step > step.number ? "✓" : step.number}
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-text-100 m-0 truncate">
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded transition ${
                      state.step > step.number
                        ? "bg-brand-main"
                        : "bg-brand-main/10"
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
