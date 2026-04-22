export type SpintaxPackId =
  | "general"
  | "saas"
  | "agency"
  | "ecommerce"
  | "recruitment"
  | "ai_ml"
  | "fintech"
  | "healthcare"
  | "real_estate";

export interface SpintaxPack {
  id: SpintaxPackId;
  label: string;
  description: string;
}

export interface SpintaxRule {
  packId: SpintaxPackId;
  category: string;
  trigger: string;
  pattern: RegExp;
  variants: string[];
  strictSensitive?: boolean;
}

export interface SpintaxApplyOptions {
  packId?: SpintaxPackId;
  strictGrammarMode?: boolean;
  includeGeneral?: boolean;
}

export const SPINTAX_PACKS: SpintaxPack[] = [
  { id: "general", label: "General", description: "Works across most outreach emails" },
  { id: "saas", label: "SaaS", description: "Product-led and B2B software messaging" },
  { id: "agency", label: "Agency", description: "Service delivery, growth, and creative work" },
  { id: "ecommerce", label: "Ecommerce", description: "Store revenue, AOV, and conversion focus" },
  { id: "recruitment", label: "Recruitment", description: "Hiring, talent pipeline, and candidate flow" },
  { id: "ai_ml", label: "AI / Machine Learning", description: "Automation, models, and AI workflows" },
  { id: "fintech", label: "Fintech", description: "Financial ops, risk, and transaction language" },
  { id: "healthcare", label: "Healthcare", description: "Patient flow and clinical operations" },
  { id: "real_estate", label: "Real Estate", description: "Listings, tours, and buyer/seller funnels" },
];

