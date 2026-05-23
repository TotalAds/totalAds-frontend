"use client";

import axios, { AxiosError } from "axios";

import { refreshAccessToken } from "../auth/refreshAccessToken";
import { tokenStorage } from "../auth/tokenStorage";
import apiClient from "./apiClient";

const SOCIAL_SERVICE_URL =
	process.env.NEXT_PUBLIC_SOCIAL_SERVICE_URL || "http://localhost:3005";

export const getSocialApiErrorMessage = (error: unknown, fallback: string) => {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as { message?: string } | undefined;
		if (data?.message) return data.message;
		return error.message || fallback;
	}
	if (error instanceof Error) return error.message;
	return fallback;
};

const socialClient = axios.create({
	baseURL: SOCIAL_SERVICE_URL,
	headers: { "Content-Type": "application/json" },
	withCredentials: true,
	timeout: 120000,
});

let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value?: unknown) => void;
	reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) reject(error);
		else resolve(token);
	});
	failedQueue = [];
};

socialClient.interceptors.request.use(
	(config) => {
		const accessToken = tokenStorage.getAccessToken();
		if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
		return config;
	},
	(error) => Promise.reject(error)
);

socialClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as any;
		if (error.response?.status !== 401 || originalRequest?._retry) {
			return Promise.reject(error);
		}
		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			})
				.then((token) => {
					originalRequest.headers.Authorization = `Bearer ${token}`;
					return socialClient(originalRequest);
				})
				.catch((err) => Promise.reject(err));
		}
		isRefreshing = true;
		originalRequest._retry = true;
		try {
			const token = await refreshAccessToken();
			processQueue(null, token);
			originalRequest.headers.Authorization = `Bearer ${token}`;
			return socialClient(originalRequest);
		} catch (refreshError) {
			processQueue(refreshError, null);
			tokenStorage.removeTokens();
			if (typeof window !== "undefined") {
				window.location.href = "/login";
			}
			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	}
);

// -----------------------------------------------------------------------
// Shared types
// -----------------------------------------------------------------------

export type SocialPostStatus =
	| "draft"
	| "in_review"
	| "approved"
	| "scheduled"
	| "publishing"
	| "published"
	| "failed"
	| "rejected"
	| "cancelled";

export type MemoryLayer = "profile" | "work" | "learning";

export interface SocialAccessResponse {
	enabled: boolean;
	hasActiveSubscription: boolean;
	subscription: {
		tierName: string | null;
		tierDisplayName: string | null;
		status: string | null;
		currentPeriodEnd: string | null;
		nextBillingDate: string | null;
		lockedPriceInPaise: number | null;
	} | null;
	linkedinConnected: boolean;
	commentsApprovalMode: boolean;
	linkedinImageGenerationEnabled: boolean;
	linkedinExternalUrl: string;
	socialOnboardingCompleted: boolean;
	_requiresSubscription?: boolean; // Internal flag indicating new subscription-based access
}

export interface LinkedinConnection {
	linkedinMemberUrn: string | null;
	linkedinEmail: string | null;
	linkedinName: string | null;
	status: "connected" | "disconnected" | "expired";
	sessionStatus: string | null;
	tokenExpiresAt: string | null;
	refreshTokenExpiresAt: string | null;
	connectedAt: string | null;
	lastRefreshedAt: string | null;
}

export interface LinkedinStatus {
	connected: boolean;
	connection: LinkedinConnection | null;
}

export interface AgentDraft {
	body: string;
	hook: string;
	hashtags: string[];
	rationale: string;
	confidence: number;
	postFormat: string;
	productMentionMode: "none" | "soft" | "direct";
	ctaType: string;
	hasProductMention: boolean;
	topicCategory: string;
}

export type HumanizerLevel = "off" | "light" | "medium" | "heavy";

export interface AgentRunOutput {
	agentRunId: string;
	postRunId: number;
	status: "draft" | "in_review" | "approved" | "failed";
	draft: AgentDraft;
	humanizerLevel?: HumanizerLevel;
	antiAiScore?: number;
	approvalChannel: string;
	approvalMessageId?: string;
	memoryUsed: {
		profileKeyCount: number;
		workKeyCount: number;
		learningRuleCount: number;
	};
	mediaAssets?: Array<{
		id: number;
		assetType: "single_image" | "carousel_pdf";
		provider: string;
		publicUrl: string | null;
		status: "pending" | "processing" | "ready" | "failed";
	}>;
	formatIntelligence?: {
		selectedFormat: string;
		formatConfidenceScore: number;
		reasoning: string;
		historicalSimilarityScore: number;
		recommendations: Array<{
			format: string;
			label: string;
			score: number;
			reason: string;
		}>;
	};
}

export interface ArticleMeta {
	title: string;
	description: string;
	source: string;
	bodyHtml: string;
	commentary: string;
	thumbnailUrl?: string;
	coverImagePrompt?: string;
	/** Paste into ChatGPT, Claude, or Gemini for cover art */
	coverImagePromptExternal?: string;
	linkedinThumbnailUrn?: string;
	articleHosted?: boolean;
	hostedUrl?: string;
	hostedAt?: string;
	plannedSourceUrl?: string;
	feedPostEnabled?: boolean;
	feedPostPublishedAt?: string;
	feedPostUrn?: string;
	/** Public S3 object key after publish-live */
	hostedS3Key?: string;
	/** https://www.linkedin.com/feed/update/… after feed publish */
	linkedinPostUrl?: string;
}

