"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Zap, Loader2, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BodyPortal } from "@/components/ui/BodyPortal";
import {
  getLeadhubCategories,
  getLeadhubLists,
  LeadhubCategory,
  LeadhubLeadSource,
  LeadhubList,
  LeadhubPipelineStage,
  LeadhubSyncConfig,
} from "@/utils/api/leadhubClient";
import { formatContinuousSyncInterval } from "@/lib/continuousSyncInterval";

interface LeadhubAutopilotPanelProps {
  open: boolean;
  onClose: () => void;
  value: LeadhubSyncConfig | null;
  onChange: (config: LeadhubSyncConfig | null) => void;
  onSyncNow?: () => void;
  syncing?: boolean;
  enriching?: boolean;
  /** When true, auto-sync uses the campaign's configured interval. */
  isContinuous?: boolean;
  continuousSyncIntervalMinutes?: number;
  syncPhase?: "idle" | "fetching" | "enriching" | "complete" | "error";
  syncStats?: {
    processed: number;
    ready: number;
    pendingEnrichment: number;
    queued: number;
    skipped: number;
    skippedNoEmail?: number;
    skippedVerification?: number;
    skippedEnrichedOnly?: number;
    failed?: number;
  } | null;
  syncLinks?: Array<{
    leadhubLeadId: string;
    email: string | null;
    emailField?: "signup.email" | "contact.email" | null;
    mergeToken?: "{{email}}";
    isSignupLead?: boolean;
    syncStatus: string;
    lastError: string | null;
    priority: string | null;
  }>;
}

const PRIORITIES: Array<"hot" | "warm" | "cold"> = ["hot", "warm", "cold"];

