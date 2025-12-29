"use client";

import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  getTemplates,
  runCampaign,
  validateCampaign,
  WhatsAppTemplate,
} from "@/utils/api/whatsappClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [campaignName, setCampaignName] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [step, setStep] = useState<"details" | "upload" | "review">("details");

  // TODO: Get phoneNumberId from user settings
  const phoneNumberId = "default";

  const loadTemplates = async () => {
    try {
      const data = await getTemplates(phoneNumberId, "APPROVED");
      setTemplates(data);
    } catch (error: any) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCsvData(results.data as any[]);
        setStep("review");
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleValidate = async () => {
    if (csvData.length === 0) {
      toast.error("Please upload a CSV file first");
      return;
    }

    try {
      setLoading(true);
      const result = await validateCampaign(csvData);
      setValidationResult(result);

      if (!result.valid) {
        toast.error(
          `Validation failed: ${result.invalidRecords} invalid records`
        );
      } else {
        toast.success("CSV validated successfully!");
      }
    } catch (error: any) {
      console.error("Error validating campaign:", error);
      toast.error(
        error.response?.data?.message || "Failed to validate campaign"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!campaignName || !selectedTemplate || csvData.length === 0) {
      toast.error("Please fill in all fields and upload CSV");
      return;
    }

    if (!validationResult?.valid) {
      toast.error("Please validate the CSV first");
      return;
    }

    try {
      setLoading(true);
      const template = templates.find((t) => t.id === selectedTemplate);
      if (!template) {
        toast.error("Template not found");
        return;
      }

      await runCampaign({
        campaignName,
        templateName: template.templateName,
        templateLanguage: template.language,
        csvData,
      });

      toast.success("Campaign created successfully!");
      router.push("/whatsapp/campaigns");
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error(error.response?.data?.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-text-100">
            Create WhatsApp Campaign
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Create a new WhatsApp campaign with template messages
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-8">
          {/* Step 1: Campaign Details */}
          {step === "details" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-200 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name"
                  className="w-full px-4 py-2 bg-bg-200 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-200 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-200 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.templateName} ({template.language})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep("upload")}
                  disabled={!campaignName || !selectedTemplate}
                  className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
                >
                  Next: Upload CSV
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload CSV */}
          {step === "upload" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-200 mb-2">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-brand-main/30 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <svg
                      className="w-12 h-12 text-brand-main"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div>
                      <p className="text-text-100 font-medium">
                        Click to upload CSV
                      </p>
                      <p className="text-text-200 text-sm mt-1">
                        CSV must include phoneNumber column
                      </p>
                    </div>
                  </label>
                </div>
                {csvFile && (
                  <p className="text-sm text-text-200 mt-2">
                    Selected: {csvFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={() => setStep("details")}
                  className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 px-6 py-2 rounded-lg transition"
                >
                  Back
                </Button>
                <Button
                  onClick={handleValidate}
                  disabled={csvData.length === 0 || loading}
                  className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
                >
                  {loading ? "Validating..." : "Validate CSV"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === "review" && validationResult && (
            <div className="space-y-6">
              <div className="bg-bg-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-100 mb-4">
                  Validation Results
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-text-200 text-sm">Total Records</p>
                    <p className="text-2xl font-bold text-text-100">
                      {validationResult.totalRecords}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-sm">Valid Records</p>
                    <p className="text-2xl font-bold text-green-400">
                      {validationResult.validRecords}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-sm">Invalid Records</p>
                    <p className="text-2xl font-bold text-red-400">
                      {validationResult.invalidRecords}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-200 text-sm">Status</p>
                    <p
                      className={`text-2xl font-bold ${
                        validationResult.valid
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {validationResult.valid ? "Valid" : "Invalid"}
                    </p>
                  </div>
                </div>

                {validationResult.errors &&
                  validationResult.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-text-200 text-sm mb-2">Errors:</p>
                      <div className="max-h-48 overflow-y-auto">
                        {validationResult.errors
                          .slice(0, 10)
                          .map((error: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-xs text-red-400 p-2 bg-red-500/10 rounded mb-1"
                            >
                              Row {error.row}: {error.error}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={() => setStep("upload")}
                  className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 px-6 py-2 rounded-lg transition"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!validationResult.valid || loading}
                  className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
                >
                  {loading ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
