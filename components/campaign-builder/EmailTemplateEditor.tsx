"use client";

import { Code2, Eye, FileText, Monitor, Smartphone, X, Search, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  previewText?: string;
  htmlContent: string;
  availableVariables: string[];
  complianceStatus?: ComplianceStatus;
  onSubjectChange: (subject: string) => void;
  onPreviewTextChange?: (preview: string) => void;
  onHtmlContentChange: (content: string) => void;
}

export default function EmailTemplateEditor({
  subject,
  previewText,
  htmlContent,
  availableVariables,
  complianceStatus,
  onSubjectChange,
  onPreviewTextChange,
  onHtmlContentChange,
}: EmailTemplateEditorProps) {
  const [editMode, setEditMode] = useState<"design" | "code">("design");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showVariablePanel, setShowVariablePanel] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [variableSearch, setVariableSearch] = useState("");
  const variablePanelRef = useRef<HTMLDivElement>(null);

  // Filter variables based on search
  const filteredVariables = availableVariables.filter((variable) =>
    variable.toLowerCase().includes(variableSearch.toLowerCase())
  );

  // Handle variable insertion
  const handleInsertVariable = (variable: string) => {
    if (editMode === "design") {
      window.dispatchEvent(
        new CustomEvent("totalads:insert-variable", { detail: variable })
      );
      toast.success(`Added ${variable}`, { duration: 1500 });
      return;
    }

    // Code editor insertion
    const textarea = document.getElementById("codeEditor") as HTMLTextAreaElement | null;
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
      toast.success(`Added ${variable}`, { duration: 1500 });
      return;
    }

    onHtmlContentChange((htmlContent || "") + variable);
  };

  // Highlight variables in HTML content
  const highlightVariables = (html: string) => {
    return html.replace(
      /\{\{(\w+)\}\}/g,
      '<span style="background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%); color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 0.9em; display: inline-block; margin: 0 2px;">{{$1}}</span>'
    );
  };

  // Close variable panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        variablePanelRef.current &&
        !variablePanelRef.current.contains(event.target as Node)
      ) {
        setShowVariablePanel(false);
      }
    };

    if (showVariablePanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showVariablePanel]);

  return (
    <div className="space-y-4">
      {/* Header Section - Subject & Preview Text */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subject */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-100 flex items-center gap-2">
            Email Subject
            <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="e.g., Hi {{firstName}}, check out our new product!"
            className="w-full px-4 py-3 bg-bg-200/50 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/40 focus:outline-none focus:ring-2 focus:ring-brand-main/50 focus:border-brand-main transition-all text-sm"
          />
        </div>

        {/* Preview Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-100 flex items-center gap-2">
            Preview Text
            <span className="text-xs text-text-200/60 font-normal">
              (optional)
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={previewText || ""}
              onChange={(e) => onPreviewTextChange && onPreviewTextChange(e.target.value)}
              placeholder="Keep it under 100 characters for inbox preview"
              maxLength={100}
              className="w-full px-4 py-3 bg-bg-200/50 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/40 focus:outline-none focus:ring-2 focus:ring-brand-main/50 focus:border-brand-main transition-all text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span
                className={`text-xs ${
                  (previewText || "").length > 100
                    ? "text-error"
                    : (previewText || "").length > 80
                    ? "text-yellow-500"
                    : "text-text-200/60"
                }`}
              >
                {(previewText || "").length}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Section */}
      <div className="bg-bg-200/30 border border-brand-main/20 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="bg-bg-200/50 border-b border-brand-main/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Edit Mode Tabs */}
            <div className="flex items-center gap-1 bg-bg-300/50 p-1 rounded-lg">
              <button
                onClick={() => setEditMode("design")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${
                  editMode === "design"
                    ? "bg-brand-main text-white shadow-lg shadow-brand-main/20"
                    : "text-text-200 hover:text-text-100 hover:bg-bg-200/50"
                }`}
              >
                <FileText size={16} />
                Design
              </button>
              <button
                onClick={() => setEditMode("code")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${
                  editMode === "code"
                    ? "bg-brand-main text-white shadow-lg shadow-brand-main/20"
                    : "text-text-200 hover:text-text-100 hover:bg-bg-200/50"
                }`}
              >
                <Code2 size={16} />
                Code
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview Button */}
            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 text-brand-main rounded-lg transition-all text-sm font-medium border border-brand-main/20"
            >
              <Eye size={16} />
              Preview
            </button>

            {/* Variable Insert Button */}
            <div className="relative" ref={variablePanelRef}>
              <button
                onClick={() => setShowVariablePanel(!showVariablePanel)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 text-brand-main rounded-lg transition-all text-sm font-medium border border-brand-main/20"
              >
                <Plus size={16} />
                Add Variable
              </button>

              {/* Variable Dropdown Panel */}
              {showVariablePanel && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-bg-200 border border-brand-main/20 rounded-lg shadow-xl z-50 max-h-96 flex flex-col">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-brand-main/10">
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-200/60"
                      />
                      <input
                        type="text"
                        value={variableSearch}
                        onChange={(e) => setVariableSearch(e.target.value)}
                        placeholder="Search variables..."
                        className="w-full pl-10 pr-4 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/40 focus:outline-none focus:ring-2 focus:ring-brand-main/50 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Variables List */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {filteredVariables.length > 0 ? (
                      <div className="space-y-1">
                        {filteredVariables.map((variable) => (
                          <button
                            key={variable}
                            onClick={() => {
                              handleInsertVariable(variable);
                              setShowVariablePanel(false);
                              setVariableSearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-brand-main/10 rounded-lg transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <code className="text-sm text-brand-main font-mono font-semibold">
                                {variable}
                              </code>
                              <Plus
                                size={14}
                                className="text-text-200/60 group-hover:text-brand-main transition-colors"
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-text-200/60 text-sm">
                        No variables found
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-brand-main/10 bg-bg-300/50">
                    <p className="text-xs text-text-200/60">
                      {filteredVariables.length} variable{filteredVariables.length !== 1 ? "s" : ""} available
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Width Editor */}
        <div className="bg-bg-100/50">
          <div className="p-6 min-h-[700px] flex flex-col">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-text-100 flex items-center gap-2">
                {editMode === "design" ? (
                  <>
                    <FileText size={16} />
                    Visual Editor
                  </>
                ) : (
                  <>
                    <Code2 size={16} />
                    HTML Code Editor
                  </>
                )}
              </h3>
              <p className="text-xs text-text-200/60 mt-1">
                {editMode === "design"
                  ? "Use the toolbar above to format your email content"
                  : "Edit your HTML code directly. Variables are highlighted in the preview."}
              </p>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg border border-brand-main/10 bg-white shadow-sm">
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
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl bg-bg-200 border border-brand-main/20 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-main/10 bg-bg-200/50">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-brand-main" />
                <h3 className="text-lg font-semibold text-text-100">Email Preview</h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Preview Mode Toggle */}
                <div className="flex items-center gap-1 bg-bg-300/50 p-1 rounded-lg">
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-2 rounded transition-all ${
                      previewMode === "desktop"
                        ? "bg-brand-main text-white"
                        : "text-text-200 hover:text-text-100 hover:bg-bg-200/50"
                    }`}
                    title="Desktop View"
                  >
                    <Monitor size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-2 rounded transition-all ${
                      previewMode === "mobile"
                        ? "bg-brand-main text-white"
                        : "text-text-200 hover:text-text-100 hover:bg-bg-200/50"
                    }`}
                    title="Mobile View"
                  >
                    <Smartphone size={16} />
                  </button>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-bg-300/50 rounded-lg transition-colors text-text-200 hover:text-text-100"
                  title="Close Preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-bg-100/30">
              <div
                className={`bg-white rounded-lg shadow-lg border border-brand-main/10 mx-auto ${
                  previewMode === "mobile" ? "max-w-sm" : "max-w-4xl"
                }`}
              >
                {/* Email Header Preview */}
                <div className="border-b border-brand-main/10 p-4 bg-bg-200/30">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-text-200/60 font-medium">To:</span>{" "}
                      <span className="text-text-100">recipient@example.com</span>
                    </div>
                    <div>
                      <span className="text-text-200/60 font-medium">Subject:</span>{" "}
                      <span className="text-text-100">{subject || "Your email subject"}</span>
                    </div>
                    {previewText && (
                      <div className="pt-2 border-t border-brand-main/10">
                        <span className="text-text-200/60 font-medium">Preview:</span>{" "}
                        <span className="text-text-200 italic">{previewText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Body Preview */}
                <div className="p-6 min-h-[400px]">
                  {htmlContent ? (
                    <div
                      className="prose prose-sm max-w-none text-text-100"
                      dangerouslySetInnerHTML={{
                        __html: highlightVariables(htmlContent),
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <Eye size={48} className="mx-auto text-text-200/40 mb-4" />
                        <p className="text-base text-text-200/60 mb-2">
                          No content to preview
                        </p>
                        <p className="text-sm text-text-200/40">
                          Start typing in the editor to see your email preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-brand-main/10 bg-bg-200/50 flex justify-end">
              <Button
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2 bg-brand-main hover:bg-brand-main/90 text-white"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
