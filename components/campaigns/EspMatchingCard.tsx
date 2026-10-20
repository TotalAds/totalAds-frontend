"use client";

import { useEffect, useMemo, useState } from "react";

import { ProviderLogo, providerLabel } from "@/components/email/ProviderLogo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCampaignEspCoverage } from "@/utils/api/emailClient";

export type EspMode = "off" | "prioritize_matching" | "strict_matching";

export type EspRuleDraft = {
  senderFamily: string;
  recipientFamily: string;
  action: "allow" | "deny";
  enabled: boolean;
  label: string;
};

export type EspMatchingValue = {
  inheritWorkspaceDefault: boolean;
  mode: EspMode;
  unknownRecipientPolicy: "any_eligible" | "strict_unknown";
  rules: EspRuleDraft[];
};

export const ESP_FAMILIES = [
  "google",
  "microsoft",
  "zoho",
  "yahoo",
  "apple_icloud",
  "proton",
  "fastmail",
  "other_smtp",
  "unknown",
];

const MODES: Array<{
  id: EspMode;
  label: string;
  summary: string;
  detail: string;
  recommended?: boolean;
}> = [
  {
    id: "prioritize_matching",
    label: "Prioritize matching",
    summary: "Match first, then use your other selected mailboxes.",
    detail:
      "Google leads go to Google mailboxes first. If those are busy or full, the lead still sends from another selected mailbox in the same cycle. Unknown providers also use any selected mailbox.",
    recommended: true,
  },
  {
    id: "strict_matching",
    label: "Strict matching",
    summary: "Only a matching mailbox can send. Leads wait otherwise.",
    detail:
      "A Microsoft lead waits until a Microsoft mailbox is free. Other selected mailboxes are not used as fallback. This can reduce throughput.",
  },
  {
    id: "off",
    label: "Off",
    summary: "Ignore provider matching. Use normal rotation.",
    detail: "Sender choice follows your existing rotation and volume split only.",
  },
];

type Coverage = {
  leadsByFamily: Record<string, number>;
  sendersByFamily: Record<string, number>;
  confidentLeads: number;
  eligibleLeads: number;
  uncovered: string[];
};

