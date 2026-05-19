"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import toast from "react-hot-toast";

import { LinkedinTextEditor } from "@/components/social/LinkedinTextEditor";
import { PostPreview } from "@/components/social/PostPreview";
import {
	DangerButton,
	InlineAlert,
	LoadingCardGrid,
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
	approvePost,
	deleteSocialMediaAsset,
	deleteLinkedinPost,
	getPost,
	listPostMediaAssets,
	listEntityEvents,
	publishPostNow,
	rejectPost,
	reschedulePostToSlot,
	retrySocialMediaAsset,
	schedulePost,
	SocialEvent,
	SocialTimeSlot,
	getSocialAccess,
	SocialMediaAsset,
	SocialPostRun,
	uploadSocialEditorImage,
	updatePostDraft,
} from "@/utils/api/socialClient";
import { formatSocialDateTime } from "@/utils/socialDate";
import { resolveSocialMediaDisplayUrl } from "@/utils/social/mediaUrl";
import {
	IconArrowLeft,
	IconBolt,
	IconBrandLinkedin,
	IconCalendarTime,
	IconCheck,
	IconCopy,
	IconEdit,
	IconLoader2,
	IconMoon,
	IconSun,
	IconSunrise,
	IconTrash,
	IconX,
} from "@tabler/icons-react";

