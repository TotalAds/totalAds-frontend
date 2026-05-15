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

/** Highlight {{var}} and {a|b} tokens in HTML for preview (iframe or div). */
export function highlightEmailSyntaxInHtml(html: string): string {
  return html.replace(/\{\{\s*([^{}]+?)\s*\}\}|\{([^{}]*\|[^{}]*)\}/g, (match, mergeToken, spintaxToken) => {
    if (mergeToken !== undefined) {
      const raw = String(mergeToken || "").trim();
      if (!raw) return match;
      if (raw.startsWith("#if") || raw === "else" || raw === "/if") return match;
      return `<span style="background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%); color: #1d4ed8; border: 1px solid rgba(37,99,235,.22); padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.88em; display: inline-block; margin: 0 2px;">${getMergeLabel(raw)}</span>`;
    }

    const rawSpin = String(spintaxToken || "").trim();
    if (!rawSpin) return match;
    return `<span style="background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%); color: #6d28d9; border: 1px solid rgba(124,58,237,.22); padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.88em; display: inline-block; margin: 0 2px;"><span style="font-size:.78em;text-transform:uppercase;opacity:.75;margin-right:4px;">spin</span>${getSpintaxLabel(rawSpin)}</span>`;
  });
}

export function wrapEmailPreviewDocument(html: string, highlighted: boolean) {
  const body = highlighted ? highlightEmailSyntaxInHtml(html) : html;
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
