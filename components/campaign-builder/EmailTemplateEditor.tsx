"use client";

import { Code2, Eye, FileText } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

import CodeEditor from "./CodeEditor";
import DesignEditor from "./DesignEditor";

interface ComplianceStatus {
  hasUnsubscribeLink: boolean;
  hasPhysicalAddress: boolean;
  hasAddressInput: boolean;
}

interface EmailTemplateEditorProps {
  subject: string;
  htmlContent: string;
  availableVariables: string[];
  complianceStatus?: ComplianceStatus;
  onSubjectChange: (subject: string) => void;
  onHtmlContentChange: (content: string) => void;
}

export default function EmailTemplateEditor({
  subject,
  htmlContent,
  availableVariables,
  complianceStatus,
  onSubjectChange,
  onHtmlContentChange,
}: EmailTemplateEditorProps) {
  const [editMode, setEditMode] = useState<"design" | "code">("design");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [showVariables, setShowVariables] = useState(true);
  // Compliance help removed; backend auto-inserts unsubscribe + address footer

  const handleInsertVariable = (variable: string) => {
    // If we're in the Design (Tiptap) editor, dispatch a custom event that the child listens to
    if (editMode === "design") {
      window.dispatchEvent(
        new CustomEvent("totalads:insert-variable", { detail: variable })
      );
      return;
    }

    // Fallback for Code editor (textarea)
    const textarea = document.getElementById(
      "codeEditor"
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newContent =
        htmlContent.substring(0, start) + variable + htmlContent.substring(end);

      onHtmlContentChange(newContent);

      setTimeout(() => {
        const pos = start + variable.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      }, 0);
      return;
    }

    // If no textarea found (edge case), append to content
    onHtmlContentChange((htmlContent || "") + variable);
  };

  // Highlight variables in HTML content
  const highlightVariables = (html: string) => {
    return html.replace(
      /\{\{(\w+)\}\}/g,
      '<mark style="background-color: #fbbf24; color: #000; padding: 2px 4px; border-radius: 3px; font-weight: 600;">{{$1}}</mark>'
    );
  };

  return (
    <div className="space-y-4">
      {/* Subject Input - Compact */}
      <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
        <label className="block text-xs font-medium text-text-200 mb-2">
          Email Subject *
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="e.g., {{firstName}}, check out our new product!"
          className="w-full px-3 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main text-sm"
        />
      </div>

      {/* Email Content Editor - Full Width */}
      <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
        {/* Header with Mode Tabs - Compact */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-brand-main/10">
          <div className="flex gap-1">
            <button
              onClick={() => setEditMode("design")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition text-sm ${
                editMode === "design"
                  ? "bg-brand-main text-brand-white"
                  : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
              }`}
            >
              <FileText size={16} />
              Design
            </button>
            <button
              onClick={() => setEditMode("code")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition text-sm ${
                editMode === "code"
                  ? "bg-brand-main text-brand-white"
                  : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
              }`}
            >
              <Code2 size={16} />
              Code
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="text-xs text-brand-main hover:text-brand-main/80 transition"
            >
              {showVariables ? "Hide" : "Show"} Variables
            </button>
          </div>
        </div>

        {/* Variables Helper - Compact */}
        {showVariables && (
          <div className="mb-3 p-2 bg-brand-main/10 border border-brand-main/20 rounded-lg">
            <p className="text-xs text-text-200 mb-1.5">Available variables:</p>
            <div className="flex flex-wrap gap-1.5">
              {availableVariables.map((variable) => (
                <button
                  key={variable}
                  onClick={() => handleInsertVariable(variable)}
                  className="px-2 py-1 bg-brand-main/30 hover:bg-brand-main/50 text-brand-main text-xs rounded transition"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor Content - 3 Column Layout */}
        <div className="grid grid-cols-3 gap-3">
          {/* Left: Editor (Takes more space) */}
          <div className="col-span-2 space-y-1.5">
            <h3 className="text-xs font-medium text-text-200">
              {editMode === "design" ? "Design Editor" : "HTML Code"}
            </h3>
            {editMode === "design" ? (
              <DesignEditor
                htmlContent={htmlContent}
                onHtmlContentChange={onHtmlContentChange}
              />
            ) : (
              <CodeEditor
                htmlContent={htmlContent}
                onHtmlContentChange={onHtmlContentChange}
              />
            )}
          </div>

          {/* Right: Preview (Compact) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <Eye size={14} className="text-text-200" />
              <h3 className="text-xs font-medium text-text-200">Preview</h3>
            </div>

            {/* Preview Mode Tabs - Compact */}
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`px-2 py-1 text-xs rounded transition ${
                  previewMode === "desktop"
                    ? "bg-brand-main text-brand-white"
                    : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
                }`}
              >
                💻
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`px-2 py-1 text-xs rounded transition ${
                  previewMode === "mobile"
                    ? "bg-brand-main text-brand-white"
                    : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
                }`}
              >
                📱
              </button>
            </div>

            {/* Preview Container */}
            <div
              className={`bg-brand-white rounded-lg overflow-hidden border border-brand-main/20 ${
                previewMode === "mobile" ? "mx-auto w-64" : "w-full"
              }`}
            >
              <div className="bg-bg-200 p-3 min-h-80 max-h-80 overflow-y-auto">
                {htmlContent ? (
                  <div
                    className="text-text-100 text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightVariables(htmlContent),
                    }}
                  />
                ) : (
                  <div className="text-text-200/60 text-center py-8 text-xs">
                    <p>Preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
