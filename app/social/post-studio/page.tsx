"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { PostPreview } from "@/components/social/PostPreview";
import { LinkedinPostCharLimit } from "@/components/social/LinkedinPostCharLimit";
import { LinkedinTextEditor } from "@/components/social/LinkedinTextEditor";
import {
	EmptyState,
	InlineAlert,
	MetaRow,
	PageHeader,
	PageShell,
	PrimaryButton,
	SecondaryButton,
	PostGenerationChips,
	SectionTitle,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	AgentDraft,
	AgentRunOutput,
	approvePost,
	createManualPost,
	getFormatRecommendation,
	getSocialAccess,
	listPosts,
	publishPostNow,
	rejectPost,
	runAgent,
	schedulePost,
	SocialPostRun,
	uploadSocialEditorImage,
} from "@/utils/api/socialClient";
import { resolveSocialMediaDisplayUrl } from "@/utils/social/mediaUrl";
import { getLinkedinPostLengthError, isLinkedinPostOverLimit } from "@/utils/social/linkedinPostLimits";
import {
	IconCalendarTime,
	IconBrandLinkedin,
	IconBulb,
	IconChevronRight,
	IconDeviceLaptop,
	IconPlayerPlay,
	IconRotateClockwise,
	IconSend,
	IconSparkles,
} from "@tabler/icons-react";

type TextBriefField =
	| "topic"
	| "proofPoint"
	| "cta"
	| "seriesName"
	| "extraInstructions";

const ANGLE_OPTIONS = [
	"Contrarian",
	"Story",
	"Breakdown",
	"How-to",
	"Listicle",
	"Case Study",
] as const;

const AUDIENCE_OPTIONS = [
	"Founders",
	"VPs",
	"Marketers",
	"Operators",
	"Investors",
] as const;

