"use client";

import { Check, ShieldAlert, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  analyzeEmailQuality,
  type ReadabilityLabel,
} from "./emailQualityCheck";

type Tab = "readability" | "spam";

const SCALE: { label: string; short: string }[] = [
  { label: "Very Hard", short: "V. Hard" },
  { label: "Hard", short: "Hard" },
  { label: "Moderate", short: "Moderate" },
  { label: "Easy", short: "Easy" },
  { label: "Very Easy", short: "V. Easy" },
];

function markerPercent(score: number): number {
  return Math.min(98, Math.max(2, score));
}

function Recommendation({
  ok,
  title,
  detail,
}: {
  ok: boolean;
  title: string;
  detail: string;
}) {
  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-b-0">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
            ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
          )}
        >
          {ok ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function EmailQualityPanel({
  subject,
  bodyHtml,
  onClose,
}: {
  subject: string;
  bodyHtml: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("readability");
  const report = analyzeEmailQuality(subject, bodyHtml);
  const label: ReadabilityLabel = report.label;

  return (
    <div className="flex max-h-[min(68vh,620px)] w-[min(100%,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-end justify-between border-b border-slate-100 px-2 pt-2">
        <div className="flex min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setTab("readability")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 pb-2.5 pt-1.5 text-sm font-semibold",
              tab === "readability"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-400 hover:text-slate-600",
            )}
          >
            <span className="text-base leading-none">≡</span>
            Readability
          </button>
          <button
            type="button"
            onClick={() => setTab("spam")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 pb-2.5 pt-1.5 text-sm font-semibold",
              tab === "spam"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-400 hover:text-slate-600",
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            Spam Check
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mb-2 ml-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close inbox check"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "readability" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <p
                  className={cn(
                    "text-[42px] font-semibold leading-none tracking-tight",
                    report.score >= 70
                      ? "text-emerald-600"
                      : report.score >= 50
                        ? "text-amber-500"
                        : "text-rose-500",
                  )}
                >
                  {report.score}
                  <span className="text-xl font-medium text-slate-300">/100</span>
                </p>
                <span
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold",
                    report.score >= 70
                      ? "bg-emerald-50 text-emerald-700"
                      : report.score >= 50
                        ? "bg-amber-50 text-amber-800"
                        : "bg-rose-50 text-rose-700",
                  )}
                >
                  {label}
                </span>
              </div>
              <div className="relative mt-4">
                <div className="h-2 rounded-full bg-gradient-to-r from-rose-300 via-amber-200 to-emerald-400" />
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-emerald-500 bg-white shadow-sm"
                  style={{ left: `calc(${markerPercent(report.score)}% - 8px)` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                {SCALE.map((item) => (
                  <span key={item.short}>{item.short}</span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 text-center">
                <div>
                  <p className="text-xl font-semibold text-slate-900">{report.words}</p>
                  <p className="text-[11px] text-slate-400">Words</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    {report.sentences}
                  </p>
                  <p className="text-[11px] text-slate-400">Sentences</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    {report.avgWordsPerSentence}
                  </p>
                  <p className="text-[11px] text-slate-400">Avg / Sent.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200">
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold tracking-wider text-slate-400">
                ANALYSIS
              </p>
              {[
                {
                  label: "Passive Voice",
                  value: `${report.passiveVoiceUses} uses`,
                  ok: report.activeVoice,
                },
                {
                  label: "Adverbs",
                  value: `${report.adverbCount} found`,
                  ok: report.minimalAdverbs,
                },
                {
                  label: "Hard Sentences",
                  value: `${report.hardSentences.length} of ${report.sentences}`,
                  ok: report.shortSentences,
                },
                {
                  label: "Very Hard Sentences",
                  value: `${report.veryHardSentences.length} of ${report.sentences}`,
                  ok: report.noVeryHardSentences,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="border-t border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          row.ok ? "bg-emerald-500" : "bg-amber-500",
                        )}
                      />
                      {row.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {row.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200">
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold tracking-wider text-slate-400">
                RECOMMENDATIONS
              </p>
              <Recommendation
                ok={report.shortSentences}
                title="Short, clear sentences"
                detail="Aim to keep sentences under 20 words so they're easy to scan."
              />
              <Recommendation
                ok={report.activeVoice}
                title="Active voice"
                detail="Use active voice — it's more direct and engaging for cold outreach."
              />
              <Recommendation
                ok={report.minimalAdverbs}
                title="Minimal adverbs"
                detail="Limit adverbs to 3 or fewer — they often weaken your message."
              />
              <Recommendation
                ok={report.noVeryHardSentences}
                title="No very hard sentences"
                detail="Very hard sentences lose readers quickly. Break them up."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={cn(
                "rounded-2xl px-4 py-8 text-center",
                report.inboxSafe ? "bg-emerald-50" : "bg-amber-50",
              )}
            >
              <div
                className={cn(
                  "mx-auto flex h-16 w-20 items-center justify-center rounded-xl border bg-white shadow-sm",
                  report.inboxSafe ? "border-emerald-200" : "border-amber-200",
                )}
              >
                <span className="text-2xl" aria-hidden>
                  ✉
                </span>
              </div>
              <p
                className={cn(
                  "mt-4 text-xl font-bold",
                  report.inboxSafe ? "text-emerald-800" : "text-amber-900",
                )}
              >
                {report.inboxSafe ? "Inbox Safe" : "Needs attention"}
              </p>
              <span
                className={cn(
                  "mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold",
                  report.inboxSafe
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900",
                )}
              >
                {report.spamWordCount} spam word
                {report.spamWordCount === 1 ? "" : "s"} detected
              </span>
              <p
                className={cn(
                  "mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed",
                  report.inboxSafe ? "text-emerald-700" : "text-amber-800",
                )}
              >
                {report.inboxSafe
                  ? "Your email looks clean and ready to land in inboxes."
                  : "Tighten trigger words, punctuation, or ALL CAPS before you send."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200">
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold tracking-wider text-slate-400">
                RECOMMENDATIONS
              </p>
              <Recommendation
                ok={report.noSpamWords}
                title="No spam trigger words"
                detail={
                  report.noSpamWords
                    ? "Avoid words that commonly trigger spam filters."
                    : `Found: ${report.spamHits.map((hit) => hit.word).join(", ")}.`
                }
              />
              <Recommendation
                ok={report.punctuationOk}
                title="No excessive punctuation"
                detail="Limit exclamation marks to 1–2 per email."
              />
              <Recommendation
                ok={report.noAllCaps}
                title="No ALL CAPS text"
                detail="Avoid writing words in all capital letters."
              />
              <Recommendation
                ok={report.hasPersonalization}
                title="Include personalization"
                detail="Use first name variables to improve engagement."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
