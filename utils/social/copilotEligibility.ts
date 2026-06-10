import { getMemoryBrain, getSocialAccess } from "@/utils/api/socialClient";

export const COPILOT_MEMORY_MIN_COMPLETION_SCORE = 80;

export interface CopilotEligibility {
	eligible: boolean;
	linkedinConnected: boolean;
	memoryCompletionScore: number;
	memoryReady: boolean;
}

export async function checkCopilotEligibility(): Promise<CopilotEligibility> {
	const [access, brain] = await Promise.all([
		getSocialAccess(),
		getMemoryBrain().catch(() => null),
	]);

	const memoryCompletionScore = brain?.completionScore ?? 0;
	const linkedinConnected = access.linkedinConnected;
	const memoryReady =
		memoryCompletionScore >= COPILOT_MEMORY_MIN_COMPLETION_SCORE;

	return {
		eligible: linkedinConnected && memoryReady,
		linkedinConnected,
		memoryCompletionScore,
		memoryReady,
	};
}