export function EspMatchingCard({
  value,
  onChange,
  disabled,
  campaignId,
  showInherit = true,
  collapsible = false,
  defaultOpen = true,
}: {
  value: EspMatchingValue;
  onChange: (next: EspMatchingValue) => void;
  disabled?: boolean;
  campaignId?: string;
  showInherit?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);
  const conflicts = useMemo(() => contradictory(value.rules), [value.rules]);

  useEffect(() => {
    if (!campaignId || value.mode === "off") {
      setCoverage(null);
      return;
    }
    const handle = window.setTimeout(() => {
      void getCampaignEspCoverage(campaignId).then(setCoverage).catch(() => setCoverage(null));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [campaignId, value.mode, value.rules, value.unknownRecipientPolicy]);

  const selectMode = (mode: EspMode) => {
    onChange({
      ...value,
      mode,
      // Prioritize: default fallback is any selected mailbox.
      unknownRecipientPolicy:
        mode === "prioritize_matching" ? "any_eligible" : value.unknownRecipientPolicy,
    });
  };

  const modeLabel = value.inheritWorkspaceDefault
    ? "Workspace default"
    : MODES.find((mode) => mode.id === value.mode)?.label ?? "Off";

  const body = (
      <div className="p-4 space-y-4">
        {showInherit && (
          <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
            <span>Use workspace default</span>
            <input
              type="checkbox"
              checked={value.inheritWorkspaceDefault}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...value, inheritWorkspaceDefault: event.target.checked })
              }
            />
          </label>
        )}

        {showInherit && value.inheritWorkspaceDefault && (
          <p className="text-xs text-slate-500">
            This campaign uses the workspace default.{" "}
            <a href="/email/settings?tab=email-delivery" className="font-medium text-slate-900">
              Edit workspace ESP matching
            </a>
          </p>
        )}

        {(!showInherit || !value.inheritWorkspaceDefault) && (
          <>
            <div className="grid gap-2">
              {MODES.map((mode) => {
                const selected = value.mode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectMode(mode.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      selected ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      {mode.label}
                      {mode.recommended && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white">
                          Recommended
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs font-medium text-slate-700">{mode.summary}</span>
                    <span className="mt-1 block text-xs text-slate-500">{mode.detail}</span>
                  </button>
                );
              })}
            </div>

            {value.mode === "prioritize_matching" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1.5">
                <p className="text-xs font-semibold text-slate-800">Default fallback</p>
                <p className="text-xs text-slate-600">
                  If no matching mailbox is free, send from any other selected campaign mailbox that still has capacity. You do not need to add a rule for this.
                </p>
              </div>
            )}

            {value.mode === "strict_matching" && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                No fallback. Leads wait until a matching mailbox is available. Throughput may drop.
              </p>
            )}

            {value.mode !== "off" && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
                  onClick={() => setShowAdvancedRules((open) => !open)}
                >
                  {showAdvancedRules ? "Hide advanced rules" : "Advanced rules (optional)"}
                </button>
                {showAdvancedRules && (
                  <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] text-slate-500">
                      Optional allow or deny for a specific sender family to recipient family. Leave empty unless you need an exception. Deny beats allow.
                    </p>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={disabled}
                        className="text-xs font-medium text-slate-900"
                        onClick={() =>
                          onChange({
                            ...value,
                            rules: [
                              ...value.rules,
                              {
                                senderFamily: "google",
                                recipientFamily: "google",
                                action: "allow",
                                enabled: true,
                                label: "",
                              },
                            ],
                          })
                        }
                      >
                        Add rule
                      </button>
                    </div>
                    {value.rules.length === 0 && (
                      <p className="text-xs text-slate-500">No custom rules. Default mode behavior applies.</p>
                    )}
                    {value.rules.map((rule, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <select
                          className="col-span-3 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                          value={rule.senderFamily}
                          disabled={disabled}
                          onChange={(event) =>
                            updateRule(value, onChange, index, { senderFamily: event.target.value })
                          }
                        >
                          {ESP_FAMILIES.map((family) => (
                            <option key={family} value={family}>
                              {providerLabel(family)}
                            </option>
                          ))}
                        </select>
                        <select
                          className="col-span-3 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                          value={rule.recipientFamily}
                          disabled={disabled}
                          onChange={(event) =>
                            updateRule(value, onChange, index, { recipientFamily: event.target.value })
                          }
                        >
                          {ESP_FAMILIES.map((family) => (
                            <option key={family} value={family}>
                              {providerLabel(family)}
                            </option>
                          ))}
                        </select>
                        <select
                          className="col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                          value={rule.action}
                          disabled={disabled}
                          onChange={(event) =>
                            updateRule(value, onChange, index, {
                              action: event.target.value as "allow" | "deny",
                            })
                          }
                        >
                          <option value="allow">Allow</option>
                          <option value="deny">Deny</option>
                        </select>
                        <button
                          type="button"
                          className="col-span-2 text-xs text-slate-500"
                          onClick={() =>
                            onChange({
                              ...value,
                              rules: value.rules.filter((_, ruleIndex) => ruleIndex !== index),
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {conflicts.map((conflict) => (
                      <p key={conflict} className="text-xs text-red-600">
                        {conflict}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {coverage && value.mode !== "off" && (
          <CoveragePanel coverage={coverage} mode={value.mode} />
        )}
      </div>
  );

  if (collapsible) {
    return (
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? "esp-matching" : undefined}
        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
      >
        <AccordionItem value="esp-matching" className="border-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-slate-100">
            <div className="pr-3 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800">ESP Matching</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {modeLabel}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-normal text-slate-500">
                Prefer a mailbox that matches the lead&apos;s email provider. This improves alignment. It does not guarantee inbox placement.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-0">{body}</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">ESP Matching</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Prefer a mailbox that matches the lead&apos;s email provider. This improves alignment. It does not guarantee inbox placement.
        </p>
      </div>
      {body}
    </div>
  );
}

function CoveragePanel({ coverage, mode }: { coverage: Coverage; mode: EspMode }) {
  const families = Object.keys({
    ...coverage.leadsByFamily,
    ...coverage.sendersByFamily,
  }).sort();

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3">
      <div>
        <p className="text-xs font-semibold text-slate-800">Mailbox coverage for this campaign</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {mode === "strict_matching"
            ? "Families with no matching mailbox will wait."
            : "Families with no matching mailbox still send from your other selected mailboxes."}
        </p>
      </div>
      <div className="space-y-2">
        {families.length === 0 ? (
          <p className="text-xs text-slate-500">Add leads and selected mailboxes to see coverage.</p>
        ) : (
          families.map((family) => {
            const leads = coverage.leadsByFamily[family] ?? 0;
            const mailboxes = coverage.sendersByFamily[family] ?? 0;
            const hasMatch = mailboxes > 0;
            return (
              <div
                key={family}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2"
              >
                <ProviderLogo provider={family} showLabel size="sm" />
                <div className="text-right text-[11px] text-slate-600">
                  <p>
                    {leads} lead{leads === 1 ? "" : "s"} · {mailboxes} mailbox
                    {mailboxes === 1 ? "" : "es"}
                  </p>
                  <p className={hasMatch ? "text-emerald-700" : "text-amber-700"}>
                    {hasMatch
                      ? "Matched"
                      : mode === "strict_matching"
                        ? "Will wait"
                        : "Uses fallback mailbox"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function updateRule(
  value: EspMatchingValue,
  onChange: (next: EspMatchingValue) => void,
  index: number,
  patch: Partial<EspRuleDraft>
) {
  onChange({
    ...value,
    rules: value.rules.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule)),
  });
}

function contradictory(rules: EspRuleDraft[]): string[] {
  const seen = new Map<string, string>();
  const errors: string[] = [];
  for (const rule of rules.filter((item) => item.enabled)) {
    const key = `${rule.senderFamily}:${rule.recipientFamily}`;
    const previous = seen.get(key);
    if (previous && previous !== rule.action) {
      errors.push(`${rule.senderFamily} → ${rule.recipientFamily} is both allowed and denied`);
    }
    seen.set(key, rule.action);
  }
  return errors;
}
