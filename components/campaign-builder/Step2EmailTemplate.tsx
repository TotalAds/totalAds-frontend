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
  const [showPreview, setShowPreview] = useState(false);

  const replacePlaceholders = (input: string, values: Record<string, any>) =>
    input.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, key) => {
      const k = String(key || "").trim();
      const v = values?.[k];
      if (v == null || String(v).trim().length === 0) return `{{${k}}}`;
      return String(v);
    });

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
      {/* Attachments */}
      <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
        <label className="block text-sm font-medium text-text-200 mb-4">
          📎 Attachment (Max 1 file, 7MB)
        </label>

        {/* File Upload Area */}
        <div className="mb-4">
          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-brand-main/20 rounded-lg cursor-pointer hover:border-brand-main hover:bg-brand-main/5 transition">
            <div className="text-center">
              <p className="text-sm text-text-200">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-text-200/60 mt-1">
                PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 7MB)
              </p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={
                (state.emailTemplate.attachments || []).length >=
                MAX_ATTACHMENTS
              }
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
          </label>
        </div>

        {/* Attached Files List */}
        {(state.emailTemplate.attachments || []).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
              <span className="text-lg">✅</span>
              <p className="text-sm text-success">
                {(state.emailTemplate.attachments || []).length} file attached -
                Ready to send
              </p>
            </div>
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
                    className="p-4 bg-brand-main/10 border border-brand-main/30 rounded-lg hover:border-brand-main/50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-2xl mt-1">
                          {getFileIcon(fileType)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-100 truncate">
                            {attachment.name}
                          </p>
                          <div className="flex gap-3 mt-2 text-xs text-text-200/60">
                            <span>📦 {sizeInMB} MB</span>
                            <span>📋 {fileType}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="px-3 py-2 bg-error/20 hover:bg-error/40 text-error text-xs rounded-lg transition whitespace-nowrap"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={onPrev}
          className="bg-brand-main/10 hover:bg-brand-main/20 text-brand-main px-6 py-2 rounded-lg transition"
        >
          ← Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowPreview(true)}
            className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 px-3 py-2 rounded-lg text-xs transition"
          >
            Preview
          </Button>
          <Button
            onClick={handleNext}
            className="bg-brand-main hover:bg-brand-main/90 text-brand-white px-6 py-2 rounded-lg transition"
          >
            Next: Send →
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-100">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-text-200/60 hover:text-text-100 transition-colors"
              >
                ✕
              </button>
            </div>
            {(() => {
              const sample = state.csvData?.[0] || {};
              const email = sample?.[state.emailColumn] || sample?.email || "";
              const replacedSubject = replacePlaceholders(
                state.emailTemplate.subject || "",
                sample
              );
              const replacedBody = replacePlaceholders(
                state.emailTemplate.htmlContent || "",
                sample
              );
              return (
                <div className="space-y-4">
                  <div className="text-sm text-text-200">
                    <div>
                      <span className="text-text-200/60">To:</span>{" "}
                      {email || "(no email)"}
                    </div>
                    <div>
                      <span className="text-text-200/60">Subject:</span>{" "}
                      {replacedSubject}
                    </div>
                  </div>
                  <div className="border border-brand-main/20 rounded-lg p-4 bg-brand-main/5">
                    <div
                      className="prose prose-invert max-w-none text-text-100"
                      dangerouslySetInnerHTML={{ __html: replacedBody }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
