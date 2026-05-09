"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { PostPreview } from "@/components/social/PostPreview";
import {
	EmptyState,
	LoadingCardGrid,
	PageHeader,
	PageShell,
	PostGenerationChips,
	PrimaryButton,
	SecondaryButton,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	approvePost,
	type CopilotSessionSnapshot,
	type GeneratedLinkedinCalendarPost,
	getCopilotSession,
	getPost,
	publishPostNow,
	rejectPost,
	type SocialPostStatus,
} from "@/utils/api/socialClient";
import { formatSocialDate, formatSocialDateTime, formatSocialTime } from "@/utils/socialDate";
import {
	IconArrowLeft,
	IconCalendarEvent,
	IconClock,
	IconFile,
	IconPhoto,
	IconPlayerPlay,
	IconX,
} from "@tabler/icons-react";

type DraftFilter =
	| "all"
	| "draft"
	| "in_review"
	| "approved"
	| "scheduled"
	| "published"
	| "rejected"
	| "failed";

type SessionDraft = GeneratedLinkedinCalendarPost & {
	liveStatus: SocialPostStatus;
	liveScheduledFor: string | null;
	livePublishedAt: string | null;
	liveRejectedReason: string | null;
	liveFailureReason: string | null;
	liveContentPostFormat?: string | null;
	liveSelectedFormat?: string | null;
	liveProductMentionMode?: string | null;
	liveHasProductMention?: boolean | null;
};

type SessionMediaAsset = NonNullable<GeneratedLinkedinCalendarPost["mediaAssets"]>[number];

type DraftGroup = {
	date: string;
	label: string;
	posts: SessionDraft[];
};

const toScheduledDate = (value?: string) => {
	const d = value ? new Date(value) : new Date(NaN);
	return Number.isNaN(d.getTime()) ? null : d;
};

const FILTERS: Array<{ id: DraftFilter; label: string }> = [
	{ id: "all", label: "All" },
	{ id: "draft", label: "Draft" },
	{ id: "in_review", label: "In review" },
	{ id: "approved", label: "Approved" },
	{ id: "scheduled", label: "Scheduled" },
	{ id: "published", label: "Published" },
	{ id: "rejected", label: "Rejected" },
	{ id: "failed", label: "Failed" },
];

