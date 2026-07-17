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
  Link2,
  Sparkles,
  FileText,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  getLeadhubCategories,
  getLeadhubLists,
  getLeadhubPersonalizationTokens,
  getLeadhubStatus,
  LeadhubCategory,
  LeadhubList,
  LeadhubSyncConfig,
} from "@/utils/api/leadhubClient";

interface LeadhubAutopilotPanelProps {
  value: LeadhubSyncConfig | null;
  onChange: (config: LeadhubSyncConfig | null) => void;
  onSyncNow?: () => void;
  syncing?: boolean;
  enriching?: boolean;
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
    { id: "enriching", label: "Enriching" },
    { id: "ready", label: "Ready" },
    { id: "queued", label: "Queued" },
  ] as const;

  const activePhase =
    syncPhase === "fetching"
      ? "fetching"
      : syncPhase === "enriching" || enriching
        ? "enriching"
        : syncPhase === "complete" && syncStats
          ? syncStats.queued > 0
            ? "queued"
            : "ready"
          : null;

  const total =
    (syncStats?.ready ?? 0) +
    (syncStats?.pendingEnrichment ?? 0) +
    (syncStats?.queued ?? 0) +
    (syncStats?.skipped ?? 0) +
    (syncStats?.failed ?? 0);
  const done = (syncStats?.ready ?? 0) + (syncStats?.queued ?? 0);
  const pct =
    syncing && !syncStats
      ? 35
      : enriching && total > 0
        ? Math.min(95, Math.round((done / Math.max(total, 1)) * 100))
        : syncPhase === "complete"
          ? 100
          : syncing
            ? 50
            : 0;

  if (!syncing && !enriching && !syncStats) return null;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-800">
          {syncing
            ? "Syncing leads…"
            : enriching
              ? "Enriching in LeadHub…"
              : syncPhase === "complete"
                ? "Sync complete"
                : "Sync status"}
        </p>
        {(syncing || enriching) && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            syncing || enriching
              ? "bg-blue-500"
              : syncPhase === "error"
                ? "bg-amber-500"
                : "bg-emerald-500"
          } ${syncing && !syncStats ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {phases.map((p) => {
          const isActive = activePhase === p.id;
          return (
            <span
              key={p.id}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                isActive
                  ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
                  : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {p.label}
            </span>
          );
        })}
      </div>
      {syncStats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Ready", value: syncStats.ready },
            { label: "Enriching", value: syncStats.pendingEnrichment },
            { label: "Queued", value: syncStats.queued },
            {
              label: "Skipped",
              value: syncStats.skipped,
              hint:
                [
                  syncStats.skippedNoEmail
                    ? `${syncStats.skippedNoEmail} no email`
                    : null,
                  syncStats.skippedVerification
                    ? `${syncStats.skippedVerification} unverified`
                    : null,
                  syncStats.skippedEnrichedOnly
                    ? `${syncStats.skippedEnrichedOnly} not enriched`
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ") || undefined,
            },
            ...(syncStats.failed
              ? [{ label: "Failed", value: syncStats.failed }]
              : []),
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
              <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
              {"hint" in stat && stat.hint ? (
                <p className="mt-0.5 text-[10px] text-slate-500">{stat.hint}</p>
              ) : null}
            </div>
          ))}
        </div>
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
      toast.success(`Copied ${label}`);
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
  value,
  onChange,
  onSyncNow,
  syncing,
  enriching,
  syncPhase = "idle",
  syncStats,
  syncLinks,
}: LeadhubAutopilotPanelProps) {
  const [connected, setConnected] = useState(false);
  const [lists, setLists] = useState<LeadhubList[]>([]);
  const [categories, setCategories] = useState<LeadhubCategory[]>([]);
  const [tokens, setTokens] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);

  const enabled = Boolean(value?.enabled);
  const personalizationMode = value?.personalizationMode ?? "template";
  const grouped = useMemo(() => groupTokens(tokens), [tokens]);

  useEffect(() => {
    (async () => {
      try {
        const status = await getLeadhubStatus();
        setConnected(status.isConfigured);
        if (!status.isConfigured) return;
        setLoadingMeta(true);
        const [l, c, t] = await Promise.all([
          getLeadhubLists(),
          getLeadhubCategories(),
          getLeadhubPersonalizationTokens(),
        ]);
        setLists(l);
        setCategories(c);
        setTokens(t);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const ensureConfig = (): LeadhubSyncConfig =>
    value ?? {
      enabled: true,
      source: "leadhub_autopilot",
      enrichmentGate: "auto_enrich",
      trustLeadhubVerification: true,
      priorities: ["hot", "warm"],
      dailyIntakeCap: 50,
      personalizationMode: "template",
    };

  const toggleEnabled = (next: boolean) => {
    if (!connected) {
      toast.error("Connect LeadHub in Settings → Integrations first");
      return;
    }
    if (!next) {
      onChange(null);
      return;
    }
    onChange({ ...ensureConfig(), enabled: true });
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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">
                LeadHub Autopilot
              </h4>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  connected
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                }`}
              >
                <Link2 className="h-2.5 w-2.5" />
                {connected ? "Connected" : "Not connected"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Continuously pull matching LeadHub leads. Enrichment runs in LeadHub
              (~2–3 min). Verified LeadHub emails skip Reoon.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => toggleEnabled(!enabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {!connected && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
            LeadHub is not connected.{" "}
            <Link
              href="/email/settings?tab=integrations"
              className="font-semibold underline underline-offset-2"
            >
              Settings → Integrations
            </Link>{" "}
            to add your service API key.
          </p>
        )}

        {enabled && connected && (
          <>
            {loadingMeta && (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading LeadHub lists…
              </p>
            )}

            {/* Lead intake */}
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

            {/* Email mode cards */}
            <section className="space-y-2">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Email personalization
              </h5>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => patch({ personalizationMode: "template" })}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    personalizationMode === "template"
                      ? "border-blue-400 bg-blue-50/80 ring-2 ring-blue-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-900">
                      Template
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                    Write sequence emails with {"{{tokens}}"} from LeadHub (hook,
                    problem, CTA…).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => patch({ personalizationMode: "ai_agent" })}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    personalizationMode === "ai_agent"
                      ? "border-blue-400 bg-blue-50/80 ring-2 ring-blue-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <span className="text-sm font-semibold text-slate-900">
                      LeadSniper agent
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                    LeadSniper agent writes a unique step-1 email per lead at
                    send. Complete the agent brief in Sequence.
                  </p>
                </button>
              </div>
            </section>

            {/* Advanced accordion */}
            <section className="rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
              >
                <span className="text-xs font-semibold text-slate-800">
                  Advanced options
                </span>
                {advancedOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {advancedOpen && (
                <div className="space-y-3 border-t border-slate-100 px-3.5 py-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      If not enriched
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      value={value?.enrichmentGate ?? "auto_enrich"}
                      onChange={(e) =>
                        patch({
                          enrichmentGate: e.target.value as
                            | "auto_enrich"
                            | "enriched_only",
                        })
                      }
                    >
                      <option value="auto_enrich">
                        Auto-enrich in LeadHub, then send
                      </option>
                      <option value="enriched_only">
                        Only already-enriched leads
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Daily intake cap
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={value?.dailyIntakeCap ?? 50}
                      onChange={(e) =>
                        patch({
                          dailyIntakeCap: e.target.value
                            ? Number(e.target.value)
                            : 50,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Max new leads ingested per sync tick (default 50).
                    </p>
                  </div>
                  <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300"
                      checked={value?.trustLeadhubVerification !== false}
                      onChange={(e) =>
                        patch({ trustLeadhubVerification: e.target.checked })
                      }
                    />
                    <span>
                      <span className="block text-xs font-medium text-slate-800">
                        Trust LeadHub verification
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        Skip Reoon for emails already verified in LeadHub
                        (recommended).
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </section>

            {/* Tokens */}
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

            {/* Sync */}
            <SyncProgressBar
              syncing={syncing}
              enriching={enriching}
              syncPhase={syncPhase}
              syncStats={syncStats}
            />

            {onSyncNow && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={syncing || enriching}
                  onClick={onSyncNow}
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Syncing…
                    </>
                  ) : enriching ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Enriching…
                    </>
                  ) : (
                    "Sync now"
                  )}
                </Button>
                <p className="text-[11px] text-slate-500">
                  Imports matching leads into this campaign.
                </p>
              </div>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}
