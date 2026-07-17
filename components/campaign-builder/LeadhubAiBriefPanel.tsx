"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  isLeadhubAiBriefComplete,
  LEADHUB_AI_PARENT_TEMPLATE_PREVIEW,
} from "@/lib/leadhubAiParentTemplate";
import {
  expandLeadSniperBrief,
  LeadhubAiBrief,
  LeadhubAiBriefTone,
  LeadhubSyncConfig,
  LeadSniperPreviewEmail,
  previewLeadSniperEmails,
} from "@/utils/api/leadhubClient";
import {
  getEmailServiceErrorMessage,
  patchCampaign,
} from "@/utils/api/emailClient";
import IsolatedEmailHtmlPreview from "./IsolatedEmailHtmlPreview";

interface LeadhubAiBriefPanelProps {
  campaignId: string;
  domainId: string;
  config: LeadhubSyncConfig;
  onConfigChange: (config: LeadhubSyncConfig) => void;
  disabled?: boolean;
  campaignName?: string;
  /** Lift generated examples to the parent (Step 1 right pane). */
  onPreviewsChange?: (
    /** Pass `null` to only update previewing flag without touching the list. */
    previews: LeadSniperPreviewEmail[] | null,
    meta: { previewing: boolean }
  ) => void;
}

const TONE_OPTIONS: Array<{ value: LeadhubAiBriefTone; label: string }> = [
  { value: "founder", label: "Founder" },
  { value: "consultative", label: "Consultative" },
  { value: "direct", label: "Direct" },
];