export interface SocialPostRun {
	id: number;
	userId: number;
	status: SocialPostStatus;
	contentBody: string;
	contentBodyV1: string | null;
	hookText: string | null;
	mediaUrls: string[] | null;
	hashtags: string[] | null;
	linkedinPostUrn: string | null;
	linkedinPostId: string | null;
	linkedinAuthorUrn: string | null;
	scheduledFor: string | null;
	publishedAt: string | null;
	failureReason: string | null;
	retryCount: number | null;
	approvalMode: "manual" | "auto" | "telegram" | "whatsapp";
	approvalChannel: string | null;
	approvalMessageId: string | null;
	approvedBy: string | null;
	approvedAt: string | null;
	rejectedReason: string | null;
	userEditedBody: boolean;
	topic: string | null;
	angle: string | null;
	audience: string | null;
	agentRunId: string | null;
	contentPostFormat?: string | null;
	articleMeta?: ArticleMeta | null;
	productMentionMode?: string | null;
	hasProductMention?: boolean | null;
	selectedFormat?: string | null;
	formatConfidenceScore?: number | null;
	formatReasoning?: string | null;
	historicalSimilarityScore?: number | null;
	profileMemorySnapshot: Record<string, unknown> | null;
	workMemorySnapshot: Record<string, unknown> | null;
	learningRulesApplied: number[] | null;
	createdAt: string;
	updatedAt: string;
}

export type LinkedinCalendarDurationDays = 1 | 7 | 15 | 30;
export type LinkedinCalendarFocus =
	| "awareness"
	| "authority"
	| "conversion"
	| "balanced";

export interface GenerateLinkedinCalendarInput {
	chatId?: string;
	durationDays: LinkedinCalendarDurationDays;
	startDate?: string;
	postsPerWeek?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
	focus?: LinkedinCalendarFocus;
	brief?: string;
	audience?: string;
	proofPoint?: string;
	cta?: string;
	approvalBehavior?: "draft" | "review";
	userPrompt?: string;
	selectedFramework?: string;
	answers?: Record<string, string>;
	approvedArchitecture?: Record<string, unknown>;
	attachments?: CopilotAttachment[];
	mediaMode?: "none" | "image" | "carousel" | "auto";
	imageStyle?: "professional" | "classic" | "modern" | "minimal" | "bold";
	aspectRatio?: "1:1" | "16:9" | "4:5";
	messages?: Array<{ role: "user" | "assistant"; content: string; createdAt?: string }>;
	selectedFrameworkId?: string | null;
	briefSnapshot?: CopilotBriefResponse | null;
	humanizerLevel?: HumanizerLevel;
}

export interface CopilotAttachment {
	name: string;
	type?: string;
	description?: string;
	url?: string;
}

export interface CopilotBriefResponse {
	chatId?: string;
	session?: CopilotSessionSnapshot;
	reply: string;
	intent: {
		durationDays: LinkedinCalendarDurationDays;
		postsPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
		focus: LinkedinCalendarFocus;
		mediaMode: "none" | "image" | "carousel" | "auto";
	};
	recommendedFrameworks: Array<{
		id: string;
		label: string;
		reason: string;
		durationDays: LinkedinCalendarDurationDays;
		postsPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
		focus: LinkedinCalendarFocus;
		mediaMode: "none" | "image" | "carousel" | "auto";
	}>;
	questions: string[];
	architecture: {
		title: string;
		summary: string;
		days: Array<{
			day: number;
			theme: string;
			framework: string;
			kltStage: "Know" | "Like" | "Trust";
			creativeDirection: string;
			mediaSuggestion: "none" | "image" | "carousel";
		}>;
	};
	canGenerate: boolean;
	humanizerLevel?: HumanizerLevel;
	memoryUsed: {
		profileKeyCount: number;
		workKeyCount: number;
		learningRuleCount: number;
	};
}

export interface CopilotSessionSnapshot {
	chatId: string;
	title: string;
	status: "drafting" | "briefed" | "generated";
	messages: Array<{ role: "user" | "assistant"; content: string; createdAt?: string }>;
	attachments: CopilotAttachment[];
	brief: CopilotBriefResponse | null;
	selectedFrameworkId: string | null;
	answers: Record<string, string>;
	calendar: GeneratedLinkedinCalendar | null;
	updatedAt: string;
}

export interface GeneratedLinkedinCalendarPost {
	calendarPlanId: number;
	postRunId: number;
	date: string;
	scheduledFor: string;
	kltStage: "Know" | "Like" | "Trust";
	pillar: string;
	format: string;
	hookType: string;
	hook: string;
	topic: string;
	angle: string;
	postBody: string;
	hashtags: string[];
	ctaType: string;
	notes: string;
	mediaSuggestion?: "none" | "image" | "carousel";
	status: "draft" | "in_review";
	mediaAssets?: Array<{
		id: number;
		assetType: string;
		publicUrl: string | null;
		status: string;
	}>;
}

export interface GeneratedLinkedinCalendar {
	calendarBatchId: string;
	durationDays: LinkedinCalendarDurationDays;
	totalPosts: number;
	startDate: string;
	posts: GeneratedLinkedinCalendarPost[];
	kltDistribution: {
		know: number;
		like: number;
		trust: number;
	};
	memoryUsed: {
		profileKeyCount: number;
		workKeyCount: number;
		learningRuleCount: number;
	};
	humanizerLevel?: HumanizerLevel;
}

export interface PerformanceSnapshot {
	id: number;
	postRunId: number;
	userId: number;
	snapshotHour: number;
	impressions: number;
	uniqueViews: number;
	likes: number;
	comments: number;
	reposts: number;
	clicks: number;
	engagementRate: number;
	snapshotTakenAt: string;
}

