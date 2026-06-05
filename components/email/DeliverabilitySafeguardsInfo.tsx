"use client";

import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import {
  DELIVERABILITY_NOTES,
  MANAGED_DELIVERABILITY_SAFEGUARDS,
} from "@/lib/deliverabilitySafeguards";

type Props = {
  /** compact = icon + label link; icon = icon only */
  variant?: "compact" | "icon" | "link";
  className?: string;
  managedOnly?: boolean;
};

const levelStyles: Record<
  (typeof MANAGED_DELIVERABILITY_SAFEGUARDS)[number]["level"],
  string
> = {
  safe: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  degraded: "bg-orange-50 text-orange-900 border-orange-200",
  paused: "bg-rose-50 text-rose-900 border-rose-200",
};

export function DeliverabilitySafeguardsInfo({
  variant = "compact",
  className = "",
  managedOnly = true,
}: Props) {
  const [open, setOpen] = useState(false);

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-full p-1 text-text-200 hover:bg-brand-main/10 hover:text-brand-main transition-colors ${className}`}
        title="Deliverability safeguards"
        aria-label="Deliverability safeguards"
      >
        <HelpCircle size={16} />
      </button>
    ) : variant === "link" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs font-medium text-brand-main hover:underline ${className}`}
      >
        Deliverability rules
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-brand-main/20 bg-brand-main/5 px-2.5 py-1 text-xs font-medium text-text-100 hover:bg-brand-main/10 transition-colors ${className}`}
      >
        <HelpCircle size={14} className="text-brand-main shrink-0" />
        Sender limits & auto-pause
      </button>
    );

  return (
    <>
      {trigger}
      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deliverability-safeguards-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-brand-main/15 bg-bg-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-brand-main/10 bg-bg-100 px-5 py-4">
              <div>
                <h2
                  id="deliverability-safeguards-title"
                  className="text-sm font-semibold text-text-100"
                >
                  Deliverability safeguards
                </h2>
                <p className="mt-1 text-xs text-text-200 leading-relaxed">
                  {managedOnly
                    ? "Managed SES senders — automatic cap changes and campaign protection."
                    : "How LeadSnipper protects sender reputation during outbound."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-text-200 hover:bg-brand-main/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {MANAGED_DELIVERABILITY_SAFEGUARDS.map((row) => (
                <div
                  key={row.level}
                  className={`rounded-xl border px-3 py-2.5 ${levelStyles[row.level]}`}
                >
                  <p className="text-xs font-semibold">{row.label}</p>
                  <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                    <span className="font-medium">When:</span> {row.trigger}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                    <span className="font-medium">Then:</span> {row.action}
                  </p>
                </div>
              ))}

              <ul className="space-y-1.5 pt-1">
                {DELIVERABILITY_NOTES.map((note) => (
                  <li
                    key={note}
                    className="text-[11px] text-text-200 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-text-200/60"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
