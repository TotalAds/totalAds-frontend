import { getMemoryBrain, getSocialAccess, getSocialApiErrorMessage } from "@/utils/api/socialClient";

import {
	isSocialServiceUnreachable,
	SOCIAL_SERVICE_UNAVAILABLE_MESSAGE,
} from "./socialServiceErrors";

/** Keep in sync with totalads-shared `COPILOT_MEMORY_MIN_COMPLETION_SCORE`. */
export const COPILOT_MEMORY_MIN_COMPLETION_SCORE = 80;

export interface CopilotEligibility {
	eligible: boolean;
	linkedinConnected: boolean;
	/** Null when the brain API could not be loaded (do not treat as 0%). */
	memoryCompletionScore: number | null;
	memoryReady: boolean;
	brainLoadFailed: boolean;
	brainLoadError: string | null;
	accessLoadFailed: boolean;
	accessLoadError: string | null;
}

export async function checkCopilotEligibility(): Promise<CopilotEligibility> {
	let linkedinConnected = false;
	let accessLoadFailed = false;
	let accessLoadError: string | null = null;

	try {
		const access = await getSocialAccess();
		linkedinConnected = access.linkedinConnected;
	} catch (error) {
		accessLoadFailed = true;
		accessLoadError = isSocialServiceUnreachable(error)
			? SOCIAL_SERVICE_UNAVAILABLE_MESSAGE
			: getSocialApiErrorMessage(error, "Failed to load account access");
	}

	let memoryCompletionScore: number | null = null;
	let brainLoadFailed = false;
	let brainLoadError: string | null = null;

	try {
		const brain = await getMemoryBrain();
		memoryCompletionScore = brain.completionScore;
	} catch (error) {
		brainLoadFailed = true;
		brainLoadError = isSocialServiceUnreachable(error)
			? SOCIAL_SERVICE_UNAVAILABLE_MESSAGE
			: getSocialApiErrorMessage(error, "Failed to load memory brain");
	}

	const memoryReady =
		memoryCompletionScore !== null &&
		memoryCompletionScore >= COPILOT_MEMORY_MIN_COMPLETION_SCORE;

	return {
		eligible:
			!accessLoadFailed &&
			!brainLoadFailed &&
			linkedinConnected &&
			memoryReady,
		linkedinConnected,
		memoryCompletionScore,
		memoryReady,
		brainLoadFailed,
		brainLoadError,
		accessLoadFailed,
		accessLoadError,
	};
}

export function formatCopilotMemoryStatus(eligibility: CopilotEligibility): string {
	if (eligibility.brainLoadFailed) {
		return "Could not load memory score — check that the social service is running.";
	}
	if (eligibility.memoryCompletionScore === null) {
		return "Memory score unavailable";
	}
	if (eligibility.memoryReady) {
		return `${eligibility.memoryCompletionScore}% complete`;
	}
	return `${eligibility.memoryCompletionScore}% complete — reach ${COPILOT_MEMORY_MIN_COMPLETION_SCORE}% for Copilot.`;
}
