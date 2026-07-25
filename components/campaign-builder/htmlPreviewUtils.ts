function getMergeLabel(token: string): string {
  const raw = String(token || "").trim();
  const [field, fallback] = raw.split("|").map((part) => part.trim());
  const label = field
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return fallback ? `${label} · ${fallback}` : label;
}

function getSpintaxLabel(token: string): string {
  const variants = String(token || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (variants.length <= 3) return variants.join(" · ");
  return `${variants.slice(0, 3).join(" · ")} +${variants.length - 3}`;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Coverage of a merge token across campaign leads (not compulsory — warning only). */
export type PersonalizationTokenCoverage = {
  withValue: number;
  withoutValue: number;
  total: number;
  /** 0–100 */
  coveragePct: number;
};

export type CoverageStatus = "ok" | "warning" | "missing";

/** Warn when fewer than 10% of leads have a value; missing when none do. */
export const COVERAGE_WARN_BELOW_PCT = 10;

/** Highlight {{var}} and {a|b} tokens in HTML for preview (iframe or div). */
export function highlightEmailSyntaxInHtml(
  html: string,
  tokenSampleValues?: Record<string, string>,
  tokenCoverage?: Record<string, PersonalizationTokenCoverage>
): string {
  return html.replace(
    /\{\{\s*([^{}]+?)\s*\}\}|\{([^{}]*\|[^{}]*)\}/g,
    (match, mergeToken, spintaxToken) => {
      if (mergeToken !== undefined) {
        const raw = String(mergeToken || "").trim();
        if (!raw) return match;
        if (raw.startsWith("#if") || raw === "else" || raw === "/if") return match;
        const fieldOnly = raw.split("|")[0].trim();
        const coverage = lookupTokenCoverage(tokenCoverage, fieldOnly);
        const sample =
          tokenSampleValues != null
            ? lookupMergeValue(tokenSampleValues, fieldOnly)
            : undefined;
        // Without a coverage map, keep the default blue highlight (sample tooltip only).
        const status = tokenCoverage
          ? getCoverageStatus(coverage)
          : ("ok" as CoverageStatus);
        const style =
          status === "missing"
            ? "background: linear-gradient(180deg, #fef2f2 0%, #fecaca 100%); color: #b91c1c; border: 1px solid rgba(185,28,28,.35); padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.88em; display: inline-block; margin: 0 2px; cursor: help;"
            : status === "warning"
              ? "background: linear-gradient(180deg, #fffbeb 0%, #fde68a 100%); color: #b45309; border: 1px solid rgba(180,83,9,.28); padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.88em; display: inline-block; margin: 0 2px; cursor: help;"
              : "background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%); color: #1d4ed8; border: 1px solid rgba(37,99,235,.22); padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.88em; display: inline-block; margin: 0 2px; cursor: help;";
        return `<span data-merge-field="${escapeHtmlAttr(fieldOnly)}" data-coverage-status="${status}" data-sample="${escapeHtmlAttr(sample || "")}" style="${style}">${getMergeLabel(raw)}</span>`;
      }

      const rawSpin = String(spintaxToken || "").trim();
      if (!rawSpin) return match;
      return `<span style="background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%); color: #6d28d9; border: 1px solid rgba(124,58,237,.22); padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.88em; display: inline-block; margin: 0 2px;"><span style="font-size:.78em;text-transform:uppercase;opacity:.75;margin-right:4px;">spin</span>${getSpintaxLabel(rawSpin)}</span>`;
    }
  );
}

export function wrapEmailPreviewDocument(
  html: string,
  highlighted: boolean,
  tokenSampleValues?: Record<string, string>,
  tokenCoverage?: Record<string, PersonalizationTokenCoverage>
) {
  const body = highlighted
    ? highlightEmailSyntaxInHtml(html, tokenSampleValues, tokenCoverage)
    : html;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>
    html,body{margin:0;background:#f8fafc;}
    body{overflow-x:hidden;overflow-y:auto;padding:12px;}
    *{box-sizing:border-box;}
    table{max-width:100%!important;}
    img{max-width:100%!important;height:auto!important;}
  </style></head><body>${body}</body></html>`;
}

/** Standard lead/contact merge tags; CSV columns are merged in the composer. */
export const STANDARD_MERGE_TAGS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{email}}",
  "{{name}}",
  "{{phone}}",
  "{{company}}",
];

export function mergeVariableLists(
  csvColumns: string[],
  extras: string[] = STANDARD_MERGE_TAGS
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...extras, ...csvColumns]) {
    const v = t.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/** Fictional recipients for composer “inbox” preview (merge + spintax resolved). */
export const PREVIEW_SAMPLE_LEADS: Record<string, string>[] = [
  {
    first_name: "Malav",
    firstName: "Malav",
    last_name: "Joshi",
    lastName: "Joshi",
    email: "malav.joshi@leadsnipper.app",
    company: "LeadSnipper",
    name: "Malav Joshi",
    phone: "+1 (555) 010-4321",
    hook: "Saw your team scaling outbound last quarter",
    problem: "Most teams burn domain reputation before they hit volume",
    benefit: "We help you send from infrastructure you control with built-in verification",
    cta: "Worth a 12-minute call this week?",
    company_summary: "B2B SaaS for deliverability-first cold email",
    role: "Head of Growth",
    title: "Head of Growth",
    intent_score: "72",
    priority: "hot",
  },
  {
    first_name: "Alex",
    firstName: "Alex",
    last_name: "Chen",
    lastName: "Chen",
    email: "alex.chen@acmecorp.io",
    company: "Acme Corp",
    name: "Alex Chen",
    phone: "+1 (555) 010-8841",
  },
  {
    first_name: "Sam",
    firstName: "Sam",
    last_name: "Rivera",
    lastName: "Rivera",
    email: "sam.rivera@northwind.com",
    company: "Northwind",
    name: "Sam Rivera",
    phone: "+1 (555) 010-2219",
  },
];

export function normalizeMergeFieldKey(field: string): string {
  return field.trim().toLowerCase().replace(/\s+/g, "_");
}

function mergeFieldDisplayLabel(field: string): string {
  const label = field.replace(/[_-]+/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return label || "Value";
}

function lookupMergeValue(
  lead: Record<string, string>,
  fieldKey: string
): string | undefined {
  const nk = normalizeMergeFieldKey(fieldKey);
  for (const [k, v] of Object.entries(lead)) {
    if (normalizeMergeFieldKey(k) === nk) return v;
  }
  return undefined;
}

/**
 * Merge tag templates from the campaign (e.g. `{{jobTitle}}`) merged onto a sample row
 * so preview can resolve unknown columns with a readable placeholder.
 */
export function buildCompositeLeadForPreview(
  sampleIndex: number,
  mergeTagTemplates: string[]
): Record<string, string> {
  const samples = PREVIEW_SAMPLE_LEADS;
  const base: Record<string, string> = { ...samples[sampleIndex % samples.length] };
  const seen = new Set<string>();
  for (const k of Object.keys(base)) {
    seen.add(normalizeMergeFieldKey(k));
  }
  for (const tag of mergeTagTemplates) {
    const inner = tag.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
    const fieldOnly = inner.split("|")[0].trim();
    if (!fieldOnly) continue;
    const nk = normalizeMergeFieldKey(fieldOnly);
    if (seen.has(nk)) continue;
    seen.add(nk);
    const placeholder = `[${mergeFieldDisplayLabel(fieldOnly)}]`;
    base[fieldOnly] = placeholder;
  }
  return base;
}

/** Field names used as `{{field}}` / `{{field|fallback}}` in subject/body (skips conditionals). */
export function extractUsedMergeVariables(...texts: string[]): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([^{}]+?)\s*\}\}/g;
  for (const text of texts) {
    if (!text) continue;
    let match: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((match = re.exec(text)) !== null) {
      const raw = String(match[1] || "").trim();
      if (!raw || raw.startsWith("#if") || raw === "else" || raw === "/if") {
        continue;
      }
      const field = raw.split("|")[0].trim();
      if (field) found.add(field);
    }
  }
  return Array.from(found);
}

/**
 * Replace `{{field}}` / `{{ field | fallback }}` and `{a|b|c}` spintax in a string
 * (HTML or subject) using sample lead data. Spintax option is chosen by `spintaxPickIndex`.
 */
export function resolveMergeTagsAndSpintax(
  text: string,
  lead: Record<string, string>,
  spintaxPickIndex: number
): string {
  let result = text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, inner: string) => {
    const parts = String(inner).split("|");
    const fieldPart = parts[0].trim();
    const fallbackPart =
      parts.length > 1 ? parts.slice(1).join("|").trim() : "";
    const val = lookupMergeValue(lead, fieldPart);
    if (val !== undefined && val !== "") return val;
    return fallbackPart;
  });
  result = result.replace(/\{([^{}]*)\}/g, (full, inner: string) => {
    if (!String(inner).includes("|")) return full;
    const opts = String(inner)
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (opts.length === 0) return full;
    return opts[Math.abs(spintaxPickIndex) % opts.length];
  });
  return result;
}

function stringifySampleValue(value: unknown): string | null {
  const unwrapped = unwrapSampleField(value);
  if (unwrapped == null) return null;
  if (typeof unwrapped === "string") {
    const trimmed = unwrapped.trim();
    return trimmed || null;
  }
  if (typeof unwrapped === "number" || typeof unwrapped === "boolean") {
    return String(unwrapped);
  }
  if (Array.isArray(unwrapped)) {
    const parts = unwrapped
      .map((item) => {
        const inner = unwrapSampleField(item);
        if (inner == null) return "";
        if (typeof inner === "string") return inner.trim();
        if (
          inner &&
          typeof inner === "object" &&
          "label" in (inner as object) &&
          typeof (inner as { label: unknown }).label === "string"
        ) {
          return (inner as { label: string }).label.trim();
        }
        try {
          return JSON.stringify(inner);
        } catch {
          return String(inner);
        }
      })
      .filter(Boolean);
    return parts.length ? parts.join("; ") : null;
  }
  try {
    return JSON.stringify(unwrapped);
  } catch {
    return null;
  }
}

/** LeadHub AI fields often arrive as `{ value, confidence }`. */
function unwrapSampleField(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return value;
  if (!Object.prototype.hasOwnProperty.call(value, "value")) return value;
  return (value as { value: unknown }).value;
}

/**
 * Collect merge-tag keys present on a campaign lead (enrichedData / customFields).
 * Used so Personalize lists every LeadHub field available for at least one lead.
 */
export function extractVariableKeysFromLead(lead?: {
  email?: string | null;
  name?: string | null;
  company?: string | null;
  role?: string | null;
  customFields?: Record<string, unknown> | null;
  enrichedData?: Record<string, unknown> | null;
} | null): string[] {
  const keys = new Set<string>();
  const add = (key: string) => {
    const k = String(key || "")
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toLowerCase();
    if (!k || k === "leadhub" || k === "source") return;
    keys.add(k);
  };

  if (!lead) return [];

  if (lead.email) add("email");
  if (lead.name) add("name");
  if (lead.company) add("company");
  if (lead.role) {
    add("role");
    add("title");
  }

  const ingestObject = (obj: Record<string, unknown> | null | undefined) => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      if (k === "leadhub") continue;
      const str = stringifySampleValue(v);
      if (str != null) add(k);
    }
  };

  ingestObject(lead.customFields ?? undefined);
  ingestObject(lead.enrichedData ?? undefined);

  const enriched = lead.enrichedData;
  if (enriched?.leadhub && typeof enriched.leadhub === "object") {
    const lh = enriched.leadhub as Record<string, unknown>;
    const ai = lh.aiIntelligence as Record<string, unknown> | undefined;
    if (ai?.emailVariables && typeof ai.emailVariables === "object") {
      for (const k of Object.keys(ai.emailVariables as object)) add(k);
    }
    if (ai) {
      for (const [k, v] of Object.entries(ai)) {
        if (
          k === "emailVariables" ||
          k === "generatedAt" ||
          k === "updatedAt" ||
          k === "id" ||
          k === "leadId" ||
          k === "companyId"
        ) {
          continue;
        }
        if (stringifySampleValue(v) != null) add(k);
      }
    }
  }

  return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

/**
 * Build {{token}} → sample value map from a campaign lead (enrichedData / customFields)
 * with PREVIEW_SAMPLE_LEADS[0] as fallback for missing LeadHub keys.
 */
export function buildTokenSampleValuesFromLead(lead?: {
  email?: string | null;
  name?: string | null;
  company?: string | null;
  role?: string | null;
  customFields?: Record<string, unknown> | null;
  enrichedData?: Record<string, unknown> | null;
} | null): Record<string, string> {
  const out: Record<string, string> = { ...PREVIEW_SAMPLE_LEADS[0] };

  const put = (key: string, value: unknown) => {
    const str = stringifySampleValue(value);
    if (!key || str == null) return;
    const normalized = normalizeMergeFieldKey(
      key
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
    );
    out[key] = str;
    out[normalized] = str;
  };

  if (!lead) return out;

  put("email", lead.email);
  put("name", lead.name);
  put("company", lead.company);
  put("company_name", lead.company);
  put("role", lead.role);
  put("title", lead.role);

  if (lead.name) {
    const parts = String(lead.name).trim().split(/\s+/);
    if (parts[0]) {
      put("first_name", parts[0]);
      put("firstName", parts[0]);
    }
    if (parts.length > 1) {
      const last = parts.slice(1).join(" ");
      put("last_name", last);
      put("lastName", last);
    }
  }

  const custom = lead.customFields;
  if (custom && typeof custom === "object") {
    for (const [k, v] of Object.entries(custom)) put(k, v);
  }

  const enriched = lead.enrichedData;
  if (enriched && typeof enriched === "object") {
    for (const [k, v] of Object.entries(enriched)) {
      if (k === "leadhub" && v && typeof v === "object") {
        const lh = v as Record<string, unknown>;
        const contact = lh.contact as Record<string, unknown> | undefined;
        const company = lh.company as Record<string, unknown> | undefined;
        const ai = lh.aiIntelligence as Record<string, unknown> | undefined;
        if (contact) {
          put("first_name", contact.firstName);
          put("firstName", contact.firstName);
          put("last_name", contact.lastName);
          put("lastName", contact.lastName);
          put("email", contact.email);
          put("role", contact.role);
          put("title", contact.role);
          put("phone", contact.phone);
          put("linkedin_url", contact.linkedinUrl);
          put("location", contact.location);
          const full = [contact.firstName, contact.lastName]
            .filter(Boolean)
            .join(" ");
          if (full) put("name", full);
        }
        if (company) {
          put("company", company.name);
          put("company_name", company.name);
          put("company_domain", company.domain);
          put("company_website", company.website);
          put("website", company.website);
          put("company_description", company.description);
          put("company_city", company.city);
          put("company_country", company.country);
          put("company_services", company.services);
          put("industry", company.industry);
          put("company_size", company.size);
        }
        put("priority", lh.priority);
        put("intent_score", lh.intentScore);
        put("icp_score", lh.icpScore);
        put("confidence", lh.confidence);
        put("enrichment_status", lh.enrichmentStatus);
        put("pipeline_stage", lh.pipelineStage);

        if (ai?.emailVariables && typeof ai.emailVariables === "object") {
          for (const [ek, ev] of Object.entries(
            ai.emailVariables as Record<string, unknown>
          )) {
            put(ek, ev);
          }
        }
        if (ai) {
          const aiMap: Array<[string, unknown]> = [
            ["suggested_email_opening", ai.suggestedEmailOpening],
            ["email_opener", ai.suggestedEmailOpening],
            ["suggested_cta", ai.suggestedCta],
            ["recommended_outreach_angle", ai.recommendedOutreachAngle],
            ["best_outreach_angle", ai.bestOutreachAngle],
            ["personalization_snippets", ai.personalizationSnippets],
            ["personalization_notes", ai.personalizationNotes],
            ["company_summary", ai.companySummary],
            ["person_summary", ai.personSummary],
            ["pain_points", ai.painPoints],
            ["buying_signals", ai.buyingSignals],
            ["growth_stage", ai.growthStage],
            ["outreach_insights", ai.outreachInsights],
            ["buying_intent", ai.buyingIntent],
            ["product_fit", ai.productFit],
            ["competitors", ai.competitors],
            ["existing_tools", ai.existingTools],
            ["recent_activity", ai.recentActivity],
            ["ideal_buyer_persona", ai.idealBuyerPersona],
            ["outreach_objections", ai.outreachObjections],
            ["intent_score", ai.intentScore],
            ["icp_score", ai.icpScore],
            ["priority", ai.priority],
            ["confidence", ai.overallConfidence],
          ];
          for (const [token, val] of aiMap) put(token, val);
        }
        continue;
      }
      // Flat enriched keys (including arrays); skip nested objects except via stringify
      put(k, v);
    }
  }

  return out;
}

function normalizeCoverageKey(field: string): string {
  return field
    .trim()
    .toLowerCase()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s_-]+/g, "");
}

/** Aliases so {{company_name}} counts as {{company}}, etc. */
const COVERAGE_ALIASES: Record<string, string[]> = {
  companyname: ["company", "company_name"],
  emailopener: [
    "suggested_email_opening",
    "email_opener",
    "hook",
  ],
  suggestedemailopening: [
    "suggested_email_opening",
    "email_opener",
    "hook",
  ],
  firstname: ["first_name", "firstName", "name"],
  lastname: ["last_name", "lastName"],
};

function leadHasTokenValue(
  values: Record<string, string>,
  field: string
): boolean {
  const direct = lookupMergeValue(values, field);
  if (direct != null && direct !== "") return true;
  const nk = normalizeCoverageKey(field);
  const aliases = COVERAGE_ALIASES[nk];
  if (!aliases) return false;
  for (const alias of aliases) {
    const v = lookupMergeValue(values, alias);
    if (v != null && v !== "") return true;
  }
  return false;
}

/**
 * Real lead token map only — no PREVIEW_SAMPLE fictional fill.
 * Used for coverage checks so sample defaults never count as "has value".
 */
export function buildRealLeadTokenValues(lead?: {
  email?: string | null;
  name?: string | null;
  company?: string | null;
  role?: string | null;
  customFields?: Record<string, unknown> | null;
  enrichedData?: Record<string, unknown> | null;
} | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!lead) return out;

  const put = (key: string, value: unknown) => {
    const str = stringifySampleValue(value);
    if (!key || str == null) return;
    const normalized = normalizeMergeFieldKey(
      key
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
    );
    out[key] = str;
    out[normalized] = str;
  };

  put("email", lead.email);
  put("name", lead.name);
  put("company", lead.company);
  put("company_name", lead.company);
  put("role", lead.role);
  put("title", lead.role);

  if (lead.name) {
    const parts = String(lead.name).trim().split(/\s+/);
    if (parts[0]) {
      put("first_name", parts[0]);
      put("firstName", parts[0]);
    }
    if (parts.length > 1) {
      const last = parts.slice(1).join(" ");
      put("last_name", last);
      put("lastName", last);
    }
  }

  const custom = lead.customFields;
  if (custom && typeof custom === "object") {
    for (const [k, v] of Object.entries(custom)) put(k, v);
  }

  const enriched = lead.enrichedData;
  if (enriched && typeof enriched === "object") {
    for (const [k, v] of Object.entries(enriched)) {
      if (k === "leadhub" && v && typeof v === "object") {
        const lh = v as Record<string, unknown>;
        const contact = lh.contact as Record<string, unknown> | undefined;
        const company = lh.company as Record<string, unknown> | undefined;
        const ai = lh.aiIntelligence as Record<string, unknown> | undefined;
        if (contact) {
          put("first_name", contact.firstName);
          put("firstName", contact.firstName);
          put("last_name", contact.lastName);
          put("lastName", contact.lastName);
          put("email", contact.email);
          put("role", contact.role);
          put("title", contact.role);
          put("phone", contact.phone);
          put("linkedin_url", contact.linkedinUrl);
          put("location", contact.location);
          const full = [contact.firstName, contact.lastName]
            .filter(Boolean)
            .join(" ");
          if (full) put("name", full);
        }
        if (company) {
          put("company", company.name);
          put("company_name", company.name);
          put("company_domain", company.domain);
          put("company_website", company.website);
          put("website", company.website);
          put("company_description", company.description);
          put("company_city", company.city);
          put("company_country", company.country);
          put("company_services", company.services);
          put("industry", company.industry);
          put("company_size", company.size);
        }
        put("priority", lh.priority);
        put("intent_score", lh.intentScore);
        put("icp_score", lh.icpScore);
        put("confidence", lh.confidence);
        put("enrichment_status", lh.enrichmentStatus);
        put("pipeline_stage", lh.pipelineStage);

        if (ai?.emailVariables && typeof ai.emailVariables === "object") {
          for (const [ek, ev] of Object.entries(
            ai.emailVariables as Record<string, unknown>
          )) {
            put(ek, ev);
          }
        }
        if (ai) {
          const opener = ai.suggestedEmailOpening;
          put("suggested_email_opening", opener);
          put("email_opener", opener);
          put("suggested_cta", ai.suggestedCta);
          put("recommended_outreach_angle", ai.recommendedOutreachAngle);
          put("best_outreach_angle", ai.bestOutreachAngle);
          put("personalization_snippets", ai.personalizationSnippets);
          put("personalization_notes", ai.personalizationNotes);
          put("company_summary", ai.companySummary);
          put("person_summary", ai.personSummary);
          put("pain_points", ai.painPoints);
          put("buying_signals", ai.buyingSignals);
          put("growth_stage", ai.growthStage);
          put("outreach_insights", ai.outreachInsights);
          put("buying_intent", ai.buyingIntent);
          put("product_fit", ai.productFit);
          put("competitors", ai.competitors);
          put("existing_tools", ai.existingTools);
          put("recent_activity", ai.recentActivity);
          put("ideal_buyer_persona", ai.idealBuyerPersona);
          put("outreach_objections", ai.outreachObjections);
          put("intent_score", ai.intentScore);
          put("icp_score", ai.icpScore);
          put("priority", ai.priority);
          put("confidence", ai.overallConfidence);
        }
        continue;
      }
      put(k, v);
    }
  }

  return out;
}

/**
 * Build coverage map for merge fields across campaign leads.
 * Uses real lead data only (no fictional PREVIEW_SAMPLE fill for the check).
 */
export function computePersonalizationCoverage(
  leads: Array<{
    email?: string | null;
    name?: string | null;
    company?: string | null;
    role?: string | null;
    customFields?: Record<string, unknown> | null;
    enrichedData?: Record<string, unknown> | null;
  }>,
  fields: string[]
): Record<string, PersonalizationTokenCoverage> {
  const uniqueFields = Array.from(
    new Set(
      fields
        .map((f) =>
          f
            .replace(/^\{\{\s*/, "")
            .replace(/\s*\}\}$/, "")
            .split("|")[0]
            .trim()
        )
        .filter(Boolean)
    )
  );
  const total = leads.length;
  const out: Record<string, PersonalizationTokenCoverage> = {};

  if (total === 0) {
    for (const field of uniqueFields) {
      const row = { withValue: 0, withoutValue: 0, total: 0, coveragePct: 0 };
      out[field] = row;
      out[normalizeMergeFieldKey(field)] = row;
    }
    return out;
  }

  const leadMaps = leads.map((lead) => buildRealLeadTokenValues(lead));

  for (const field of uniqueFields) {
    let withValue = 0;
    for (const map of leadMaps) {
      if (leadHasTokenValue(map, field)) withValue += 1;
    }
    const withoutValue = total - withValue;
    const coveragePct = Math.round((withValue / total) * 100);
    const row: PersonalizationTokenCoverage = {
      withValue,
      withoutValue,
      total,
      coveragePct,
    };
    out[field] = row;
    out[normalizeMergeFieldKey(field)] = row;
  }

  return out;
}

export function getCoverageStatus(
  coverage: PersonalizationTokenCoverage | null | undefined
): CoverageStatus {
  if (!coverage || coverage.total === 0) return "missing";
  if (coverage.withValue === 0) return "missing";
  if (coverage.coveragePct < COVERAGE_WARN_BELOW_PCT) return "warning";
  if (coverage.withoutValue > 0) return "warning";
  return "ok";
}

export function formatCoverageTooltip(
  field: string,
  coverage: PersonalizationTokenCoverage | null | undefined,
  sample?: string | null
): string {
  if (!coverage || coverage.total === 0) {
    return `${field} → Not found on any campaign leads`;
  }
  const lines = [
    `${field}: ${coverage.withValue.toLocaleString()} of ${coverage.total.toLocaleString()} leads have a value (${coverage.coveragePct}%)`,
    `${coverage.withoutValue.toLocaleString()} leads missing this field`,
  ];
  if (coverage.withValue === 0) {
    lines.push("This variable does not exist in your selected leads.");
  } else if (coverage.coveragePct < COVERAGE_WARN_BELOW_PCT) {
    lines.push(
      "Warning: fewer than 10% of leads have this value — emails will leave it blank."
    );
  } else if (coverage.withoutValue > 0) {
    lines.push("Warning: some leads will get a blank value for this field.");
  }
  if (sample) lines.push(`Sample: ${sample}`);
  return lines.join("\n");
}

export function lookupTokenCoverage(
  coverageMap: Record<string, PersonalizationTokenCoverage> | null | undefined,
  field: string
): PersonalizationTokenCoverage | null {
  if (!coverageMap) return null;
  return (
    coverageMap[field] ||
    coverageMap[normalizeMergeFieldKey(field)] ||
    null
  );
}

/** Highlight merge tags in plain text (subject / preview) for the overlay. */
export function highlightMergeTagsInPlainText(
  text: string,
  tokenCoverage?: Record<string, PersonalizationTokenCoverage>,
  tokenSampleValues?: Record<string, string>
): string {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return highlightEmailSyntaxInHtml(escaped, tokenSampleValues, tokenCoverage);
}