export interface MemoryItem {
	id: number;
	userId: number;
	layer: MemoryLayer;
	key: string;
	value: unknown;
	description: string | null;
	confidence: number;
	evidenceCount: number;
	campaignId: number | null;
	status: "active" | "deprecated" | "contradicted" | "archived";
	sourceEventIds: number[] | null;
	expiresAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface MemoryBrainSection {
	id: string;
	label: string;
	completed: number;
	total: number;
	completion: number;
	items: Array<{
		key: string;
		label: string;
		hint: string;
		value: unknown;
		isSet: boolean;
		impactWeight: number;
		updatedAt: string | null;
	}>;
}

export interface MemoryBrainPayload {
	sections: MemoryBrainSection[];
	completionScore: number;
	rawCompletionScore?: number;
	weighting?: Record<string, number>;
	completedFields: number;
	totalFields: number;
	missing: Array<{
		section: string;
		key: string;
		label: string;
		hint: string;
		priority?: number;
	}>;
}

export interface LearningRule {
	id: number;
	userId: number;
	ruleType:
		| "hook_pattern"
		| "cta_style"
		| "topic"
		| "format"
		| "timing"
		| "audience"
		| "avoid";
	title: string;
	description: string;
	confidence: number;
	evidenceCount: number;
	sourcePostRunIds: number[] | null;
	status: "active" | "deprecated" | "contradicted";
	autoApplyToPrompt: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface SocialEvent {
	id: number;
	userId: number;
	eventType: string;
	entityType:
		| "post"
		| "comment"
		| "lead"
		| "memory"
		| "session"
		| "agent_run"
		| "approval"
		| "thread"
		| null;
	entityId: number | null;
	payload: Record<string, unknown>;
	actor: "agent" | "user" | "system" | "linkedin_api" | "telegram";
	sessionId: string | null;
	occurredAt: string;
}

export interface AgentBriefing {
	date: string;
	counts: {
		drafts: number;
		inReview: number;
		scheduled: number;
		publishedLast24h: number;
	};
	topLearningRules: Array<{
		id: number;
		title: string;
		description: string;
		confidence: number;
		ruleType: string;
	}>;
	recommendation: string;
}

export interface AccountPreferences {
	approvalChannel: "telegram" | "whatsapp" | "dashboard";
	autoMode: boolean;
	autoConfidenceThreshold: number;
	telegramLinked: boolean;
	whatsappLinked: boolean;
	agentEnabled: boolean;
	dailyPostLimit: number;
	postingWindowStart: string;
	postingWindowEnd: string;
	similarityPolicy: "warn" | "require_edit" | "block";
	similarityThreshold: number;
	humanizerLevel: HumanizerLevel;
}

export interface SocialMediaAsset {
	id: number;
	userId: number;
	postRunId: number | null;
	assetType: "single_image" | "single_video" | "carousel_pdf";
	provider: string;
	providerAssetId: string | null;
	sourcePrompt: string | null;
	publicUrl: string | null;
	status: "pending" | "processing" | "ready" | "failed" | "deleted";
	failureReason: string | null;
	createdAt: string;
	updatedAt: string;
}

// -----------------------------------------------------------------------
// Access / session (via totalads-api apiClient)
// -----------------------------------------------------------------------

export const getSocialAccess = async (): Promise<SocialAccessResponse> => {
	const response = await apiClient.get("/social/access");
	const payload = response.data?.payload || response.data;
	return payload;
};

/** Mark SocialSnipper onboarding as complete */
export const completeSocialOnboarding = async (): Promise<void> => {
	await apiClient.post("/social/onboarding/complete");
};

export const updateSocialSettings = async (settings: {
	commentsApprovalMode?: boolean;
	linkedinExternalUrl?: string;
}) => {
	const response = await apiClient.patch("/social/settings", settings);
	return response.data?.payload || response.data;
};

// -----------------------------------------------------------------------
// LinkedIn OAuth + session health
// -----------------------------------------------------------------------

export const getLinkedinStatus = async (): Promise<LinkedinStatus> => {
	const response = await socialClient.get("/api/v1/linkedin/status");
	return response.data?.data;
};

export const getLinkedinLoginUrl = async (redirectUri?: string) => {
	const response = await socialClient.post("/api/v1/linkedin/login", {
		redirectUri,
	});
	return response.data?.data as {
		authUrl: string;
		state: string;
		redirectUri: string;
	};
};

export const connectLinkedin = async (data: {
	code: string;
	state: string;
	redirectUri?: string;
}) => {
	const response = await socialClient.post("/api/v1/linkedin/callback", data);
	return response.data;
};

export const refreshLinkedinSession = async () => {
	const response = await socialClient.post("/api/v1/linkedin/refresh");
	return response.data?.data as { expiresAt: string };
};

export const disconnectLinkedin = async () => {
	const response = await socialClient.post("/api/v1/linkedin/disconnect");
	return response.data;
};

export const getLinkedinConfigCheck = async () => {
	const response = await socialClient.get("/api/v1/linkedin/config-check");
	return response.data?.data;
};

// -----------------------------------------------------------------------
// Agent: the heart of the system
// -----------------------------------------------------------------------

export const runAgent = async (input: {
	topic: string;
	/** @deprecated prefer `angles` */
	angle?: string;
	/** @deprecated prefer `audiences` */
	audience?: string;
	angles?: string[];
	audiences?: string[];
	proofPoint?: string;
	cta?: string;
	seriesName?: string;
	extraInstructions?: string;
	scheduledFor?: string;
	campaignId?: number | null;
	createImage?: boolean;
	createCarousel?: boolean;
	humanizerLevel?: HumanizerLevel;
}): Promise<AgentRunOutput> => {
	const response = await socialClient.post("/api/v1/agent/run", input);
	return response.data?.data;
};

export const getFormatRecommendation = async (input: {
	topic: string;
	angle?: string;
	angles?: string[];
	audience?: string;
	audiences?: string[];
	cta?: string;
	extraInstructions?: string;
}) => {
	const response = await socialClient.post("/api/v1/agent/format-recommendation", input);
	return response.data?.data as {
		selectedFormat: string;
		selectedLabel: string;
		formatConfidenceScore: number;
		reasoning: string;
		historicalSimilarityScore: number;
		recommendations: Array<{ format: string; label: string; score: number; reason: string }>;
	};
};

export const getAgentBriefing = async (): Promise<AgentBriefing> => {
	const response = await socialClient.get("/api/v1/agent/briefing");
	return response.data?.data;
};

export const getAgentLearningRules = async (): Promise<LearningRule[]> => {
	const response = await socialClient.get("/api/v1/agent/learning-rules");
	return response.data?.data || [];
};

// -----------------------------------------------------------------------
// Posts (post_runs) CRUD
// -----------------------------------------------------------------------

export const listPosts = async (filters?: {
	status?: SocialPostStatus;
	limit?: number;
}): Promise<SocialPostRun[]> => {
	const response = await socialClient.get("/api/v1/posts", {
		params: filters,
	});
	return response.data?.data || [];
};

export const getPost = async (
	id: number
): Promise<{ post: SocialPostRun; snapshots: PerformanceSnapshot[] }> => {
	const response = await socialClient.get(`/api/v1/posts/${id}`);
	return response.data?.data;
};

export const createManualPost = async (payload: {
	contentBody: string;
	topic?: string;
	hashtags?: string[];
	mediaUrls?: string[];
}): Promise<{ postRunId: number }> => {
	const response = await socialClient.post("/api/v1/posts", payload);
	return response.data?.data;
};

export const updatePostDraft = async (
	id: number,
	payload: { contentBody: string; hashtags?: string[]; mediaUrls?: string[] }
) => {
	const response = await socialClient.patch(`/api/v1/posts/${id}`, payload);
	return response.data;
};

export const approvePost = async (
	id: number,
	options?: { scheduleFor?: string; postNow?: boolean }
) => {
	const response = await socialClient.post(`/api/v1/posts/${id}/approve`, options || {});
	return response.data?.data;
};

export const rejectPost = async (id: number, reason?: string) => {
	const response = await socialClient.post(`/api/v1/posts/${id}/reject`, {
		reason,
	});
	return response.data;
};

export const cancelScheduledPost = async (id: number, reason?: string) => {
	const response = await socialClient.post(`/api/v1/posts/${id}/cancel-schedule`, {
		reason,
	});
	return response.data?.data as {
		previousScheduledFor: string | null;
		post: SocialPostRun;
	};
};

export const schedulePost = async (id: number, scheduledFor: string) => {
	const response = await socialClient.post(`/api/v1/posts/${id}/schedule`, {
		scheduledFor,
	});
	return response.data;
};

export type SocialTimeSlot = "morning" | "afternoon" | "evening";

export const reschedulePostToSlot = async (
	id: number,
	slot: SocialTimeSlot
) => {
	const response = await socialClient.post(
		`/api/v1/posts/${id}/schedule-slot`,
		{ slot }
	);
	return response.data;
};

export const publishPostNow = async (id: number) => {
	const response = await socialClient.post(`/api/v1/posts/${id}/publish-now`);
	return response.data?.data;
};

export const deleteLinkedinPost = async (id: number) => {
	const response = await socialClient.delete(`/api/v1/posts/${id}/linkedin`);
	return response.data;
};

// -----------------------------------------------------------------------
// Legacy content / approval endpoints (proxied to post_runs on the server)
// -----------------------------------------------------------------------

export const generateSocialDrafts = async (input: {
	topic: string;
	angle?: string;
	audience?: string;
	angles?: string[];
	audiences?: string[];
	proofPoint?: string;
	cta?: string;
	scheduledFor?: string;
	extraInstructions?: string;
	seriesName?: string;
}) => {
	const response = await socialClient.post("/api/v1/content/generate", input);
	return response.data?.data as {
		postRunId: number;
		agentRunId: string;
		status: "draft" | "in_review" | "approved" | "failed";
		draft: AgentDraft;
		approvalChannel: string;
		memoryUsed: AgentRunOutput["memoryUsed"];
	};
};

export const getApprovalQueue = async (): Promise<SocialPostRun[]> => {
	const response = await socialClient.get("/api/v1/approval/queue");
	return response.data?.data || [];
};

// -----------------------------------------------------------------------
// Scheduler / calendar
// -----------------------------------------------------------------------

export const runSchedulerNow = async () => {
	const response = await socialClient.post("/api/v1/scheduler/run");
	return response.data?.data as {
		due: number;
		published: number;
		failed: number;
	};
};

export const getSocialCalendar = async (): Promise<{
	scheduled: SocialPostRun[];
	recentPosts: SocialPostRun[];
	planned?: Array<Record<string, unknown>>;
}> => {
	const response = await socialClient.get("/api/v1/scheduler/calendar");
	return response.data?.data;
};

export const getMorningBriefing = async () => {
	const response = await socialClient.get("/api/v1/scheduler/briefing");
	return response.data?.data as {
		date: string;
		queuedPosts: number;
		postedPosts: number;
		recommendation: string;
	};
};

export const generateSevenDayCalendar = async () => {
	const response = await socialClient.post("/api/v1/calendar/generate", {
		durationDays: 7,
	});
	return response.data?.data as GeneratedLinkedinCalendar;
};

export const listCopilotSessions = async (): Promise<CopilotSessionSnapshot[]> => {
	const response = await socialClient.get("/api/v1/calendar/copilot/sessions", {
		params: { t: Date.now() },
	});
	return response.data?.data || [];
};

export const getCopilotSession = async (
	chatId: string
): Promise<CopilotSessionSnapshot> => {
	const response = await socialClient.get(
		`/api/v1/calendar/copilot/sessions/${chatId}`
	);
	return response.data?.data;
};

export const saveCopilotSession = async (input: Partial<CopilotSessionSnapshot> & {
	messages: CopilotSessionSnapshot["messages"];
}): Promise<CopilotSessionSnapshot> => {
	const response = await socialClient.post(
		"/api/v1/calendar/copilot/sessions",
		input
	);
	return response.data?.data;
};

export const briefLinkedinCopilot = async (input: {
	chatId?: string;
	prompt: string;
	conversation?: Array<{ role: "user" | "assistant"; content: string }>;
	attachments?: CopilotAttachment[];
	humanizerLevel?: HumanizerLevel;
}): Promise<CopilotBriefResponse> => {
	const response = await socialClient.post("/api/v1/calendar/copilot/brief", input);
	return response.data?.data;
};

/**
 * Starts generation on the server and polls until completion so production proxies
 * (short HTTP timeouts) do not abort while drafts are still being created.
 */
export const generateLinkedinCalendar = async (
	input: GenerateLinkedinCalendarInput,
	options?: {
		onStatus?: (status: {
			batchId: string;
			status: "started" | "pending" | "completed" | "failed";
			attempt: number;
		}) => void;
		timeoutMs?: number;
	}
): Promise<GeneratedLinkedinCalendar> => {
	const startResponse = await socialClient.post("/api/v1/calendar/generate/async", input, {
		timeout: 60000,
	});
	const batchId = startResponse.data?.data?.calendarBatchId as string | undefined;
	if (!batchId) {
		throw new Error(
			startResponse.data?.message ||
				"Calendar generation did not return a batch id. Try again."
		);
	}

	options?.onStatus?.({ batchId, status: "started", attempt: 0 });

	const deadline = Date.now() + (options?.timeoutMs ?? 8 * 60 * 1000);
	let delayMs = 2500;
	let attempt = 0;

	while (Date.now() < deadline) {
		attempt += 1;
		const poll = await socialClient.get(
			`/api/v1/calendar/generate/status/${batchId}`,
			{ timeout: 60000 }
		);
		const payload = poll.data?.data as
			| {
					status: "pending" | "completed" | "failed";
					data?: GeneratedLinkedinCalendar;
					error?: string;
			  }
			| undefined;

		if (!payload?.status) {
			throw new Error("Invalid calendar status response from server.");
		}

		if (payload.status === "completed" && payload.data) {
			options?.onStatus?.({ batchId, status: "completed", attempt });
			return payload.data;
		}

		if (payload.status === "failed") {
			options?.onStatus?.({ batchId, status: "failed", attempt });
			throw new Error(
				payload.error ||
					"Calendar generation failed. Check Posts — drafts may still have been created."
			);
		}

		options?.onStatus?.({ batchId, status: "pending", attempt });
		await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 12000)));
		delayMs = Math.min(Math.floor(delayMs * 1.2), 12000);
	}

	throw new Error(
		"Calendar generation timed out waiting for the server. Open Posts — your drafts may already be there."
	);
};

