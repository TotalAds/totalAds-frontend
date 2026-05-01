"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
	SectionTitle,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	approvePost,
	deleteLinkedinPost,
	getPost,
	listPostMediaAssets,
	listEntityEvents,
	publishPostNow,
	rejectPost,
	schedulePost,
	SocialEvent,
	SocialMediaAsset,
	SocialPostRun,
	uploadSocialEditorImage,
	updatePostDraft,
} from "@/utils/api/socialClient";
import { formatSocialDateTime } from "@/utils/socialDate";
import {
	IconArrowLeft,
	IconBolt,
	IconBrandLinkedin,
	IconCheck,
	IconClock,
	IconEdit,
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
	const [busy, setBusy] = useState(false);
	const [pickerValue, setPickerValue] = useState("");

	const load = async () => {
		try {
			setLoading(true);
			const data = await getPost(id);
			setPost(data.post);
			setBody(data.post.contentBody);
			const [ev, media] = await Promise.all([
				listEntityEvents("post", id),
				listPostMediaAssets(id),
			]);
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

	if (!Number.isFinite(id)) {
		return (
			<PageShell>
				<PageHeader title="Invalid post id" />
			</PageShell>
		);
	}

	const saveEdit = async () => {
		try {
			setBusy(true);
			await updatePostDraft(id, { contentBody: body });
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
			setBusy(true);
			const response = await schedulePost(id, new Date(pickerValue).toISOString());
			const payload = response?.data;
			if (payload?.rescheduled) {
				toast.success(
					`Rescheduled to ${formatSocialDateTime(payload.scheduledFor)} (daily limit reached on selected day)`
				);
			} else {
				toast.success("Scheduled");
			}
			setPickerValue("");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Scheduling failed");
		} finally {
			setBusy(false);
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
	const isApproved = post?.status === "approved" || !!post?.approvedAt || isScheduled;
	const canTakeDraftAction =
		!!post &&
		!isPublished &&
		!isPublishing &&
		!isScheduled &&
		!isRejected &&
		post.status !== "approved";
	const canSchedule = !!post && !isPublished && !isRejected;

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
					post?.publishedAt
						? `Published ${formatSocialDateTime(post.publishedAt)}`
						: post?.scheduledFor
							? `Scheduled for ${formatSocialDateTime(post.scheduledFor)}`
							: "Draft"
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
											const uploaded = await uploadSocialEditorImage({
												postRunId: id,
												fileName: file.name || "linkedin-editor-upload",
												mimeType: file.type as any,
												dataBase64: await fileToBase64(file),
											});
											return uploaded.publicUrl || "";
										}}
									/>
									<div className="mt-4 flex justify-end gap-2">
										<SecondaryButton
											onClick={() => {
												setEditing(false);
												setBody(post.contentBody);
											}}
										>
											Cancel
										</SecondaryButton>
										<PrimaryButton onClick={saveEdit} disabled={busy}>
											Save draft
										</PrimaryButton>
									</div>
								</>
							) : (
								<>
									<PostPreview
										body={post.contentBody}
										hashtags={post.hashtags || undefined}
										mediaUrls={post.mediaUrls || undefined}
										mediaAssets={postMediaAssets}
									/>
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
										{isApproved && !isPublished && (
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
							{canSchedule && (
								<SurfaceCard>
									<SectionTitle
										title={post.scheduledFor ? "Reschedule" : "Schedule"}
									/>
									<p className="text-xs text-slate-500">
										{post.scheduledFor
											? `Currently scheduled for ${formatSocialDateTime(post.scheduledFor)}`
											: "Not scheduled."}
									</p>
									<div className="mt-3 flex flex-wrap items-center gap-2">
										<input
											type="datetime-local"
											value={pickerValue}
											onChange={(e) => setPickerValue(e.target.value)}
											className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
										/>
										<PrimaryButton
											onClick={scheduleAt}
											disabled={busy || !pickerValue}
										>
											<IconClock className="h-4 w-4" />
											{post.scheduledFor ? "Reschedule" : "Save"}
										</PrimaryButton>
									</div>
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
		</PageShell>
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