const splitBriefTokens = (raw: string): string[] =>
	raw
		.split(/[,;\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

const dedupeBrief = (items: string[]): string[] => {
	const out: string[] = [];
	for (const item of items) {
		if (!out.includes(item)) out.push(item);
	}
	return out;
};

export default function SocialPostStudioPage() {
	const [flow, setFlow] = useState<"ai" | "manual">("ai");
	const [form, setForm] = useState({
		topic: "",
		proofPoint: "",
		cta: "",
		seriesName: "",
		extraInstructions: "",
		createImage: false,
	});
	const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
	const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
	const [showCustomAngle, setShowCustomAngle] = useState(false);
	const [showCustomAudience, setShowCustomAudience] = useState(false);
	const [customAngleText, setCustomAngleText] = useState("");
	const [customAudienceText, setCustomAudienceText] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [latestRun, setLatestRun] = useState<AgentRunOutput | null>(null);
	const [drafts, setDrafts] = useState<SocialPostRun[]>([]);
	const [isBusy, setIsBusy] = useState<number | null>(null);
	const [manualBody, setManualBody] = useState("");
	const [manualHashtagInput, setManualHashtagInput] = useState("");
	const [manualMediaUrls, setManualMediaUrls] = useState<string[]>([]);
	const [manualTopic, setManualTopic] = useState("");
	const [manualScheduleFor, setManualScheduleFor] = useState("");
	const [imageGenerationEnabled, setImageGenerationEnabled] = useState(true);
	const [manualBusy, setManualBusy] = useState<"save" | "schedule" | "post_now" | null>(
		null
	);
	const [formatPreview, setFormatPreview] = useState<{
		selectedLabel: string;
		formatConfidenceScore: number;
		reasoning: string;
		recommendations: Array<{ label: string; score: number; reason: string }>;
	} | null>(null);

	const loadDrafts = async () => {
		try {
			const [draftPosts, reviewPosts] = await Promise.all([
				listPosts({ status: "draft", limit: 20 }),
				listPosts({ status: "in_review", limit: 20 }),
			]);
			setDrafts([...reviewPosts, ...draftPosts]);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to load drafts"
			);
		}
	};

	useEffect(() => {
		loadDrafts();
		(async () => {
			try {
				const access = await getSocialAccess();
				setImageGenerationEnabled(
					access.linkedinImageGenerationEnabled !== false
				);
			} catch {
				setImageGenerationEnabled(true);
			}
		})();
	}, []);

	useEffect(() => {
		if (!imageGenerationEnabled && form.createImage) {
			setForm((prev) => ({ ...prev, createImage: false }));
		}
	}, [imageGenerationEnabled, form.createImage]);

	const set = (field: TextBriefField, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const setMedia = (field: "createImage", value: boolean) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const onGenerate = async () => {
		if (form.topic.trim().length < 3) {
			toast.error("Topic must be at least 3 characters");
			return;
		}
		const customAngles = splitBriefTokens(customAngleText);
		const customAudiences = splitBriefTokens(customAudienceText);
		const angles = dedupeBrief([
			...selectedAngles,
			...customAngles,
		]);
		const audiences = dedupeBrief([
			...selectedAudiences,
			...customAudiences,
		]);
		try {
			setIsGenerating(true);
			setLatestRun(null);
			const run = await runAgent({
				topic: form.topic.trim(),
				angles: angles.length ? angles : undefined,
				audiences: audiences.length ? audiences : undefined,
				proofPoint: form.proofPoint || undefined,
				cta: form.cta || undefined,
				seriesName: form.seriesName || undefined,
				extraInstructions: form.extraInstructions || undefined,
				createImage: imageGenerationEnabled ? form.createImage : false,
				createCarousel: false,
			});
			setLatestRun(run);
			setFormatPreview(
				run.formatIntelligence
					? {
							selectedLabel: run.formatIntelligence.selectedFormat,
							formatConfidenceScore: run.formatIntelligence.formatConfidenceScore,
							reasoning: run.formatIntelligence.reasoning,
							recommendations: run.formatIntelligence.recommendations.map((r) => ({
								label: r.label,
								score: r.score,
								reason: r.reason,
							})),
						}
					: null
			);
			toast.success("Draft generated");
			await loadDrafts();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to generate draft"
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const approveLatest = async (postNow = false) => {
		if (!latestRun) return;
		const lengthError = getLinkedinPostLengthError(latestRun.draft.body.trim().length);
		if (lengthError) {
			toast.error(lengthError);
			return;
		}
		try {
			setIsBusy(latestRun.postRunId);
			await approvePost(latestRun.postRunId, { postNow });
			toast.success(
				postNow ? "Approved and publishing now" : "Approved and scheduled"
			);
			setLatestRun(null);
			await loadDrafts();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Approval failed"
			);
		} finally {
			setIsBusy(null);
		}
	};

	const rejectLatest = async () => {
		if (!latestRun) return;
		try {
			setIsBusy(latestRun.postRunId);
			await rejectPost(latestRun.postRunId, "rejected_from_studio");
			toast.success("Draft rejected");
			setLatestRun(null);
			await loadDrafts();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Rejection failed"
			);
		} finally {
			setIsBusy(null);
		}
	};

	// Mirrors the backend merge so we can warn before sending the request.
	// We use \w+ here because parseHashtagInput strips non-ASCII anyway, so
	// this matches what the server will ultimately persist.
	const manualMergedHashtags = useMemo(() => {
		const fromInput = parseHashtagInput(manualHashtagInput || manualBody);
		const fromBody = Array.from(
			manualBody.matchAll(/(^|\s)#(\w+)/g)
		).map((match) => match[2]);
		return Array.from(new Set([...fromInput, ...fromBody]));
	}, [manualBody, manualHashtagInput]);
	const manualHashtagLimitExceeded =
		manualMergedHashtags.length > MAX_LINKEDIN_HASHTAGS;
	const manualBodyLength = manualBody.trim().length;
	const manualBodyLengthError = getLinkedinPostLengthError(manualBodyLength);
	const manualBodyOverLimit = Boolean(manualBodyLengthError);

	const createManualDraft = async () => {
		if (manualBody.trim().length < 10) {
			toast.error("Write at least 10 characters");
			return null;
		}
		if (manualBodyLengthError) {
			toast.error(manualBodyLengthError);
			return null;
		}
		if (manualHashtagLimitExceeded) {
			toast.error(
				`You can use at most ${MAX_LINKEDIN_HASHTAGS} LinkedIn tags. Remove ${
					manualMergedHashtags.length - MAX_LINKEDIN_HASHTAGS
				} to continue.`
			);
			return null;
		}
		const created = await createManualPost({
			contentBody: manualBody.trim(),
			topic: manualTopic.trim() || undefined,
			hashtags: parseHashtagInput(manualHashtagInput || manualBody),
			mediaUrls: manualMediaUrls,
		});
		await loadDrafts();
		return created.postRunId;
	};

	const onManualSave = async () => {
		try {
			setManualBusy("save");
			const id = await createManualDraft();
			if (!id) return;
			toast.success("Draft saved");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save draft");
		} finally {
			setManualBusy(null);
		}
	};

	const onManualSchedule = async () => {
		if (!manualScheduleFor) {
			toast.error("Select date and time first");
			return;
		}
		try {
			setManualBusy("schedule");
			const id = await createManualDraft();
			if (!id) return;
			const response = await schedulePost(id, new Date(manualScheduleFor).toISOString());
			const payload = response?.data;
			if (payload?.rescheduled) {
				toast.success(
					`Post rescheduled to ${new Date(payload.scheduledFor).toLocaleString()} due to daily limit`
				);
			} else {
				toast.success("Post scheduled");
			}
			setManualBody("");
			setManualHashtagInput("");
			setManualMediaUrls([]);
			setManualTopic("");
			setManualScheduleFor("");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to schedule");
		} finally {
			setManualBusy(null);
		}
	};

	const onManualPostNow = async () => {
		try {
			setManualBusy("post_now");
			const id = await createManualDraft();
			if (!id) return;
			await publishPostNow(id);
			toast.success("Posting now");
			setManualBody("");
			setManualHashtagInput("");
			setManualMediaUrls([]);
			setManualTopic("");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to post now");
		} finally {
			setManualBusy(null);
		}
	};

	return (
		<PageShell>
			<PageHeader
				eyebrow="Post Studio"
				title="Create your LinkedIn post"
				description="Use AI Post Builder or write your own post in a LinkedIn-style studio and schedule directly."
				actions={
					<Link href="/social/memory">
						<SecondaryButton>
							<IconBulb className="h-4 w-4" />
							Tune memory
						</SecondaryButton>
					</Link>
				}
			/>

			<div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
				<button
					type="button"
					onClick={() => setFlow("ai")}
					className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
						flow === "ai"
							? "bg-blue-600 text-white shadow-sm"
							: "text-slate-600 hover:bg-slate-100"
					}`}
				>
					<IconSparkles className="h-4 w-4" />
					AI Post Builder
				</button>
				<button
					type="button"
					onClick={() => setFlow("manual")}
					className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
						flow === "manual"
							? "bg-blue-600 text-white shadow-sm"
							: "text-slate-600 hover:bg-slate-100"
					}`}
				>
					<IconDeviceLaptop className="h-4 w-4" />
					Write Your Own Post
				</button>
			</div>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
				{flow === "ai" ? (
					<SurfaceCard className="lg:col-span-5">
						<SectionTitle
							title="Brief"
							description="Fields marked optional are used only when provided. Topic is the only required input."
						/>
						<div className="grid grid-cols-1 gap-4">
							<Field
								label="Topic"
								required
								value={form.topic}
								onChange={(v) => set("topic", v)}
								placeholder="e.g. Why CPM is a vanity metric in D2C Meta ads"
							/>
							<div>
								<label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
									Angle
								</label>
								<p className="mb-2 text-xs text-slate-500">
									Select one or more angles. Custom entries can be comma-separated.
								</p>
								<div className="flex flex-wrap gap-2">
									{ANGLE_OPTIONS.map((option) => (
										<Chip
											key={option}
											active={selectedAngles.includes(option)}
											onClick={() => {
												setSelectedAngles((prev) =>
													prev.includes(option)
														? prev.filter((item) => item !== option)
														: [...prev, option]
												);
											}}
										>
											{option}
										</Chip>
									))}
									<Chip
										active={showCustomAngle}
										onClick={() => setShowCustomAngle((v) => !v)}
									>
										+ Custom
									</Chip>
								</div>
								{showCustomAngle && (
									<input
										value={customAngleText}
										onChange={(event) => setCustomAngleText(event.target.value)}
										placeholder="e.g. Lessons from a failed launch, or comma-separated list"
										className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
									/>
								)}
							</div>

							<div>
								<label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
									Audience
								</label>
								<p className="mb-2 text-xs text-slate-500">
									Select one or more audiences. Custom entries can be comma-separated.
								</p>
								<div className="flex flex-wrap gap-2">
									{AUDIENCE_OPTIONS.map((option) => (
										<Chip
											key={option}
											active={selectedAudiences.includes(option)}
											onClick={() => {
												setSelectedAudiences((prev) =>
													prev.includes(option)
														? prev.filter((item) => item !== option)
														: [...prev, option]
												);
											}}
										>
											{option}
										</Chip>
									))}
									<Chip
										active={showCustomAudience}
										onClick={() => setShowCustomAudience((v) => !v)}
									>
										+ Custom
									</Chip>
								</div>
								{showCustomAudience && (
									<input
										value={customAudienceText}
										onChange={(event) => setCustomAudienceText(event.target.value)}
										placeholder="e.g. RevOps leaders, or comma-separated list"
										className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
									/>
								)}
							</div>

							<div className="max-w-md">
								<label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
									CTA style
								</label>
								<div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
									<SegmentButton
										active={!form.cta || form.cta === "None"}
										onClick={() => set("cta", "None")}
									>
										None
									</SegmentButton>
									<SegmentButton
										active={form.cta === "Soft"}
										onClick={() => set("cta", "Soft")}
									>
										Soft
									</SegmentButton>
									<SegmentButton
										active={form.cta === "Direct"}
										onClick={() => set("cta", "Direct")}
									>
										Direct
									</SegmentButton>
								</div>
							</div>

							<div>
								<button
									type="button"
									onClick={() => setShowAdvanced((prev) => !prev)}
									className="text-sm font-medium text-blue-600 hover:text-blue-700"
								>
									{showAdvanced ? "Hide advanced" : "+ Advanced"}
								</button>
								{showAdvanced && (
									<Field
										label="Extra instructions"
										optional
										multiline
										value={form.extraInstructions}
										onChange={(v) => set("extraInstructions", v)}
										placeholder="Tone, references, forbidden words, series name, proof points..."
									/>
								)}
							</div>

							<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
								<div className="mb-3">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
										Creative assets
									</p>
									<p className="mt-1 text-xs text-slate-500">
										Optional. Create media while this draft is being generated.
									</p>
								</div>
								<div className="grid grid-cols-1 gap-3">
									{imageGenerationEnabled && (
										<MediaOption
											title="Create LinkedIn image"
											description="Generate a professional feed image with the draft."
											checked={form.createImage}
											onChange={(checked) => setMedia("createImage", checked)}
										/>
									)}
								</div>
							</div>
						</div>
						<div className="mt-5 flex flex-wrap items-center justify-end gap-2">
								<SecondaryButton
									onClick={async () => {
										try {
											const rec = await getFormatRecommendation({
												topic: form.topic.trim(),
												angles: selectedAngles,
												audiences: selectedAudiences,
												cta: form.cta || undefined,
												extraInstructions: form.extraInstructions || undefined,
											});
											setFormatPreview({
												selectedLabel: rec.selectedLabel,
												formatConfidenceScore: rec.formatConfidenceScore,
												reasoning: rec.reasoning,
												recommendations: rec.recommendations.map((r) => ({
													label: r.label,
													score: r.score,
													reason: r.reason,
												})),
											});
										} catch (err) {
											toast.error(
												err instanceof Error
													? err.message
													: "Failed to preview format recommendation"
											);
										}
									}}
									disabled={!form.topic.trim()}
								>
									Preview format recommendation
								</SecondaryButton>
							<PrimaryButton onClick={onGenerate} disabled={isGenerating}>
								{isGenerating ? (
									<>
										<IconRotateClockwise className="h-4 w-4 animate-spin" />
										Drafting…
									</>
								) : (
									<>
										<IconSparkles className="h-4 w-4" />
										Draft post
									</>
								)}
							</PrimaryButton>
							{latestRun && (
								<SecondaryButton onClick={() => setLatestRun(null)}>
									Clear preview
								</SecondaryButton>
							)}
						</div>
						{formatPreview ? (
							<div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
								<p className="font-semibold">
									Recommended format: {formatPreview.selectedLabel} (
									{Math.round(formatPreview.formatConfidenceScore * 100)}%)
								</p>
								<p className="mt-1 text-xs">{formatPreview.reasoning}</p>
							</div>
						) : null}
					</SurfaceCard>
				) : (
					<SurfaceCard className="lg:col-span-5">
						<SectionTitle
							title="LinkedIn-style composer"
							description="Write your own post, preview it in real-time, then save, schedule, or post now."
						/>
						<LinkedinStudioEditor
							body={manualBody}
							onBodyChange={setManualBody}
							hashtagInput={manualHashtagInput}
							onHashtagInputChange={setManualHashtagInput}
							hashtagCount={manualMergedHashtags.length}
							hashtagLimitExceeded={manualHashtagLimitExceeded}
							bodyOverLimit={manualBodyOverLimit}
							mediaUrls={manualMediaUrls}
							onMediaUrlsChange={setManualMediaUrls}
							topic={manualTopic}
							onTopicChange={setManualTopic}
							scheduleFor={manualScheduleFor}
							onScheduleForChange={setManualScheduleFor}
							onSave={onManualSave}
							onSchedule={onManualSchedule}
							onPostNow={onManualPostNow}
							busy={manualBusy}
							onUploadImage={async (file) => {
								const uploaded = await uploadSocialEditorImage({
									file,
									mimeType: file.type as any,
								});
								return uploaded.publicUrl || "";
							}}
						/>
					</SurfaceCard>
				)}

				{flow === "ai" && (
					<SurfaceCard className="lg:col-span-5">
						<SectionTitle
							title="How the agent writes"
							description="Quick context used for each AI-generated draft."
						/>
						<div className="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-3">
							<p>
								<span className="font-medium text-slate-800">Profile memory</span>:
								founder voice, tone, and forbidden phrases.
							</p>
							<p>
								<span className="font-medium text-slate-800">Work memory</span>:
								current campaign and active narrative.
							</p>
							<p>
								<span className="font-medium text-slate-800">Learning rules</span>:
								patterns from your best-performing posts.
							</p>
						</div>
					</SurfaceCard>
				)}
			</div>

			{latestRun && <LatestRunPanel
				run={latestRun}
				busy={isBusy === latestRun.postRunId}
				onApproveSchedule={() => approveLatest(false)}
				onApproveNow={() => approveLatest(true)}
				onReject={rejectLatest}
			/>}

			<SurfaceCard>
				<SectionTitle
					title="Drafts + awaiting approval"
					description="Every post still in the pipeline. Jump into any to edit or approve."
					action={
						<Link
							href="/social/posts"
							className="text-xs font-semibold text-blue-600 hover:text-blue-700"
						>
							All posts →
						</Link>
					}
				/>
				{drafts.length === 0 ? (
					<EmptyState
						icon={<IconSparkles className="h-5 w-5" />}
						title="No drafts yet"
						description="Your generated drafts will live here until they're approved, scheduled or published."
					/>
				) : (
					<ul className="divide-y divide-slate-100">
						{drafts.map((draft) => (
							<li key={draft.id} className="py-3">
								<Link
									href={`/social/posts/${draft.id}`}
									className="flex items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-slate-50"
								>
									<div className="min-w-0 flex-1">
										<p className="line-clamp-1 text-sm font-medium text-slate-800">
											{draft.hookText || draft.topic || draft.contentBody.slice(0, 100)}
										</p>
										<MetaRow
											items={[
												{
													label: "Status",
													value: <StatusPill status={draft.status} />,
												},
												{
													label: "Created",
													value: new Date(draft.createdAt).toLocaleString(),
												},
												draft.userEditedBody
													? {
															label: "Edited",
															value: "By you",
														}
													: null,
											].filter(Boolean) as any}
										/>
										<div className="mt-2">
											<PostGenerationChips post={draft} />
										</div>
									</div>
									<IconChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
								</Link>
							</li>
						))}
					</ul>
				)}
			</SurfaceCard>
		</PageShell>
	);
}

function Chip({
	children,
	active,
	onClick,
}: {
	children: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
				active
					? "border-blue-600 bg-blue-600 text-white"
					: "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
			}`}
		>
			{children}
		</button>
	);
}

function SegmentButton({
	children,
	active,
	onClick,
}: {
	children: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
				active
					? "bg-blue-600 text-white"
					: "text-slate-600 hover:bg-slate-100"
			}`}
		>
			{children}
		</button>
	);
}