export default function SocialPostDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const id = Number(params?.id);

	const [loading, setLoading] = useState(true);
	const [post, setPost] = useState<SocialPostRun | null>(null);
	const [events, setEvents] = useState<SocialEvent[]>([]);
	const [postMediaAssets, setPostMediaAssets] = useState<SocialMediaAsset[]>([]);
	const [editing, setEditing] = useState(false);
	const [body, setBody] = useState("");
	const [hashtagInput, setHashtagInput] = useState("");
	const [mediaUrls, setMediaUrls] = useState<string[]>([]);
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
	const [assetToRemoveUrl, setAssetToRemoveUrl] = useState<string | null>(null);
	const [imageGenerationEnabled, setImageGenerationEnabled] = useState(true);
	const [busy, setBusy] = useState(false);
	const [retryingAssetId, setRetryingAssetId] = useState<number | null>(null);
	const [pickerValue, setPickerValue] = useState("");
	/** Only schedule controls; avoids full-page reload feel when rescheduling */
	type ScheduleSubmitKind = false | "manual" | SocialTimeSlot;
	const [scheduleSubmitting, setScheduleSubmitting] =
		useState<ScheduleSubmitKind>(false);

	// Mirrors the backend merge: explicit input tags + inline #tags from body,
	// deduped. Used to show a live X/10 counter and gate the save button.
	// We use \w+ here because parseHashtagInput strips non-ASCII anyway, so
	// this matches what the server will ultimately persist.
	const mergedHashtags = useMemo(() => {
		const fromInput = parseHashtagInput(hashtagInput);
		const fromBody = Array.from(body.matchAll(/(^|\s)#(\w+)/g)).map(
			(match) => match[2]
		);
		return Array.from(new Set([...fromInput, ...fromBody]));
	}, [body, hashtagInput]);
	const hashtagLimitExceeded = mergedHashtags.length > MAX_LINKEDIN_HASHTAGS;

	const load = async () => {
		try {
			setLoading(true);
			const data = await getPost(id);
			if (data.post.contentPostFormat === "article") {
				router.replace("/social/posts");
				return;
			}
			const [ev, media] = await Promise.all([
				listEntityEvents("post", id),
				listPostMediaAssets(id),
			]);
			const mergedMediaUrls = mergeUniqueMediaUrls(
				data.post.mediaUrls || [],
				media.map((asset) => asset.publicUrl).filter(Boolean) as string[]
			);
			setPost(data.post);
			setBody(data.post.contentBody);
			setHashtagInput((data.post.hashtags || []).join(", "));
			setMediaUrls(mergedMediaUrls);
			setPickerValue(toDatetimeLocalValue(data.post.scheduledFor));
			setEvents(ev);
			setPostMediaAssets(media);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load post");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (Number.isFinite(id)) load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const patchScheduledTime = (iso: string) => {
		setPost((prev) =>
			prev
				? {
						...prev,
						scheduledFor: iso,
						status: "scheduled",
					}
				: null
		);
		setPickerValue(toDatetimeLocalValue(iso));
	};

	useEffect(() => {
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

	if (!Number.isFinite(id)) {
		return (
			<PageShell>
				<PageHeader title="Invalid post id" />
			</PageShell>
		);
	}

	const saveEdit = async () => {
		if (hashtagLimitExceeded) {
			toast.error(
				`You can use at most ${MAX_LINKEDIN_HASHTAGS} LinkedIn tags. Remove ${
					mergedHashtags.length - MAX_LINKEDIN_HASHTAGS
				} to continue.`
			);
			return;
		}
		try {
			setBusy(true);
			await updatePostDraft(id, {
				contentBody: body,
				hashtags: parseHashtagInput(hashtagInput),
				mediaUrls,
			});
			toast.success("Draft saved");
			setEditing(false);
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(false);
		}
	};

	const approve = async (postNow = false) => {
		try {
			setBusy(true);
			await approvePost(id, { postNow });
			toast.success(postNow ? "Publishing now" : "Approved and scheduled");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Approval failed");
		} finally {
			setBusy(false);
		}
	};

	const reject = async () => {
		try {
			setBusy(true);
			await rejectPost(id, "rejected_from_detail");
			toast.success("Rejected");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Rejection failed");
		} finally {
			setBusy(false);
		}
	};

	const publishNow = async () => {
		try {
			setBusy(true);
			await publishPostNow(id);
			toast.success("Published to LinkedIn");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Publish failed");
		} finally {
			setBusy(false);
		}
	};

	const scheduleAt = async () => {
		if (!pickerValue) return;
		try {
			setScheduleSubmitting("manual");
			const response = await schedulePost(id, new Date(pickerValue).toISOString());
			const payload = response?.data;
			const iso = payload?.scheduledFor as string | undefined;
			if (iso) patchScheduledTime(iso);
			if (payload?.rescheduled) {
				toast.success(
					`Rescheduled to ${formatSocialDateTime(payload.scheduledFor)} (daily limit reached on selected day)`
				);
			} else {
				toast.success("Scheduled");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Scheduling failed");
		} finally {
			setScheduleSubmitting(false);
		}
	};

	const rescheduleToSlot = async (slot: SocialTimeSlot) => {
		try {
			setScheduleSubmitting(slot);
			const response = await reschedulePostToSlot(id, slot);
			const payload = response?.data;
			const iso = payload?.scheduledFor as string | undefined;
			if (iso) patchScheduledTime(iso);
			toast.success(
				payload?.shiftedDays
					? `Rescheduled to ${formatSocialDateTime(payload.scheduledFor)} (daily limit pushed to next available day)`
					: `Rescheduled to ${formatSocialDateTime(payload?.scheduledFor)}`
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Scheduling failed");
		} finally {
			setScheduleSubmitting(false);
		}
	};

	const removeFromLinkedin = async () => {
		if (!post?.linkedinPostUrn) return;
		try {
			setBusy(true);
			await deleteLinkedinPost(id);
			toast.success("Deleted from LinkedIn");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Delete failed");
		} finally {
			setBusy(false);
		}
	};

	const isPublished = post?.status === "published";
	const isPublishing = post?.status === "publishing";
	const isScheduled = post?.status === "scheduled" || !!post?.scheduledFor;
	const isRejected = post?.status === "rejected" || post?.status === "cancelled";
	const hasUserApproved =
		!!post &&
		(!!post.approvedAt ||
			post.status === "approved" ||
			post.status === "scheduled" ||
			post.status === "publishing" ||
			post.status === "published" ||
			(post.status === "failed" && !!post.approvedAt));
	const canTakeDraftAction =
		!!post && !isPublished && !isPublishing && !isRejected && !hasUserApproved;
	const canCustomizePrePublish =
		!!post && !isPublished && !isPublishing && !isRejected;
	const canSchedule =
		!!post &&
		!isPublished &&
		!isRejected &&
		!isPublishing &&
		hasUserApproved;
	const schedulingBusy = scheduleSubmitting !== false;
	const canRetryFailedMedia =
		!!post &&
		!post.linkedinPostUrn &&
		post.status !== "published" &&
		post.status !== "publishing";
	const mediaPolicy = getLinkedinMediaPolicy(mediaUrls);
	const imagePromptText = post ? buildImagePromptFromPost(post) : "";
	const retryMediaAsset = async (assetId: number) => {
		try {
			setRetryingAssetId(assetId);
			await retrySocialMediaAsset(assetId);
			toast.success("Media regeneration finished");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Media retry failed");
		} finally {
			setRetryingAssetId(null);
		}
	};

	const uploadCustomAssets = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		try {
			setBusy(true);
			for (const file of Array.from(files)) {
				const supportedMime = normalizeUploadMime(file);
				if (!supportedMime) {
					toast.error(`${file.name}: unsupported file type`);
					continue;
				}
				const uploaded = await uploadSocialEditorImage({
					postRunId: id,
					file,
					mimeType: supportedMime,
				});
				if (uploaded.publicUrl) {
					setMediaUrls((prev) =>
						prev.includes(uploaded.publicUrl as string)
							? prev
							: [...prev, uploaded.publicUrl as string]
					);
				}
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Asset upload failed");
		} finally {
			setBusy(false);
		}
	};

	const removeAsset = async (url: string) => {
		try {
			setBusy(true);
			const matched = postMediaAssets.find((asset) => asset.publicUrl === url);
			if (matched?.id) {
				await deleteSocialMediaAsset(matched.id);
				// Keep the asset row for prompt history, but clear media URL from active previews.
				setPostMediaAssets((prev) =>
					prev.map((asset) =>
						asset.id === matched.id
							? { ...asset, publicUrl: null, status: "deleted" as any }
							: asset
					)
				);
			}
			setMediaUrls((prev) => prev.filter((item) => item !== url));
			toast.success("Asset removed");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to remove asset");
		} finally {
			setBusy(false);
		}
	};

	const copyTextToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Prompt copied");
		} catch {
			toast.error("Unable to copy prompt");
		}
	};

	return (
		<PageShell>
			<PageHeader
				breadcrumb={[
					{ label: "Posts", href: "/social/posts" },
					{ label: `#${id}` },
				]}
				eyebrow={post?.topic || "Post"}
				title={post?.hookText || post?.topic || `Post #${id}`}
				description={
					post?.publishedAt ? (
						<>
							Published{" "}
							<strong className="font-semibold text-slate-700">
								{formatSocialDateTime(post.publishedAt)}
							</strong>
						</>
					) : post?.scheduledFor ? (
						<>
							Scheduled for{" "}
							<strong className="font-semibold text-slate-700">
								{formatSocialDateTime(post.scheduledFor)}
							</strong>
						</>
					) : (
						"Draft"
					)
				}
				actions={
					<SecondaryButton onClick={() => router.back()}>
						<IconArrowLeft className="h-4 w-4" />
						Back
					</SecondaryButton>
				}
			/>

			{loading || !post ? (
				<LoadingCardGrid cards={2} />
			) : (
				<>
					<PostGenerationChips post={post} className="mb-1" />
					{post.status === "failed" && post.failureReason && (
						<InlineAlert
							tone="danger"
							title="Publish failed"
							description={post.failureReason}
							action={
								<PrimaryButton onClick={publishNow} disabled={busy}>
									Retry publish
								</PrimaryButton>
							}
						/>
					)}

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
						<SurfaceCard className="lg:col-span-3">
							<SectionTitle
								title="Post content"
								description={
									post.userEditedBody
										? "You edited this draft. The original agent output is preserved below."
										: "Untouched from the agent run."
								}
								action={<StatusPill status={post.status} />}
							/>

							{editing ? (
								<>
									<LinkedinTextEditor
										value={body}
										onChange={setBody}
										rows={14}
										placeholder="Edit your LinkedIn post..."
										onUploadImage={async (file) => {
											const supportedMime = normalizeUploadMime(file);
											if (!supportedMime) {
												throw new Error("Unsupported file type");
											}
											const uploaded = await uploadSocialEditorImage({
												postRunId: id,
												file,
												mimeType: supportedMime,
											});
											return uploaded.publicUrl || "";
										}}
										insertUploadedImageUrl={false}
										onImageUploaded={(url) => {
											setMediaUrls((prev) =>
												prev.includes(url) ? prev : [...prev, url]
											);
										}}
									/>
									<div className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
										<label className="block">
											<div className="mb-1 flex items-center justify-between">
												<span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
													LinkedIn tags
												</span>
												<span
													className={`text-[11px] font-medium ${
														hashtagLimitExceeded
															? "text-red-600"
															: "text-slate-500"
													}`}
												>
													{mergedHashtags.length}/{MAX_LINKEDIN_HASHTAGS}
												</span>
											</div>
											<input
												value={hashtagInput}
												onChange={(e) => setHashtagInput(e.target.value)}
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
															mergedHashtags.length - MAX_LINKEDIN_HASHTAGS
														} to stay within the ${MAX_LINKEDIN_HASHTAGS}-tag limit (inline #tags in the body count too).`
													: `Use comma, space, or newline separated tags. Up to ${MAX_LINKEDIN_HASHTAGS} total (inline #tags in the body count toward this limit).`}
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
												onChange={(e) => void uploadCustomAssets(e.target.files)}
												disabled={busy}
												className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
											/>
											<p className="mt-1 text-[11px] text-slate-500">
												Upload files directly for LinkedIn publishing (image, video, or PDF carousel).
											</p>
											{mediaPolicy.message && (
												<InlineAlert
													tone={mediaPolicy.tone}
													title="LinkedIn publish behavior"
													description={mediaPolicy.message}
												/>
											)}
											{mediaUrls.length > 0 && (
												<div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
													{mediaUrls.map((url) => {
														const kind = getAssetKind(url);
														return (
															<div
																key={url}
																className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
															>
																<button
																	type="button"
																	onClick={() => {
																		if (kind === "image") setPreviewImageUrl(url);
																	}}
																	className="block h-full w-full text-left"
																>
																	{kind === "image" ? (
																		<img
																			src={resolveSocialMediaDisplayUrl(url)}
																			alt="Uploaded asset"
																			className="h-28 w-full object-cover"
																		/>
																	) : kind === "video" ? (
																		<video
																			src={resolveSocialMediaDisplayUrl(url)}
																			className="h-28 w-full object-cover"
																			muted
																			playsInline
																			controls
																		/>
																	) : kind === "pdf" ? (
																		<iframe
																			title="Uploaded carousel pdf"
																			src={`${resolveSocialMediaDisplayUrl(url)}#page=1&view=FitH`}
																			className="h-28 w-full border-0"
																		/>
																	) : (
																		<div className="flex h-28 w-full items-center justify-center bg-slate-50 px-2 text-center text-xs font-medium text-slate-600">
																			{getAssetLabel(url)}
																		</div>
																	)}
																</button>
																<button
																	type="button"
																	aria-label="Remove asset"
																	onClick={() => setAssetToRemoveUrl(url)}
																	disabled={busy}
																	className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
																>
																	<IconX className="h-3.5 w-3.5" />
																</button>
															</div>
														);
													})}
												</div>
											)}
										</div>
									</div>
									<div className="mt-4 flex justify-end gap-2">
										<SecondaryButton
											onClick={() => {
												setEditing(false);
												setBody(post.contentBody);
												setHashtagInput((post.hashtags || []).join(", "));
												setMediaUrls(
													mergeUniqueMediaUrls(
														post.mediaUrls || [],
														postMediaAssets
															.map((asset) => asset.publicUrl)
															.filter(Boolean) as string[]
													)
												);
											}}
										>
											Cancel
										</SecondaryButton>
										<PrimaryButton
											onClick={saveEdit}
											disabled={busy || hashtagLimitExceeded}
										>
											Save draft
										</PrimaryButton>
									</div>
								</>
							) : (
								<>
									{mediaPolicy.message && (
										<div className="mb-4">
											<InlineAlert
												tone={mediaPolicy.tone}
												title="LinkedIn publish behavior"
												description={mediaPolicy.message}
											/>
										</div>
									)}
									<PostPreview
										body={post.contentBody}
										hashtags={post.hashtags || undefined}
										mediaUrls={post.mediaUrls || undefined}
										mediaAssets={postMediaAssets}
									/>
									{imageGenerationEnabled &&
										canRetryFailedMedia &&
										postMediaAssets.some(
											(a) =>
												(a.status === "failed" || a.status === "pending") &&
												!(
													a.assetType === "single_image" &&
													a.provider === "user_upload"
												)
										) && (
											<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
												<p className="text-xs font-semibold text-amber-900">
													Generated media needs attention
												</p>
												<p className="mt-1 text-xs leading-relaxed text-amber-800/90">
													If generated media failed before this post went live, retry
													below. This is only available until the post is on LinkedIn.
												</p>
												<ul className="mt-3 space-y-2">
													{postMediaAssets
														.filter(
															(a) =>
																(a.status === "failed" || a.status === "pending") &&
																!(
																	a.assetType === "single_image" &&
																	a.provider === "user_upload"
																)
														)
														.map((asset) => (
															<li
																key={asset.id}
																className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white/90 px-3 py-2"
															>
																<div className="min-w-0 flex-1">
																	<p className="text-xs font-medium text-slate-800">
																		{asset.assetType === "single_image"
																			? "Image"
																			: "Carousel"}{" "}
																		· #{asset.id}
																	</p>
																	<p className="text-[11px] text-slate-500">
																		Status: {asset.status}
																		{asset.failureReason
																			? ` — ${asset.failureReason}`
																			: ""}
																	</p>
																</div>
																<SecondaryButton
																	onClick={() => retryMediaAsset(asset.id)}
																	disabled={busy || retryingAssetId !== null}
																	className="shrink-0"
																>
																	{retryingAssetId === asset.id
																		? "Retrying…"
																		: "Retry generation"}
																</SecondaryButton>
															</li>
														))}
												</ul>
											</div>
										)}
									<div className="mt-4 flex flex-wrap gap-2">
										{canTakeDraftAction && (
											<>
												<PrimaryButton
													onClick={() => approve(false)}
													disabled={busy}
												>
													<IconCheck className="h-4 w-4" />
													Approve
												</PrimaryButton>
												<SecondaryButton
													onClick={() => approve(true)}
													disabled={busy}
												>
													<IconBolt className="h-4 w-4" />
													Publish now
												</SecondaryButton>
												<SecondaryButton onClick={() => setEditing(true)}>
													<IconEdit className="h-4 w-4" />
													Edit body
												</SecondaryButton>
											</>
										)}
										{canCustomizePrePublish && !canTakeDraftAction && (
											<SecondaryButton onClick={() => setEditing(true)}>
												<IconEdit className="h-4 w-4" />
												Customize for LinkedIn
											</SecondaryButton>
										)}
										{hasUserApproved && !isPublished && (
											<StatusNotice
												title={
													isScheduled
														? "Scheduling is already done"
														: "Approval is already done"
												}
												description={
													isScheduled
														? `This post is scheduled for ${formatSocialDateTime(post.scheduledFor)}.`
														: post.approvedAt
															? `Approved on ${formatSocialDateTime(post.approvedAt)}.`
															: "This post has already been approved."
												}
											/>
										)}
										{post.linkedinPostUrn && (
											<DangerButton
												onClick={removeFromLinkedin}
												disabled={busy}
											>
												<IconTrash className="h-4 w-4" />
												Delete from LinkedIn
											</DangerButton>
										)}
										{canTakeDraftAction && (
											<DangerButton onClick={reject} disabled={busy}>
												<IconX className="h-4 w-4" />
												Reject
											</DangerButton>
										)}
									</div>
								</>
							)}

							{post.contentBodyV1 && post.userEditedBody && (
								<details className="mt-5 rounded-lg border border-dashed border-slate-200 p-3 text-sm">
									<summary className="cursor-pointer text-xs font-medium text-slate-500">
										View original agent draft
									</summary>
									<p className="mt-2 whitespace-pre-line text-slate-700">
										{post.contentBodyV1}
									</p>
								</details>
							)}
						</SurfaceCard>

						<div className="space-y-5 lg:col-span-2">
							{canCustomizePrePublish && (
								<SurfaceCard>
									<SectionTitle title="Image generation prompts" />
									<p className="text-xs leading-relaxed text-slate-600">
										Use this image prompt in GPT, Claude, Gemini, or another tool
										to generate your own asset, then upload it back here for posting.
									</p>
									<div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<p className="text-xs font-medium text-slate-800">
												Image prompt
											</p>
											<SecondaryButton
												onClick={() => void copyTextToClipboard(imagePromptText)}
												className="px-2 py-1 text-xs"
											>
												<IconCopy className="h-3.5 w-3.5" />
												Copy prompt
											</SecondaryButton>
										</div>
										<pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-2 text-[11px] leading-relaxed text-slate-700">
											{imagePromptText}
										</pre>
									</div>
								</SurfaceCard>
							)}

							{canSchedule && (
								<SurfaceCard>
									<SectionTitle
										title={post.scheduledFor ? "Reschedule" : "Schedule"}
									/>
									<p className="text-xs text-slate-500">
										{post.scheduledFor ? (
											<>
												Currently scheduled for{" "}
												<strong className="font-semibold text-slate-700">
													{formatSocialDateTime(post.scheduledFor)}
												</strong>
											</>
										) : (
											"Not scheduled."
										)}
									</p>
									{post.scheduledFor && (
										<div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
											{otherSlots(detectSlotForDate(post.scheduledFor)).map(
												(slot) => {
													const SlotIcon = SLOT_ICON[slot];
													const slotLoading = scheduleSubmitting === slot;
													return (
														<SecondaryButton
															key={slot}
															onClick={() => rescheduleToSlot(slot)}
															disabled={schedulingBusy}
															className="w-full justify-center"
														>
															{slotLoading ? (
																<IconLoader2 className="h-4 w-4 shrink-0 animate-spin" />
															) : (
																<SlotIcon className="h-4 w-4 shrink-0" />
															)}
															Reschedule to {SLOT_LABEL[slot]}
														</SecondaryButton>
													);
												}
											)}
										</div>
									)}
									{post.scheduledFor && (
										<div className="my-4 flex items-center gap-3">
											<span className="h-px flex-1 bg-slate-200" />
											<span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
												or
											</span>
											<span className="h-px flex-1 bg-slate-200" />
										</div>
									)}
									<div className="mt-3 flex flex-col gap-2">
										<input
											type="datetime-local"
											value={pickerValue}
											onChange={(e) => setPickerValue(e.target.value)}
											disabled={schedulingBusy}
											className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
										/>
										<PrimaryButton
											onClick={scheduleAt}
											disabled={schedulingBusy || !pickerValue}
											className="w-full justify-center"
										>
											{scheduleSubmitting === "manual" ? (
												<IconLoader2 className="h-4 w-4 shrink-0 animate-spin" />
											) : (
												<IconCalendarTime className="h-4 w-4 shrink-0" />
											)}
											{post.scheduledFor ? "Reschedule" : "Save"}
										</PrimaryButton>
									</div>
									{post.scheduledFor && (
										<p className="mt-2 text-[11px] text-slate-400">
											Quick reschedule picks a random time inside the slot
											(clipped to your posting window) so posts don't always
											land on the same minute.
										</p>
									)}
								</SurfaceCard>
							)}

							<SurfaceCard>
								<SectionTitle title="LinkedIn" />
								{post.linkedinPostUrn ? (
									<>
										<p className="text-sm text-slate-700">
											Published{" "}
											{post.publishedAt
												? formatSocialDateTime(post.publishedAt)
												: ""}
										</p>
										<p className="mt-2 break-all text-xs text-slate-500">
											URN: {post.linkedinPostUrn}
										</p>
										<Link
											href={`https://www.linkedin.com/feed/update/${post.linkedinPostUrn}`}
											target="_blank"
											rel="noreferrer"
											className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
										>
											<IconBrandLinkedin className="h-4 w-4" />
											Open on LinkedIn →
										</Link>
									</>
								) : (
									<p className="text-sm text-slate-500">Not yet on LinkedIn.</p>
								)}
							</SurfaceCard>

							<SurfaceCard>
								<SectionTitle
									title="Engagement metrics"
									description="LinkedIn requires additional access for member post engagement metrics."
								/>
								<div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
									<p className="text-sm font-semibold text-slate-800">Coming soon</p>
									<p className="mt-1 text-xs leading-relaxed text-slate-500">
										Snapshots and engagement metrics will be enabled once the LinkedIn
										engagement API access is approved.
									</p>
								</div>
							</SurfaceCard>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
						<SurfaceCard>
							<SectionTitle
								title="Memory used"
								description="Snapshot captured when the agent generated this draft."
							/>
							<MemorySnapshotBlock
								label="Profile"
								snapshot={post.profileMemorySnapshot}
							/>
							<MemorySnapshotBlock
								label="Work"
								snapshot={post.workMemorySnapshot}
							/>
							{post.learningRulesApplied && post.learningRulesApplied.length > 0 && (
								<div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
									<p className="text-xs font-medium text-slate-500">
										Learning rules applied
									</p>
									<p className="mt-1 text-sm text-slate-800">
										{post.learningRulesApplied
											.map((rid) => `#${rid}`)
											.join(", ")}
									</p>
								</div>
							)}
						</SurfaceCard>

						<SurfaceCard>
							<SectionTitle
								title="Timeline"
								description="Top 5 latest events for this post."
								action={
									<Link
										href={`/social/events?entityType=post&entityId=${id}`}
										className="text-xs font-semibold text-blue-600 hover:text-blue-700"
									>
										View all logs →
									</Link>
								}
							/>
							{events.length === 0 ? (
								<p className="text-sm text-slate-500">No events yet.</p>
							) : (
								<ol className="relative border-l border-slate-200 pl-4">
									{events.slice(0, 5).map((event) => (
										<li key={event.id} className="mb-4 last:mb-0">
											<div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
											<div className="ml-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-medium text-slate-800">
														{event.eventType.replace(/_/g, " ").toLowerCase()}
													</p>
													<StatusPill tone="neutral" label={event.actor} />
												</div>
												<p className="text-xs text-slate-500">
													{formatSocialDateTime(event.occurredAt)}
												</p>
											</div>
										</li>
									))}
								</ol>
							)}
						</SurfaceCard>
					</div>
				</>
			)}

			{previewImageUrl && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4"
					onClick={() => setPreviewImageUrl(null)}
				>
					<div className="relative max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
						<img
							src={resolveSocialMediaDisplayUrl(previewImageUrl)}
							alt="Image preview"
							className="max-h-[90vh] max-w-full rounded-lg border border-slate-200 bg-white object-contain"
						/>
						<button
							type="button"
							aria-label="Close image preview"
							onClick={() => setPreviewImageUrl(null)}
							className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/75 text-white"
						>
							<IconX className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}

			{assetToRemoveUrl && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
					<div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
						<h3 className="text-sm font-semibold text-slate-900">Remove asset?</h3>
						<p className="mt-2 text-sm text-slate-600">
							This removes the asset from this post and deletes the uploaded file from storage.
						</p>
						<div className="mt-4 flex justify-end gap-2">
							<SecondaryButton onClick={() => setAssetToRemoveUrl(null)} disabled={busy}>
								Cancel
							</SecondaryButton>
							<DangerButton
								onClick={async () => {
									const target = assetToRemoveUrl;
									setAssetToRemoveUrl(null);
									if (target) await removeAsset(target);
								}}
								disabled={busy}
							>
								Delete asset
							</DangerButton>
						</div>
					</div>
				</div>
			)}
		</PageShell>
	);
}

function getAssetKind(url: string): "image" | "video" | "pdf" | "other" {
	const clean = String(url || "").split("?")[0].toLowerCase();
	if (/\.(png|jpe?g|webp|gif)$/i.test(clean)) return "image";
	if (/\.(mp4|mov|webm|m4v)$/i.test(clean)) return "video";
	if (/\.pdf$/i.test(clean)) return "pdf";
	return "other";
}

function getAssetLabel(url: string): string {
	const kind = getAssetKind(url);
	if (kind === "pdf") return "PDF carousel";
	if (kind === "video") return "Video asset";
	return "Asset";
}

function mergeUniqueMediaUrls(primary: string[], secondary: string[]): string[] {
	return Array.from(
		new Set(
			[...primary, ...secondary]
				.map((url) => String(url || "").trim())
				.filter(Boolean)
		)
	);
}

function getLinkedinMediaPolicy(mediaUrls: string[]): {
	tone: "info" | "warning";
	message: string | null;
} {
	const kinds = mediaUrls.map(getAssetKind);
	const imageCount = kinds.filter((k) => k === "image").length;
	const videoCount = kinds.filter((k) => k === "video").length;
	const pdfCount = kinds.filter((k) => k === "pdf").length;
	const total = mediaUrls.length;

	if (total === 0) return { tone: "info", message: null };
	if (total > 20) {
		return {
			tone: "warning",
			message:
				`You attached ${total} assets. LinkedIn allows max 20; only the first 20 eligible assets are published.`,
		};
	}
	if (pdfCount > 0 && (imageCount > 0 || videoCount > 0)) {
		return {
			tone: "warning",
			message:
				"PDF carousel + other media detected. System publishes the PDF carousel post and ignores other media.",
		};
	}
	if (videoCount > 0 && imageCount > 0) {
		return {
			tone: "warning",
			message:
				"Video + image combination detected. System publishes videos only; images are ignored in that publish.",
		};
	}
	if (videoCount > 0) {
		return {
			tone: "info",
			message: `This post will publish ${Math.min(videoCount, 20)} video asset(s).`,
		};
	}
	if (imageCount > 0) {
		return {
			tone: "info",
			message: `This post will publish ${Math.min(imageCount, 20)} image asset(s).`,
		};
	}
	if (pdfCount > 0) {
		return {
			tone: "info",
			message: "This post will publish as a PDF carousel.",
		};
	}
	return { tone: "info", message: null };
}

function buildImagePromptFromPost(post: SocialPostRun): string {
	const prompt = [
		`Create a polished LinkedIn image for this post: ${
			post.topic || post.hookText || "LinkedIn post"
		}`,
		post.angle ? `Angle: ${post.angle}` : "",
		post.selectedFormat || post.contentPostFormat
			? `Format: ${post.selectedFormat || post.contentPostFormat}`
			: "",
		"Visual rule: no humans, no founder portraits, no unrelated people; use abstract/product/data/workspace visuals with a subtle bottom-corner organization tag.",
		`Post body:\n${String(post.contentBody || "").slice(0, 1600)}`,
	].filter(Boolean).join("\n");
	return buildHumanReadablePrompt(prompt);
}

function buildHumanReadablePrompt(rawPrompt: string): string {
	const prompt = String(rawPrompt || "").trim();
	const systemPrompt = [
		"You are generating a LinkedIn-ready visual for a B2B post.",
		"Use a professional style suitable for founders/operators.",
		"Avoid unrelated people/faces unless explicitly required.",
		"Keep composition clean and posting-ready for LinkedIn feed.",
	].join("\n");
	return [
		"System prompt:",
		systemPrompt,
		"",
		"User prompt:",
		prompt || "(No user prompt captured)",
	].join("\n");
}


/**
 * Mirrors the backend cap in totalads-social-service/src/routes/posts.ts so
 * the UI can preempt 422s before sending the request.
 */
const MAX_LINKEDIN_HASHTAGS = 10;

/**
 * Bucket a scheduled timestamp into one of the three canonical time slots.
 * Mirrors detectSlotForHour on the server. Used to figure out which two
 * "Reschedule to ..." quick-action buttons to surface.
 */
const detectSlotForDate = (iso: string | null | undefined): SocialTimeSlot => {
	if (!iso) return "morning";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "morning";
	const hour = date.getHours();
	if (hour < 12) return "morning";
	if (hour < 16) return "afternoon";
	return "evening";
};

const ALL_SLOTS: SocialTimeSlot[] = ["morning", "afternoon", "evening"];

const SLOT_LABEL: Record<SocialTimeSlot, string> = {
	morning: "morning",
	afternoon: "afternoon",
	evening: "evening",
};

const SLOT_ICON: Record<
	SocialTimeSlot,
	ComponentType<{ className?: string }>
> = {
	morning: IconSunrise,
	afternoon: IconSun,
	evening: IconMoon,
};

const otherSlots = (current: SocialTimeSlot) =>
	ALL_SLOTS.filter((slot) => slot !== current);

/**
 * Convert an ISO timestamp to the value format expected by
 * `<input type="datetime-local">` (YYYY-MM-DDTHH:mm in the browser's local
 * timezone). Used to prefill the reschedule picker with the post's existing
 * scheduledFor value.
 */
const toDatetimeLocalValue = (iso: string | null | undefined) => {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate()
	)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseHashtagInput = (input: string): string[] =>
	Array.from(
		new Set(
			input
				.split(/[,\s\n]+/)
				.map((token) => token.trim().replace(/^#/, ""))
				.map((token) => token.replace(/[^A-Za-z0-9_]/g, ""))
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

function MemorySnapshotBlock({
	label,
	snapshot,
}: {
	label: string;
	snapshot: Record<string, unknown> | null;
}) {
	if (!snapshot || Object.keys(snapshot).length === 0) {
		return (
			<div className="mb-3 rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-400">
				No {label.toLowerCase()} memory used.
			</div>
		);
	}
	return (
		<div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
				{label}
			</p>
			<ul className="mt-1 space-y-1 text-xs text-slate-700">
				{Object.entries(snapshot).map(([k, v]) => (
					<li key={k} className="flex items-start gap-2">
						<span className="w-32 shrink-0 text-slate-400">{k}</span>
						<span className="flex-1 break-words">
							{typeof v === "string"
								? v
								: Array.isArray(v)
									? v.join(", ")
									: JSON.stringify(v)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function StatusNotice({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="inline-flex max-w-full flex-col rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left">
			<span className="text-xs font-semibold text-emerald-800">{title}</span>
			<span className="mt-0.5 text-xs leading-relaxed text-emerald-700">
				{description}
			</span>
		</div>
	);
}
