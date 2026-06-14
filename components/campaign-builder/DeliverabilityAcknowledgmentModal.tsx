"use client";

import { ShieldAlert, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BodyPortal } from "@/components/ui/BodyPortal";
import { DELIVERABILITY_ACK_LABEL } from "@/lib/deliverabilitySafeguards";

interface DeliverabilityAcknowledgmentModalProps {
  open: boolean;
  userMessage?: string;
  submitting?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose?: () => void;
}

export function DeliverabilityAcknowledgmentModal({
  open,
  userMessage,
  submitting = false,
  onConfirm,
  onClose,
}: DeliverabilityAcknowledgmentModalProps) {
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!checked || submitting) return;
    await onConfirm();
    setChecked(false);
  };

  return (
    <BodyPortal>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]">
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-200/90 bg-white shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)]"
          role="dialog"
          aria-labelledby="deliverability-ack-title"
        >
          <div className="border-b border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50/40 px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <ShieldAlert size={22} strokeWidth={2} />
                </div>
                <div>
                  <h2
                    id="deliverability-ack-title"
                    className="text-lg font-semibold tracking-tight text-slate-900"
                  >
                    Confirm before resuming
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    This campaign was paused for deliverability. Review the issue and confirm
                    below to resume sending.
                  </p>
                </div>
              </div>
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200/80 p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {userMessage ? (
              <p className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-sm leading-relaxed text-rose-950">
                {userMessage}
              </p>
            ) : null}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-main focus:ring-brand-main/40"
              />
              <span className="text-sm leading-relaxed text-slate-800">
                {DELIVERABILITY_ACK_LABEL}
              </span>
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {onClose ? (
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={!checked || submitting}
                onClick={() => void handleConfirm()}
              >
                {submitting ? "Confirming…" : "Confirm and resume"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