export const getUpcomingCalendarPlan = async () => {
	const response = await socialClient.get("/api/v1/calendar/upcoming");
	return response.data?.data || [];
};

export const generateSocialImage = async (payload: {
	postRunId?: number;
	prompt?: string;
	imageStyle?: "professional" | "classic" | "modern" | "minimal" | "bold";
	aspectRatio?: "1:1" | "16:9" | "4:5";
	autoPrompt?: boolean;
	provider?: "nano_banana" | "bannerbear";
}) => {
	const response = await socialClient.post("/api/v1/media/image", payload);
	return response.data?.data;
};

export const generateSocialCarousel = async (payload: {
	postRunId?: number;
	prompt: string;
}) => {
	const response = await socialClient.post("/api/v1/media/carousel", payload);
	return response.data?.data;
};

export const uploadSocialEditorImage = async (params: {
	postRunId?: number;
	file: File;
	mimeType:
		| "image/png"
		| "image/jpeg"
		| "image/jpg"
		| "image/webp"
		| "image/gif"
		| "video/mp4"
		| "video/quicktime"
		| "video/webm"
		| "application/pdf";
}) => {
	const presignResponse = await socialClient.post("/api/v1/media/upload/presign", {
		postRunId: params.postRunId,
		fileName: params.file.name || "linkedin-asset-upload",
		mimeType: params.mimeType,
		fileSize: params.file.size,
	});
	const presigned = presignResponse.data?.data as {
		uploadUrl: string;
		key: string;
		publicUrl: string;
		headers?: Record<string, string>;
	};
	if (!presigned?.uploadUrl || !presigned.key) {
		throw new Error(presignResponse.data?.message || "Failed to prepare upload");
	}

	const putResponse = await fetch(presigned.uploadUrl, {
		method: "PUT",
		body: params.file,
		headers: presigned.headers || { "Content-Type": params.mimeType },
	});
	if (!putResponse.ok) {
		const detail = (await putResponse.text()).trim().slice(0, 240);
		throw new Error(
			detail
				? `Direct upload to storage failed (${putResponse.status}): ${detail}`
				: `Direct upload to storage failed (${putResponse.status})`
		);
	}

	const completeResponse = await socialClient.post("/api/v1/media/upload/complete", {
		postRunId: params.postRunId,
		key: presigned.key,
		fileName: params.file.name || "linkedin-asset-upload",
		mimeType: params.mimeType,
	});
	return completeResponse.data?.data as SocialMediaAsset;
};

