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

  // Extract variables from CSV columns
  const availableVariables = state.columns.map((col) => `{{${col}}}`);

  const handleNext = () => {
    if (!state.emailTemplate.subject.trim()) {
      toast.error("Email subject is required");
      return;
    }
    if (!state.emailTemplate.htmlContent.trim()) {
      toast.error("Email content is required");
      return;
    }

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
        htmlContent={state.emailTemplate.htmlContent}
        availableVariables={availableVariables}
        onSubjectChange={(subject) =>
          setState({
            ...state,
            emailTemplate: {
              ...state.emailTemplate,
              subject,
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
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <label className="block text-sm font-medium text-gray-300 mb-4">
          📎 Attachment (Max 1 file, 7MB)
        </label>

        {/* File Upload Area */}
        <div className="mb-4">
          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition">
            <div className="text-center">
              <p className="text-sm text-gray-300">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
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
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="text-lg">✅</span>
              <p className="text-sm text-green-300">
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
                    className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-2xl mt-1">
                          {getFileIcon(fileType)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">
                            {attachment.name}
                          </p>
                          <div className="flex gap-3 mt-2 text-xs text-gray-400">
                            <span>📦 {sizeInMB} MB</span>
                            <span>📋 {fileType}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 text-xs rounded-lg transition whitespace-nowrap"
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
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
        >
          Next: Preview →
        </Button>
      </div>
    </div>
  );
}
