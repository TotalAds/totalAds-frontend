/** How the From header appears to email recipients. */
export function formatSenderFromPreview(
  email: string,
  displayName?: string | null
): string {
  const name = displayName?.trim();
  if (!name) return email;
  const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}" <${email}>`;
}

export function normalizeSenderDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidSenderDisplayName(value: string): boolean {
  const normalized = normalizeSenderDisplayName(value);
  return normalized.length >= 1 && normalized.length <= 100;
}

export const CAMPAIGN_OAUTH_SETTINGS_KEY = "campaign:oauth:settings";
export const ONBOARDING_OAUTH_RETURN_KEY = "leadsnipper:onboarding:return";

export function saveCampaignOAuthSettings(
  provider: "gmail" | "outlook" | "zoho",
  settings: { displayName: string }
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    `${CAMPAIGN_OAUTH_SETTINGS_KEY}:${provider}`,
    JSON.stringify(settings)
  );
}

export function readCampaignOAuthSettings(provider: string): { displayName?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${CAMPAIGN_OAUTH_SETTINGS_KEY}:${provider}`);
    if (!raw) return null;
    return JSON.parse(raw) as { displayName?: string };
  } catch {
    return null;
  }
}

export function clearCampaignOAuthSettings(provider: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${CAMPAIGN_OAUTH_SETTINGS_KEY}:${provider}`);
}

export function setOnboardingOAuthReturnPath(path: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ONBOARDING_OAUTH_RETURN_KEY, path);
}

export function readOnboardingOAuthReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ONBOARDING_OAUTH_RETURN_KEY);
}

export function clearOnboardingOAuthReturnPath() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_OAUTH_RETURN_KEY);
}