export const listMediaAssets = async () => {
	const response = await socialClient.get("/api/v1/media/assets");
	return (response.data?.data || []) as SocialMediaAsset[];
};

export const listPostMediaAssets = async (postRunId: number) => {
	const response = await socialClient.get(`/api/v1/media/assets/${postRunId}`);
	return (response.data?.data || []) as SocialMediaAsset[];
};

export const retrySocialMediaAsset = async (
	assetId: number
): Promise<SocialMediaAsset> => {
	try {
		const response = await socialClient.post(
			`/api/v1/media/assets/${assetId}/retry`
		);
		const data = response.data?.data;
		if (!data) {
			throw new Error(response.data?.message || "Retry failed");
		}
		return data as SocialMediaAsset;
	} catch (err) {
		if (err instanceof AxiosError && err.response?.data?.message) {
			throw new Error(String(err.response.data.message));
		}
		throw err;
	}
};

export const deleteSocialMediaAsset = async (assetId: number) => {
	const response = await socialClient.delete(`/api/v1/media/assets/${assetId}`);
	return response.data?.data as { id: number };
};

export const regenerateImagePrompt = async (params: {
	assetId: number;
	includeContactInImage: boolean;
}): Promise<{
	assetId: number;
	sourcePrompt: string;
	includeContactInImage: boolean;
}> => {
	const response = await socialClient.post("/api/v1/media/regenerate-prompt", params);
	return response.data?.data;
};

