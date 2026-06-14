import {
	BOUNCE_EMERGENCY_RATE,
	BOUNCE_PAUSE_RATE_250,
	BOUNCE_PAUSE_RATE_500,
	BOUNCE_SLOW_RATE,
	BOUNCE_WARN_RATE,
	COMPLAINT_EMERGENCY_RATE,
	COMPLAINT_PAUSE_RATE_250,
	COMPLAINT_PAUSE_RATE_500,
	COMPLAINT_SLOW_RATE,
	COMPLAINT_WARN_RATE,
	DELIVERABILITY_MIN_SAMPLE_WARN,
	mergeDeliverabilityActions,
	ROLLING_BOUNCE_PAUSE_COUNT,
	ROLLING_WINDOW_SIZE,
	type DeliverabilityAction,
	evaluateBounceAction,
	evaluateComplaintAction,
} from "./deliverabilitySafeguardsConstants";

export const DELIVERABILITY_ACK_LABEL =
	"I confirm this list is verified. I accept responsibility for bounce rates above 3%.";

export interface DeliverabilityUserMessageParams {
	campaignName: string;
	sentCount?: number;
	bounceCount?: number;
	sent7d?: number;
	bounceRate7d?: number;
	complaintRate7d?: number;
	deliverabilityAction?: DeliverabilityAction;
	rollingBounceAction?: DeliverabilityAction;
	isPaused?: boolean;
}

export interface DeliverabilityDisplayStats {
	sentCount: number;
	bounceCount: number;
	complaintCount: number;
	bounceRate: number;
	complaintRate: number;
	windowLabel: string;
}

function formatRate(rate: number): string {
	return `${(rate * 100).toFixed(1)}%`;
}

function formatThreshold(rate: number): string {
	return `${(rate * 100).toFixed(0)}%`;
}

export function resolveEffectiveDeliverabilityAction(params: {
	deliverabilityAction?: DeliverabilityAction;
	rollingBounceAction?: DeliverabilityAction;
}): DeliverabilityAction {
	return mergeDeliverabilityActions(
		params.rollingBounceAction || "none",
		params.deliverabilityAction || "none"
	);
}

export function computeDeliverabilityStats(params: {
	sentCount?: number;
	bounceCount?: number;
	sent7d?: number;
	bounceRate7d?: number;
	complaintRate7d?: number;
}): DeliverabilityDisplayStats {
	const sent7d = params.sent7d ?? 0;
	const bounceRate7d = params.bounceRate7d ?? 0;
	const complaintRate7d = params.complaintRate7d ?? 0;

	if (sent7d > 0) {
		return {
			sentCount: sent7d,
			bounceCount: Math.round(sent7d * bounceRate7d),
			complaintCount: Math.round(sent7d * complaintRate7d),
			bounceRate: bounceRate7d,
			complaintRate: complaintRate7d,
			windowLabel: "in the last 7 days",
		};
	}

	const campaignSent = params.sentCount ?? 0;
	const campaignBounces = params.bounceCount ?? 0;
	if (campaignSent > 0) {
		return {
			sentCount: campaignSent,
			bounceCount: campaignBounces,
			complaintCount: 0,
			bounceRate: campaignBounces / campaignSent,
			complaintRate: 0,
			windowLabel: "on this campaign",
		};
	}

	return {
		sentCount: 0,
		bounceCount: 0,
		complaintCount: 0,
		bounceRate: 0,
		complaintRate: 0,
		windowLabel: "on this campaign",
	};
}

