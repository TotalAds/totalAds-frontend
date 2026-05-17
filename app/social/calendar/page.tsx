"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
	EmptyState,
	LoadingCardGrid,
	PageHeader,
	PageShell,
	PrimaryButton,
	SecondaryButton,
	PostGenerationChips,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	getSocialCalendar,
	runSchedulerNow,
	schedulePost,
	SocialPostRun,
} from "@/utils/api/socialClient";
import {
	IconBolt,
	IconCalendarEvent,
	IconChevronLeft,
	IconChevronRight,
	IconRefresh,
} from "@tabler/icons-react";

type CalendarItem = {
	post: SocialPostRun;
	date: Date;
	kind: "scheduled" | "published";
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const dateKey = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
		date.getDate()
	).padStart(2, "0")}`;

const timeLabel = (date: Date) =>
	date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function SocialCalendarPage() {
	const [loading, setLoading] = useState(true);
	const [scheduled, setScheduled] = useState<SocialPostRun[]>([]);
	const [recent, setRecent] = useState<SocialPostRun[]>([]);
	const [running, setRunning] = useState(false);
	const [draggingPostId, setDraggingPostId] = useState<number | null>(null);
	const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
	const [reschedulingPostId, setReschedulingPostId] = useState<number | null>(null);
	const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

	const load = async () => {
		try {
			setLoading(true);
			const data = await getSocialCalendar();
			const excludeArticles = (posts: SocialPostRun[]) =>
				posts.filter((post) => post.contentPostFormat !== "article");
			setScheduled(excludeArticles(data?.scheduled || []));
			setRecent(excludeArticles(data?.recentPosts || []));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load calendar");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const runScheduler = async () => {
		try {
			setRunning(true);
			const result = await runSchedulerNow();
			toast.success(`Published ${result.published} · failed ${result.failed}`);
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Run failed");
		} finally {
			setRunning(false);
		}
	};

	const moveScheduledPost = async (post: SocialPostRun, targetDay: Date) => {
		if (!post.scheduledFor || reschedulingPostId) return;
		const currentSchedule = new Date(post.scheduledFor);
		if (Number.isNaN(currentSchedule.getTime())) return;

		const nextSchedule = new Date(targetDay);
		nextSchedule.setHours(
			currentSchedule.getHours(),
			currentSchedule.getMinutes(),
			currentSchedule.getSeconds(),
			currentSchedule.getMilliseconds()
		);

		if (dateKey(currentSchedule) === dateKey(nextSchedule)) return;

		const previousScheduled = scheduled;
		const nextScheduledFor = nextSchedule.toISOString();
		setReschedulingPostId(post.id);
		setScheduled((posts) =>
			posts.map((item) =>
				item.id === post.id ? { ...item, scheduledFor: nextScheduledFor } : item
			)
		);

		try {
			const result = await schedulePost(post.id, nextScheduledFor);
			const savedScheduledFor =
				typeof result?.data?.scheduledFor === "string"
					? result.data.scheduledFor
					: nextScheduledFor;
			setScheduled((posts) =>
				posts.map((item) =>
					item.id === post.id ? { ...item, scheduledFor: savedScheduledFor } : item
				)
			);
			if (savedScheduledFor !== nextScheduledFor) {
				toast.success("Post moved to next available schedule slot");
			} else {
				toast.success("Post schedule updated");
			}
		} catch (err) {
			setScheduled(previousScheduled);
			toast.error(err instanceof Error ? err.message : "Failed to move post");
		} finally {
			setReschedulingPostId(null);
			setDraggingPostId(null);
			setDropTargetDate(null);
		}
	};

	const itemsByDate = useMemo(() => {
		const map = new Map<string, CalendarItem[]>();
		const push = (item: CalendarItem) => {
			const key = dateKey(item.date);
			map.set(key, [...(map.get(key) || []), item]);
		};
		for (const post of scheduled) {
			if (!post.scheduledFor) continue;
			push({ post, date: new Date(post.scheduledFor), kind: "scheduled" });
		}
		for (const post of recent) {
			if (!post.publishedAt) continue;
			push({ post, date: new Date(post.publishedAt), kind: "published" });
		}
		for (const [key, value] of map.entries()) {
			map.set(
				key,
				value.sort((a, b) => a.date.getTime() - b.date.getTime())
			);
		}
		return map;
	}, [recent, scheduled]);

	const monthCells = useMemo(() => {
		const first = startOfMonth(currentMonth);
		const last = endOfMonth(currentMonth);
		const cells: Date[] = [];
		const cursor = new Date(first);
		cursor.setDate(cursor.getDate() - cursor.getDay());
		while (cursor <= last || cursor.getDay() !== 0) {
			cells.push(new Date(cursor));
			cursor.setDate(cursor.getDate() + 1);
		}
		return cells;
	}, [currentMonth]);

	const monthLabel = currentMonth.toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
	});

	const upcomingCount = scheduled.filter((post) => post.scheduledFor).length;

	return (
		<PageShell maxWidth="7xl">
			<PageHeader
				eyebrow="Calendar"
				title="LinkedIn publishing calendar"
				description="Month view for scheduled and published LinkedIn posts."
				actions={
					<>
						<SecondaryButton onClick={load}>
							<IconRefresh className="h-4 w-4" />
							Refresh
						</SecondaryButton>
						<PrimaryButton onClick={runScheduler} disabled={running}>
							{running ? "Running..." : "Run scheduler now"}
						</PrimaryButton>
					</>
				}
			/>

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : (
				<div className="space-y-5">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<SurfaceCard>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								Upcoming
							</p>
							<p className="mt-2 text-3xl font-semibold text-slate-950">{upcomingCount}</p>
							<p className="mt-1 text-xs text-slate-500">Scheduled posts</p>
						</SurfaceCard>
						<SurfaceCard>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								Published
							</p>
							<p className="mt-2 text-3xl font-semibold text-slate-950">{recent.length}</p>
							<p className="mt-1 text-xs text-slate-500">Recent posts shown</p>
						</SurfaceCard>
						<SurfaceCard>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								Today
							</p>
							<p className="mt-2 text-lg font-semibold text-slate-950">
								{new Date().toLocaleDateString(undefined, {
									weekday: "long",
									month: "short",
									day: "numeric",
								})}
							</p>
							<p className="mt-1 text-xs text-slate-500">Current local date</p>
						</SurfaceCard>
					</div>

					<SurfaceCard padded={false} className="overflow-hidden">
						<div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
									<IconCalendarEvent className="h-5 w-5" />
								</div>
								<div>
									<h2 className="text-lg font-semibold text-slate-950">{monthLabel}</h2>
									<p className="text-xs text-slate-500">
										Scheduled posts are blue. Published posts are green.
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<SecondaryButton
									onClick={() =>
										setCurrentMonth(
											new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
										)
									}
								>
									<IconChevronLeft className="h-4 w-4" />
									Prev
								</SecondaryButton>
								<SecondaryButton onClick={() => setCurrentMonth(startOfMonth(new Date()))}>
									Today
								</SecondaryButton>
								<SecondaryButton
									onClick={() =>
										setCurrentMonth(
											new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
										)
									}
								>
									Next
									<IconChevronRight className="h-4 w-4" />
								</SecondaryButton>
							</div>
						</div>

						<div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
							{weekdays.map((day) => (
								<div
									key={day}
									className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
								>
									{day}
								</div>
							))}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-7">
							{monthCells.map((day) => {
								const key = dateKey(day);
								const items = itemsByDate.get(key) || [];
								const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
								const isToday = key === dateKey(new Date());
								return (
									<div
										key={key}
										onDragOver={(event) => {
											if (!draggingPostId) return;
											event.preventDefault();
										}}
										onDragEnter={() => {
											if (draggingPostId) setDropTargetDate(key);
										}}
										onDragLeave={() => {
											if (dropTargetDate === key) setDropTargetDate(null);
										}}
										onDrop={(event) => {
											event.preventDefault();
											const postId = Number(event.dataTransfer.getData("text/plain"));
											const post = scheduled.find((item) => item.id === postId);
											setDropTargetDate(null);
											if (post) void moveScheduledPost(post, day);
										}}
										className={`min-h-[150px] border-b border-r border-slate-100 p-2 transition ${
											isCurrentMonth ? "bg-white" : "bg-slate-50/70"
										} ${
											dropTargetDate === key
												? "bg-blue-50 ring-2 ring-inset ring-blue-300"
												: ""
										}`}
									>
										<div className="mb-2 flex items-center justify-between">
											<span
												className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
													isToday
														? "bg-blue-600 text-white"
														: isCurrentMonth
															? "text-slate-700"
															: "text-slate-400"
												}`}
											>
												{day.getDate()}
											</span>
											{items.length > 0 && (
												<span className="text-[10px] font-medium text-slate-400">
													{items.length}
												</span>
											)}
										</div>
										<div className="space-y-1.5">
											{items.slice(0, 4).map((item) => (
												<CalendarPostPill
													key={`${item.kind}-${item.post.id}`}
													item={item}
													dragging={draggingPostId === item.post.id}
													rescheduling={reschedulingPostId === item.post.id}
													onDragStart={() => setDraggingPostId(item.post.id)}
													onDragEnd={() => {
														setDraggingPostId(null);
														setDropTargetDate(null);
													}}
												/>
											))}
											{items.length > 4 && (
												<p className="px-1 text-[11px] font-medium text-slate-500">
													+{items.length - 4} more
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</SurfaceCard>

					{upcomingCount === 0 && recent.length === 0 && (
						<EmptyState
							icon={<IconCalendarEvent className="h-5 w-5" />}
							title="No posts on the calendar yet"
							description="Generate a draft in Post Studio, approve it, and it will appear here by date."
							action={
								<Link href="/social/post-studio">
									<PrimaryButton>
										<IconBolt className="h-4 w-4" />
										Draft next post
									</PrimaryButton>
								</Link>
							}
						/>
					)}
				</div>
			)}
		</PageShell>
	);
}