function LinkedinStudioEditor({
	body,
	onBodyChange,
	hashtagInput,
	onHashtagInputChange,
	hashtagCount,
	hashtagLimitExceeded,
	bodyOverLimit,
	mediaUrls,
	onMediaUrlsChange,
	topic,
	onTopicChange,
	scheduleFor,
	onScheduleForChange,
	onSave,
	onSchedule,
	onPostNow,
	busy,
	onUploadImage,
}: {
	body: string;
	onBodyChange: (v: string) => void;
	hashtagInput: string;
	onHashtagInputChange: (v: string) => void;
	hashtagCount: number;
	hashtagLimitExceeded: boolean;
	bodyOverLimit: boolean;
	mediaUrls: string[];
	onMediaUrlsChange: (urls: string[]) => void;
	topic: string;
	onTopicChange: (v: string) => void;
	scheduleFor: string;
	onScheduleForChange: (v: string) => void;
	onSave: () => void;
	onSchedule: () => void;
	onPostNow: () => void;
	busy: "save" | "schedule" | "post_now" | null;
	onUploadImage: (file: File) => Promise<string>;
}) {
	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
			<div className="grid grid-cols-1 lg:grid-cols-2">
				<div className="border-r border-slate-200">
					<div className="space-y-3 p-4">
						<input
							value={topic}
							onChange={(event) => onTopicChange(event.target.value)}
							placeholder="Post topic (optional)"
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						/>
						<LinkedinTextEditor
							value={body}
							onChange={onBodyChange}
							placeholder="Write here..."
							rows={12}
							onUploadImage={onUploadImage}
							showImageTool={false}
							insertUploadedImageUrl={false}
							onImageUploaded={(url) => {
								onMediaUrlsChange(
									mediaUrls.includes(url) ? mediaUrls : [...mediaUrls, url]
								);
							}}
						/>
						<label className="block">
							<div className="mb-1 flex items-center justify-between">
								<span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
									LinkedIn tags
								</span>
								<span
									className={`text-[11px] font-medium ${
										hashtagLimitExceeded ? "text-red-600" : "text-slate-500"
									}`}
								>
									{hashtagCount}/{MAX_LINKEDIN_HASHTAGS}
								</span>
							</div>
							<input
								value={hashtagInput}
								onChange={(e) => onHashtagInputChange(e.target.value)}
								placeholder="growth, saas, founderjourney"
								className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
									hashtagLimitExceeded
										? "border-red-300 focus:border-red-400 focus:ring-red-100"
										: "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
								}`}
							/>
							<p
								className={`mt-1 text-[11px] ${
									hashtagLimitExceeded ? "text-red-600" : "text-slate-500"
								}`}
							>
								{hashtagLimitExceeded
									? `Too many tags. Remove ${
											hashtagCount - MAX_LINKEDIN_HASHTAGS
										} to stay within the ${MAX_LINKEDIN_HASHTAGS}-tag limit (inline #tags in the body count too).`
									: `Up to ${MAX_LINKEDIN_HASHTAGS} tags total. Inline #tags in the body count toward this limit.`}
							</p>
						</label>
						<div>
							<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
								Assets (image, video, carousel)
							</p>
							<input
								type="file"
								accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/quicktime,video/webm,application/pdf"
								multiple
								onChange={async (e) => {
									const files = Array.from(e.target.files || []);
									for (const file of files) {
										const supportedMime = normalizeUploadMime(file);
										if (!supportedMime) {
											toast.error(`${file.name}: unsupported file type`);
											continue;
										}
										try {
											const uploaded = await onUploadImage(file);
											if (uploaded) {
												onMediaUrlsChange(
													mediaUrls.includes(uploaded)
														? mediaUrls
														: [...mediaUrls, uploaded]
												);
											}
										} catch (err) {
											toast.error(
												err instanceof Error
													? err.message
													: `Failed to upload ${file.name}`
											);
										}
									}
									e.currentTarget.value = "";
								}}
								className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
							/>
						</div>
						{mediaUrls.length > 0 && (
							<div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
								<p className="mb-2 text-xs font-medium text-slate-500">
									Attached media ({mediaUrls.length})
								</p>
								<div className="grid grid-cols-3 gap-2">
									{mediaUrls.map((url) => (
										<div key={url} className="relative">
											{getAssetKind(url) === "image" ? (
												<img
													src={resolveSocialMediaDisplayUrl(url)}
													alt="Attached media"
													className="h-20 w-full rounded-md border border-slate-200 object-cover"
												/>
											) : getAssetKind(url) === "video" ? (
												<video
													src={resolveSocialMediaDisplayUrl(url)}
													className="h-20 w-full rounded-md border border-slate-200 object-cover"
													controls
												/>
											) : getAssetKind(url) === "pdf" ? (
												<iframe
													title="Attached pdf"
													src={`${resolveSocialMediaDisplayUrl(url)}#page=1&view=FitH`}
													className="h-20 w-full rounded-md border border-slate-200"
												/>
											) : (
												<div className="flex h-20 w-full items-center justify-center rounded-md border border-slate-200 bg-white text-[10px] text-slate-500">
													Asset
												</div>
											)}
											<button
												type="button"
												onClick={() =>
													onMediaUrlsChange(mediaUrls.filter((item) => item !== url))
												}
												className="absolute right-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white"
											>
												Remove
											</button>
										</div>
									))}
								</div>
							</div>
						)}
						<LinkedinPostCharLimit charCount={body.trim().length} className="mt-1" />
					</div>
					<div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
						<SecondaryButton
							onClick={onSave}
							disabled={busy !== null || hashtagLimitExceeded || bodyOverLimit}
						>
							{busy === "save" ? (
								<IconRotateClockwise className="h-4 w-4 animate-spin" />
							) : null}
							Save draft
						</SecondaryButton>
						<input
							type="datetime-local"
							value={scheduleFor}
							onChange={(event) => onScheduleForChange(event.target.value)}
							className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						/>
						<PrimaryButton
							onClick={onSchedule}
							disabled={busy !== null || hashtagLimitExceeded || bodyOverLimit}
						>
							{busy === "schedule" ? (
								<IconRotateClockwise className="h-4 w-4 animate-spin" />
							) : (
								<IconCalendarTime className="h-4 w-4" />
							)}
							Schedule
						</PrimaryButton>
						<SecondaryButton
							onClick={onPostNow}
							disabled={busy !== null || hashtagLimitExceeded || bodyOverLimit}
						>
							{busy === "post_now" ? (
								<IconRotateClockwise className="h-4 w-4 animate-spin" />
							) : (
								<IconSend className="h-4 w-4" />
							)}
							Post now
						</SecondaryButton>
					</div>
				</div>
				<div className="bg-slate-50 p-4">
					<div className="mb-3 flex items-center justify-between">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
							Post Preview
						</p>
						<IconPlayerPlay className="h-4 w-4 text-slate-400" />
					</div>
					<PostPreview
						body={body || "Start writing and your post will appear here..."}
						mediaUrls={mediaUrls}
					/>
				</div>
			</div>
		</div>
	);
}