export function buildDeliverabilityTriggerExplanation(params: {
	sent7d?: number;
	bounceRate7d?: number;
	complaintRate7d?: number;
	deliverabilityAction?: DeliverabilityAction;
	rollingBounceAction?: DeliverabilityAction;
}): string {
	const sent7d = params.sent7d ?? 0;
	const bounceRate7d = params.bounceRate7d ?? 0;
	const complaintRate7d = params.complaintRate7d ?? 0;

	if (params.rollingBounceAction === "pause") {
		return `Bad batch detected: ${ROLLING_BOUNCE_PAUSE_COUNT}+ bounces in the last ${ROLLING_WINDOW_SIZE} emails. Sending is paused until list quality improves.`;
	}

	const bounceAction = evaluateBounceAction(sent7d, bounceRate7d);
	const complaintAction = evaluateComplaintAction(sent7d, complaintRate7d);
	const effective = resolveEffectiveDeliverabilityAction(params);

	if (effective === "emergency") {
		if (bounceRate7d > BOUNCE_EMERGENCY_RATE) {
			return `Emergency stop: 7-day bounce rate is above ${formatThreshold(BOUNCE_EMERGENCY_RATE)} (${formatRate(bounceRate7d)} with ${sent7d.toLocaleString()} sends). Sending stopped immediately.`;
		}
		if (complaintRate7d > COMPLAINT_EMERGENCY_RATE) {
			return `Emergency stop: 7-day complaint rate is above ${formatThreshold(COMPLAINT_EMERGENCY_RATE)} (${formatRate(complaintRate7d)} with ${sent7d.toLocaleString()} sends). Sending stopped immediately.`;
		}
		return "Emergency stop: bounce or complaint rate is critically high. Sending stopped immediately.";
	}

	if (effective === "pause") {
		if (complaintAction === "pause") {
			if (sent7d >= 500) {
				return `7-day complaint rate exceeded ${formatThreshold(COMPLAINT_PAUSE_RATE_500)} for 500+ sends (${formatRate(complaintRate7d)} with ${sent7d.toLocaleString()} sends). Sending is paused.`;
			}
			return `7-day complaint rate exceeded ${formatThreshold(COMPLAINT_PAUSE_RATE_250)} for 250–499 sends (${formatRate(complaintRate7d)} with ${sent7d.toLocaleString()} sends). Sending is paused.`;
		}
		if (sent7d >= 500) {
			return `7-day bounce rate exceeded ${formatThreshold(BOUNCE_PAUSE_RATE_500)} for 500+ sends (${formatRate(bounceRate7d)} with ${sent7d.toLocaleString()} sends). Sending is paused.`;
		}
		return `7-day bounce rate exceeded ${formatThreshold(BOUNCE_PAUSE_RATE_250)} for 250–499 sends (${formatRate(bounceRate7d)} with ${sent7d.toLocaleString()} sends). Sending is paused.`;
	}

	if (effective === "slow") {
		if (complaintAction === "slow") {
			return `7-day complaint rate exceeded ${formatThreshold(COMPLAINT_SLOW_RATE)} for 100–249 sends (${formatRate(complaintRate7d)} with ${sent7d.toLocaleString()} sends). Daily send cap reduced ~40%.`;
		}
		return `7-day bounce rate exceeded ${formatThreshold(BOUNCE_SLOW_RATE)} for 100–249 sends (${formatRate(bounceRate7d)} with ${sent7d.toLocaleString()} sends). Daily send cap reduced ~40%.`;
	}

	if (effective === "warn" || bounceAction === "warn" || complaintAction === "warn") {
		if (sent7d < DELIVERABILITY_MIN_SAMPLE_WARN) {
			return `Bounce or complaint signals are elevated but only ${sent7d}/${DELIVERABILITY_MIN_SAMPLE_WARN} sends in 7 days — monitoring only, no pause or slow yet. Baseline watch level is ${formatThreshold(BOUNCE_WARN_RATE)} bounce.`;
		}
		return `7-day bounce or complaint rate is above baseline (${formatThreshold(BOUNCE_WARN_RATE)} bounce / ${formatThreshold(COMPLAINT_WARN_RATE)} complaints). Monitoring before further action.`;
	}

	return "Deliverability safeguards were triggered based on your recent send volume and bounce/complaint rates.";
}

function buildLeadLine(
	campaignName: string,
	effectiveAction: DeliverabilityAction,
	isPaused: boolean
): string {
	if (
		isPaused ||
		effectiveAction === "pause" ||
		effectiveAction === "emergency"
	) {
		return `Your campaign ${campaignName} has been paused.`;
	}
	if (effectiveAction === "slow") {
		return `Your campaign ${campaignName} sending has been slowed.`;
	}
	if (effectiveAction === "warn") {
		return `Your campaign ${campaignName} is under deliverability monitoring.`;
	}
	return `Your campaign ${campaignName} hit a deliverability safeguard.`;
}

function buildNextSteps(effectiveAction: DeliverabilityAction, isPaused: boolean): string {
	const resumeStep =
		isPaused || effectiveAction === "pause" || effectiveAction === "emergency"
			? "3) Resume after confirming below"
			: effectiveAction === "slow"
				? "3) Monitor bounce rates — sending continues at a reduced daily cap"
				: "3) Watch bounce rates and clean your list before they trigger a pause";

	return `Here are your next steps: 1) Re-verify your list 2) Remove bounced emails ${resumeStep}`;
}

export function buildDeliverabilityUserMessage(
	params: DeliverabilityUserMessageParams
): string {
	const effectiveAction = resolveEffectiveDeliverabilityAction(params);
	const isPaused =
		params.isPaused === true ||
		effectiveAction === "pause" ||
		effectiveAction === "emergency";

	const stats = computeDeliverabilityStats(params);
	const trigger = buildDeliverabilityTriggerExplanation(params);
	const lead = buildLeadLine(params.campaignName, effectiveAction, isPaused);
	const safeLimit = formatThreshold(BOUNCE_WARN_RATE);

	const statsLine =
		stats.sentCount > 0
			? `You sent ${stats.sentCount.toLocaleString()} emails ${stats.windowLabel} and ${stats.bounceCount.toLocaleString()} bounced (${formatRate(stats.bounceRate)}).`
			: "We detected elevated bounce or complaint signals on recent sends.";

	const complaintLine =
		stats.complaintCount > 0
			? ` Complaints: ${stats.complaintCount.toLocaleString()} (${formatRate(stats.complaintRate)}).`
			: "";

	return (
		`${lead} ${statsLine}${complaintLine} Safe baseline is ${safeLimit} bounce. ${trigger} ` +
		`This usually means your email list needs cleaning. ${buildNextSteps(effectiveAction, isPaused)}`
	);
}
