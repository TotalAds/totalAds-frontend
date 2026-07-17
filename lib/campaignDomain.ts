/** Stored on inbox-only campaigns (Gmail / Microsoft / Zoho / SMTP) — no SES domain row. */
export const INBOX_CAMPAIGN_DOMAIN_ID = "0";

export type CampaignSenderRef = {
  id: string;
  domainId?: string | null;
  provider?: "ses" | "gmail" | "outlook" | "zoho" | "smtp" | string | null;
};

export function senderUsesSesDomain(
  sender: Pick<CampaignSenderRef, "provider" | "domainId">
): boolean {
  if (sender.provider) return sender.provider === "ses";
  // Legacy rows: SES senders are tied to a domain; inbox accounts have no domain.
  return Boolean(sender.domainId);
}

/** True when any selected sender routes through AWS SES (verified domain required). */
export function campaignRequiresSesDomain(
  senders: CampaignSenderRef[],
  selectedSenderIds: string[]
): boolean {
  if (selectedSenderIds.length === 0) return false;
  const selected = senders.filter((s) => selectedSenderIds.includes(s.id));
  return selected.some(senderUsesSesDomain);
}

/**
 * Domain id for campaign API paths.
 * Inbox-only → sentinel 0; SES → explicit selection or sender's domain.
 */
export function resolveEffectiveCampaignDomainId(params: {
  selectedSenderIds: string[];
  senders: CampaignSenderRef[];
  selectedDomainId: string;
}): string {
  const { selectedSenderIds, senders, selectedDomainId } = params;

  if (!campaignRequiresSesDomain(senders, selectedSenderIds)) {
    return INBOX_CAMPAIGN_DOMAIN_ID;
  }

  if (selectedDomainId) return selectedDomainId;

  const selected = senders.filter((s) => selectedSenderIds.includes(s.id));
  const sesSender = selected.find(senderUsesSesDomain);
  if (sesSender?.domainId) return sesSender.domainId;

  return "";
}

export function isInboxOnlyCampaignDomain(domainId: string | null | undefined): boolean {
  return !domainId || domainId === INBOX_CAMPAIGN_DOMAIN_ID;
}