const extractHashtags = (input: string) =>
	input
		.split(/\s+/)
		.filter((token) => token.startsWith("#") && token.length > 1)
		.map((token) => token.slice(1).trim())
		.map((tag) => tag.replace(/[^A-Za-z0-9_]/g, ""))
		.filter(Boolean);

/**
 * Mirrors the backend cap in totalads-social-service/src/routes/posts.ts so
 * the UI can preempt 422s before sending the request.
 */
const MAX_LINKEDIN_HASHTAGS = 10;

const parseHashtagInput = (input: string): string[] =>
	Array.from(
		new Set(
			input
				.split(/[,\s\n]+/)
				.map((token) => token.trim().replace(/^#/, ""))
				.map((tag) => tag.replace(/[^A-Za-z0-9_]/g, ""))
				.filter(Boolean)
		)
	);

const normalizeUploadMime = (
	file: File
):
	| "image/png"
	| "image/jpeg"
	| "image/jpg"
	| "image/webp"
	| "image/gif"
	| "video/mp4"
	| "video/quicktime"
	| "video/webm"
	| "application/pdf"
	| null => {
	const mime = String(file.type || "").toLowerCase();
	if (
		mime === "image/png" ||
		mime === "image/jpeg" ||
		mime === "image/jpg" ||
		mime === "image/webp" ||
		mime === "image/gif" ||
		mime === "video/mp4" ||
		mime === "video/quicktime" ||
		mime === "video/webm" ||
		mime === "application/pdf"
	) {
		return mime;
	}
	const lowerName = file.name.toLowerCase();
	if (lowerName.endsWith(".jpg")) return "image/jpg";
	if (lowerName.endsWith(".jpeg")) return "image/jpeg";
	if (lowerName.endsWith(".png")) return "image/png";
	if (lowerName.endsWith(".webp")) return "image/webp";
	if (lowerName.endsWith(".gif")) return "image/gif";
	if (lowerName.endsWith(".mp4")) return "video/mp4";
	if (lowerName.endsWith(".mov")) return "video/quicktime";
	if (lowerName.endsWith(".webm")) return "video/webm";
	if (lowerName.endsWith(".pdf")) return "application/pdf";
	return null;
};

function getAssetKind(url: string): "image" | "video" | "pdf" | "other" {
	const clean = String(url || "").split("?")[0].toLowerCase();
	if (/\.(png|jpe?g|webp|gif)$/i.test(clean)) return "image";
	if (/\.(mp4|mov|webm|m4v)$/i.test(clean)) return "video";
	if (/\.pdf$/i.test(clean)) return "pdf";
	return "other";
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	required,
	optional,
	multiline,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	required?: boolean;
	optional?: boolean;
	multiline?: boolean;
}) {
	return (
		<label className="block">
			<span className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-600">
				<span>{label}</span>
				{required && <span className="text-rose-500">Required</span>}
				{optional && <span className="text-slate-400">Optional</span>}
			</span>
			{multiline ? (
				<textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					rows={3}
					className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				/>
			) : (
				<input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				/>
			)}
		</label>
	);
}

function MediaOption({
	title,
	description,
	checked,
	onChange,
	disabled,
}: {
	title: string;
	description: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<label
			className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
				checked
					? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
					: disabled
						? "border-slate-200 bg-slate-100 opacity-70"
						: "border-slate-200 bg-white hover:border-blue-200"
			}`}
		>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				disabled={disabled}
				className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
			/>
			<span>
				<span className="block text-sm font-semibold text-slate-800">{title}</span>
				<span className="mt-1 block text-xs leading-relaxed text-slate-500">
					{description}
				</span>
			</span>
		</label>
	);
}

function LatestRunPanel({
	run,
	busy,
	onApproveSchedule,
	onApproveNow,
	onReject,
}: {
	run: AgentRunOutput;
	busy: boolean;
	onApproveSchedule: () => void;
	onApproveNow: () => void;
	onReject: () => void;
}) {
	const { draft, approvalChannel, memoryUsed, status } = run;
	const approvalDone = status === "approved";
	const terminal = status === "approved" || status === "failed";
	const draftOverLimit = isLinkedinPostOverLimit(draft.body);
	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
			<SurfaceCard className="lg:col-span-3">
				<SectionTitle
					title="Latest draft"
					description={`Agent confidence ${Math.round(draft.confidence * 100)}% · memory used: ${memoryUsed.profileKeyCount} profile, ${memoryUsed.workKeyCount} work, ${memoryUsed.learningRuleCount} rules`}
					action={<StatusPill status={status} />}
				/>
				<div className="mb-3">
					<PostGenerationChips
						post={{
							contentPostFormat: draft.postFormat,
							productMentionMode: draft.productMentionMode,
							hasProductMention: draft.hasProductMention,
						}}
					/>
				</div>
				<PostPreview
					body={draft.body}
					hashtags={draft.hashtags}
					mediaAssets={run.mediaAssets || []}
				/>
				<LinkedinPostCharLimit
					charCount={draft.body.trim().length}
					className="mt-3"
				/>
				{draft.rationale && (
					<p className="mt-4 text-xs italic text-slate-500">
						Why this will work: {draft.rationale}
					</p>
				)}
				{run.formatIntelligence ? (
					<div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
							Format intelligence
						</p>
						<p className="mt-1 text-xs text-violet-900">
							{run.formatIntelligence.selectedFormat} ·{" "}
							{Math.round(run.formatIntelligence.formatConfidenceScore * 100)}% confidence
						</p>
						<p className="mt-1 text-xs text-violet-800">
							{run.formatIntelligence.reasoning}
						</p>
					</div>
				) : null}
				{run.mediaAssets && run.mediaAssets.length > 0 && (
					<div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
							Media created with this draft
						</p>
						<div className="mt-2 flex flex-wrap gap-2">
							{run.mediaAssets.map((asset) => (
								<span
									key={asset.id}
									className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700"
								>
									{asset.assetType === "single_image" ? "Image" : "Carousel"} ·{" "}
									{asset.status}
								</span>
							))}
						</div>
					</div>
				)}

				<div className="mt-5 flex flex-wrap gap-2">
					{approvalDone && (
						<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
							This draft is already approved. Check the approval queue or calendar for
							the scheduled publish time.
						</div>
					)}
					{!terminal && (
						<>
							<PrimaryButton
								onClick={onApproveSchedule}
								disabled={busy || draftOverLimit}
							>
								<IconBrandLinkedin className="h-4 w-4" />
								Approve · schedule
							</PrimaryButton>
							<SecondaryButton
								onClick={onApproveNow}
								disabled={busy || draftOverLimit}
							>
								Publish now
							</SecondaryButton>
							<SecondaryButton onClick={onReject} disabled={busy}>
								Reject
							</SecondaryButton>
						</>
					)}
					<Link href={`/social/posts/${run.postRunId}`}>
						<SecondaryButton>Open post →</SecondaryButton>
					</Link>
				</div>

				{approvalChannel === "telegram" && (
					<InlineAlert
						tone="info"
						title="This draft was also sent to Telegram"
						description="You can approve / reject from your phone without coming back here."
					/>
				)}
			</SurfaceCard>

			<SurfaceCard className="lg:col-span-2">
				<SectionTitle
					title="Meta"
					description="Everything the agent attached to this run"
				/>
				<dl className="space-y-3 text-sm">
					<MetaRowItem label="Agent run id" value={run.agentRunId.slice(0, 8)} />
					<MetaRowItem label="Post id" value={`#${run.postRunId}`} />
					<MetaRowItem label="Routing" value={approvalChannel} />
					<MetaRowItem
						label="Hook"
						value={draft.hook ? `"${draft.hook}"` : "—"}
					/>
					<MetaRowItem
						label="Hashtags"
						value={
							draft.hashtags.length
								? draft.hashtags.map((t) => `#${t}`).join(" ")
								: "None"
						}
					/>
				</dl>
			</SurfaceCard>
		</div>
	);
}

function MetaRowItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
			<dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
				{label}
			</dt>
			<dd className="max-w-[60%] break-words text-right text-xs text-slate-700">
				{value}
			</dd>
		</div>
	);
}
