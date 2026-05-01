"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { PostPreview } from "@/components/social/PostPreview";
import { LinkedinTextEditor } from "@/components/social/LinkedinTextEditor";
import {
	DangerButton,
	EmptyState,
	InlineAlert,
	LoadingCardGrid,
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
	approvePost,
	getApprovalQueue,
	publishPostNow,
	rejectPost,
	runSchedulerNow,
	schedulePost,
	SocialPostRun,
	uploadSocialEditorImage,
	updatePostDraft,
} from "@/utils/api/socialClient";
import { formatSocialDateTime } from "@/utils/socialDate";
import {
	IconBolt,
	IconCalendarPlus,
	IconCheck,
	IconEdit,
	IconInbox,
	IconX,
} from "@tabler/icons-react";

export default function SocialApprovalQueuePage() {
	const [loading, setLoading] = useState(true);
	const [queue, setQueue] = useState<SocialPostRun[]>([]);
	const [schedulePickerFor, setSchedulePickerFor] = useState<number | null>(null);
	const [pickerValue, setPickerValue] = useState("");
	const [editor, setEditor] = useState<{ id: number; body: string } | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [runningScheduler, setRunningScheduler] = useState(false);
	const scheduleTargetPost = queue.find((item) => item.id === schedulePickerFor) || null;

	const load = async () => {
		try {
			setLoading(true);
			const data = await getApprovalQueue();
			setQueue(data);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to load approval queue"
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const approve = async (id: number, postNow = false) => {
		try {
			setBusyId(id);
			await approvePost(id, { postNow });
			toast.success(postNow ? "Publishing now" : "Approved and scheduled");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to approve");
		} finally {
			setBusyId(null);
		}
	};

	const reject = async (id: number) => {
		try {
			setBusyId(id);
			await rejectPost(id, "rejected_from_queue");
			toast.success("Rejected");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to reject");
		} finally {
			setBusyId(null);
		}
	};

	const saveSchedule = async () => {
		if (schedulePickerFor === null || !pickerValue) return;
		try {
			setBusyId(schedulePickerFor);
			const isoString = new Date(pickerValue).toISOString();
			const response = await schedulePost(schedulePickerFor, isoString);
			const payload = response?.data;
			if (payload?.rescheduled) {
				toast.success(
					`Rescheduled to ${formatSocialDateTime(payload.scheduledFor)} (daily limit reached on selected day)`
				);
			} else {
				toast.success("Scheduled");
			}
			setSchedulePickerFor(null);
			setPickerValue("");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Scheduling failed");
		} finally {
			setBusyId(null);
		}
	};

	const saveEdit = async () => {
		if (!editor) return;
		try {
			setBusyId(editor.id);
			await updatePostDraft(editor.id, { contentBody: editor.body });
			toast.success("Draft saved");
			setEditor(null);
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusyId(null);
		}
	};

	const publishNow = async (id: number) => {
		try {
			setBusyId(id);
			await publishPostNow(id);
			toast.success("Published to LinkedIn");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Publish failed");
		} finally {
			setBusyId(null);
		}
	};

	const onRunScheduler = async () => {
		try {
			setRunningScheduler(true);
			const result = await runSchedulerNow();
			toast.success(
				`Scheduler processed ${result.due} post${result.due === 1 ? "" : "s"} (${result.published} published, ${result.failed} failed)`
			);
			await load();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Scheduler run failed"
			);
		} finally {
			setRunningScheduler(false);
		}
	};

	const inReview = queue.filter((q) => q.status === "in_review");
	const drafts = queue.filter((q) => q.status === "draft");
	const failures = queue.filter((q) => q.status === "failed");

	return (
		<PageShell>
			<PageHeader
				eyebrow="Approval Queue"
				title="Review drafts before they ship"
				description="Every post the agent produced is here. Approve to schedule, reject to kill, or edit the body before shipping."
				actions={
					<>
						<SecondaryButton onClick={load}>Refresh</SecondaryButton>
						<PrimaryButton
							onClick={onRunScheduler}
							disabled={runningScheduler}
						>
							{runningScheduler ? "Running…" : "Run scheduler now"}
						</PrimaryButton>
					</>
				}
			/>

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : queue.length === 0 ? (
				<EmptyState
					icon={<IconInbox className="h-5 w-5" />}
					title="Queue is clear"
					description="Nothing awaiting your attention. Kick off a new draft in Post Studio."
					action={
						<Link href="/social/post-studio">
							<PrimaryButton>Open Post Studio</PrimaryButton>
						</Link>
					}
				/>
			) : (
				<div className="space-y-8">
					<Bucket
						title="Awaiting approval"
						description="The agent has finished drafting. Take a decision."
						posts={inReview}
						renderItem={(post) => (
							<QueueItem
								key={post.id}
								post={post}
								busy={busyId === post.id}
								onApproveSchedule={() => approve(post.id, false)}
								onApproveNow={() => approve(post.id, true)}
								onReject={() => reject(post.id)}
								onEdit={() =>
									setEditor({ id: post.id, body: post.contentBody })
								}
								onSchedulePicker={() => {
									setSchedulePickerFor(post.id);
									setPickerValue(
										toLocalInput(
											post.scheduledFor
												? new Date(post.scheduledFor)
												: new Date(Date.now() + 2 * 60 * 60 * 1000)
										)
									);
								}}
							/>
						)}
					/>
					<Bucket
						title="Drafts"
						description="Drafts the agent prepared but never sent for review. Edit or trigger approval manually."
						posts={drafts}
						renderItem={(post) => (
							<QueueItem
								key={post.id}
								post={post}
								busy={busyId === post.id}
								onApproveSchedule={() => approve(post.id, false)}
								onApproveNow={() => approve(post.id, true)}
								onReject={() => reject(post.id)}
								onEdit={() =>
									setEditor({ id: post.id, body: post.contentBody })
								}
								onSchedulePicker={() => {
									setSchedulePickerFor(post.id);
									setPickerValue(
										toLocalInput(
											post.scheduledFor
												? new Date(post.scheduledFor)
												: new Date(Date.now() + 2 * 60 * 60 * 1000)
										)
									);
								}}
							/>
						)}
					/>
					<Bucket
						title="Failed to publish"
						description="Something went wrong on LinkedIn. Fix and retry."
						tone="danger"
						posts={failures}
						renderItem={(post) => (
							<SurfaceCard key={post.id} className="border-rose-200">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-900">
											#{post.id} · {post.topic || "LinkedIn post"}
										</p>
										<p className="mt-1 text-xs text-rose-700">
											Reason: {post.failureReason || "Unknown"}
										</p>
									</div>
									<StatusPill status={post.status} />
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									<PrimaryButton
										onClick={() => publishNow(post.id)}
										disabled={busyId === post.id}
									>
										<IconBolt className="h-4 w-4" />
										Retry publish
									</PrimaryButton>
									<Link href={`/social/posts/${post.id}`}>
										<SecondaryButton>Open post →</SecondaryButton>
									</Link>
								</div>
							</SurfaceCard>
						)}
					/>
				</div>
			)}

			{schedulePickerFor !== null && (
				<Overlay onClose={() => setSchedulePickerFor(null)}>
					<SurfaceCard className="w-full max-w-md">
						<SectionTitle
							title="Schedule post"
							description="Pick the local date/time when this post should publish."
						/>
						{scheduleTargetPost?.scheduledFor && (
							<p className="mb-2 text-xs text-slate-500">
								Current schedule:{" "}
								<span className="font-medium text-slate-700">
									{formatSocialDateTime(scheduleTargetPost.scheduledFor)}
								</span>
							</p>
						)}
						<input
							type="datetime-local"
							value={pickerValue}
							onChange={(e) => setPickerValue(e.target.value)}
							className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						/>
						<div className="mt-4 flex justify-end gap-2">
							<SecondaryButton
								onClick={() => setSchedulePickerFor(null)}
							>
								Cancel
							</SecondaryButton>
							<PrimaryButton
								onClick={saveSchedule}
								disabled={
									busyId === schedulePickerFor || !pickerValue
								}
							>
								Save schedule
							</PrimaryButton>
						</div>
					</SurfaceCard>
				</Overlay>
			)}

			{editor && (
				<Overlay onClose={() => setEditor(null)}>
					<SurfaceCard className="w-full max-w-2xl">
						<SectionTitle
							title="Edit draft"
							description="Your edits are tracked — the learning pass uses them to improve future drafts."
						/>
						<LinkedinTextEditor
							value={editor.body}
							rows={14}
							onChange={(next) =>
								setEditor((prev) =>
									prev ? { ...prev, body: next } : prev
								)
							}
							placeholder="Edit your LinkedIn draft..."
							onUploadImage={async (file) => {
								const uploaded = await uploadSocialEditorImage({
									postRunId: editor.id,
									fileName: file.name || "linkedin-editor-upload",
									mimeType: file.type as any,
									dataBase64: await fileToBase64(file),
								});
								return uploaded.publicUrl || "";
							}}
						/>
						<div className="mt-4 flex justify-end gap-2">
							<SecondaryButton onClick={() => setEditor(null)}>
								Cancel
							</SecondaryButton>
							<PrimaryButton
								onClick={saveEdit}
								disabled={busyId === editor.id}
							>
								Save draft
							</PrimaryButton>
						</div>
					</SurfaceCard>
				</Overlay>
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

function hasCompletedScheduling(post: SocialPostRun) {
	return post.status === "scheduled" || !!post.scheduledFor;
}

function hasCompletedApproval(post: SocialPostRun) {
	return post.status === "approved" || !!post.approvedAt || hasCompletedScheduling(post);
}

function Bucket({
	title,
	description,
	tone,
	posts,
	renderItem,
}: {
	title: string;
	description: string;
	tone?: "danger";
	posts: SocialPostRun[];
	renderItem: (post: SocialPostRun) => React.ReactNode;
}) {
	if (posts.length === 0) return null;
	return (
		<div>
			<div className="mb-3 flex items-center justify-between">
				<div>
					<h2
						className={`text-sm font-semibold ${
							tone === "danger" ? "text-rose-700" : "text-slate-900"
						}`}
					>
						{title} · {posts.length}
					</h2>
					<p className="mt-0.5 text-xs text-slate-500">{description}</p>
				</div>
			</div>
			<div className="space-y-4">{posts.map(renderItem)}</div>
		</div>
	);
}

function QueueItem({
	post,
	busy,
	onApproveSchedule,
	onApproveNow,
	onReject,
	onEdit,
	onSchedulePicker,
}: {
	post: SocialPostRun;
	busy: boolean;
	onApproveSchedule: () => void;
	onApproveNow: () => void;
	onReject: () => void;
	onEdit: () => void;
	onSchedulePicker: () => void;
}) {
	const approvalDone = hasCompletedApproval(post);
	const scheduleDone = hasCompletedScheduling(post);
	const terminal =
		post.status === "published" ||
		post.status === "publishing" ||
		post.status === "rejected" ||
		post.status === "cancelled";
	const canApprove = !approvalDone && !terminal;
	const canSchedule = !terminal;
	const canPublishNow = !scheduleDone && !terminal && post.status !== "approved";
	const canEdit = !approvalDone && !terminal;
	const canReject = !approvalDone && !terminal;

	return (
		<SurfaceCard>
			<div className="flex flex-col gap-4 lg:flex-row">
				<div className="min-w-0 flex-1 space-y-3">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<div>
							<p className="text-sm font-semibold text-slate-900">
								#{post.id} · {post.topic || post.hookText || "LinkedIn post"}
							</p>
							<MetaRow
								items={[
									{
										label: "Status",
										value: <StatusPill status={post.status} />,
									},
									{
										label: "Created",
										value: formatSocialDateTime(post.createdAt),
									},
									post.scheduledFor
										? {
												label: "Scheduled",
												value: formatSocialDateTime(post.scheduledFor),
											}
										: null,
									post.approvedAt
										? {
												label: "Approved",
												value: formatSocialDateTime(post.approvedAt),
											}
										: null,
									post.userEditedBody
										? { label: "Edited", value: "By you" }
										: null,
									post.approvalChannel
										? {
												label: "Channel",
												value: post.approvalChannel,
											}
										: null,
								].filter(Boolean) as any}
							/>
						</div>
					</div>
					<PostPreview
						body={post.contentBody}
						hashtags={post.hashtags || undefined}
						mediaUrls={post.mediaUrls || undefined}
					/>
				</div>

				<div className="shrink-0 lg:w-52">
					<div className="flex flex-wrap gap-2 lg:flex-col">
						{approvalDone && (
							<QueueStatusNotice
								title={
									scheduleDone ? "Already scheduled" : "Already approved"
								}
								description={
									scheduleDone
										? `Scheduled for ${formatSocialDateTime(post.scheduledFor)}.`
										: post.approvedAt
											? `Approved on ${formatSocialDateTime(post.approvedAt)}.`
											: "Approval is complete."
								}
							/>
						)}
						{canApprove && (
							<PrimaryButton onClick={onApproveSchedule} disabled={busy}>
								<IconCheck className="h-4 w-4" />
								Approve
							</PrimaryButton>
						)}
						{canSchedule && (
							<SecondaryButton onClick={onSchedulePicker} disabled={busy}>
								<IconCalendarPlus className="h-4 w-4" />
								{scheduleDone ? "Reschedule at…" : "Schedule at…"}
							</SecondaryButton>
						)}
						{canPublishNow && (
							<SecondaryButton onClick={onApproveNow} disabled={busy}>
								<IconBolt className="h-4 w-4" />
								Publish now
							</SecondaryButton>
						)}
						{canEdit && (
							<SecondaryButton onClick={onEdit} disabled={busy}>
								<IconEdit className="h-4 w-4" />
								Edit draft
							</SecondaryButton>
						)}
						{canReject && (
							<DangerButton onClick={onReject} disabled={busy}>
								<IconX className="h-4 w-4" />
								Reject
							</DangerButton>
						)}
						<Link href={`/social/posts/${post.id}`}>
							<SecondaryButton className="w-full">
								Open post →
							</SecondaryButton>
						</Link>
					</div>
				</div>
			</div>
		</SurfaceCard>
	);
}

function QueueStatusNotice({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
			<p className="text-xs font-semibold text-emerald-800">{title}</p>
			<p className="mt-0.5 text-xs leading-relaxed text-emerald-700">
				{description}
			</p>
		</div>
	);
}

function Overlay({
	onClose,
	children,
}: {
	onClose: () => void;
	children: React.ReactNode;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
			onClick={onClose}
		>
			<div onClick={(e) => e.stopPropagation()}>{children}</div>
		</div>
	);
}

function toLocalInput(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	const yyyy = date.getFullYear();
	const mm = pad(date.getMonth() + 1);
	const dd = pad(date.getDate());
	const hh = pad(date.getHours());
	const mi = pad(date.getMinutes());
	return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
