/**
 * Client-side repair for cached LeadSniper agent preview HTML.
 * Swaps sender brand mistaken as prospect in the opener paragraphs,
 * and strips a duplicate "Hi Name," when the template already greets.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectSenderBrands(opts: {
  senderCompany?: string | null;
  product?: string | null;
}): string[] {
  const tokens = new Set<string>();
  for (const raw of [opts.senderCompany ?? "", opts.product ?? ""]) {
    const t = String(raw || "").trim();
    if (!t) continue;
    tokens.add(t);
    const firstWord = t
      .split(/[\s,.—–-]+/)
      .find((w) => /^[A-Za-z][A-Za-z0-9+.&-]{2,}$/.test(w));
    if (firstWord) tokens.add(firstWord);
    for (const m of t.match(/\bLeadSni[a-z]*\b/gi) || []) {
      tokens.add(m);
    }
  }
  for (const t of [...tokens]) {
    if (/sniper/i.test(t)) tokens.add(t.replace(/sniper/gi, "Snipper"));
    if (/snipper/i.test(t)) tokens.add(t.replace(/snipper/gi, "Sniper"));
  }
  if ([...tokens].some((t) => /leadsni/i.test(t))) {
    tokens.add("LeadSniper");
    tokens.add("LeadSnipper");
  }
  return [...tokens]
    .filter((t) => t.length >= 3 && t.length <= 64)
    .sort((a, b) => b.length - a.length);
}

function replaceBrandWithRecipient(
  text: string,
  brands: string[],
  recipientCompany: string
): string {
  let next = text;
  const recipientLc = recipientCompany.toLowerCase();
  for (const brand of brands) {
    if (brand.toLowerCase() === recipientLc) continue;
    const re = new RegExp(
      `\\b${escapeRegExp(brand)}(?:[''\u2019]s)?\\b`,
      "gi"
    );
    next = next.replace(re, (match) =>
      /[''\u2019]s$/i.test(match) ? `${recipientCompany}'s` : recipientCompany
    );
  }
  next = next.replace(/\bLeadSni[a-z]*(?:[''\u2019]s)?\b/gi, (match) =>
    /[''\u2019]s$/i.test(match) ? `${recipientCompany}'s` : recipientCompany
  );
  return next;
}

export function repairLeadhubPreviewBodyHtml(
  html: string,
  opts: {
    recipientCompany?: string | null;
    firstName?: string | null;
    senderCompany?: string | null;
    product?: string | null;
  }
): string {
  const recipientCompany = (opts.recipientCompany || "").trim();
  if (!html || !recipientCompany) return html;

  const brands = collectSenderBrands({
    senderCompany: opts.senderCompany,
    product: opts.product,
  });
  const firstName = (opts.firstName || "").trim();
  let paraIdx = 0;

  return html.replace(
    /<p(\b[^>]*)>([\s\S]*?)<\/p>/gi,
    (full, attrs: string, inner: string) => {
      paraIdx += 1;
      if (paraIdx > 2) return full;

      const plain = inner.replace(/<[^>]+>/g, "").trim();
      if (
        paraIdx === 1 &&
        /^(?:hi|hello)\b/i.test(plain) &&
        !/\b(noticed|saw|hiring|growth)\b/i.test(plain)
      ) {
        return full;
      }

      let next = replaceBrandWithRecipient(inner, brands, recipientCompany);
      if (firstName) {
        next = next.replace(
          new RegExp(
            `^(?:Hi|Hello)\\s+${escapeRegExp(firstName)}\\s*,\\s*`,
            "i"
          ),
          ""
        );
      }
      next = next.replace(/^(?:Hi|Hello)\s+there\s*,\s*/i, "");
      next = next.replace(/^(?:Hi|Hello)\s*,\s*/i, "");

      return `<p${attrs}>${next}</p>`;
    }
  );
}