export default function CopilotSessionDraftsPage() {
	const params = useParams<{ chatId: string }>();
	const chatId = params?.chatId;
	const [loading, setLoading] = useState(true);
	const [actionBusy, setActionBusy] = useState<"approve" | "publish" | "reject" | null>(null);
	const [session, setSession] = useState<CopilotSessionSnapshot | null>(null);
	const [drafts, setDrafts] = useState<SessionDraft[]>([]);
	const [filter, setFilter] = useState<DraftFilter>("all");
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [previewAsset, setPreviewAsset] = useState<SessionMediaAsset | null>(null);

	const loadSessionDrafts = async () => {
		if (!chatId) return;
		try {
			setLoading(true);
			const data = await getCopilotSession(chatId);
			setSession(data);
			const sourceDrafts = data.calendar?.posts || [];
			const enriched = await Promise.all(
				sourceDrafts.map(async (post): Promise<SessionDraft> => {
					try {
						const detail = await getPost(post.postRunId);
						return {
							...post,
							liveStatus: detail.post.status,
							liveScheduledFor: detail.post.scheduledFor,
							livePublishedAt: detail.post.publishedAt,
							liveRejectedReason: detail.post.rejectedReason,
							liveFailureReason: detail.post.failureReason,
							liveContentPostFormat: detail.post.contentPostFormat,
							liveSelectedFormat: detail.post.selectedFormat,
							liveProductMentionMode: detail.post.productMentionMode,
							liveHasProductMention: detail.post.hasProductMention,
						};
					} catch {
						return {
							...post,
							liveStatus: post.status,
							liveScheduledFor: post.scheduledFor || null,
							livePublishedAt: null,
							liveRejectedReason: null,
							liveFailureReason: null,
							liveContentPostFormat: null,
							liveSelectedFormat: null,
							liveProductMentionMode: null,
							liveHasProductMention: null,
						};
					}
				})
			);
			setDrafts(enriched);
			setSelectedIds([]);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load copilot session");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadSessionDrafts();
	}, [chatId]);

	const filteredDrafts = useMemo(() => {
		if (filter === "all") return drafts;
		return drafts.filter((post) => post.liveStatus === filter);
	}, [drafts, filter]);

	const grouped = useMemo<DraftGroup[]>(() => {
		const map = new Map<string, SessionDraft[]>();
		for (const post of filteredDrafts) {
			const effectiveDate = post.liveScheduledFor
				? post.liveScheduledFor.slice(0, 10)
				: post.date;
			const key = effectiveDate;
			map.set(key, [...(map.get(key) || []), post]);
		}
		return Array.from(map.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, posts]) => ({
				date,
				label: formatSocialDate(`${date}T00:00:00`),
				posts: posts
					.slice()
					.sort((a, b) => {
						const da = toScheduledDate(a.scheduledFor)?.getTime() ?? Number.MAX_SAFE_INTEGER;
						const db = toScheduledDate(b.scheduledFor)?.getTime() ?? Number.MAX_SAFE_INTEGER;
						return da - db;
					}),
			}));
	}, [filteredDrafts]);

	const selectedDrafts = useMemo(
		() => drafts.filter((post) => selectedIds.includes(post.postRunId)),
		[drafts, selectedIds]
	);

	const toggleOne = (id: number) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	const toggleAllFiltered = () => {
		const filteredIds = filteredDrafts.map((post) => post.postRunId);
		const everySelected =
			filteredIds.length > 0 &&
			filteredIds.every((id) => selectedIds.includes(id));
		if (everySelected) {
			setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
			return;
		}
		setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
	};

	const runBatch = async (kind: "approve" | "publish" | "reject", ids: number[]) => {
		if (!ids.length) {
			toast.error("Select at least one post first.");
			return;
		}
		try {
			setActionBusy(kind);
			if (kind === "approve") {
				await Promise.all(ids.map((id) => approvePost(id, { postNow: false })));
				toast.success(`Approved ${ids.length} post(s).`);
			}
			if (kind === "publish") {
				await Promise.all(ids.map((id) => publishPostNow(id)));
				toast.success(`Published ${ids.length} post(s).`);
			}
			if (kind === "reject") {
				await Promise.all(ids.map((id) => rejectPost(id, "rejected_from_session_drafts")));
				toast.success(`Rejected ${ids.length} post(s).`);
			}
			await loadSessionDrafts();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Bulk action failed");
		} finally {
			setActionBusy(null);
		}
	};

	return (
		<PageShell maxWidth="7xl">
			<PageHeader
				breadcrumb={[
					{ label: "Copilot", href: "/social/copilot" },
					{ label: "Session drafts" },
				]}
				eyebrow="LinkedIn Copilot"
				title={session?.title || "Session generated drafts"}
				description={
					session?.updatedAt
						? `Last updated ${formatSocialDateTime(session.updatedAt)}`
						: "Drafts generated from this copilot session."
				}
				actions={
					<Link href="/social/copilot">
						<SecondaryButton>
							<IconArrowLeft className="h-4 w-4" />
							Back to copilot
						</SecondaryButton>
					</Link>
				}
			/>

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : !session?.calendar || drafts.length === 0 ? (
				<SurfaceCard>
					<EmptyState
						icon={<IconCalendarEvent className="h-5 w-5" />}
						title="No generated drafts in this session"
						description="Generate an approved plan in Copilot first, then open this screen to review draft timing and statuses."
						action={
							<Link href="/social/copilot">
								<SecondaryButton>Open Copilot</SecondaryButton>
							</Link>
						}
					/>
				</SurfaceCard>
			) : (
				<div className="space-y-4">
					<SurfaceCard>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex flex-wrap gap-2">
								{FILTERS.map((f) => {
									const count =
										f.id === "all"
											? drafts.length
											: drafts.filter((d) => d.liveStatus === f.id).length;
									return (
										<button
											key={f.id}
											type="button"
											onClick={() => setFilter(f.id)}
											className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
												filter === f.id
													? "bg-blue-600 text-white"
													: "bg-slate-100 text-slate-700 hover:bg-slate-200"
											}`}
										>
											{f.label} ({count})
										</button>
									);
								})}
							</div>
							<SecondaryButton onClick={toggleAllFiltered}>
								{filteredDrafts.length > 0 &&
								filteredDrafts.every((d) => selectedIds.includes(d.postRunId))
									? "Unselect all"
									: "Select all"}
							</SecondaryButton>
						</div>

						<div className="mt-3 flex flex-wrap gap-2">
							<PrimaryButton
								onClick={() => runBatch("approve", selectedIds)}
								disabled={actionBusy !== null || selectedIds.length === 0}
							>
								Approve selected ({selectedIds.length})
							</PrimaryButton>
							<SecondaryButton
								onClick={() => runBatch("publish", selectedIds)}
								disabled={actionBusy !== null || selectedIds.length === 0}
							>
								Publish selected
							</SecondaryButton>
							<SecondaryButton
								onClick={() => runBatch("reject", selectedIds)}
								disabled={actionBusy !== null || selectedIds.length === 0}
							>
								Reject selected
							</SecondaryButton>
							<SecondaryButton
								onClick={() => runBatch("approve", filteredDrafts.map((d) => d.postRunId))}
								disabled={actionBusy !== null || filteredDrafts.length === 0}
							>
								Approve all filtered
							</SecondaryButton>
						</div>
					</SurfaceCard>

					{grouped.map((group) => (
						<SurfaceCard key={group.date}>
							<div className="mb-3 flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-slate-900">{group.label}</p>
									<p className="text-xs text-slate-500">
										{group.posts.length} post{group.posts.length > 1 ? "s" : ""}
									</p>
								</div>
								<StatusPill label={group.date} tone="info" />
							</div>

							<div className="space-y-3">
								{group.posts.map((post) => (
									<div
										key={post.postRunId}
										className="rounded-xl border border-slate-200 bg-white p-3"
									>
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div className="flex items-start gap-2">
												<input
													type="checkbox"
													className="mt-1.5 h-4 w-4 rounded border-slate-300"
													checked={selectedIds.includes(post.postRunId)}
													onChange={() => toggleOne(post.postRunId)}
												/>
												<div>
													<p className="text-sm font-semibold text-slate-900">
														{post.hook || post.topic}
													</p>
													<p className="mt-1 text-xs text-slate-500">{post.angle}</p>
												</div>
											</div>
											<div className="flex flex-wrap items-center gap-2">
												<StatusPill status={post.liveStatus} label={post.kltStage} />
												<StatusPill
													tone="neutral"
													label={
														post.liveScheduledFor
															? formatSocialTime(post.liveScheduledFor)
															: "No time set"
													}
												/>
											</div>
										</div>

										{post.liveRejectedReason ? (
											<p className="mt-2 text-xs text-rose-700">
												Rejected: {post.liveRejectedReason}
											</p>
										) : null}
										{post.liveFailureReason ? (
											<p className="mt-2 text-xs text-rose-700">
												Failed: {post.liveFailureReason}
											</p>
										) : null}

										<div className="mt-2 flex flex-wrap items-center gap-2">
											<PostGenerationChips
												post={{
													contentPostFormat:
														post.liveContentPostFormat || undefined,
													formatLabel: post.liveSelectedFormat || post.format,
													productMentionMode:
														post.liveProductMentionMode || undefined,
													hasProductMention:
														post.liveHasProductMention || undefined,
												}}
											/>
											<span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
												<IconClock className="h-3.5 w-3.5" />
												{post.livePublishedAt
													? `Published ${formatSocialDateTime(post.livePublishedAt)}`
													: post.liveScheduledFor
														? formatSocialDateTime(post.liveScheduledFor)
														: `Planned date ${formatSocialDate(`${post.date}T00:00:00`)}`}
											</span>
											<span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
												AI media suggestion: {post.mediaSuggestion || "image"}
											</span>
										</div>

										<div className="mt-3">
											<PostPreview body={post.postBody} hashtags={post.hashtags} />
										</div>
										{post.mediaAssets?.length ? (
											<div className="mt-3">
												<p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
													Media assets
												</p>
												<div className="flex flex-wrap gap-2">
													{post.mediaAssets.map((asset) => (
														<button
															key={asset.id}
															type="button"
															onClick={() => setPreviewAsset(asset)}
															className="overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-blue-300"
															title="Click to preview"
														>
															{asset.publicUrl && asset.assetType === "single_image" ? (
																<img
																	src={asset.publicUrl}
																	alt="Post media preview"
																	className="h-16 w-24 object-cover"
																/>
															) : (
																<span className="flex h-16 w-24 items-center justify-center gap-1 text-[11px] text-slate-600">
																	{asset.assetType === "single_video" ? (
																		<IconPlayerPlay className="h-3.5 w-3.5" />
																	) : asset.assetType === "carousel_pdf" ? (
																		<IconFile className="h-3.5 w-3.5" />
																	) : (
																		<IconPhoto className="h-3.5 w-3.5" />
																	)}
																	{asset.assetType === "carousel_pdf"
																		? "Carousel"
																		: asset.assetType === "single_video"
																			? "Video"
																			: "Image"}
																</span>
															)}
														</button>
													))}
												</div>
											</div>
										) : null}

										<div className="mt-3 flex flex-wrap gap-2">
											{post.liveStatus === "draft" || post.liveStatus === "in_review" ? (
												<PrimaryButton
													onClick={() => runBatch("approve", [post.postRunId])}
													disabled={actionBusy !== null}
												>
													Approve
												</PrimaryButton>
											) : null}
											{post.liveStatus !== "published" &&
											post.liveStatus !== "publishing" &&
											post.liveStatus !== "cancelled" ? (
												<SecondaryButton
													onClick={() => runBatch("publish", [post.postRunId])}
													disabled={actionBusy !== null}
												>
													Publish now
												</SecondaryButton>
											) : null}
											{post.liveStatus !== "rejected" &&
											post.liveStatus !== "published" &&
											post.liveStatus !== "cancelled" ? (
												<SecondaryButton
													onClick={() => runBatch("reject", [post.postRunId])}
													disabled={actionBusy !== null}
												>
													Reject
												</SecondaryButton>
											) : null}
											<Link href={`/social/posts/${post.postRunId}`}>
												<SecondaryButton>Open draft</SecondaryButton>
											</Link>
											<Link href="/social/approval-queue">
												<SecondaryButton>Open approval queue</SecondaryButton>
											</Link>
										</div>
									</div>
								))}
							</div>
						</SurfaceCard>
					))}
				</div>
			)}
			<MediaPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
		</PageShell>
	);
}

function MediaPreviewModal({
	asset,
	onClose,
}: {
	asset: SessionMediaAsset | null;
	onClose: () => void;
}) {
	if (!asset) return null;
	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-black/60" onClick={onClose} />
			<div className="absolute left-1/2 top-1/2 w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
					<p className="text-sm font-semibold text-slate-900">
						Media preview · {asset.assetType}
					</p>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
					>
						<IconX className="h-4 w-4" />
					</button>
				</div>
				<div className="max-h-[78vh] overflow-auto bg-slate-50 p-4">
					{asset.publicUrl ? (
						asset.assetType === "single_image" ? (
							<img
								src={asset.publicUrl}
								alt="Post asset large preview"
								className="mx-auto max-h-[70vh] w-auto rounded-lg border border-slate-200 bg-white"
							/>
						) : asset.assetType === "single_video" ? (
							<video
								src={asset.publicUrl}
								controls
								className="mx-auto max-h-[70vh] w-full rounded-lg border border-slate-200 bg-black"
							/>
						) : (
							<iframe
								src={asset.publicUrl}
								title="Carousel PDF preview"
								className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
							/>
						)
					) : (
						<p className="text-sm text-slate-600">
							This asset is not ready yet ({asset.status}). Try again once it finishes processing.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
