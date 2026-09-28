/** Keep in sync with totalads-shared PACING_DEFAULTS */
export const SENDER_PACING_DEFAULTS = {
  campaignDailyLimit: 30,
  minWaitMinutes: 1,
  /** Opt-in only — off by default so configured daily limits apply immediately. */
  slowRampEnabled: false,
} as const;

/** Recommended maximum daily email cap per inbox (LeadSnipper side). */
export const MAX_DAILY_EMAIL_CAP = 300;

export function isAboveRecommendedDailyEmailCap(value: number): boolean {
  return Number.isFinite(value) && value > MAX_DAILY_EMAIL_CAP;
}

export function isCriticalDailyEmailCap(value: number): boolean {
  return isAboveRecommendedDailyEmailCap(value);
}

/** Configured daily email cap from inbox settings (shown everywhere in the UI). */
export function getSenderConfiguredDailyCap(
  sender?: { campaignDailyLimit?: number | null } | null
): number {
  return sender?.campaignDailyLimit ?? SENDER_PACING_DEFAULTS.campaignDailyLimit;
}

/** Campaign-wide daily cap: sum of each selected account's configured daily limit. */
export function sumSelectedSenderDailyCaps(
  senders: ReadonlyArray<{ id: string; campaignDailyLimit?: number | null }>,
  selectedIds: readonly string[]
): number {
  if (selectedIds.length === 0 || senders.length === 0) return 0;
  const byId = new Map(senders.map((sender) => [sender.id, sender]));
  let total = 0;
  for (const id of selectedIds) {
    const sender = byId.get(id);
    if (!sender) continue;
    total += getSenderConfiguredDailyCap(sender);
  }
  return total;
}

export type SenderPacingFormValues = {
  campaignDailyLimit: number;
  minWaitMinutes: number;
  slowRampEnabled: boolean;
};

export function buildCampaignPacingOverridePayload(
  values: SenderPacingFormValues,
  senderDefaults: SenderPacingFormValues
) {
  return {
    campaignDailyLimitOverride:
      values.campaignDailyLimit !== senderDefaults.campaignDailyLimit
        ? values.campaignDailyLimit
        : null,
    minWaitMinutesOverride:
      values.minWaitMinutes !== senderDefaults.minWaitMinutes
        ? values.minWaitMinutes
        : null,
    slowRampEnabledOverride:
      values.slowRampEnabled !== senderDefaults.slowRampEnabled
        ? values.slowRampEnabled
        : null,
  };
}

export function resolveCampaignPacingFormValues(
  senderDefaults: SenderPacingFormValues,
  overrides?: {
    campaignDailyLimitOverride?: number | null;
    minWaitMinutesOverride?: number | null;
    slowRampEnabledOverride?: boolean | null;
  }
): SenderPacingFormValues {
  return {
    campaignDailyLimit:
      overrides?.campaignDailyLimitOverride ?? senderDefaults.campaignDailyLimit,
    minWaitMinutes:
      overrides?.minWaitMinutesOverride ?? senderDefaults.minWaitMinutes,
    slowRampEnabled:
      overrides?.slowRampEnabledOverride ?? senderDefaults.slowRampEnabled,
  };
}
