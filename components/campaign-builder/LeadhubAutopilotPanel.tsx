"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BodyPortal } from "@/components/ui/BodyPortal";
import {
  getLeadhubCategories,
  getLeadhubLists,
  getLeadhubPersonalizationTokens,
  LeadhubCategory,
  LeadhubList,
  LeadhubSyncConfig,
} from "@/utils/api/leadhubClient";

interface LeadhubAutopilotPanelProps {
  open: boolean;
  onClose: () => void;
  value: LeadhubSyncConfig | null;
  onChange: (config: LeadhubSyncConfig | null) => void;
  onSyncNow?: () => void;
  syncing?: boolean;
  enriching?: boolean;
  /** When true, auto-sync runs every 12h; Sync now is still available. */
  isContinuous?: boolean;
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
    syncStatus: string;
    lastError: string | null;
    priority: string | null;
  }>;
}

const PRIORITIES: Array<"hot" | "warm" | "cold"> = ["hot", "warm", "cold"];

const CONTACT_TOKENS = new Set([
  "first_name",
  "last_name",
  "title",
  "email",
  "name",
  "phone",
  "website",
  "role",
  "linkedin_url",
  "location",
]);
const COMPANY_TOKENS = new Set([
  "company",
  "company_domain",
  "company_website",
  "industry",
  "company_size",
  "company_summary",
  "growth_stage",
]);

function groupTokens(tokens: string[]) {
  const contact: string[] = [];
  const company: string[] = [];
  const outreach: string[] = [];
  for (const t of tokens) {
    if (CONTACT_TOKENS.has(t)) contact.push(t);
    else if (COMPANY_TOKENS.has(t)) company.push(t);
    else outreach.push(t);
  }
  return { contact, company, outreach };
}

function SyncProgressBar({
  syncing,
  enriching,
  syncPhase,
  syncStats,
}: {
  syncing?: boolean;
  enriching?: boolean;
  syncPhase?: LeadhubAutopilotPanelProps["syncPhase"];
  syncStats?: LeadhubAutopilotPanelProps["syncStats"];
}) {
  const phases = [
    { id: "fetching", label: "Fetching" },
    { id: "ready", label: "Ready" },
    { id: "queued", label: "Queued" },
  ] as const;

  const activePhase =
    syncPhase === "fetching"
      ? "fetching"
      : syncPhase === "complete" && syncStats
        ? syncStats.queued > 0
          ? "queued"
          : "ready"
        : null;

  const total =
    (syncStats?.ready ?? 0) +
    (syncStats?.queued ?? 0) +
    (syncStats?.skipped ?? 0);

  if (!syncing && !enriching && syncPhase === "idle" && !syncStats) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex flex-wrap gap-2">
        {phases.map((phase) => {
          const isActive = activePhase === phase.id;
          return (
            <span
              key={phase.id}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {isActive && <Loader2 className="h-3 w-3 animate-spin" />}
              {phase.label}
            </span>
          );
        })}
      </div>
      {syncStats && total > 0 && (
        <p className="text-[11px] text-slate-600">
          {syncStats.ready} ready · {syncStats.queued} queued ·{" "}
          {syncStats.skipped} skipped
          {(syncStats.skippedNoEmail ?? 0) > 0
            ? ` (${syncStats.skippedNoEmail} no valid email)`
            : ""}
          {(syncStats.skippedVerification ?? 0) > 0
            ? ` (${syncStats.skippedVerification} verification)`
            : ""}
          {(syncStats.skippedEnrichedOnly ?? 0) > 0
            ? ` (${syncStats.skippedEnrichedOnly} filter skipped)`
            : ""}
          {(syncStats.failed ?? 0) > 0 ? ` · ${syncStats.failed} failed` : ""}
        </p>
      )}
    </div>
  );
}

function TokenChip({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const label = `{{${token}}}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(label);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${label}`}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
    >
      {label}
      {copied ? (
        <Check className="h-2.5 w-2.5 text-emerald-600" />
      ) : (
        <Copy className="h-2.5 w-2.5 text-slate-400" />
      )}
    </button>
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
  syncPhase = "idle",
  syncStats,
  syncLinks,
}: LeadhubAutopilotPanelProps) {
  const [lists, setLists] = useState<LeadhubList[]>([]);
  const [categories, setCategories] = useState<LeadhubCategory[]>([]);
  const [tokens, setTokens] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);

  const enabled = Boolean(value?.enabled);
  const grouped = useMemo(() => groupTokens(tokens), [tokens]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingMeta(true);
        const [l, c, t] = await Promise.all([
          getLeadhubLists(),
          getLeadhubCategories(),
          getLeadhubPersonalizationTokens(),
        ]);
        if (cancelled) return;
        setLists(l);
        setCategories(c);
        setTokens(t);
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
      categoryIds: value?.categoryIds,
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
                  Choose filters and sync matching LeadHub leads into this campaign.
                  {isContinuous
                    ? " Continuous campaigns also auto-sync every 12 hours."
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

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                isContinuous
                  ? "border-blue-200 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {isContinuous
                ? "Continuous mode: LeadHub auto-syncs every 12 hours. You can still sync manually anytime."
                : "Standard mode: LeadHub does not auto-sync. Use Sync now to pull matching leads."}
            </div>

            {loadingMeta && (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading LeadHub lists…
              </p>
            )}

            <section className="space-y-3">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lead intake
              </h5>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    List
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    value={value?.listIds?.[0] ?? ""}
                    onChange={(e) =>
                      patch({
                        listIds: e.target.value ? [e.target.value] : [],
                      })
                    }
                  >
                    <option value="">Any list</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Priority
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Min intent score
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="e.g. 40"
                  />
                </div>
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
            </section>

            {tokens.length > 0 && (
              <section className="rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTokensOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
                >
                  <span className="text-xs font-semibold text-slate-800">
                    Personalization tokens
                    <span className="ml-2 font-normal text-slate-400">
                      ({tokens.length})
                    </span>
                  </span>
                  {tokensOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {tokensOpen && (
                  <div className="space-y-3 border-t border-slate-100 px-3.5 py-3">
                    <p className="text-[11px] text-slate-500">
                      Click a token to copy. Insert them in Sequence → Personalize.
                    </p>
                    {(
                      [
                        ["Contact", grouped.contact],
                        ["Company", grouped.company],
                        ["Outreach", grouped.outreach],
                      ] as const
                    ).map(([label, group]) =>
                      group.length > 0 ? (
                        <div key={label}>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {label}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.map((t) => (
                              <TokenChip key={t} token={t} />
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </section>
            )}

            <SyncProgressBar
              syncing={syncing}
              enriching={enriching}
              syncPhase={syncPhase}
              syncStats={syncStats}
            />

            {syncLinks && syncLinks.length > 0 && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[11px] font-semibold text-slate-800">
                  Recent sync activity
                </p>
                {syncLinks.slice(0, 12).map((link) => (
                  <div
                    key={link.leadhubLeadId}
                    className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500"
                  >
                    <span className="font-medium text-slate-800">
                      {link.email || link.leadhubLeadId}
                    </span>
                    <span className="capitalize">
                      {link.syncStatus.replace(/_/g, " ")}
                    </span>
                    {link.priority && <span>({link.priority})</span>}
                    {link.lastError && (
                      <span className="text-amber-700">— {link.lastError}</span>
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
