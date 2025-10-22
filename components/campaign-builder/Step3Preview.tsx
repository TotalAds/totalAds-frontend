"use client";

import { useState } from "react";

import { CampaignBuilderState } from "@/app/email/campaigns/builder/page";
import { Button } from "@/components/ui/button";

import { TestEmailModal } from "./TestEmailModal";

interface Step3Props {
  state: CampaignBuilderState;
  setState: (state: CampaignBuilderState) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function CampaignStep3Preview({
  state,
  setState,
  onNext,
  onPrev,
}: Step3Props) {
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);

  // Get sample row
  const sampleRow = state.csvData[selectedRowIndex] || {};

  // Replace variables in template with better handling
  const replaceVariables = (text: string, data: Record<string, string>) => {
    let result = text;

    // First, replace all available variables from the data
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      // Only replace if value exists and is not empty
      if (value && String(value).trim()) {
        result = result.replace(regex, String(value).trim());
      } else {
        // If value is empty, replace with empty string
        result = result.replace(regex, "");
      }
    });

    // Then, remove any remaining unreplaced variables
    result = result.replace(/\{\{(\w+)\}\}/g, "");

    return result;
  };

  const previewSubject = replaceVariables(
    state.emailTemplate.subject,
    sampleRow
  );
  const previewHtml = replaceVariables(
    state.emailTemplate.htmlContent,
    sampleRow
  );

  return (
    <div className="space-y-6">
      {/* Sample Selector */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Sample Lead to Preview
        </label>
        <select
          value={selectedRowIndex}
          onChange={(e) => setSelectedRowIndex(Number(e.target.value))}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {state.csvData.map((row, idx) => (
            <option key={idx} value={idx}>
              {row.email || `Row ${idx + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Email Preview */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Email Details */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Email Details
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">To:</p>
              <p className="text-white font-mono text-sm">{sampleRow.email}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Subject:</p>
              <p className="text-white font-medium">{previewSubject}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">
                Variables in this row:
              </p>
              <div className="space-y-2">
                {state.columns.map((col) => {
                  const value = sampleRow[col];
                  const hasValue = value && String(value).trim();
                  return (
                    <div key={col} className="flex justify-between text-xs">
                      <span
                        className={hasValue ? "text-gray-400" : "text-red-400"}
                      >
                        {col}:
                      </span>
                      <span
                        className={
                          hasValue
                            ? "text-white font-mono"
                            : "text-red-300 font-mono"
                        }
                      >
                        {hasValue ? value : "⚠️ EMPTY"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Email Preview */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Email Preview
          </h3>
          <div className="bg-white rounded-lg p-4 overflow-auto max-h-96">
            <div
              className="text-black text-sm"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {state.csvData.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total Leads</p>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {state.variables.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Variables Used</p>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {state.columns.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Columns</p>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-pink-400">
            {state.csvData.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Credits Needed</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={onPrev}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition"
        >
          ← Back
        </Button>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowTestEmailModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            📧 Send Test Email
          </Button>
          <Button
            onClick={onNext}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
          >
            Next: Send →
          </Button>
        </div>
      </div>

      {/* Test Email Modal */}
      <TestEmailModal
        isOpen={showTestEmailModal}
        onClose={() => setShowTestEmailModal(false)}
        domainId={state.domainId}
        campaignId={state.campaignId}
        templateVariables={state.variables}
        emailTemplate={{
          subject: state.emailTemplate.subject,
          htmlContent: state.emailTemplate.htmlContent,
        }}
        onCampaignCreated={(id) => setState({ ...state, campaignId: id })}
      />
    </div>
  );
}
