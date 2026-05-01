"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { PostPreview } from "@/components/social/PostPreview";
import { LinkedinTextEditor } from "@/components/social/LinkedinTextEditor";
import {
	EmptyState,
	InlineAlert,
	MetaRow,
	PageHeader,
	PageShell,
	PrimaryButton,
	SecondaryButton,
	SectionTitle,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	AgentDraft,
	AgentRunOutput,
	approvePost,
	createManualPost,
	listPosts,
	publishPostNow,
	rejectPost,
	runAgent,
	schedulePost,
	SocialPostRun,
	uploadSocialEditorImage,
} from "@/utils/api/socialClient";
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
	| "angle"
	| "audience"
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

export default function SocialPostStudioPage() {
	const [flow, setFlow] = useState<"ai" | "manual">("ai");
	const [form, setForm] = useState({
		topic: "",
		angle: "",
		audience: "",
		proofPoint: "",
		cta: "",
		seriesName: "",
		extraInstructions: "",
		createImage: false,
		createCarousel: false,
	});
	const [isGenerating, setIsGenerating] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [angleMode, setAngleMode] = useState<"preset" | "custom">("preset");
	const [audienceMode, setAudienceMode] = useState<"preset" | "custom">("preset");
	const [customAngle, setCustomAngle] = useState("");
	const [customAudience, setCustomAudience] = useState("");
	const [latestRun, setLatestRun] = useState<AgentRunOutput | null>(null);
	const [drafts, setDrafts] = useState<SocialPostRun[]>([]);
	const [isBusy, setIsBusy] = useState<number | null>(null);
	const [manualBody, setManualBody] = useState("");
	const [manualMediaUrls, setManualMediaUrls] = useState<string[]>([]);
	const [manualTopic, setManualTopic] = useState("");
	const [manualScheduleFor, setManualScheduleFor] = useState("");
	const [manualBusy, setManualBusy] = useState<"save" | "schedule" | "post_now" | null>(
		null
	);

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
	}, []);

	const set = (field: TextBriefField, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const setMedia = (field: "createImage" | "createCarousel", value: boolean) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const onGenerate = async () => {
		if (form.topic.trim().length < 3) {
			toast.error("Topic must be at least 3 characters");
			return;
		}
		try {
			setIsGenerating(true);
			setLatestRun(null);
			const run = await runAgent({
				topic: form.topic.trim(),
				angle: form.angle || undefined,
				audience: form.audience || undefined,
				proofPoint: form.proofPoint || undefined,
				cta: form.cta || undefined,
				seriesName: form.seriesName || undefined,
				extraInstructions: form.extraInstructions || undefined,
				createImage: form.createImage,
				createCarousel: form.createCarousel,
			});
			setLatestRun(run);
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

	const createManualDraft = async () => {
		if (manualBody.trim().length < 10) {
			toast.error("Write at least 10 characters");
			return null;
		}
		const created = await createManualPost({
			contentBody: manualBody.trim(),
			topic: manualTopic.trim() || undefined,
			hashtags: extractHashtags(manualBody),
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
								<div className="flex flex-wrap gap-2">
									{ANGLE_OPTIONS.map((option) => (
										<Chip
											key={option}
											active={angleMode === "preset" && form.angle === option}
											onClick={() => {
												setAngleMode("preset");
												set("angle", option);
											}}
										>
											{option}
										</Chip>
									))}
									<Chip
										active={angleMode === "custom"}
										onClick={() => {
											setAngleMode("custom");
											set("angle", customAngle);
										}}
									>
										+ Custom
									</Chip>
								</div>
								{angleMode === "custom" && (
									<input
										value={customAngle}
										onChange={(event) => {
											const next = event.target.value;
											setCustomAngle(next);
											set("angle", next);
										}}
										placeholder="Enter custom angle"
										className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
									/>
								)}
							</div>

							<div>
								<label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
									Audience
								</label>
								<div className="flex flex-wrap gap-2">
									{AUDIENCE_OPTIONS.map((option) => (
										<Chip
											key={option}
											active={audienceMode === "preset" && form.audience === option}
											onClick={() => {
												setAudienceMode("preset");
												set("audience", option);
											}}
										>
											{option}
										</Chip>
									))}
									<Chip
										active={audienceMode === "custom"}
										onClick={() => {
											setAudienceMode("custom");
											set("audience", customAudience);
										}}
									>
										+ Custom
									</Chip>
								</div>
								{audienceMode === "custom" && (
									<input
										value={customAudience}
										onChange={(event) => {
											const next = event.target.value;
											setCustomAudience(next);
											set("audience", next);
										}}
										placeholder="Enter custom audience"
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
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<MediaOption
										title="Create LinkedIn image"
										description="Generate a professional feed image with the draft."
										checked={form.createImage}
										onChange={(checked) => setMedia("createImage", checked)}
									/>
									<MediaOption
										title="Create carousel"
										description="Prepare a carousel deck asset for this draft."
										checked={form.createCarousel}
										onChange={(checked) => setMedia("createCarousel", checked)}
									/>
								</div>
							</div>
						</div>
						<div className="mt-5 flex flex-wrap items-center justify-end gap-2">
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
									fileName: file.name || "linkedin-editor-upload",
									mimeType: file.type as any,
									dataBase64: await fileToBase64(file),
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
							insertUploadedImageUrl={false}
							onImageUploaded={(url) => {
								onMediaUrlsChange(
									mediaUrls.includes(url) ? mediaUrls : [...mediaUrls, url]
								);
							}}
						/>
						{mediaUrls.length > 0 && (
							<div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
								<p className="mb-2 text-xs font-medium text-slate-500">
									Attached media ({mediaUrls.length})
								</p>
								<div className="grid grid-cols-3 gap-2">
									{mediaUrls.map((url) => (
										<div key={url} className="relative">
											<img
												src={url}
												alt="Attached media"
												className="h-20 w-full rounded-md border border-slate-200 object-cover"
											/>
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
						<div className="flex items-center justify-between text-xs text-slate-500">
							<span>{body.length} characters</span>
							<span>LinkedIn sweet spot: 900-1300</span>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
						<SecondaryButton onClick={onSave} disabled={busy !== null}>
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
						<PrimaryButton onClick={onSchedule} disabled={busy !== null}>
							{busy === "schedule" ? (
								<IconRotateClockwise className="h-4 w-4 animate-spin" />
							) : (
								<IconCalendarTime className="h-4 w-4" />
							)}
							Schedule
						</PrimaryButton>
						<SecondaryButton onClick={onPostNow} disabled={busy !== null}>
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

const fileToBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const out = String(reader.result || "");
			const base64 = out.includes(",") ? out.split(",")[1] : out;
			resolve(base64);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});

const extractHashtags = (input: string) =>
	Array.from(input.matchAll(/(^|\s)#([\p{L}\p{N}_]+)/gu)).map((match) =>
		match[2].trim()
	);

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
}: {
	title: string;
	description: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label
			className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
				checked
					? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
					: "border-slate-200 bg-white hover:border-blue-200"
			}`}
		>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
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
	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
			<SurfaceCard className="lg:col-span-3">
				<SectionTitle
					title="Latest draft"
					description={`Agent confidence ${Math.round(draft.confidence * 100)}% · memory used: ${memoryUsed.profileKeyCount} profile, ${memoryUsed.workKeyCount} work, ${memoryUsed.learningRuleCount} rules`}
					action={<StatusPill status={status} />}
				/>
				<PostPreview
					body={draft.body}
					hashtags={draft.hashtags}
					mediaAssets={run.mediaAssets || []}
				/>
				{draft.rationale && (
					<p className="mt-4 text-xs italic text-slate-500">
						Why this will work: {draft.rationale}
					</p>
				)}
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
							<PrimaryButton onClick={onApproveSchedule} disabled={busy}>
								<IconBrandLinkedin className="h-4 w-4" />
								Approve · schedule
							</PrimaryButton>
							<SecondaryButton onClick={onApproveNow} disabled={busy}>
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
