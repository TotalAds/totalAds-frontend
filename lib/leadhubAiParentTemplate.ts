/**
 * Default plain-text-style HTML shell for LeadSniper agent emails (preview).
 * Not a rigid marketing template — users can ask the agent for another layout.
 */
export const LEADHUB_AI_PARENT_TEMPLATE_PREVIEW = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222222;">
  <div style="max-width:600px;margin:0 auto;">
    <p style="margin:0 0 16px;">Hi {{first_name}},</p>
    <p style="margin:0 0 16px;">{{opener}}</p>
    <p style="margin:0 0 16px;">{{pain}}</p>
    <p style="margin:0 0 16px;">{{solution}}</p>
    <p style="margin:0 0 16px;">{{proof}}</p>
    <p style="margin:0 0 16px;">{{cta}}</p>
    <p style="margin:24px 0 0;">
      Best,<br>
      {{sender_name}}<br>
      {{sender_company}}
    </p>
  </div>
</body>
</html>`;

/** Brief is ready once the agent has expanded product + proof (or user filled them). */
export function isLeadhubAiBriefComplete(brief?: {
  product?: string;
  proof?: string;
  userPrompt?: string;
} | null): boolean {
  return Boolean(brief?.product?.trim() && brief?.proof?.trim());
}

/** Locked Step 1 sequence content when LeadSniper agent mode is on (filled at send). */
export const LEADHUB_AI_STEP1_SUBJECT =
  "LeadSniper agent · personalized at send";

export const LEADHUB_AI_STEP1_BODY = `<!-- leadhub-ai-placeholder --><p style="margin:0;color:#64748b;font-size:14px;">This email is personalized per lead by the LeadSniper agent at send time.</p>`;

export function isLeadhubAiStep1Placeholder(subject?: string, body?: string): boolean {
  const s = (subject || "").trim();
  const b = (body || "").trim();
  if (b.includes("<!-- leadhub-ai-placeholder -->")) return true;
  if (s.includes(LEADHUB_AI_STEP1_SUBJECT)) return true;
  // Legacy campaigns saved before placeholder marker fix
  if (
    b.includes("<!-- leadhub-ai-generated -->") &&
    b.includes(
      "This email is personalized per lead by the LeadSniper agent at send time"
    )
  ) {
    return true;
  }
  return false;
}
