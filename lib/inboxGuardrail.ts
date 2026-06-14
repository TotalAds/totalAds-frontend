/** Conservative planning default per inbox (bottom of 30–50 industry range). */
export const INBOX_SAFE_DAILY_PER_INBOX = 25;

export const INBOX_SAFE_DAILY_MIN = 30;
export const INBOX_SAFE_DAILY_MAX = 50;
export const INBOX_SAFE_MONTHLY_PER_INBOX = 1000;

export interface InboxGuardrailTableRow {
  inboxes: number;
  dailyMin: number;
  dailyMax: number;
  monthly: number;
}

export const INBOX_GUARDRAIL_TABLE: InboxGuardrailTableRow[] = [
  { inboxes: 1, dailyMin: 30, dailyMax: 50, monthly: 1000 },
  { inboxes: 2, dailyMin: 60, dailyMax: 100, monthly: 2000 },
  { inboxes: 5, dailyMin: 150, dailyMax: 250, monthly: 5000 },
  { inboxes: 10, dailyMin: 300, dailyMax: 500, monthly: 10000 },
];

export const INBOX_GUARDRAIL_DEFAULT_TARGET_DAYS = 10;

export interface ComputeInboxGuardrailParams {
  contactCount: number;
  inboxCount: number;
  targetDays?: number;
  customDailyCapacity?: number;
}

export interface InboxGuardrailResult {
  contactCount: number;
  inboxCount: number;
  dailyCapacity: number;
  estimatedDays: number;
  targetDays: number;
  inboxesNeededForTarget: number;
  isOverCapacity: boolean;
}

export function computeInboxGuardrail(
  params: ComputeInboxGuardrailParams
): InboxGuardrailResult {
  const contactCount = Math.max(0, params.contactCount);
  const inboxCount = Math.max(0, params.inboxCount);
  const targetDays = Math.max(1, params.targetDays ?? INBOX_GUARDRAIL_DEFAULT_TARGET_DAYS);

  const dailyCapacity =
    params.customDailyCapacity != null && params.customDailyCapacity > 0
      ? params.customDailyCapacity
      : inboxCount * INBOX_SAFE_DAILY_PER_INBOX;

  const estimatedDays =
    dailyCapacity > 0 ? Math.ceil(contactCount / dailyCapacity) : Infinity;

  const inboxesNeededForTarget =
    contactCount > 0
      ? Math.ceil(contactCount / (targetDays * INBOX_SAFE_DAILY_PER_INBOX))
      : 0;

  return {
    contactCount,
    inboxCount,
    dailyCapacity,
    estimatedDays: Number.isFinite(estimatedDays) ? estimatedDays : 0,
    targetDays,
    inboxesNeededForTarget,
    isOverCapacity: estimatedDays > targetDays,
  };
}
