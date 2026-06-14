"use client";

import Link from "next/link";
import { AlertTriangle, Inbox, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { BodyPortal } from "@/components/ui/BodyPortal";
import {
  computeInboxGuardrail,
  INBOX_GUARDRAIL_DEFAULT_TARGET_DAYS,
  INBOX_GUARDRAIL_TABLE,
} from "@/lib/inboxGuardrail";

interface InboxGuardrailModalProps {
  open: boolean;
  contactCount: number;
  inboxCount: number;
  customDailyCapacity?: number;
  onContinue: () => void;
  onClose: () => void;
}

export function InboxGuardrailModal({
  open,
  contactCount,
  inboxCount,
  customDailyCapacity,
  onContinue,
  onClose,
}: InboxGuardrailModalProps) {
  const [targetDays, setTargetDays] = useState(INBOX_GUARDRAIL_DEFAULT_TARGET_DAYS);

  const guardrail = useMemo(
    () =>
      computeInboxGuardrail({
        contactCount,
        inboxCount,
        targetDays,
        customDailyCapacity,
      }),
    [contactCount, inboxCount, targetDays, customDailyCapacity]
  );

  if (!open) return null;

  return (
    <BodyPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)]"
          role="dialog"
          aria-labelledby="inbox-guardrail-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50/40 px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Inbox size={22} strokeWidth={2} />
                </div>
                <div>
                  <h2
                    id="inbox-guardrail-title"
                    className="text-lg font-semibold tracking-tight text-slate-900"
                  >
                    Inbox Guardrail
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Safe cold-email sending depends on inbox count, not list size alone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200/80 p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Inboxes</th>
                    <th className="px-3 py-2 font-semibold">Safe daily sends</th>
                    <th className="px-3 py-2 font-semibold">Safe monthly sends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {INBOX_GUARDRAIL_TABLE.map((row) => (
                    <tr key={row.inboxes}>
                      <td className="px-3 py-2 font-medium">{row.inboxes}</td>
                      <td className="px-3 py-2">
                        {row.dailyMin}–{row.dailyMax}
                      </td>
                      <td className="px-3 py-2">~{row.monthly.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div className="space-y-2 text-sm text-amber-950">
                  <p>
                    Your campaign has{" "}
                    <span className="font-semibold">
                      {guardrail.contactCount.toLocaleString()}
                    </span>{" "}
                    contacts. With{" "}
                    <span className="font-semibold">{guardrail.inboxCount}</span>{" "}
                    inbox{guardrail.inboxCount !== 1 ? "es" : ""}, this will take{" "}
                    <span className="font-semibold">{guardrail.estimatedDays}</span>{" "}
                    day{guardrail.estimatedDays !== 1 ? "s" : ""} at safe sending limits.
                  </p>
                  <p>
                    To finish in{" "}
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={targetDays}
                        onChange={(e) =>
                          setTargetDays(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-14 rounded border border-amber-300 bg-white px-1.5 py-0.5 text-center text-sm font-semibold text-amber-950"
                      />
                    </label>{" "}
                    days you need{" "}
                    <span className="font-semibold">
                      {guardrail.inboxesNeededForTarget}
                    </span>{" "}
                    inbox{guardrail.inboxesNeededForTarget !== 1 ? "es" : ""}.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">
              You can continue with your current setup — this is a warning, not a block.
              Sending too fast on too few inboxes hurts deliverability even with a clean list.
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/email/domains">Add more inboxes</Link>
              </Button>
              <Button type="button" onClick={onContinue}>
                Continue anyway
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