function CalendarPostPill({
	item,
	dragging,
	rescheduling,
	onDragStart,
	onDragEnd,
}: {
	item: CalendarItem;
	dragging: boolean;
	rescheduling: boolean;
	onDragStart: () => void;
	onDragEnd: () => void;
}) {
	const title =
		item.post.hookText ||
		item.post.topic ||
		item.post.contentBody.slice(0, 80);
	const tone = item.kind === "published" ? "positive" : "info";
	const canDrag = item.kind === "scheduled" && !rescheduling;
	const href = `/social/posts/${item.post.id}`;
	return (
		<Link
			href={href}
			draggable={canDrag}
			onDragStart={(event) => {
				if (!canDrag) {
					event.preventDefault();
					return;
				}
				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setData("text/plain", String(item.post.id));
				onDragStart();
			}}
			onDragEnd={onDragEnd}
			className={`block rounded-lg border px-2 py-1.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
				item.kind === "published"
					? "border-emerald-200 bg-emerald-50"
					: "border-blue-200 bg-blue-50"
			} ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${
				dragging ? "opacity-60 ring-2 ring-blue-300" : ""
			} ${
				rescheduling ? "pointer-events-none opacity-70" : ""
			}`}
		>
			<div className="flex items-center justify-between gap-2">
				<span className="text-[11px] font-semibold text-slate-700">
					{timeLabel(item.date)}
				</span>
				<StatusPill status={item.post.status} tone={tone} />
			</div>
			<p className="mt-1 line-clamp-2 text-xs font-medium leading-4 text-slate-800">
				{title}
			</p>
			<div className="mt-1.5">
				<PostGenerationChips post={item.post} className="gap-1" />
			</div>
		</Link>
	);
}