// -----------------------------------------------------------------------
// Memory (profile / work / learning)
// -----------------------------------------------------------------------

export const getProfileMemory = async (): Promise<MemoryItem[]> => {
	const response = await socialClient.get("/api/v1/memory/profile");
	return response.data?.data || [];
};

export interface SocialBrandDetails {
	companyName: string | null;
	productName: string | null;
	website: string | null;
	brandLogoUrl: string | null;
	brandColor: string | null;
	instagramHandle: string | null;
	mobileNumber: string | null;
	brandPositioning: string | null;
	brandTone: string | null;
	usp: string | null;
}

/** Current profile-layer brand fields (not the post creation snapshot). */
export const getBrandDetails = async (): Promise<SocialBrandDetails> => {
	const response = await socialClient.get("/api/v1/memory/brand-details");
	return response.data?.data;
};

export const getMemoryLayer = async (
	layer: MemoryLayer
): Promise<MemoryItem[]> => {
	const response = await socialClient.get(`/api/v1/memory/layer/${layer}`);
	return response.data?.data || [];
};

export const upsertMemory = async (params: {
	layer: MemoryLayer;
	key: string;
	value: unknown;
	description?: string;
	confidence?: number;
	campaignId?: number | null;
}) => {
	const response = await socialClient.post("/api/v1/memory/upsert", params);
	return response.data?.data as { id: number };
};

export const deprecateMemoryItem = async (layer: MemoryLayer, key: string) => {
	const response = await socialClient.delete(`/api/v1/memory/${layer}/${encodeURIComponent(key)}`);
	return response.data;
};

export interface MemoryOnboardingPayload {
	founderName: string;
	productName?: string;
	companyName?: string;
	productCategory?: string;
	website?: string;
	icpDescription?: string;
	targetAudience?: string;
	toneKeywords?: string[];
	brandTone?: string;
	userGoals?: string | string[];
	forbiddenPhrases?: string[];
	preferredCtaStyle?: string;
	postFormatPreference?: string;
	industry?: string;
	brandPositioning?: string;
	keyPainPoints?: string[];
	productFeatures?: string[];
	usp?: string;
	competitors?: string[];
	founderProfile?: string;
	writingPreferences?: string;
	contentPillars?: string[];
	linkedinHeadline?: string;
	// Brand recognition fields (v1.1)
	instagramHandle?: string;
	brandLogoUrl?: string;
	// Brand visual identity fields (v1.2) - stored in social_memory_items for unified access
	mobileNumber?: string;
	brandColor?: string;
	// Note: includeContactInImage is now controlled per-post on the post detail page
}

export const saveMemoryOnboarding = async (payload: MemoryOnboardingPayload) => {
	const response = await socialClient.post("/api/v1/memory/onboarding", payload);
	return response.data?.data as { keysWritten: number };
};

export const getMemoryOnboardingStatus = async (): Promise<{
	isComplete: boolean;
	profileMemoryCount: number;
	requiredKeyPresent: boolean;
}> => {
	const response = await socialClient.get("/api/v1/memory/onboarding-status");
	return response.data?.data;
};

export const getMemoryBrain = async (): Promise<MemoryBrainPayload> => {
	const response = await socialClient.get("/api/v1/memory/brain");
	return response.data?.data;
};

export const enrichMemoryFromWebsite = async (payload: {
	website?: string;
	companyName?: string;
	productName?: string;
	founderName?: string;
	linkedinHeadline?: string;
}) => {
	const response = await socialClient.post("/api/v1/memory/enrich", payload);
	return response.data?.data as {
		suggestions?: Record<
			string,
			{ value: string | string[]; confidence: number; reason: string }
		>;
		summary?: string;
		recommendedMissing?: string[];
	};
};

// -----------------------------------------------------------------------
// Memory.md & Agent.md (v1.1)
// -----------------------------------------------------------------------

export interface MemoryMarkdownResponse {
	markdown: string;
	charCount: number;
	isTruncated: boolean;
	editable?: boolean;
	pageCount?: number;
	currentPage?: number;
	metadata: {
		profileKeysCount: number;
		customKeysCount?: number;
		contactsIncluded: number;
		brandLogoUrl?: string | null;
		instagramHandle?: string | null;
		source?: string;
	};
}

export const getMemoryMarkdown = async (options?: {
	view?: "paged" | "raw";
	page?: number;
	maxChars?: number;
	maxContacts?: number;
}): Promise<MemoryMarkdownResponse> => {
	const response = await socialClient.get("/api/v1/memory/docs/memory", {
		params: options,
	});
	return response.data?.data;
};

