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
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	getSocialCalendar,
	runSchedulerNow,
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
	const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

	const load = async () => {
		try {
			setLoading(true);
			const data = await getSocialCalendar();
			setScheduled(data?.scheduled || []);
			setRecent(data?.recentPosts || []);
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
				description="A Google Calendar style month view for scheduled and recently published posts. Click any post to open its detail page."
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
										className={`min-h-[150px] border-b border-r border-slate-100 p-2 ${
											isCurrentMonth ? "bg-white" : "bg-slate-50/70"
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
												<CalendarPostPill key={`${item.kind}-${item.post.id}`} item={item} />
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

function CalendarPostPill({ item }: { item: CalendarItem }) {
	const title =
		item.post.hookText || item.post.topic || item.post.contentBody.slice(0, 80);
	const tone = item.kind === "published" ? "positive" : "info";
	return (
		<Link
			href={`/social/posts/${item.post.id}`}
			className={`block rounded-lg border px-2 py-1.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
				item.kind === "published"
					? "border-emerald-200 bg-emerald-50"
					: "border-blue-200 bg-blue-50"
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
		</Link>
	);
}