const PIPELINE_STAGES: Array<{ value: LeadhubPipelineStage; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const LEAD_SOURCES: Array<{ value: LeadhubLeadSource; label: string }> = [
  { value: "apollo", label: "Apollo" },
  { value: "apify", label: "Apify" },
  { value: "google_maps", label: "Google Maps" },
  { value: "csv", label: "CSV" },
  { value: "url", label: "URL" },
  { value: "manual", label: "Manual" },
  { value: "extension", label: "Extension" },
];

const selectClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-50 disabled:text-slate-400";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";

function SyncProgressBar({
  syncing,
  enriching,
  syncPhase,
  syncStats,
  isContinuous = false,
}: {
  syncing?: boolean;
  enriching?: boolean;
  syncPhase?: LeadhubAutopilotPanelProps["syncPhase"];
  syncStats?: LeadhubAutopilotPanelProps["syncStats"];
  isContinuous?: boolean;
}) {
  const inFlight = Boolean(syncing || enriching);
  const isComplete = syncPhase === "complete" && Boolean(syncStats);
  const isError = syncPhase === "error";

  const total =
    (syncStats?.ready ?? 0) +
    (syncStats?.queued ?? 0) +
    (syncStats?.skipped ?? 0) +
    (syncStats?.failed ?? 0);

  if (!inFlight && syncPhase === "idle" && !syncStats) {
    return null;
  }

  const imported = (syncStats?.ready ?? 0) + (syncStats?.queued ?? 0);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {inFlight ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing…
          </span>
        ) : isError ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-semibold text-white">
            Sync failed
          </span>
        ) : isComplete ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white">
            <Check className="h-3 w-3" />
            Sync complete
          </span>
        ) : null}
      </div>

      {syncStats && (total > 0 || isComplete) && (
        <div className="space-y-1">
          <p className="text-[11px] text-slate-600">
            {imported} imported
            {isContinuous ? ` · ${syncStats.queued} queued for send` : ""}
            {" · "}
            {syncStats.skipped} skipped
            {(syncStats.failed ?? 0) > 0 ? ` · ${syncStats.failed} failed` : ""}
          </p>
          {(syncStats.skippedNoEmail ?? 0) > 0 ||
          (syncStats.skippedVerification ?? 0) > 0 ||
          (syncStats.skippedEnrichedOnly ?? 0) > 0 ? (
            <p className="text-[10px] text-slate-500">
              {(syncStats.skippedNoEmail ?? 0) > 0
                ? `${syncStats.skippedNoEmail} no valid email · `
                : ""}
              {(syncStats.skippedVerification ?? 0) > 0
                ? `${syncStats.skippedVerification} verification · `
                : ""}
              {(syncStats.skippedEnrichedOnly ?? 0) > 0
                ? `${syncStats.skippedEnrichedOnly} enrichment filter`
                : ""}
            </p>
          ) : null}
          {isComplete && imported > 0 && !isContinuous && (
            <p className="text-[10px] text-slate-500">
              Leads are in this campaign. They queue for send when the campaign
              is live (or after Restart Campaign if it was already running).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function LeadhubAutopilotPanel({
  open,
  onClose,
  value,
  onChange,
  onSyncNow,
  syncing,
  enriching,
  isContinuous = false,
  continuousSyncIntervalMinutes,
  syncPhase = "idle",
  syncStats,
  syncLinks,
}: LeadhubAutopilotPanelProps) {
  const [lists, setLists] = useState<LeadhubList[]>([]);
  const [categories, setCategories] = useState<LeadhubCategory[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const enabled = Boolean(value?.enabled);
  const selectedList = useMemo(
    () => lists.find((l) => l.id === value?.listIds?.[0]),
    [lists, value?.listIds],
  );
  const isSignupList =
    value?.listType === "signup" || selectedList?.listType === "signup";
  const continuousSyncLabel = isContinuous
    ? formatContinuousSyncInterval(continuousSyncIntervalMinutes).toLowerCase()
    : null;

  const crmLists = useMemo(
    () => lists.filter((l) => l.listType !== "signup"),
    [lists],
  );
  const signupLists = useMemo(
    () => lists.filter((l) => l.listType === "signup"),
    [lists],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingMeta(true);
        const [l, c] = await Promise.all([
          getLeadhubLists(),
          getLeadhubCategories(),
        ]);
        if (cancelled) return;
        setLists(l);
        setCategories(c);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          toast.error("Failed to load LeadHub lists");
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Opening the import modal should surface filters — enable Autopilot if needed.
  useEffect(() => {
    if (!open || enabled) return;
    onChange({
      enabled: true,
      source: "leadhub_autopilot",
      enrichmentGate: "import_both",
      priorities: value?.priorities ?? ["hot", "warm"],
      listIds: value?.listIds,
      listType: value?.listType ?? "regular",
      categoryIds: value?.categoryIds,
      pipelineStage: value?.pipelineStage,
      leadSource: value?.leadSource,
      minIntentScore: value?.minIntentScore,
      minIcpScore: value?.minIcpScore,
      icpProfileId: value?.icpProfileId,
    });
    // Only when opening without an enabled config
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const ensureConfig = (): LeadhubSyncConfig =>
    value ?? {
      enabled: true,
      source: "leadhub_autopilot",
      enrichmentGate: "import_both",
      listType: "regular",
      priorities: ["hot", "warm"],
    };

  const patch = (partial: Partial<LeadhubSyncConfig>) => {
    onChange({
      ...ensureConfig(),
      ...partial,
      enabled: true,
      source: "leadhub_autopilot",
    });
  };

  const setDataSource = (listType: "regular" | "signup") => {
    if (listType === "signup") {
      patch({
        listType: "signup",
        listIds: [],
        categoryIds: [],
        pipelineStage: undefined,
        leadSource: undefined,
        minIntentScore: undefined,
        minIcpScore: undefined,
        priorities: value?.priorities ?? ["hot", "warm"],
      });
      return;
    }
    patch({
      listType: "regular",
      listIds: [],
      pipelineStage: value?.pipelineStage,
      leadSource: value?.leadSource,
    });
  };

  const togglePriority = (p: "hot" | "warm" | "cold") => {
    const current = value?.priorities ?? [];
    const next = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p];
    patch({ priorities: next });
  };

  if (!open) return null;

  return (
    <BodyPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <div
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)]"
          role="dialog"
          aria-labelledby="leadhub-import-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 px-6 py-5">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <Zap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2
                  id="leadhub-import-title"
                  className="text-lg font-semibold tracking-tight text-slate-900"
                >
                  Import from LeadHub
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Pick a lead source, set filters, then sync matching leads into
                  this campaign.
                  {isContinuous
                    ? ` Continuous campaigns also auto-sync ${continuousSyncLabel ?? "on schedule"}.`
                    : " Sync runs only when you click Sync now."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                isContinuous
                  ? "border-blue-200 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {isContinuous
                ? `Continuous mode: LeadHub auto-syncs ${continuousSyncLabel ?? "on your schedule"}. You can still sync manually anytime.`
                : "Standard mode: LeadHub does not auto-sync. Use Sync now to pull matching leads."}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              <span className="font-semibold">Re-sync replaces previous LeadHub import.</span>{" "}
              When you sync again, previous LeadHub leads for this campaign are
              removed completely from the campaign and from your leads (unless
              they are used in another campaign). The new sync results replace
              them.
            </div>

            {loadingMeta && (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading LeadHub lists…
              </p>
            )}

            <section className="space-y-2.5">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lead source
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: "regular" as const,
                      label: "Lead CRM",
                      hint: "Enriched pipeline leads",
                    },
                    {
                      id: "signup" as const,
                      label: "Signup data",
                      hint: "Locked signup emails",
                    },
                  ] as const
                ).map((opt) => {
                  const active =
                    opt.id === "signup" ? isSignupList : !isSignupList;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDataSource(opt.id)}
                      className={`rounded-xl border px-3.5 py-3 text-left transition ${
                        active
                          ? "border-blue-600 bg-blue-50/80 shadow-sm ring-1 ring-blue-600/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          active ? "text-blue-900" : "text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {opt.hint}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Filters
              </h5>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    List
                  </label>
                  <select
                    className={selectClassName}
                    value={value?.listIds?.[0] ?? ""}
                    onChange={(e) => {
                      const listId = e.target.value;
                      patch({
                        listIds: listId ? [listId] : [],
                        listType: isSignupList ? "signup" : "regular",
                      });
                    }}
                  >
                    <option value="">Any list</option>
                    {(isSignupList ? signupLists : crmLists).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!isSignupList && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Category
                    </label>
                    <select
                      className={selectClassName}
                      value={value?.categoryIds?.[0] ?? ""}
                      onChange={(e) =>
                        patch({
                          categoryIds: e.target.value ? [e.target.value] : [],
                        })
                      }
                    >
                      <option value="">Any category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!isSignupList && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Stage
                    </label>
                    <select
                      className={selectClassName}
                      value={value?.pipelineStage ?? ""}
                      onChange={(e) =>
                        patch({
                          pipelineStage: e.target.value
                            ? (e.target.value as LeadhubPipelineStage)
                            : undefined,
                        })
                      }
                    >
                      <option value="">Any stage</option>
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!isSignupList && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Origin source
                    </label>
                    <select
                      className={selectClassName}
                      value={value?.leadSource ?? ""}
                      onChange={(e) =>
                        patch({
                          leadSource: e.target.value
                            ? (e.target.value as LeadhubLeadSource)
                            : undefined,
                        })
                      }
                    >
                      <option value="">Any origin</option>
                      {LEAD_SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  {isSignupList ? "Signup category" : "Priority"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => {
                    const active = (value?.priorities ?? []).includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePriority(p)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                          active
                            ? "bg-blue-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                {isSignupList && (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Filters signup leads by hot / warm / cold category.
                  </p>
                )}
              </div>

              {!isSignupList && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Min ICP score
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={value?.minIcpScore ?? ""}
                      onChange={(e) =>
                        patch({
                          minIcpScore: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className={inputClassName}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Min intent confidence
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={value?.minIntentScore ?? ""}
                      onChange={(e) =>
                        patch({
                          minIntentScore: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className={inputClassName}
                      placeholder="e.g. 40"
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Email mapping
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                Send address for{" "}
                <span className="font-mono text-slate-800">{"{{email}}"}</span>:
              </p>
              <p className="mt-2 text-[11px] text-slate-600">
                {isSignupList ? (
                  <>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-800 ring-1 ring-amber-200">
                      signup.email
                    </span>{" "}
                    — locked signup address
                  </>
                ) : (
                  <>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                      contact.email
                    </span>{" "}
                    — enriched primary email
                  </>
                )}
              </p>
            </section>

            <SyncProgressBar
              syncing={syncing}
              enriching={enriching}
              syncPhase={syncPhase}
              syncStats={syncStats}
              isContinuous={isContinuous}
            />

            {syncLinks && syncLinks.length > 0 && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[11px] font-semibold text-slate-800">
                  Recent sync activity
                </p>
                {syncLinks.slice(0, 12).map((link) => (
                  <div
                    key={link.leadhubLeadId}
                    className="space-y-0.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                      <span className="font-medium text-slate-800">
                        {link.email || link.leadhubLeadId}
                      </span>
                      <span className="capitalize text-slate-500">
                        {link.syncStatus.replace(/_/g, " ")}
                      </span>
                      {link.priority && (
                        <span className="text-slate-500">
                          ({link.priority})
                        </span>
                      )}
                    </div>
                    {link.emailField && (
                      <p className="font-mono text-[10px] text-slate-500">
                        {link.mergeToken ?? "{{email}}"}{" "}
                        <span className="text-slate-400">←</span>{" "}
                        <span
                          className={
                            link.isSignupLead
                              ? "text-amber-700"
                              : "text-slate-600"
                          }
                        >
                          {link.emailField}
                        </span>
                      </p>
                    )}
                    {link.lastError && (
                      <p className="text-[10px] text-amber-700">
                        {link.lastError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {onSyncNow && (
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={syncing || enriching}
                onClick={onSyncNow}
              >
                {syncing ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Syncing…
                  </>
                ) : (
                  "Sync now"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
