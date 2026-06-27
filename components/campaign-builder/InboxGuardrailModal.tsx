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
import { capResponsibilityNote } from "@/lib/senderProviderEducation";

interface InboxGuardrailModalProps {
  open: boolean;
  contactCount: number;
  inboxCount: number;
  customDailyCapacity?: number;
  isManagedSes?: boolean;
  onContinue: () => void;
  onClose: () => void;
}

export function InboxGuardrailModal({
  open,
  contactCount,
  inboxCount,
  customDailyCapacity,
  isManagedSes = false,
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

  const usingActualCaps = customDailyCapacity != null && customDailyCapacity > 0;

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
                    Sending capacity warning
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Your list is larger than today&apos;s safe send capacity across selected
                    accounts.
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
              <p>
                <span className="font-semibold">{guardrail.contactCount.toLocaleString()}</span>{" "}
                contacts ·{" "}
                <span className="font-semibold">{guardrail.inboxCount}</span> sending account
                {guardrail.inboxCount !== 1 ? "s" : ""} selected
              </p>
              <p>
                Estimated completion:{" "}
                <span className="font-semibold">{guardrail.estimatedDays}</span> day
                {guardrail.estimatedDays !== 1 ? "s" : ""}
                {usingActualCaps && (
                  <>
                    {" "}
                    at{" "}
                    <span className="font-semibold">
                      {guardrail.dailyCapacity.toLocaleString()}
                    </span>{" "}
                    emails/day combined cap
                  </>
                )}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {capResponsibilityNote(isManagedSes)}
              </p>
            </div>

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
                    days you need about{" "}
                    <span className="font-semibold">
                      {guardrail.inboxesNeededForTarget}
                    </span>{" "}
                    inbox{guardrail.inboxesNeededForTarget !== 1 ? "es" : ""}.
                  </p>
                  <p className="text-xs">
                    Sending too fast on too few inboxes hurts inbox placement — even with a clean
                    list. This is a warning, not a block, but provider limits are enforced during
                    send.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/email/sending-accounts">Add more accounts</Link>
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
