"use client";

import { LayoutTemplate, Monitor, Pencil, Smartphone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import CreateEmailModal from "./CreateEmailModal";
import { wrapEmailPreviewDocument } from "./htmlPreviewUtils";

export interface EmailTemplateEditorProps {
  subject: string;
  previewText?: string;
  htmlContent: string;
  bodyEditor: "simple" | "html";
  /** When false, show the empty state until the user picks an editor or template in the modal */
  emailBodyInitialized: boolean;
  domainId: string;
  excludeCampaignId?: string | null;
  availableVariables: string[];
  onSubjectChange: (subject: string) => void;
  onPreviewTextChange?: (preview: string) => void;
  onHtmlContentChange: (content: string) => void;
  onBodyEditorChange: (mode: "simple" | "html") => void;
  onEmailBodyInitialized: (initialized: boolean) => void;
}

export default function EmailTemplateEditor({
  subject,
  previewText,
  htmlContent,
  bodyEditor,
  emailBodyInitialized,
  domainId,
  excludeCampaignId,
  availableVariables,
  onSubjectChange,
  onPreviewTextChange,
  onHtmlContentChange,
  onBodyEditorChange,
  onEmailBodyInitialized,
}: EmailTemplateEditorProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [openDirectlyToEditor, setOpenDirectlyToEditor] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const handleApplyFromModal = (payload: {
    htmlContent: string;
    bodyEditor: "simple" | "html";
  }) => {
    onBodyEditorChange(payload.bodyEditor);
    onHtmlContentChange(payload.htmlContent);
    onEmailBodyInitialized(true);
  };

  const openModalNew = () => {
    setOpenDirectlyToEditor(false);
    setCreateModalOpen(true);
  };

  const openModalEdit = () => {
    setOpenDirectlyToEditor(true);
    setCreateModalOpen(true);
  };

  const previewSrc =
    htmlContent.trim().length > 0
      ? wrapEmailPreviewDocument(htmlContent, true)
      : wrapEmailPreviewDocument(
          '<p style="margin:0;font-size:15px;color:#94a3b8;">No body yet — open the editor to add content.</p>',
          false
        );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-200 shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-20 flex-shrink-0 text-sm font-medium text-text-200">
              Subject
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Add a subject line"
              className="flex-1 bg-transparent text-sm text-text-100 placeholder:text-text-300 focus:outline-none"
            />
          </div>
        </div>
        <div className="px-4 py-2.5">
          <div className="flex items-start gap-3">
            <span className="w-20 flex-shrink-0 pt-0.5 text-xs font-medium text-text-300">
              Preview
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <input
                type="text"
                value={previewText || ""}
                onChange={(e) =>
                  onPreviewTextChange && onPreviewTextChange(e.target.value)
                }
                placeholder="Inbox preview text (optional)"
                maxLength={100}
                className="w-full bg-transparent text-xs text-text-200 placeholder:text-text-300 focus:outline-none"
              />
              {(previewText || "").length > 0 && (
                <span className="text-[11px] text-text-300">
                  {(previewText || "").length}/100
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-bg-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-text-100">Email content</h3>
            <p className="mt-0.5 text-xs text-text-200">
              Preview of what recipients see. Use{" "}
              <span className="font-medium text-text-100">Create email</span> to pick a template or
              edit in the modal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {emailBodyInitialized ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openModalEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit email
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-brand-main hover:bg-brand-main/90"
              onClick={openModalNew}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              {emailBodyInitialized ? "Change email" : "Create email"}
            </Button>
          </div>
        </div>

        {!emailBodyInitialized ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-6 max-w-md rounded-2xl border border-dashed border-border bg-bg-300/40 px-8 py-10">
              <p className="text-base font-medium text-text-100">Create your email</p>
              <p className="mt-2 text-sm text-text-200">
                Choose a template or build from scratch in the editor — subject and inbox preview
                stay on this page.
              </p>
            </div>
            <Button
              type="button"
              className="rounded-full bg-brand-main px-8 hover:bg-brand-main/90"
              onClick={openModalNew}
            >
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Create email
            </Button>
          </div>
        ) : (
          <div className="border-t border-border bg-bg-300/30">
            <div className="flex items-center justify-between border-b border-border bg-bg-300/50 px-3 py-2">
              <span className="text-xs font-medium text-text-200">Inbox view</span>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`rounded-md p-1.5 transition-all ${
                    previewMode === "desktop"
                      ? "bg-brand-main text-white"
                      : "text-text-200 hover:bg-bg-300"
                  }`}
                  title="Desktop"
                >
                  <Monitor size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`rounded-md p-1.5 transition-all ${
                    previewMode === "mobile"
                      ? "bg-brand-main text-white"
                      : "text-text-200 hover:bg-bg-300"
                  }`}
                  title="Mobile"
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div
                className={`mx-auto overflow-hidden rounded-xl border border-border bg-white shadow-md ${
                  previewMode === "mobile" ? "max-w-[360px]" : "max-w-3xl"
                }`}
              >
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs">
                  <div className="truncate font-medium text-text-100">
                    {subject || "Subject line"}
                  </div>
                  {(previewText || "").trim() ? (
                    <div className="mt-0.5 truncate text-text-300">{previewText}</div>
                  ) : null}
                </div>
                <div className="min-h-[280px] bg-white">
                  <iframe
                    title="Email body preview"
                    className="h-[min(520px,70vh)] w-full border-0 [scrollbar-width:thin]"
                    srcDoc={previewSrc}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateEmailModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        domainId={domainId}
        excludeCampaignId={excludeCampaignId}
        availableVariables={availableVariables}
        seedHtml={htmlContent}
        seedBodyEditor={bodyEditor}
        openDirectlyToEditor={openDirectlyToEditor}
        onApply={handleApplyFromModal}
      />
    </div>
  );
}
