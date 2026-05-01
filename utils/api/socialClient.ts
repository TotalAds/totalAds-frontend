"use client";

import axios, { AxiosError } from "axios";

import { refreshAccessToken } from "../auth/refreshAccessToken";
import { tokenStorage } from "../auth/tokenStorage";
import apiClient from "./apiClient";

const SOCIAL_SERVICE_URL =
	process.env.NEXT_PUBLIC_SOCIAL_SERVICE_URL || "http://localhost:3005";
const SOCIAL_ACCESS_KEY_STORAGE_KEY = "social-service-access-key";

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

const getSocialAccessKey = () => {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(SOCIAL_ACCESS_KEY_STORAGE_KEY);
};

const setSocialAccessKey = (value: string | null) => {
	if (typeof window === "undefined") return;
	if (value) window.localStorage.setItem(SOCIAL_ACCESS_KEY_STORAGE_KEY, value);
	else window.localStorage.removeItem(SOCIAL_ACCESS_KEY_STORAGE_KEY);
};

socialClient.interceptors.request.use(
	(config) => {
		const accessToken = tokenStorage.getAccessToken();
		const socialAccessKey = getSocialAccessKey();
		if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
		if (socialAccessKey) {
			config.headers["X-Social-Access-Key"] = socialAccessKey;
		}
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
	desktopAgentEnabled: boolean;
	linkedinConnected: boolean;
	commentsApprovalMode: boolean;
	accessKey: string | null;
	linkedinExternalUrl: string;
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
}

export interface AgentRunOutput {
	agentRunId: string;
	postRunId: number;
	status: "draft" | "in_review" | "approved" | "failed";
	draft: AgentDraft;
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
	agentRunId: string | null;
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
}

export interface SocialMediaAsset {
	id: number;
	userId: number;
	postRunId: number | null;
	assetType: "single_image" | "carousel_pdf";
	provider: string;
	providerAssetId: string | null;
	sourcePrompt: string | null;
	publicUrl: string | null;
	status: "pending" | "processing" | "ready" | "failed";
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
	if (payload?.accessKey) setSocialAccessKey(payload.accessKey);
	return payload;
};

export const enableSocialAccess = async (enableDesktopAgent = false) => {
	const response = await apiClient.post("/social/access/enable", {
		enableDesktopAgent,
	});
	const payload = response.data?.payload || response.data;
	if (payload?.accessKey) setSocialAccessKey(payload.accessKey);
	return payload;
};

export const disableSocialAccess = async () => {
	const response = await apiClient.post("/social/access/disable");
	return response.data?.payload || response.data;
};

export const rotateSocialAccessKey = async () => {
	const response = await apiClient.post("/social/access/rotate-key");
	const payload = response.data?.payload || response.data;
	if (payload?.accessKey) setSocialAccessKey(payload.accessKey);
	return payload;
};

export const updateSocialSettings = async (settings: {
	desktopAgentEnabled?: boolean;
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
	angle?: string;
	audience?: string;
	proofPoint?: string;
	cta?: string;
	seriesName?: string;
	extraInstructions?: string;
	scheduledFor?: string;
	campaignId?: number | null;
	createImage?: boolean;
	createCarousel?: boolean;
}): Promise<AgentRunOutput> => {
	const response = await socialClient.post("/api/v1/agent/run", input);
	return response.data?.data;
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

export const schedulePost = async (id: number, scheduledFor: string) => {
	const response = await socialClient.post(`/api/v1/posts/${id}/schedule`, {
		scheduledFor,
	});
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
}): Promise<CopilotBriefResponse> => {
	const response = await socialClient.post("/api/v1/calendar/copilot/brief", input);
	return response.data?.data;
};

export const generateLinkedinCalendar = async (
	input: GenerateLinkedinCalendarInput
): Promise<GeneratedLinkedinCalendar> => {
	const response = await socialClient.post("/api/v1/calendar/generate", input);
	return response.data?.data;
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

export const uploadSocialEditorImage = async (payload: {
	postRunId?: number;
	fileName: string;
	mimeType: "image/png" | "image/jpeg" | "image/jpg" | "image/webp" | "image/gif";
	dataBase64: string;
}) => {
	const response = await socialClient.post("/api/v1/media/upload", payload);
	return response.data?.data as SocialMediaAsset;
};

export const listMediaAssets = async () => {
	const response = await socialClient.get("/api/v1/media/assets");
	return (response.data?.data || []) as SocialMediaAsset[];
};

export const listPostMediaAssets = async (postRunId: number) => {
	const response = await socialClient.get(`/api/v1/media/assets/${postRunId}`);
	return (response.data?.data || []) as SocialMediaAsset[];
};

// -----------------------------------------------------------------------
// Memory (profile / work / learning)
// -----------------------------------------------------------------------

export const getProfileMemory = async (): Promise<MemoryItem[]> => {
	const response = await socialClient.get("/api/v1/memory/profile");
	return response.data?.data || [];
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

export const saveMemoryOnboarding = async (payload: {
	founderName: string;
	productName?: string;
	icpDescription?: string;
	toneKeywords?: string[];
	forbiddenPhrases?: string[];
	preferredCtaStyle?: string;
	postFormatPreference?: string;
	linkedinHeadline?: string;
}) => {
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