export const saveMemoryMarkdown = async (markdown: string): Promise<{
	charCount: number;
	keysWritten: number;
	limit: number;
}> => {
	const response = await socialClient.post("/api/v1/memory/docs/memory", { markdown });
	return response.data?.data;
};

export const regenerateMemoryMarkdown = async (): Promise<{
	markdown: string;
	charCount: number;
	limit: number;
}> => {
	const response = await socialClient.post("/api/v1/memory/docs/memory/regenerate");
	return response.data?.data;
};

export interface AgentDocumentResponse {
	current: {
		id: number;
		content: string;
		version: number;
		charCount: number;
		updatedAt: string;
	};
	history: Array<{
		id: number;
		version: number;
		charCount: number;
		createdAt: string;
	}>;
	canRestore: boolean;
	template: string;
	limit: number;
}

export const getAgentDocument = async (): Promise<AgentDocumentResponse> => {
	const response = await socialClient.get("/api/v1/memory/docs/agent");
	return response.data?.data;
};

export const saveAgentDocument = async (content: string): Promise<{
	id: number;
	version: number;
	charCount: number;
	limit: number;
}> => {
	const response = await socialClient.post("/api/v1/memory/docs/agent", { content });
	return response.data?.data;
};

export const listAgentDocumentVersions = async (limit?: number): Promise<
	Array<{
		id: number;
		version: number;
		charCount: number;
		createdAt: string;
		isCurrent: boolean;
	}>
> => {
	const response = await socialClient.get("/api/v1/memory/docs/agent/versions", {
		params: { limit },
	});
	return response.data?.data;
};

export const restoreAgentDocumentVersion = async (versionId: number): Promise<{
	newVersion: number;
}> => {
	const response = await socialClient.post("/api/v1/memory/docs/agent/restore", {
		versionId,
	});
	return response.data?.data;
};

export const uploadBrandLogo = async (params: {
	file: File;
	mimeType: "image/png" | "image/jpeg" | "image/jpg" | "image/webp";
}): Promise<{ publicUrl: string; key: string }> => {
	const presignResponse = await socialClient.post("/api/v1/memory/logo/presign", {
		fileName: params.file.name || "brand-logo",
		mimeType: params.mimeType,
		fileSize: params.file.size,
	});
	const presigned = presignResponse.data?.data as {
		uploadUrl: string;
		key: string;
		publicUrl: string;
		headers?: Record<string, string>;
	};
	if (!presigned?.uploadUrl || !presigned.key) {
		throw new Error(presignResponse.data?.message || "Failed to prepare logo upload");
	}

	const putResponse = await fetch(presigned.uploadUrl, {
		method: "PUT",
		body: params.file,
		headers: presigned.headers || { "Content-Type": params.mimeType },
	});
	if (!putResponse.ok) {
		const detail = (await putResponse.text()).trim().slice(0, 240);
		throw new Error(
			detail
				? `Direct logo upload to storage failed (${putResponse.status}): ${detail}`
				: `Direct logo upload to storage failed (${putResponse.status})`
		);
	}

	const completeResponse = await socialClient.post("/api/v1/memory/logo/complete", {
		key: presigned.key,
		fileName: params.file.name || "brand-logo",
		mimeType: params.mimeType,
	});
	return completeResponse.data?.data;
};

// -----------------------------------------------------------------------
// Events (immutable ledger)
// -----------------------------------------------------------------------

export const listEvents = async (filters?: {
	limit?: number;
	offset?: number;
	eventType?: string;
	entityType?: string;
}): Promise<SocialEvent[]> => {
	const response = await socialClient.get("/api/v1/events", {
		params: filters,
	});
	return response.data?.data || [];
};

export const listEntityEvents = async (
	entityType: SocialEvent["entityType"] | string,
	entityId: number
): Promise<SocialEvent[]> => {
	const response = await socialClient.get(
		`/api/v1/events/entity/${entityType}/${entityId}`
	);
	return response.data?.data || [];
};

// -----------------------------------------------------------------------
// Settings / preferences
// -----------------------------------------------------------------------

export const getAccountPreferences = async (): Promise<AccountPreferences> => {
	const response = await socialClient.get("/api/v1/settings/preferences");
	return response.data?.data;
};

export const updateAccountPreferences = async (
	payload: Partial<AccountPreferences>
) => {
	const response = await socialClient.patch(
		"/api/v1/settings/preferences",
		payload
	);
	return response.data;
};

// -----------------------------------------------------------------------
// Telegram approval bot
// -----------------------------------------------------------------------

export const getTelegramStatus = async () => {
	const response = await socialClient.get("/api/v1/telegram/status");
	return response.data?.data as {
		linked: boolean;
		chatId: string | null;
		linkedAt: string | null;
	};
};

export const linkTelegramBot = async (params: {
	botToken: string;
	chatId?: string;
}) => {
	const response = await socialClient.post("/api/v1/telegram/link", params);
	return response.data?.data as { bot?: string; chatId: string };
};

export const unlinkTelegramBot = async () => {
	const response = await socialClient.post("/api/v1/telegram/unlink");
	return response.data;
};

// -----------------------------------------------------------------------
// WhatsApp approval channel
// -----------------------------------------------------------------------

export const getWhatsappStatus = async () => {
	const response = await socialClient.get("/api/v1/whatsapp/status");
	return response.data?.data as {
		linked: boolean;
		phone: string | null;
		linkedAt: string | null;
	};
};

export const linkWhatsapp = async (params: { phone: string }) => {
	const response = await socialClient.post("/api/v1/whatsapp/link", params);
	return response.data;
};

export const unlinkWhatsapp = async () => {
	const response = await socialClient.post("/api/v1/whatsapp/unlink");
	return response.data;
};

