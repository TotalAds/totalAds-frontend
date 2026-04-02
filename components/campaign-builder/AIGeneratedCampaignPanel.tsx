"use client";

import { Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AIGeneratedCampaignResponse } from "@/utils/api/emailClient";

interface AIGeneratedCampaignPanelProps {
  data: AIGeneratedCampaignResponse;
  /** Current editor body (for highlighting selected step) */
  editorBody: string;
  onSelectEmailStep: (step: {
    step: number;
    subject: string;
    body: string;
    preview_line: string;
    why_this_works: string;
  }) => void;
  onClear: () => void;
}

function normalizeForCompare(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export default function AIGeneratedCampaignPanel({
  data,
  editorBody,
  onSelectEmailStep,
  onClear,
}: AIGeneratedCampaignPanelProps) {
  const emails = [...(data.emails || [])].sort((a, b) => a.step - b.step);

  return (
    <div className="mb-4 rounded-xl border border-brand-main/25 bg-brand-main/10 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-100">
            AI-generated options
          </h3>
          <p className="mt-0.5 text-xs text-text-200">
            Pick an email variation below. Your choice fills the editor. This
            stays here until you clear it.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          className="shrink-0 border-error/40 text-error hover:bg-error/10"
        >
          <Trash2 size={14} className="mr-1.5" />
          Clear AI options
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-text-100">
            Email variations ({emails.length})
          </p>
          <div className="space-y-3">
            {emails.map((email) => {
              const isActive =
                normalizeForCompare(editorBody) ===
                normalizeForCompare(email.body);
              const preview = email.preview_line?.trim();
              const why = email.why_this_works?.trim();
              return (
                <div
                  key={email.step}
                  className={`rounded-lg border p-3 ${
                    isActive
                      ? "border-brand-main bg-brand-main/15"
                      : "border-brand-main/20 bg-bg-100/40"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-text-100">
                      Variation {email.step}
                    </span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-success">
                        <Check size={12} /> In editor
                      </span>
                    ) : null}
                  </div>
                  <p className="mb-1 text-[11px] font-medium text-text-100">{email.subject}</p>
                  {preview ? (
                    <p className="mb-2 text-[11px] text-text-100">
                      <span className="text-text-200">Preview line: </span>
                      {preview}
                    </p>
                  ) : null}
                  <div className="mb-3 max-h-56 overflow-y-auto rounded-md border border-brand-main/15 bg-bg-100/80 p-2.5">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-text-100">
                      {email.body || (
                        <span className="italic text-text-200">
                          (empty body)
                        </span>
                      )}
                    </p>
                  </div>
                  {why ? (
                    <p className="mb-3 rounded border border-brand-main/10 bg-brand-main/5 p-2 text-[11px] leading-relaxed text-text-100">
                      <span className="font-medium text-text-200">
                        Why this email works:{" "}
                      </span>
                      {why}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => onSelectEmailStep(email)}
                  >
                    Use this email
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
