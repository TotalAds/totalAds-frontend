export type DeliverabilitySafeguardRow = {
  level: "safe" | "warning" | "degraded" | "paused";
  label: string;
  trigger: string;
  action: string;
};

/** Managed SES sender safeguards (matches backend reputationService thresholds). */
export const MANAGED_DELIVERABILITY_SAFEGUARDS: DeliverabilitySafeguardRow[] = [
  {
    level: "safe",
    label: "Healthy",
    trigger: "Bounce < 3%, complaints < 0.2%",
    action: "Daily cap can ramp up on new domains",
  },
  {
    level: "warning",
    label: "Warning",
    trigger: "Health score 50–69",
    action: "Daily cap reduced ~30%",
  },
  {
    level: "degraded",
    label: "Degraded",
    trigger: "Bounce > 5% or complaints > 0.3% (7-day)",
    action: "Daily cap cut by at least 50% (min 10/day)",
  },
  {
    level: "paused",
    label: "Paused",
    trigger: "Bounce > 8%, complaints > 1%, or health critical",
    action: "Sender cap = 0; running campaigns auto-pause",
  },
];

export const DELIVERABILITY_NOTES = [
  "Metrics use a rolling 7-day window and recalculate on each send attempt.",
  "Caps reset at UTC midnight; recovery depends on improved bounce/complaint rates.",
  "Hitting only today's daily limit throttles until tomorrow — campaign keeps running.",
  "Critical reputation auto-pauses the campaign (status: paused). Accounts are not auto-blocked.",
  "BYO-SES uses your configured cap and does not apply managed reputation pauses.",
];

export function formatDeliverabilityRate(rate?: number): string {
  if (typeof rate !== "number" || Number.isNaN(rate)) return "N/A";
  return `${(rate * 100).toFixed(2)}%`;
}

export function senderHealthBadge(
  healthStatus?: string,
  bounceRate7d?: number,
  complaintRate7d?: number
): { label: string; tone: "ok" | "warn" | "critical" } | null {
  if (healthStatus === "critical" || (typeof bounceRate7d === "number" && bounceRate7d > 0.08)) {
    return { label: "Critical", tone: "critical" };
  }
  if (
    healthStatus === "warning" ||
    (typeof bounceRate7d === "number" && bounceRate7d > 0.05) ||
    (typeof complaintRate7d === "number" && complaintRate7d > 0.003)
  ) {
    return { label: "At risk", tone: "warn" };
  }
  if (healthStatus === "good" || healthStatus === "excellent") {
    return { label: "Healthy", tone: "ok" };
  }
  return null;
}