const RECOMMENDED_SPINTAX_RULES: SpintaxRule[] = [
  { packId: "general", category: "Greeting", trigger: "hi", pattern: /\bhi\b/gi, variants: ["hi", "hello", "hey"] },
  { packId: "general", category: "Greeting", trigger: "hello", pattern: /\bhello\b/gi, variants: ["hello", "hi", "hey there"] },
  {
    packId: "general",
    category: "Greeting",
    trigger: "i hope you're doing well",
    pattern: /\bi hope you're doing well\b/gi,
    variants: ["I hope you're doing well", "Hope you're doing well", "I hope all is well"],
  },
  { packId: "general", category: "Follow-up", trigger: "just checking in", pattern: /\bjust checking in\b/gi, variants: ["just checking in", "following up", "circling back"] },
  { packId: "general", category: "Follow-up", trigger: "reaching out", pattern: /\breaching out\b/gi, variants: ["reaching out", "getting in touch", "connecting"] },
  { packId: "general", category: "Tone", trigger: "quick", pattern: /\bquick\b/gi, variants: ["quick", "brief", "short"], strictSensitive: true },
  { packId: "general", category: "Tone", trigger: "help", pattern: /\bhelp\b/gi, variants: ["help", "assist", "support"], strictSensitive: true },
  { packId: "general", category: "Value", trigger: "improve", pattern: /\bimprove\b/gi, variants: ["improve", "boost", "increase"], strictSensitive: true },
  { packId: "general", category: "CTA", trigger: "let me know", pattern: /\blet me know\b/gi, variants: ["let me know", "share your thoughts", "tell me what you think"] },
  { packId: "general", category: "CTA", trigger: "book a call", pattern: /\bbook a call\b/gi, variants: ["book a call", "schedule a call", "set up a call"] },
  { packId: "general", category: "Closing", trigger: "thank you", pattern: /\bthank you\b/gi, variants: ["thank you", "thanks", "many thanks"] },
  { packId: "general", category: "Closing", trigger: "best regards", pattern: /\bbest regards\b/gi, variants: ["best regards", "kind regards", "best"] },

  { packId: "saas", category: "SaaS", trigger: "product", pattern: /\bproduct\b/gi, variants: ["product", "platform", "solution"], strictSensitive: true },
  { packId: "saas", category: "SaaS", trigger: "users", pattern: /\busers\b/gi, variants: ["users", "customers", "accounts"] },
  { packId: "saas", category: "SaaS", trigger: "trial", pattern: /\btrial\b/gi, variants: ["trial", "pilot", "evaluation"] },
  { packId: "saas", category: "SaaS", trigger: "adoption", pattern: /\badoption\b/gi, variants: ["adoption", "activation", "usage"] },
  { packId: "saas", category: "SaaS", trigger: "churn", pattern: /\bchurn\b/gi, variants: ["churn", "attrition", "drop-off"] },

  { packId: "agency", category: "Agency", trigger: "campaign", pattern: /\bcampaign\b/gi, variants: ["campaign", "initiative", "program"] },
  { packId: "agency", category: "Agency", trigger: "clients", pattern: /\bclients\b/gi, variants: ["clients", "brands", "accounts"] },
  { packId: "agency", category: "Agency", trigger: "creative", pattern: /\bcreative\b/gi, variants: ["creative", "content", "assets"] },
  { packId: "agency", category: "Agency", trigger: "performance", pattern: /\bperformance\b/gi, variants: ["performance", "results", "outcomes"] },
  { packId: "agency", category: "Agency", trigger: "retainer", pattern: /\bretainer\b/gi, variants: ["retainer", "engagement", "partnership"] },

  { packId: "ecommerce", category: "Ecommerce", trigger: "store", pattern: /\bstore\b/gi, variants: ["store", "shop", "brand site"] },
  { packId: "ecommerce", category: "Ecommerce", trigger: "conversion", pattern: /\bconversion\b/gi, variants: ["conversion", "checkout completion", "purchase rate"] },
  { packId: "ecommerce", category: "Ecommerce", trigger: "cart", pattern: /\bcart\b/gi, variants: ["cart", "basket", "checkout"] },
  { packId: "ecommerce", category: "Ecommerce", trigger: "aov", pattern: /\baov\b/gi, variants: ["AOV", "average order value", "order size"] },
  { packId: "ecommerce", category: "Ecommerce", trigger: "repeat purchase", pattern: /\brepeat purchase\b/gi, variants: ["repeat purchase", "return orders", "customer repeat buys"] },

  { packId: "recruitment", category: "Recruitment", trigger: "candidate", pattern: /\bcandidate\b/gi, variants: ["candidate", "applicant", "talent"] },
  { packId: "recruitment", category: "Recruitment", trigger: "hiring", pattern: /\bhiring\b/gi, variants: ["hiring", "recruiting", "talent acquisition"] },
  { packId: "recruitment", category: "Recruitment", trigger: "interview", pattern: /\binterview\b/gi, variants: ["interview", "screen", "evaluation"] },
  { packId: "recruitment", category: "Recruitment", trigger: "job", pattern: /\bjob\b/gi, variants: ["job", "role", "position"] },
  { packId: "recruitment", category: "Recruitment", trigger: "time to hire", pattern: /\btime to hire\b/gi, variants: ["time to hire", "hiring cycle", "fill time"] },

  { packId: "ai_ml", category: "AI / ML", trigger: "ai", pattern: /\bai\b/gi, variants: ["AI", "machine intelligence", "automation intelligence"] },
  { packId: "ai_ml", category: "AI / ML", trigger: "model", pattern: /\bmodel\b/gi, variants: ["model", "pipeline", "system"], strictSensitive: true },
  { packId: "ai_ml", category: "AI / ML", trigger: "automation", pattern: /\bautomation\b/gi, variants: ["automation", "AI workflow", "intelligent flow"] },
  { packId: "ai_ml", category: "AI / ML", trigger: "inference", pattern: /\binference\b/gi, variants: ["inference", "prediction", "runtime output"] },
  { packId: "ai_ml", category: "AI / ML", trigger: "accuracy", pattern: /\baccuracy\b/gi, variants: ["accuracy", "quality", "precision"] },

  { packId: "fintech", category: "Fintech", trigger: "payments", pattern: /\bpayments\b/gi, variants: ["payments", "transactions", "payment flows"] },
  { packId: "fintech", category: "Fintech", trigger: "fraud", pattern: /\bfraud\b/gi, variants: ["fraud", "risk abuse", "transaction risk"] },
  { packId: "fintech", category: "Fintech", trigger: "compliance", pattern: /\bcompliance\b/gi, variants: ["compliance", "regulatory alignment", "policy adherence"] },
  { packId: "fintech", category: "Fintech", trigger: "onboarding", pattern: /\bonboarding\b/gi, variants: ["onboarding", "activation", "account setup"] },
  { packId: "fintech", category: "Fintech", trigger: "approval", pattern: /\bapproval\b/gi, variants: ["approval", "decisioning", "verification"] },

  { packId: "healthcare", category: "Healthcare", trigger: "patients", pattern: /\bpatients\b/gi, variants: ["patients", "patient population", "members"] },
  { packId: "healthcare", category: "Healthcare", trigger: "appointments", pattern: /\bappointments\b/gi, variants: ["appointments", "visits", "bookings"] },
  { packId: "healthcare", category: "Healthcare", trigger: "care team", pattern: /\bcare team\b/gi, variants: ["care team", "clinical team", "provider team"] },
  { packId: "healthcare", category: "Healthcare", trigger: "outcomes", pattern: /\boutcomes\b/gi, variants: ["outcomes", "care quality", "clinical outcomes"] },
  { packId: "healthcare", category: "Healthcare", trigger: "workflow", pattern: /\bworkflow\b/gi, variants: ["workflow", "clinical process", "operational flow"] },

  { packId: "real_estate", category: "Real Estate", trigger: "listing", pattern: /\blisting\b/gi, variants: ["listing", "property listing", "home listing"] },
  { packId: "real_estate", category: "Real Estate", trigger: "buyers", pattern: /\bbuyers\b/gi, variants: ["buyers", "home buyers", "qualified buyers"] },
  { packId: "real_estate", category: "Real Estate", trigger: "sellers", pattern: /\bsellers\b/gi, variants: ["sellers", "homeowners", "property owners"] },
  { packId: "real_estate", category: "Real Estate", trigger: "showing", pattern: /\bshowing\b/gi, variants: ["showing", "tour", "property visit"] },
  { packId: "real_estate", category: "Real Estate", trigger: "leads", pattern: /\bleads\b/gi, variants: ["leads", "inquiries", "prospects"] },
];

