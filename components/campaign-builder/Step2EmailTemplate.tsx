"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { CampaignBuilderState } from "@/app/email/campaigns/builder/page";
import { Button } from "@/components/ui/button";

import EmailTemplateEditor from "./EmailTemplateEditor";

interface Step2Props {
  state: CampaignBuilderState;
  setState: (state: CampaignBuilderState) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface ComplianceStatus {
  hasUnsubscribeLink: boolean;
  hasPhysicalAddress: boolean;
  hasAddressInput: boolean;
}

export default function CampaignStep2EmailTemplate({
  state,
  setState,
  onNext,
  onPrev,
}: Step2Props) {
  const MAX_ATTACHMENTS = 1;
  const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentAttachments = state.emailTemplate.attachments || [];
    if (currentAttachments.length >= MAX_ATTACHMENTS) {
      toast.error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large (max 7MB)`);
        return;
      }

      if (currentAttachments.length < MAX_ATTACHMENTS) {
        const newAttachments = [
          ...currentAttachments,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            file,
          },
        ];

        setState({
          ...state,
          emailTemplate: {
            ...state.emailTemplate,
            attachments: newAttachments,
          },
        });

        toast.success(`Added ${file.name}`);
      }
    });
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = (state.emailTemplate.attachments || []).filter(
      (_, i) => i !== index
    );
    setState({
      ...state,
      emailTemplate: {
        ...state.emailTemplate,
        attachments: newAttachments,
      },
    });
  };

  // Extract variables from CSV columns, filtering out internal database fields
  const INTERNAL_FIELDS = [
    "id",
    "lead_id",
    "user_id",
    "created_at",
    "updated_at",
    "campaign_id",
    "category_id",
    "status",
    "enriched_data",
    "bounce_reason",
    "complaint_reason",
    "unsubscribe_reason",
    "last_email_sent_at",
    "last_interaction_at",
  ];

  const availableVariables = state.columns
    .filter((e) => e !== "__EMPTY")
    .filter((e) => !INTERNAL_FIELDS.includes(e.toLowerCase()))
    .map((e) => `{{${e.trim()}}}`);
  // Check compliance status
  const getComplianceStatus = (): ComplianceStatus => {
    const hasUnsubscribeLink = /{{\s*unsubscribe_link\s*}}/i.test(
      state.emailTemplate.htmlContent
    );
    const hasPhysicalAddress = /{{\s*physical_address\s*}}/i.test(
      state.emailTemplate.htmlContent
    );
    const hasAddressInput = !!(
      state.physicalAddress && state.physicalAddress.trim()
    );

    return {
      hasUnsubscribeLink,
      hasPhysicalAddress,
      hasAddressInput,
    };
  };

  const complianceStatus = getComplianceStatus();

  const handleNext = () => {
    if (!state.emailTemplate.subject.trim()) {
      toast.error("Email subject is required");
      return;
    }
    if (!state.emailTemplate.htmlContent.trim()) {
      toast.error("Email content is required");
      return;
    }
    // Physical address optional; backend will auto-insert default if missing

    // Extract variables used in template
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = state.emailTemplate.htmlContent.match(variableRegex) || [];
    const uniqueVariables = [...new Set(matches)];

    setState({
      ...state,
      variables: uniqueVariables,
    });

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Email Template Editor */}
      <EmailTemplateEditor
        subject={state.emailTemplate.subject}
        previewText={state.emailTemplate.previewText || ""}
        htmlContent={state.emailTemplate.htmlContent}
        availableVariables={availableVariables}
        complianceStatus={complianceStatus}
        onSubjectChange={(subject) =>
          setState({
            ...state,
            emailTemplate: {
              ...state.emailTemplate,
              subject,
            },
          })
        }
        onPreviewTextChange={(previewText) =>
          setState({
            ...state,
            emailTemplate: {
              ...state.emailTemplate,
              previewText,
            },
          })
        }
        onHtmlContentChange={(htmlContent) =>
          setState({
            ...state,
            emailTemplate: {
              ...state.emailTemplate,
              htmlContent,
            },
          })
        }
      />
      {/* Attachments Section */}
      <div className="bg-bg-200/30 border border-brand-main/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-text-100 flex items-center gap-2">
            <span>📎</span>
            Attachments
            <span className="text-xs text-text-200/60 font-normal">
              (Optional, Max 1 file, 7MB)
            </span>
          </label>
          {(state.emailTemplate.attachments || []).length > 0 && (
            <span className="text-xs text-green-500 font-medium">
              ✓ {(state.emailTemplate.attachments || []).length} file attached
            </span>
          )}
        </div>

        {/* File Upload Area */}
        {(state.emailTemplate.attachments || []).length === 0 ? (
          <label className="flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-brand-main/20 rounded-lg cursor-pointer hover:border-brand-main/40 hover:bg-brand-main/5 transition-all group">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-main/10 group-hover:bg-brand-main/20 flex items-center justify-center transition-colors">
                <span className="text-2xl">📎</span>
              </div>
              <p className="text-sm font-medium text-text-100 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-text-200/60">
                PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 7MB)
              </p>
            </div>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
          </label>
        ) : (
          <div className="space-y-3">
            {(state.emailTemplate.attachments || []).map(
              (attachment, index) => {
                const sizeInMB = (attachment.size / 1024 / 1024).toFixed(2);
                const fileType = attachment.type || "Unknown";
                const getFileIcon = (type: string) => {
                  if (type.includes("pdf")) return "📕";
                  if (type.includes("word") || type.includes("document"))
                    return "📘";
                  if (type.includes("sheet") || type.includes("excel"))
                    return "📗";
                  if (type.includes("image")) return "🖼️";
                  return "📄";
                };

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-bg-300/50 border border-brand-main/20 rounded-lg hover:border-brand-main/40 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getFileIcon(fileType)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-100 truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-text-200/60 mt-0.5">
                          {sizeInMB} MB • {fileType.split("/")[1]?.toUpperCase() || "FILE"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAttachment(index)}
                      className="px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-4 pt-4 border-t border-brand-main/10">
        <Button
          onClick={onPrev}
          className="bg-bg-200/50 hover:bg-bg-200/70 text-text-100 border border-brand-main/20 px-6 py-2.5 text-sm font-medium"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-brand-main hover:bg-brand-main/90 text-white px-8 py-2.5 text-sm font-medium shadow-lg shadow-brand-main/20"
        >
          Continue to Send →
        </Button>
      </div>
    </div>
  );
}
