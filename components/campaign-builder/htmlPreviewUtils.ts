/** Highlight {{var}} tokens in HTML for preview (iframe or div). */
export function highlightMergeVariablesInHtml(html: string): string {
  return html.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, token) => {
    const raw = String(token || '').trim();
    if (!raw) return match;
    if (raw.startsWith('#if') || raw === 'else' || raw === '/if') return match;
    return `<span style="background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%); color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 0.9em; display: inline-block; margin: 0 2px;">{{${raw}}}</span>`;
  });
}

export function wrapEmailPreviewDocument(html: string, highlighted: boolean) {
  const body = highlighted ? highlightMergeVariablesInHtml(html) : html;
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