// -----------------------------------------------------------------------
// LinkedIn articles
// -----------------------------------------------------------------------

export const listArticles = async (filters?: {
	status?: SocialPostStatus;
	limit?: number;
}): Promise<SocialPostRun[]> => {
	const response = await socialClient.get("/api/v1/articles", {
		params: filters,
	});
	return response.data?.data || [];
};

export const generateArticleDraft = async (input: {
	topic: string;
	angle?: string;
	audience?: string;
	proofPoint?: string;
	cta?: string;
	extraInstructions?: string;
	sourceUrl?: string;
	postRunId?: number;
}) => {
	try {
		const response = await socialClient.post("/api/v1/articles/generate", input);
		if (!response.data?.success) {
			throw new Error(response.data?.message || "Article generation failed");
		}
		return response.data?.data as {
			title: string;
			description: string;
			bodyHtml: string;
			commentary: string;
			coverImagePrompt: string;
			coverImagePromptExternal: string;
			sourceUrl: string;
			plannedSourceUrl?: string;
			usedFallback?: boolean;
			modelUsed?: string;
		};
	} catch (error) {
		throw new Error(getSocialApiErrorMessage(error, "Article generation failed"));
	}
};

export const saveArticle = async (payload: {
	topic?: string;
	articleMeta: ArticleMeta;
}) => {
	try {
		const response = await socialClient.post("/api/v1/articles", payload);
		if (!response.data?.success) {
			throw new Error(response.data?.message || "Failed to save article");
		}
		return response.data?.data as { postRunId: number };
	} catch (error) {
		throw new Error(getSocialApiErrorMessage(error, "Failed to save article"));
	}
};

export const updateArticle = async (
	id: number,
	payload: { topic?: string; articleMeta: ArticleMeta }
) => {
	try {
		const response = await socialClient.patch(`/api/v1/articles/${id}`, payload);
		if (!response.data?.success) {
			throw new Error(response.data?.message || "Failed to update article");
		}
		return response.data;
	} catch (error) {
		throw new Error(getSocialApiErrorMessage(error, "Failed to update article"));
	}
};

export const generateArticleCoverImage = async (payload: {
	postRunId?: number;
	prompt?: string;
	autoPrompt?: boolean;
	imageStyle?: "professional" | "classic" | "modern" | "minimal" | "bold";
}) => {
	try {
		const response = await socialClient.post("/api/v1/articles/cover-image", payload);
		if (!response.data?.success) {
			throw new Error(response.data?.message || "Cover image failed");
		}
		return response.data?.data as { publicUrl: string; prompt: string };
	} catch (error) {
		throw new Error(getSocialApiErrorMessage(error, "Cover image failed"));
	}
};

export const publishArticleLive = async (id: number) => {
	try {
		const response = await socialClient.post(`/api/v1/articles/${id}/publish-live`);
		if (!response.data?.success) {
			throw new Error(response.data?.message || "Publish failed");
		}
		return response.data?.data as {
			hostedUrl: string;
			hostedAt: string;
			hostedS3Key?: string;
		};
	} catch (error) {
		throw new Error(getSocialApiErrorMessage(error, "Publish failed"));
	}
};

export const publishArticleFeed = async (id: number) => {
	try {
		const response = await socialClient.post(`/api/v1/articles/${id}/publish-feed`, {
			shareOnFeed: true,
		});
		if (!response.data?.success) {
			throw new Error(response.data?.message || "Feed post failed");
		}
		return response.data?.data as {
			postUrn?: string;
			linkedinPostUrl?: string;
		};
	} catch (error) {
		throw new Error(getSocialApiErrorMessage(error, "Feed post failed"));
	}
};

/** @deprecated use publishArticleLive + publishArticleFeed */
export const publishArticle = publishArticleFeed;

export const scheduleArticle = async (
	id: number,
	scheduledFor: string,
	options?: { shareOnFeed?: boolean }
) => {
	try {
		const response = await socialClient.post(`/api/v1/articles/${id}/schedule`, {
			scheduledFor,
			shareOnFeed: options?.shareOnFeed,
		});
		if (!response.data?.success) {
			throw new Error(response.data?.message || "Schedule failed");
		}
		return response.data?.data as {
			scheduledFor: string;
			rescheduled?: boolean;
			shiftedDays?: number;
		};
	} catch (error) {
		throw new Error(getSocialApiErrorMessage(error, "Schedule failed"));
	}
};

// -----------------------------------------------------------------------
// Raw thoughts (brain dump → post pipeline)
// -----------------------------------------------------------------------

export interface RawThoughtResult {
	thoughtId: number;
	detectedPriority: string;
	freshnessScore: number;
	humanizerLevel?: HumanizerLevel;
	generatedPosts: Array<{
		postRunId: number;
		format: string;
		preview: string;
		scheduledFor?: string | null;
		queueAction?: string;
	}>;
}

export interface RawThought {
	id: number;
	userId: number;
	rawInput: string;
	detectedCategory: string | null;
	detectedPriority: string | null;
	emotionalIntensity: number | null;
	generatedPostRunIds: number[] | null;
	status: string;
	createdAt: string;
}

export const submitRawThought = async (
	rawInput: string,
	options?: { humanizerLevel?: HumanizerLevel }
): Promise<RawThoughtResult> => {
	const response = await socialClient.post("/api/v1/raw-thoughts", {
		rawInput,
		humanizerLevel: options?.humanizerLevel,
	});
	return response.data?.data;
};

export const listRawThoughts = async (
	limit = 20
): Promise<RawThought[]> => {
	const response = await socialClient.get("/api/v1/raw-thoughts", {
		params: { limit },
	});
	return response.data?.data || [];
};