export interface SpintaxSuggestion {
  packId: SpintaxPackId;
  packLabel: string;
  category: string;
  trigger: string;
  spintax: string;
}

const TOKEN_GUARD_REGEX = /(\{\{[^}]+\}\}|\{[^{}]*\|[^{}]*\})/g;
const HTML_TAG_REGEX = /(<[^>]+>)/g;

function applyCase(template: string, source: string): string {
  if (!source) return template;
  if (source.toUpperCase() === source) return template.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return template[0].toUpperCase() + template.slice(1);
  }
  return template;
}

function getPackLabel(packId: SpintaxPackId): string {
  return SPINTAX_PACKS.find((pack) => pack.id === packId)?.label || "General";
}

function resolveRules(packId: SpintaxPackId, includeGeneral: boolean): SpintaxRule[] {
  return RECOMMENDED_SPINTAX_RULES.filter((rule) => {
    if (rule.packId === packId) return true;
    return includeGeneral && rule.packId === "general";
  });
}

function isSentenceStart(source: string, offset: number): boolean {
  const before = source.slice(0, offset).trimEnd();
  if (!before) return true;
  return /[.!?]\s*$/.test(before);
}

function injectSpintaxIntoText(
  text: string,
  options: Required<SpintaxApplyOptions>
): { updated: string; replacements: number } {
  if (!text.trim()) return { updated: text, replacements: 0 };

  let updatedText = text;
  let replacements = 0;
  const rules = resolveRules(options.packId, options.includeGeneral);

  for (const rule of rules) {
    updatedText = updatedText.replace(rule.pattern, (...args: unknown[]) => {
      const match = String(args[0] || "");
      const offset = Number(args[args.length - 2] || 0);
      const source = String(args[args.length - 1] || "");

      // Strict mode avoids risky single-word / context-sensitive swaps.
      if (
        options.strictGrammarMode &&
        rule.strictSensitive &&
        (isSentenceStart(source, offset) || match.trim().split(/\s+/).length === 1)
      ) {
        return match;
      }

      const variants = Array.from(
        new Set(
          [match, ...rule.variants]
            .map((variant) => applyCase(variant, match).trim())
            .filter(Boolean)
        )
      );
      if (variants.length <= 1) return match;
      replacements += 1;
      return `{${variants.join("|")}}`;
    });
  }

  return { updated: updatedText, replacements };
}

function processTextWithGuards(
  text: string,
  options: Required<SpintaxApplyOptions>
): { updated: string; replacements: number } {
  const chunks = text.split(TOKEN_GUARD_REGEX);
  let replacements = 0;
  const processed = chunks.map((chunk) => {
    if (!chunk) return chunk;
    if (chunk.startsWith("{{") || (chunk.startsWith("{") && chunk.includes("|"))) {
      return chunk;
    }
    const result = injectSpintaxIntoText(chunk, options);
    replacements += result.replacements;
    return result.updated;
  });
  return { updated: processed.join(""), replacements };
}

export function getSpintaxSuggestions(
  packId: SpintaxPackId = "general",
  includeGeneral: boolean = true,
  strictGrammarMode: boolean = false
): SpintaxSuggestion[] {
  const rules = resolveRules(packId, includeGeneral).filter(
    (rule) => !(strictGrammarMode && rule.strictSensitive)
  );
  return rules.map((rule) => ({
    packId: rule.packId,
    packLabel: getPackLabel(rule.packId),
    category: rule.category,
    trigger: rule.trigger,
    spintax: `{${rule.variants.join("|")}}`,
  }));
}

export function applyRecommendedSpintaxToHtml(
  input: string,
  options?: SpintaxApplyOptions
): {
  output: string;
  replacements: number;
} {
  if (!input.trim()) return { output: input, replacements: 0 };

  const resolvedOptions: Required<SpintaxApplyOptions> = {
    packId: options?.packId || "general",
    strictGrammarMode: Boolean(options?.strictGrammarMode),
    includeGeneral: options?.includeGeneral !== false,
  };

  const parts = input.split(HTML_TAG_REGEX);
  let replacements = 0;
  const transformed = parts.map((part) => {
    if (!part || part.startsWith("<")) return part;
    const result = processTextWithGuards(part, resolvedOptions);
    replacements += result.replacements;
    return result.updated;
  });

  return { output: transformed.join(""), replacements };
}
