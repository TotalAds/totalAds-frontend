"use client";

import {
  Plus,
  Mail,
  Trash2,
  Shuffle,
  FileText,
  Check,
  Loader2,
  CalendarDays,
  Zap,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";

import CreateEmailModal from "@/components/campaign-builder/CreateEmailModal";
import {
  buildTokenSampleValuesFromLead,
  computePersonalizationCoverage,
  extractVariableKeysFromLead,
  mergeVariableLists,
  type PersonalizationTokenCoverage,
} from "@/components/campaign-builder/htmlPreviewUtils";
import { INBOX_CAMPAIGN_DOMAIN_ID } from "@/lib/campaignDomain";
import {
  getLeadhubPersonalizationTokens,
  type LeadhubSyncConfig,
} from "@/utils/api/leadhubClient";
import {
  getCampaignById,
  getCampaignMemberLeads,
  getEmailServiceErrorMessage,
  patchCampaign,
  type Lead,
} from "@/utils/api/emailClient";

type StepCondition = "always" | "if_not_opened" | "if_not_replied";

interface SequenceStep {
  id: string;
  stepNumber: number;
  delayDays: number;
  condition: StepCondition;
  variants: StepVariant[];
  activeVariantId: string;
}

interface StepVariant {
  id: string;
  label: string;
  subject: string;
  previewText: string;
  body: string;
  bodyEditor: "simple" | "html";
  useSpintax: boolean;
  spintaxPackId: string;
  strictGrammarMode: boolean;
}

function createDefaultVariant(label: string): StepVariant {
  return {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label,
    subject: "",
    previewText: "",
    body: "",
    bodyEditor: "simple",
    useSpintax: false,
    spintaxPackId: "general",
    strictGrammarMode: false,
  };
}

function createDefaultStep(stepNumber: number, delayDays: number): SequenceStep {
  const variantA = createDefaultVariant("A");
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    stepNumber,
    delayDays,
    condition: stepNumber === 1 ? "always" : "if_not_replied",
    variants: [variantA],
    activeVariantId: variantA.id,
  };
}

const VARIANT_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const LOCKED_STATUSES = new Set(["completed", "cancelled", "verifying_leads"]);

interface SequenceTabProps {
  campaignId: string;
  domainId?: string;
  campaignStatus: string;
}

function mapApiSequenceToSteps(
  sequence: Array<{
    subject?: string;
    body?: string;
    previewText?: string;
    delayMinutes?: number;
    condition?: string;
    bodyEditor?: string;
    useSpintax?: boolean;
    spintaxPackId?: string;
    strictGrammarMode?: boolean;
    variants?: Array<{
      label?: string;
      subject?: string;
      body?: string;
      previewText?: string;
      bodyEditor?: string;
      useSpintax?: boolean;
      spintaxPackId?: string;
      strictGrammarMode?: boolean;
    }>;
  }>
): SequenceStep[] {
  if (!sequence?.length) {
    return [createDefaultStep(1, 0)];
  }

  return sequence.map((step, index) => {
    const conditionRaw = step.condition as StepCondition | undefined;
    const condition: StepCondition =
      conditionRaw === "if_not_opened" || conditionRaw === "if_not_replied"
        ? conditionRaw
        : "always";

    const apiVariants = Array.isArray(step.variants) ? step.variants : [];
    const variants: StepVariant[] =
      apiVariants.length > 0
        ? apiVariants.map((variant, variantIndex) => {
            const created = createDefaultVariant(
              variant.label || VARIANT_LABELS[variantIndex] || "A"
            );
            created.subject = variant.subject || "";
            created.body = variant.body || "";
            created.previewText = variant.previewText || "";
            created.bodyEditor = variant.bodyEditor === "html" ? "html" : "simple";
            created.useSpintax = Boolean(variant.useSpintax);
            created.spintaxPackId = variant.spintaxPackId || "general";
            created.strictGrammarMode = Boolean(variant.strictGrammarMode);
            return created;
          })
        : (() => {
            const variantA = createDefaultVariant("A");
            variantA.subject = step.subject || "";
            variantA.body = step.body || "";
            variantA.previewText = step.previewText || "";
            variantA.bodyEditor = step.bodyEditor === "html" ? "html" : "simple";
            variantA.useSpintax = Boolean(step.useSpintax);
            variantA.spintaxPackId = step.spintaxPackId || "general";
            variantA.strictGrammarMode = Boolean(step.strictGrammarMode);
            return [variantA];
          })();

    return {
      id: `step-${index + 1}-${Date.now()}`,
      stepNumber: index + 1,
      delayDays: Math.max(0, Math.round(Number(step.delayMinutes || 0) / 1440)),
      condition: index === 0 ? "always" : condition,
      variants,
      activeVariantId: variants[0]?.id || "",
    };
  });
}

