"use client";

import {
  Code2,
  Eye,
  FileText,
  Monitor,
  Plus,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );
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
    <div className="space-y-2">
      {/* Gmail-like Compact Header */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
        {/* Subject Line - Gmail style */}
        <div className="border-b border-gray-200">
          <div className="flex items-center px-3 py-2">
            <span className="text-sm text-gray-600 w-16 flex-shrink-0">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Add a subject"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Preview Text - Compact */}
        <div className="border-b border-gray-200">
          <div className="flex items-center px-3 py-1.5">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">Preview</span>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={previewText || ""}
                onChange={(e) =>
                  onPreviewTextChange && onPreviewTextChange(e.target.value)
                }
                placeholder="Add preview text (optional)"
                maxLength={100}
                className="flex-1 text-xs text-gray-600 placeholder-gray-400 focus:outline-none"
              />
              {(previewText || "").length > 0 && (
                <span className="text-xs text-gray-400">
                  {(previewText || "").length}/100
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compact Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-1">
            {/* Edit Mode Toggle - Compact */}
            <button
              onClick={() => setEditMode("design")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                editMode === "design"
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              title="Visual Editor"
            >
              <FileText size={14} />
            </button>
            <button
              onClick={() => setEditMode("code")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                editMode === "code"
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              title="HTML Editor"
            >
              <Code2 size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Variable Insert - Compact */}
            <div className="relative" ref={variablePanelRef}>
              <button
                onClick={() => setShowVariablePanel(!showVariablePanel)}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors"
                title="Insert Variable"
              >
                <Plus size={14} />
              </button>

              {/* Variable Dropdown - Compact */}
              {showVariablePanel && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 flex flex-col">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={variableSearch}
                        onChange={(e) => setVariableSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-1 max-h-64">
                    {filteredVariables.length > 0 ? (
                      <div className="space-y-0.5">
                        {filteredVariables.map((variable) => (
                          <button
                            key={variable}
                            onClick={() => {
                              handleInsertVariable(variable);
                              setShowVariablePanel(false);
                              setVariableSearch("");
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-blue-50 rounded text-xs transition-colors"
                          >
                            <code className="text-blue-600 font-mono">{variable}</code>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-gray-400">
                        No variables found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Button - Compact */}
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Preview"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        {/* Editor Area - Compact */}
        <div className="bg-white min-h-[400px]">
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

      {/* Preview Modal - Full Screen */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">
                Email Preview
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Preview Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-2 rounded transition-all ${
                    previewMode === "desktop"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Desktop View"
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-2 rounded transition-all ${
                    previewMode === "mobile"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Mobile View"
                >
                  <Smartphone size={16} />
                </button>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-900"
                title="Close Preview"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Preview Content - Full Screen */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div
                className={`bg-white rounded-lg shadow-lg border border-gray-200 mx-auto ${
                  previewMode === "mobile" ? "max-w-sm" : "max-w-4xl"
                }`}
              >
                {/* Email Header Preview */}
                <div className="border-b border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">To:</span>{" "}
                      <span className="text-gray-900">
                        recipient@example.com
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">
                        Subject:
                      </span>{" "}
                      <span className="text-gray-900">
                        {subject || "Your email subject"}
                      </span>
                    </div>
                    {previewText && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-gray-600 font-medium">
                          Preview:
                        </span>{" "}
                        <span className="text-gray-500 italic">
                          {previewText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Body Preview */}
                <div className="p-6 min-h-[400px]">
                  {htmlContent ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: highlightVariables(htmlContent),
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <Eye
                          size={48}
                          className="mx-auto text-gray-400 mb-4"
                        />
                        <p className="text-base text-gray-600 mb-2">
                          No content to preview
                        </p>
                        <p className="text-sm text-gray-400">
                          Start typing in the editor to see your email preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