export default function LeadhubAiBriefPanel({
  campaignId,
  domainId,
  config,
  onConfigChange,
  disabled,
  campaignName,
  onPreviewsChange,
}: LeadhubAiBriefPanelProps) {
  const [userPrompt, setUserPrompt] = useState(
    config.aiBrief?.userPrompt ?? ""
  );
  const [templateDescription, setTemplateDescription] = useState(
    config.aiBrief?.templateDescription ?? ""
  );
  const [brief, setBrief] = useState<LeadhubAiBrief>(config.aiBrief ?? {});
  const [fieldsOpen, setFieldsOpen] = useState(
    Boolean(config.aiBrief?.product)
  );
  const complete = isLeadhubAiBriefComplete(brief);
  const [panelOpen, setPanelOpen] = useState(() => !complete);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const previewGenRef = useRef(0);

  useEffect(() => {
    setUserPrompt(config.aiBrief?.userPrompt ?? "");
    setTemplateDescription(config.aiBrief?.templateDescription ?? "");
    setBrief(config.aiBrief ?? {});
    setFieldsOpen(Boolean(config.aiBrief?.product));
    setDirty(false);
  }, [config.aiBrief]);

  useEffect(() => {
    setPanelOpen(!isLeadhubAiBriefComplete(config.aiBrief ?? {}));
  }, [campaignId]);

  const templateHtml =
    brief.emailTemplateHtml?.trim() || LEADHUB_AI_PARENT_TEMPLATE_PREVIEW;

  const updateField = <K extends keyof LeadhubAiBrief>(
    key: K,
    value: LeadhubAiBrief[K]
  ) => {
    setBrief((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const buildConfig = (
    nextBrief: LeadhubAiBrief,
    examples?: LeadSniperPreviewEmail[] | null
  ): LeadhubSyncConfig => {
    const {
      agentPreviewExamples: _dropExamples,
      agentPreviewExamplesAt: _dropAt,
      ...configRest
    } = config;
    const base: LeadhubSyncConfig = {
      ...configRest,
      enabled: true,
      source: "leadhub_autopilot",
      personalizationMode: "ai_agent",
      aiBrief: nextBrief,
    };
    // undefined = omit (server preserves); null/array = explicit replace
    if (examples === undefined) {
      return base;
    }
    if (examples === null) {
      return {
        ...base,
        agentPreviewExamples: [],
        agentPreviewExamplesAt: new Date().toISOString(),
      };
    }
    return {
      ...base,
      agentPreviewExamples: examples,
      agentPreviewExamplesAt: new Date().toISOString(),
    };
  };

  const runAgentExpand = async () => {
    const prompt = userPrompt.trim();
    if (prompt.length < 10) {
      toast.error("Tell the agent about your product in a bit more detail");
      return;
    }
    try {
      setGenerating(true);
      const expanded = await expandLeadSniperBrief({
        userPrompt: prompt,
        templateDescription: templateDescription.trim() || undefined,
        campaignName,
      });
      const nextBrief: LeadhubAiBrief = {
        ...expanded,
        userPrompt: prompt,
        templateDescription: templateDescription.trim() || undefined,
      };
      setBrief(nextBrief);
      setFieldsOpen(true);
      setPanelOpen(true);
      setDirty(true);
      toast.success("LeadSniper agent filled your brief");
    } catch (err: unknown) {
      toast.error(
        getEmailServiceErrorMessage(err, "LeadSniper agent failed to expand brief")
      );
    } finally {
      setGenerating(false);
    }
  };

  const loadPreviews = async () => {
    const gen = ++previewGenRef.current;
    try {
      setPreviewing(true);
      // Keep current examples on screen; only flip the loading flag
      onPreviewsChange?.(null, { previewing: true });
      const data = await previewLeadSniperEmails({
        campaignId,
        limit: 5,
      });
      // Ignore stale responses if the user clicked Preview again
      if (gen !== previewGenRef.current) return;
      const next = data.previews ?? [];
      if (next.length > 0) {
        const nextBrief: LeadhubAiBrief = {
          userPrompt: userPrompt.trim() || brief.userPrompt,
          templateDescription: templateDescription.trim() || undefined,
          emailTemplateHtml: brief.emailTemplateHtml?.trim() || undefined,
          product: brief.product?.trim() || undefined,
          proof: brief.proof?.trim() || undefined,
          cta: brief.cta?.trim() || undefined,
          senderName: brief.senderName?.trim() || undefined,
          senderCompany: brief.senderCompany?.trim() || undefined,
          tone: brief.tone,
          extra: brief.extra?.trim() || undefined,
        };
        // Replace old examples in local config + Step 1 pane (server already persisted)
        const nextConfig = buildConfig(nextBrief, next);
        onConfigChange(nextConfig);
        onPreviewsChange?.(next, { previewing: false });
        toast.success(
          `LeadSniper agent generated ${next.length} example emails`
        );
      } else {
        onPreviewsChange?.(null, { previewing: false });
        toast.error("No example emails were generated. Try again.");
      }
    } catch (err: unknown) {
      if (gen !== previewGenRef.current) return;
      onPreviewsChange?.(null, { previewing: false });
      toast.error(
        getEmailServiceErrorMessage(err, "Could not generate email previews")
      );
    } finally {
      if (gen === previewGenRef.current) {
        setPreviewing(false);
      }
    }
  };

  const save = async () => {
    if (!complete) {
      toast.error("Run the agent first so product and proof are filled");
      return;
    }
    const nextBrief: LeadhubAiBrief = {
      userPrompt: userPrompt.trim() || brief.userPrompt,
      templateDescription: templateDescription.trim() || undefined,
      emailTemplateHtml: brief.emailTemplateHtml?.trim() || undefined,
      product: brief.product?.trim() || undefined,
      proof: brief.proof?.trim() || undefined,
      cta: brief.cta?.trim() || undefined,
      senderName: brief.senderName?.trim() || undefined,
      senderCompany: brief.senderCompany?.trim() || undefined,
      tone: brief.tone,
      extra: brief.extra?.trim() || undefined,
    };
    // Omit examples from this patch so we don't re-write stale ones over a concurrent preview
    const next = buildConfig(nextBrief);
    try {
      setSaving(true);
      await patchCampaign(domainId, campaignId, { leadhubSyncConfig: next });
      onConfigChange({
        ...next,
        // Keep whatever examples are currently on the parent config until loadPreviews replaces them
        agentPreviewExamples: config.agentPreviewExamples,
        agentPreviewExamplesAt: config.agentPreviewExamplesAt,
      });
      setDirty(false);
      toast.success("Brief saved");
      await loadPreviews();
      setPanelOpen(false);
    } catch (err: unknown) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to save brief"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white shadow-sm">
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              LeadSniper agent brief
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {panelOpen
                ? "Describe your product and how you want to attract customers. The agent expands that into a full brief and email layout you can edit."
                : complete
                  ? "Brief ready — open to edit product, proof, or layout."
                  : "Open to complete your agent brief for Step 1 personalization."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              complete
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
            }`}
          >
            {complete ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Ready
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" /> Need agent fill
              </>
            )}
          </span>
          {panelOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {panelOpen && (
        <div className="space-y-3 border-t border-violet-100 px-4 pb-4 pt-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              What is your product, and how do you want to attract customers?{" "}
              <span className="text-red-500">*</span>
            </span>
            <textarea
              value={userPrompt}
              onChange={(e) => {
                setUserPrompt(e.target.value);
                setDirty(true);
              }}
              disabled={disabled || generating}
              rows={4}
              placeholder="e.g. We help B2B SaaS teams send personalized cold email at scale without hurting deliverability. Attract founders who care about reply rates, not spray-and-pray."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              Email layout preference (optional)
            </span>
            <textarea
              value={templateDescription}
              onChange={(e) => {
                setTemplateDescription(e.target.value);
                setDirty(true);
              }}
              disabled={disabled || generating}
              rows={2}
              placeholder="Leave blank for the default plain-text style, or describe another layout (still simple HTML, no heavy design)."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
            />
          </label>

          <button
            type="button"
            disabled={disabled || generating || userPrompt.trim().length < 10}
            onClick={() => void runAgentExpand()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Agent working…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate with LeadSniper agent
              </>
            )}
          </button>

          {complete && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setFieldsOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
                >
                  <span className="text-xs font-semibold text-slate-800">
                    Review & edit agent brief
                  </span>
                  {fieldsOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {fieldsOpen && (
                  <div className="space-y-3 border-t border-slate-100 px-3.5 py-3">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">
                        Product
                      </span>
                      <textarea
                        value={brief.product ?? ""}
                        onChange={(e) => updateField("product", e.target.value)}
                        disabled={disabled}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">
                        Proof
                      </span>
                      <textarea
                        value={brief.proof ?? ""}
                        onChange={(e) => updateField("proof", e.target.value)}
                        disabled={disabled}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">
                        CTA
                      </span>
                      <input
                        type="text"
                        value={brief.cta ?? ""}
                        onChange={(e) => updateField("cta", e.target.value)}
                        disabled={disabled}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                      />
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-medium text-slate-700">
                          Sign-off name
                        </span>
                        <input
                          type="text"
                          value={brief.senderName ?? ""}
                          onChange={(e) =>
                            updateField("senderName", e.target.value)
                          }
                          disabled={disabled}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:bg-white disabled:opacity-60"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-slate-700">
                          Company / product name
                        </span>
                        <input
                          type="text"
                          value={brief.senderCompany ?? ""}
                          onChange={(e) =>
                            updateField("senderCompany", e.target.value)
                          }
                          disabled={disabled}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:bg-white disabled:opacity-60"
                        />
                      </label>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-700">
                        Tone
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {TONE_OPTIONS.map((opt) => {
                          const active = (brief.tone ?? "founder") === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={disabled}
                              onClick={() => updateField("tone", opt.value)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                                active
                                  ? "bg-violet-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">
                        Email template HTML
                      </span>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Default plain-text layout — edit or regenerate with a
                        layout preference above. Placeholders:{" "}
                        {"{{first_name}}"} (recipient), {"{{opener}}"},{" "}
                        {"{{pain}}"}, {"{{solution}}"}, {"{{proof}}"},{" "}
                        {"{{cta}}"}, {"{{sender_name}}"}, {"{{sender_company}}"}{" "}
                        (alias {"{{company}}"}). Use {"{{recipient_company}}"}{" "}
                        only for the prospect&apos;s company.
                      </p>
                      <textarea
                        value={templateHtml}
                        onChange={(e) =>
                          updateField("emailTemplateHtml", e.target.value)
                        }
                        disabled={disabled}
                        rows={8}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] outline-none focus:border-violet-400 focus:bg-white disabled:opacity-60"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Template preview (default until you customize)
                </p>
                <IsolatedEmailHtmlPreview
                  html={templateHtml}
                  title="LeadSniper template preview"
                  iframeClassName="h-48"
                />
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {complete && (
              <button
                type="button"
                disabled={disabled || previewing || dirty}
                onClick={() => void loadPreviews()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                title={dirty ? "Save brief first" : undefined}
              >
                {previewing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating examples…
                  </>
                ) : (
                  <>
                    <Mail className="h-3.5 w-3.5" />
                    Preview 5 emails
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              disabled={disabled || saving || !dirty || !complete}
              onClick={() => void save()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save brief & generate examples"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