function buildSequencePayload(steps: SequenceStep[]) {
  return steps.map((step, index) => {
    const variants = step.variants.map((variant, variantIndex) => ({
      label: variant.label || VARIANT_LABELS[variantIndex] || "A",
      subject: variant.subject || "",
      previewText: variant.previewText || "",
      body: variant.body || "",
      bodyEditor: variant.bodyEditor || "simple",
      useSpintax: Boolean(variant.useSpintax),
      spintaxPackId: variant.spintaxPackId || "general",
      strictGrammarMode: Boolean(variant.strictGrammarMode),
    }));
    const primary =
      step.variants.find((v) => v.id === step.activeVariantId) || step.variants[0];

    return {
      subject: primary?.subject || "",
      previewText: primary?.previewText || "",
      body: primary?.body || "",
      condition: index === 0 ? "always" : step.condition || "always",
      delayMinutes: index === 0 ? 0 : Math.max(0, Number(step.delayDays || 0)) * 1440,
      bodyEditor: primary?.bodyEditor || "simple",
      useSpintax: Boolean(primary?.useSpintax),
      spintaxPackId: primary?.spintaxPackId || "general",
      strictGrammarMode: Boolean(primary?.strictGrammarMode),
      variants,
    };
  });
}

export function SequenceTab({ campaignId, domainId, campaignStatus }: SequenceTabProps) {
  const effectiveDomainId = domainId || INBOX_CAMPAIGN_DOMAIN_ID;
  const isLocked = LOCKED_STATUSES.has(campaignStatus);

  const [steps, setSteps] = useState<SequenceStep[]>([createDefaultStep(1, 0)]);
  const [selectedStepId, setSelectedStepId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const skipAutosaveRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingVariantInfo, setEditingVariantInfo] = useState<{
    stepId: string;
    variantId: string;
  } | null>(null);
  const [leadhubSyncConfig, setLeadhubSyncConfig] =
    useState<LeadhubSyncConfig | null>(null);
  const [leadhubTokens, setLeadhubTokens] = useState<string[]>([]);
  const [tokenSampleValues, setTokenSampleValues] = useState<
    Record<string, string>
  >(() => buildTokenSampleValuesFromLead(null));
  const [tokenCoverage, setTokenCoverage] = useState<
    Record<string, PersonalizationTokenCoverage>
  >({});
  const [campaignLeadsForCoverage, setCampaignLeadsForCoverage] = useState<
    Lead[]
  >([]);

  const leadhubAutopilotEnabled =
    leadhubSyncConfig?.enabled === true &&
    leadhubSyncConfig?.source === "leadhub_autopilot";

  const baseSequenceVariables = [
    "first_name",
    "last_name",
    "email",
    "company",
    "title",
    "phone",
    "website",
  ];

  const availableVariables = useMemo(
    () =>
      leadhubAutopilotEnabled || leadhubTokens.length > 0
        ? mergeVariableLists(leadhubTokens, baseSequenceVariables)
        : baseSequenceVariables,
    [leadhubAutopilotEnabled, leadhubTokens]
  );

  useEffect(() => {
    if (campaignLeadsForCoverage.length === 0) {
      setTokenCoverage({});
      return;
    }
    setTokenCoverage(
      computePersonalizationCoverage(
        campaignLeadsForCoverage,
        availableVariables
      )
    );
  }, [campaignLeadsForCoverage, availableVariables]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const campaign = await getCampaignById(effectiveDomainId, campaignId);
        if (cancelled) return;
        const lh = campaign.leadhubSyncConfig as LeadhubSyncConfig | null;
        const enabled =
          lh?.enabled === true && lh?.source === "leadhub_autopilot";
        setLeadhubSyncConfig(enabled ? lh : null);

        const allLeads: Lead[] = [];
        let page = 1;
        let pages = 1;
        const pageSize = 100;
        while (page <= pages && page <= 50) {
          const members = await getCampaignMemberLeads(
            campaignId,
            page,
            pageSize
          ).catch(() => ({
            leads: [] as Lead[],
            pagination: { page: 1, limit: pageSize, total: 0, pages: 0 },
          }));
          if (cancelled) return;
          allLeads.push(...(members.leads || []));
          pages = Math.max(1, members.pagination?.pages || 1);
          if (!members.leads?.length) break;
          page += 1;
        }
        if (cancelled) return;
        setCampaignLeadsForCoverage(allLeads);

        const sampleLead =
          allLeads.find(
            (l) =>
              (l.enrichedData as Record<string, unknown> | null)?.source ===
                "leadhub" ||
              Boolean(
                (l.enrichedData as Record<string, unknown> | null)?.leadhub
              )
          ) ??
          allLeads[0] ??
          null;

        const hasLeadhubLead = Boolean(
          sampleLead &&
            ((sampleLead.enrichedData as Record<string, unknown> | null)
              ?.source === "leadhub" ||
              (sampleLead.enrichedData as Record<string, unknown> | null)
                ?.leadhub)
        );

        setTokenSampleValues(buildTokenSampleValuesFromLead(sampleLead));

        if (!enabled && !hasLeadhubLead) {
          setLeadhubTokens([]);
          return;
        }

        let apiTokens: string[] = [];
        try {
          apiTokens = await getLeadhubPersonalizationTokens();
        } catch {
          apiTokens = [];
        }
        if (cancelled) return;

        const leadKeys = extractVariableKeysFromLead(sampleLead);
        const allKeys = new Set<string>(leadKeys);
        for (const lead of allLeads.slice(0, 50)) {
          for (const k of extractVariableKeysFromLead(lead)) allKeys.add(k);
        }
        setLeadhubTokens(mergeVariableLists(apiTokens, Array.from(allKeys)));
      } catch {
        if (!cancelled) {
          setLeadhubSyncConfig(null);
          setLeadhubTokens([]);
          setTokenSampleValues(buildTokenSampleValuesFromLead(null));
          setCampaignLeadsForCoverage([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, effectiveDomainId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      skipAutosaveRef.current = true;
      try {
        const campaign = await getCampaignById(effectiveDomainId, campaignId);
        if (cancelled) return;

        const mapped = mapApiSequenceToSteps(campaign.sequence || []);
        setSteps(mapped);
        setSelectedStepId(mapped[0]?.id || "");
      } catch (error: unknown) {
        if (!cancelled) {
          toast.error(getEmailServiceErrorMessage(error, "Failed to load sequence"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          skipAutosaveRef.current = false;
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId, effectiveDomainId]);

  const selectedStep =
    steps.find((s) => s.id === selectedStepId) || steps[0];
  const activeVariant = selectedStep?.variants.find(
    (v) => v.id === selectedStep.activeVariantId
  );
  const updateStep = (stepId: string, patch: Partial<SequenceStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s))
    );
  };

  const addStep = () => {
    const maxDelay = Math.max(...steps.map((s) => s.delayDays), 0);
    const newStep = createDefaultStep(steps.length + 1, maxDelay + 2);
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  };

  const deleteStep = (stepId: string) => {
    if (steps.length <= 1) {
      toast.error("A sequence must have at least one step");
      return;
    }
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== stepId);
      return filtered.map((s, i) => ({
        ...s,
        stepNumber: i + 1,
        delayDays: i === 0 ? 0 : s.delayDays,
        condition: i === 0 ? "always" : s.condition,
      }));
    });
    if (selectedStepId === stepId) {
      const remaining = steps.find((s) => s.id !== stepId);
      if (remaining) setSelectedStepId(remaining.id);
    }
  };

  const addVariant = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        if (s.variants.length >= 26) {
          toast.error("Maximum 26 variants per step");
          return s;
        }
        const label = VARIANT_LABELS[s.variants.length];
        const newVariant = createDefaultVariant(label);
        return {
          ...s,
          variants: [...s.variants, newVariant],
          activeVariantId: newVariant.id,
        };
      })
    );
  };

  const deleteVariant = (stepId: string, variantId: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        if (s.variants.length <= 1) {
          toast.error("A step must have at least one variant");
          return s;
        }
        const filtered = s.variants.filter((v) => v.id !== variantId);
        const relabeled = filtered.map((v, i) => ({ ...v, label: VARIANT_LABELS[i] }));
        const nextActive =
          s.activeVariantId === variantId ? relabeled[0].id : s.activeVariantId;
        return { ...s, variants: relabeled, activeVariantId: nextActive };
      })
    );
  };

  const setActiveVariant = (stepId: string, variantId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, activeVariantId: variantId } : s))
    );
  };

  const openEmailEditor = (stepId: string, variantId: string) => {
    setEditingVariantInfo({ stepId, variantId });
    setEmailModalOpen(true);
  };

  const handleEmailApply = useCallback(
    (payload: {
      subject: string;
      previewText: string;
      htmlContent: string;
      bodyEditor: "simple" | "html";
      useSpintax: boolean;
      spintaxPackId: string;
      strictGrammarMode: boolean;
    }) => {
      if (!editingVariantInfo) return;
      const { stepId, variantId } = editingVariantInfo;
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id !== stepId) return s;
          return {
            ...s,
            variants: s.variants.map((v) =>
              v.id === variantId
                ? {
                    ...v,
                    subject: payload.subject,
                    previewText: payload.previewText,
                    body: payload.htmlContent,
                    bodyEditor: payload.bodyEditor,
                    useSpintax: payload.useSpintax,
                    spintaxPackId: payload.spintaxPackId,
                    strictGrammarMode: payload.strictGrammarMode,
                  }
                : v
            ),
          };
        })
      );
      setEmailModalOpen(false);
      setEditingVariantInfo(null);
    },
    [editingVariantInfo]
  );

  const persistSequence = useCallback(
    async (stepsToSave: SequenceStep[]) => {
      if (isLocked) return;
      setSaving(true);
      setSaved(false);
      try {
        await patchCampaign(effectiveDomainId, campaignId, {
          sequence: buildSequencePayload(stepsToSave),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (error: unknown) {
        toast.error(getEmailServiceErrorMessage(error, "Failed to save sequence"));
      } finally {
        setSaving(false);
      }
    },
    [campaignId, effectiveDomainId, isLocked]
  );

  useEffect(() => {
    if (loading || isLocked || skipAutosaveRef.current) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void persistSequence(steps);
    }, 600);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [steps, loading, isLocked, persistSequence]);

  const editingStep = editingVariantInfo
    ? steps.find((s) => s.id === editingVariantInfo.stepId)
    : null;
  const editingVariant = editingStep?.variants.find(
    (v) => v.id === editingVariantInfo?.variantId
  );

  if (loading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[640px] flex-col">
      {leadhubAutopilotEnabled && (
        <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                LeadHub Autopilot · Template tokens
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                Use LeadHub personalization tokens in every step via Personalize.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
      {/* Left: step list */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email Steps
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {steps.length} step{steps.length !== 1 ? "s" : ""} in sequence
          </p>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {steps.map((step) => {
            const isSelected = step.id === selectedStepId;
            return (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                className={`group relative cursor-pointer rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-blue-300 bg-white shadow-sm ring-1 ring-blue-200"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {step.stepNumber}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Step {step.stepNumber}
                    </span>
                  </div>
                  {steps.length > 1 && !isLocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStep(step.id);
                      }}
                      className="hidden h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 group-hover:flex"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="mb-2 space-y-0.5 text-[10px] text-slate-400">
                  {step.stepNumber === 1 ? (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Sends on day 0
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      +{step.delayDays} day{step.delayDays !== 1 ? "s" : ""} after step{" "}
                      {step.stepNumber - 1}
                    </span>
                  )}
                  {step.stepNumber > 1 && step.condition !== "always" && (
                    <span className="block capitalize text-slate-500">
                      {step.condition.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {step.variants.map((variant) => (
                    <div
                      key={variant.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStepId(step.id);
                        setActiveVariant(step.id, variant.id);
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition-colors ${
                        step.activeVariantId === variant.id && isSelected
                          ? "bg-blue-50 font-medium text-blue-700"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="font-bold">Variant {variant.label}</span>
                        {variant.subject ? (
                          <span className="truncate text-slate-400">
                            {variant.subject}
                          </span>
                        ) : (
                          <span className="italic text-slate-300">Empty</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addVariant(step.id);
                    }}
                    className="mt-2 flex w-full items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add variant
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!isLocked && (
          <div className="border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={addStep}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </button>
          </div>
        )}
      </div>

      {/* Right: editor */}
      <div className="flex flex-1 flex-col bg-white">
        {selectedStep && activeVariant ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">
              <div className="flex items-center gap-1">
                {selectedStep.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setActiveVariant(selectedStep.id, variant.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedStep.activeVariantId === variant.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <Shuffle className="h-3 w-3" />
                    Variant {variant.label}
                  </button>
                ))}
                {!isLocked && selectedStep.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      deleteVariant(selectedStep.id, selectedStep.activeVariantId)
                    }
                    className="ml-1 rounded-lg px-2 py-1 text-[11px] text-red-500 hover:bg-red-50"
                  >
                    Remove variant
                  </button>
                )}
              </div>
              {selectedStep.variants.length > 1 && (
                <div className="flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] text-amber-700">
                  <Shuffle className="h-3 w-3" />
                  Random variant per lead
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Step timing */}
              <div className="mb-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Step timing
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        {selectedStep.stepNumber === 1
                          ? "Send day (first email)"
                          : "Days after previous step"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        disabled={selectedStep.stepNumber === 1 || isLocked}
                        value={selectedStep.stepNumber === 1 ? 0 : selectedStep.delayDays}
                        onChange={(e) =>
                          updateStep(selectedStep.id, {
                            delayDays: Math.max(0, Number(e.target.value || 0)),
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        {selectedStep.stepNumber === 1
                          ? "First step always sends on day 0 when the campaign starts."
                          : `Waits ${selectedStep.delayDays} day(s) after step ${selectedStep.stepNumber - 1}.`}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Continue condition
                      </label>
                      <select
                        disabled={selectedStep.stepNumber === 1 || isLocked}
                        value={selectedStep.stepNumber === 1 ? "always" : selectedStep.condition}
                        onChange={(e) =>
                          updateStep(selectedStep.id, {
                            condition: e.target.value as StepCondition,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                      >
                        <option value="always">Always continue</option>
                        <option value="if_not_opened">Only if not opened</option>
                        <option value="if_not_replied">Only if not replied</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {activeVariant.subject || activeVariant.body ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Subject
                    </span>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {activeVariant.subject || (
                        <span className="italic text-slate-400">No subject</span>
                      )}
                    </p>
                    {activeVariant.previewText && (
                      <p className="mt-1 text-xs text-slate-500">
                        Preview: {activeVariant.previewText}
                      </p>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Email body
                      </span>
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() =>
                            openEmailEditor(selectedStep.id, activeVariant.id)
                          }
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    <div
                      className="prose prose-sm max-h-80 max-w-none overflow-y-auto p-4 text-sm leading-relaxed text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html:
                          activeVariant.body ||
                          "<em class='text-slate-400'>No content</em>",
                      }}
                    />
                  </div>

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => openEmailEditor(selectedStep.id, activeVariant.id)}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4" />
                      Edit email content
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                    <Mail className="h-7 w-7 text-blue-500" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-slate-900">
                    Step {selectedStep.stepNumber} — Variant {activeVariant.label}
                  </h3>
                  <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
                    Write the email for this step. Add variants A/B to test different messages —
                    one is picked at random per lead.
                  </p>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => openEmailEditor(selectedStep.id, activeVariant.id)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
                    >
                      <Mail className="h-4 w-4" />
                      Write email
                    </button>
                  )}
                </div>
              )}

              {!isLocked && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={addStep}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-4 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add sequence step
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
              <div className="text-xs text-slate-500">
                {`Step ${selectedStep.stepNumber} · ${selectedStep.variants.length} variant${
                  selectedStep.variants.length !== 1 ? "s" : ""
                }`}
                {selectedStep.stepNumber > 1 && ` · +${selectedStep.delayDays}d delay`}
              </div>
              {!isLocked ? (
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    saving
                      ? "bg-slate-100 text-slate-600"
                      : saved
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Saved
                    </>
                  ) : (
                    "Autosave on"
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400">Sequence locked for this status</span>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Select a step to edit
          </div>
        )}
      </div>

      {emailModalOpen && editingVariant && (
        <CreateEmailModal
          open={emailModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEmailModalOpen(false);
              setEditingVariantInfo(null);
            }
          }}
          domainId={effectiveDomainId}
          campaignId={campaignId}
          excludeCampaignId={campaignId}
          availableVariables={availableVariables}
          tokenSampleValues={tokenSampleValues}
          tokenCoverage={
            campaignLeadsForCoverage.length > 0 ? tokenCoverage : undefined
          }
          seedSubject={editingVariant.subject}
          seedPreviewText={editingVariant.previewText}
          seedUseSpintax={editingVariant.useSpintax}
          seedSpintaxPackId={editingVariant.spintaxPackId as any}
          seedStrictGrammarMode={editingVariant.strictGrammarMode}
          seedHtml={editingVariant.body}
          seedBodyEditor={editingVariant.bodyEditor}
          openDirectlyToEditor
          onApply={handleEmailApply}
        />
      )}
      </div>
    </div>
  );
}
