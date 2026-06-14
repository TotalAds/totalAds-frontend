export type DeliverabilitySafeguardRow = {
  level: "safe" | "warning" | "degraded" | "paused" | "monitoring";
  label: string;
  trigger: string;
  action: string;
};

/** Managed SES sender safeguards (matches backend deliverabilityThresholds). */
export const MANAGED_DELIVERABILITY_SAFEGUARDS: DeliverabilitySafeguardRow[] = [
  {
    level: "monitoring",
    label: "Monitoring",
    trigger: "Fewer than 100 sends in 7 days with elevated bounce/complaint signals",
    action: "Warning only — campaign keeps sending; we wait for more data",
  },
  {
    level: "safe",
    label: "Healthy",
    trigger: "Bounce and complaint rates within safe bands for your send volume",
    action: "Daily cap can ramp up on new domains",
  },
  {
    level: "warning",
    label: "Elevated",
    trigger: "Bounce or complaint rate above baseline for your 7-day volume",
    action: "Monitoring banner shown; no auto-pause until thresholds are met",
  },
  {
    level: "degraded",
    label: "Slowed",
    trigger: "100–249 sends and bounce >10%, or matching complaint tier",
    action: "Daily cap reduced ~40% (e.g. 125 → 75/day)",
  },
  {
    level: "paused",
    label: "Paused",
    trigger: "250–499 sends with bounce >8%; 500+ with bounce >10%; or bad recent batch",
    action: "Sender cap = 0; running campaigns auto-pause",
  },
  {
    level: "paused",
    label: "Emergency stop",
    trigger: "Bounce >15% or complaints >1% at any volume",
    action: "Immediate pause — check list quality and verification",
  },
];

export const DELIVERABILITY_NOTES = [
  "Metrics use a rolling 7-day window and recalculate on each send attempt.",
  "Below 100 sends in 7 days, elevated bounce rates show a monitoring warning only — we do not auto-pause on small samples.",
  "After 100+ sends, enforcement tiers apply: slow → pause based on volume and bounce/complaint rate.",
  "We also watch the last 50 emails per sender; 10+ bounces in that window pauses sending (bad batch detection).",
  "Caps reset at UTC midnight; recovery depends on improved bounce/complaint rates.",
  "Hitting only today's daily limit throttles until tomorrow — campaign keeps running.",
  "Critical reputation auto-pauses the campaign (status: paused). Accounts are not auto-blocked.",
  "BYO-SES uses your configured cap and does not apply managed reputation pauses.",
];

export type DeliverabilityAction =
  | "none"
  | "warn"
  | "slow"
  | "pause"
  | "emergency";

export const DELIVERABILITY_MIN_SAMPLE_WARN = 100;

export {
  DELIVERABILITY_ACK_LABEL,
  buildDeliverabilityUserMessage,
  buildDeliverabilityTriggerExplanation,
  computeDeliverabilityStats,
  resolveEffectiveDeliverabilityAction,
} from "./deliverabilityMessaging";

export function formatDeliverabilityRate(rate?: number): string {
  if (typeof rate !== "number" || Number.isNaN(rate)) return "N/A";
  return `${(rate * 100).toFixed(2)}%`;
}

export function deliverabilityActionLabel(action?: DeliverabilityAction): string {
  switch (action) {
    case "emergency":
      return "Emergency pause";
    case "pause":
      return "Paused";
    case "slow":
      return "7-day cap slowed";
    case "warn":
      return "Monitoring";
    default:
      return "Healthy";
  }
}

export function deliverabilityActionDescription(params: {
  action?: DeliverabilityAction;
  sent7d?: number;
  rollingBounceAction?: DeliverabilityAction;
}): string {
  const { action, sent7d, rollingBounceAction } = params;

  if (rollingBounceAction === "pause") {
    return "Bad batch detected: 10+ bounces in the last 50 emails from this sender. Sending is paused until list quality improves.";
  }

  switch (action) {
    case "emergency":
      return "Critically high bounce or complaint rate. Sending stopped immediately — review list source and verification.";
    case "pause":
      return "7-day bounce or complaint rate exceeded safe limits for your send volume. Campaign may auto-pause.";
    case "slow":
      return "Elevated signals for your send volume. Today's sender cap is reduced ~40% until metrics improve.";
    case "warn":
      if (typeof sent7d === "number" && sent7d < DELIVERABILITY_MIN_SAMPLE_WARN) {
        return `Bounce rate is elevated but only ${sent7d} sends in the last 7 days — monitoring only, not enough data to pause.`;
      }
      return "Bounce or complaint rate is elevated. We are monitoring before slowing or pausing.";
    default:
      return "Sender reputation is within normal ranges for your current send volume.";
  }
}

export function senderHealthBadge(
  healthStatus?: string,
  bounceRate7d?: number,
  complaintRate7d?: number,
  sent7d?: number,
  deliverabilityAction?: DeliverabilityAction
): { label: string; tone: "ok" | "warn" | "critical" | "monitoring" } | null {
  if (
    deliverabilityAction === "emergency" ||
    deliverabilityAction === "pause" ||
    healthStatus === "critical" ||
    (typeof sent7d === "number" &&
      sent7d >= 250 &&
      typeof bounceRate7d === "number" &&
      bounceRate7d > 0.08)
  ) {
    return { label: "Critical", tone: "critical" };
  }

  if (
    deliverabilityAction === "slow" ||
    healthStatus === "warning" ||
    deliverabilityAction === "warn"
  ) {
    const monitoring =
      deliverabilityAction === "warn" ||
      (typeof sent7d === "number" && sent7d < DELIVERABILITY_MIN_SAMPLE_WARN);
    return {
      label: monitoring ? "Monitoring" : "At risk",
      tone: monitoring ? "monitoring" : "warn",
    };
  }

  if (healthStatus === "good" || healthStatus === "excellent") {
    return { label: "Healthy", tone: "ok" };
  }

  return null;
}

export function getBounceMetricStatus(
  rate: number,
  sentCount: number
): "good" | "warning" | "critical" | "monitoring" {
  if (sentCount < DELIVERABILITY_MIN_SAMPLE_WARN) {
    if (rate > 3) return "monitoring";
    return "good";
  }
  if (rate > 15) return "critical";
  if (sentCount >= 500 ? rate > 10 : sentCount >= 250 ? rate > 8 : rate > 10) {
    return "critical";
  }
  if (rate > 5) return "warning";
  if (rate > 3) return "monitoring" as "good";
  return "good";
}
