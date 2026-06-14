/** Matches totalads-shared deliverabilityThresholds — kept in sync for frontend messaging. */
export type DeliverabilityAction = "none" | "warn" | "slow" | "pause" | "emergency";

export const DELIVERABILITY_MIN_SAMPLE_WARN = 100;
export const BOUNCE_EMERGENCY_RATE = 0.15;
export const BOUNCE_WARN_RATE = 0.03;
export const BOUNCE_SLOW_RATE = 0.1;
export const BOUNCE_PAUSE_RATE_250 = 0.08;
export const BOUNCE_PAUSE_RATE_500 = 0.1;
export const COMPLAINT_EMERGENCY_RATE = 0.01;
export const COMPLAINT_WARN_RATE = 0.001;
export const COMPLAINT_SLOW_RATE = 0.005;
export const COMPLAINT_PAUSE_RATE_250 = 0.003;
export const COMPLAINT_PAUSE_RATE_500 = 0.005;
export const ROLLING_WINDOW_SIZE = 50;
export const ROLLING_BOUNCE_PAUSE_COUNT = 10;

const ACTION_STRICTNESS: Record<DeliverabilityAction, number> = {
	none: 0,
	warn: 1,
	slow: 2,
	pause: 3,
	emergency: 4,
};

export function mergeDeliverabilityActions(
	a: DeliverabilityAction,
	b: DeliverabilityAction
): DeliverabilityAction {
	return ACTION_STRICTNESS[a] >= ACTION_STRICTNESS[b] ? a : b;
}

export function evaluateBounceAction(
	sent: number,
	bounceRate: number
): DeliverabilityAction {
	if (!Number.isFinite(sent) || sent < 0) sent = 0;
	if (!Number.isFinite(bounceRate) || bounceRate < 0) bounceRate = 0;

	if (bounceRate > BOUNCE_EMERGENCY_RATE) return "emergency";
	if (sent < DELIVERABILITY_MIN_SAMPLE_WARN) {
		return bounceRate > BOUNCE_WARN_RATE ? "warn" : "none";
	}
	if (sent < 250) {
		if (bounceRate > BOUNCE_SLOW_RATE) return "slow";
		if (bounceRate > BOUNCE_WARN_RATE) return "warn";
		return "none";
	}
	if (sent < 500) {
		if (bounceRate > BOUNCE_PAUSE_RATE_250) return "pause";
		if (bounceRate > BOUNCE_WARN_RATE) return "warn";
		return "none";
	}
	if (bounceRate > BOUNCE_PAUSE_RATE_500) return "pause";
	return "none";
}

export function evaluateComplaintAction(
	sent: number,
	complaintRate: number
): DeliverabilityAction {
	if (!Number.isFinite(sent) || sent < 0) sent = 0;
	if (!Number.isFinite(complaintRate) || complaintRate < 0) complaintRate = 0;

	if (complaintRate > COMPLAINT_EMERGENCY_RATE) return "emergency";
	if (sent < DELIVERABILITY_MIN_SAMPLE_WARN) {
		return complaintRate > COMPLAINT_WARN_RATE ? "warn" : "none";
	}
	if (sent < 250) {
		if (complaintRate > COMPLAINT_SLOW_RATE) return "slow";
		if (complaintRate > COMPLAINT_WARN_RATE) return "warn";
		return "none";
	}
	if (sent < 500) {
		if (complaintRate > COMPLAINT_PAUSE_RATE_250) return "pause";
		if (complaintRate > COMPLAINT_WARN_RATE) return "warn";
		return "none";
	}
	if (complaintRate > COMPLAINT_PAUSE_RATE_500) return "pause";
	if (complaintRate > COMPLAINT_WARN_RATE) return "warn";
	return "none";
}
