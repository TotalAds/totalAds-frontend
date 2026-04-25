"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
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
	getSocialCalendar,
	runSchedulerNow,
	SocialPostRun,
} from "@/utils/api/socialClient";
import { IconBolt, IconCalendarEvent } from "@tabler/icons-react";

export default function SocialCalendarPage() {
	const [loading, setLoading] = useState(true);
	const [scheduled, setScheduled] = useState<SocialPostRun[]>([]);
	const [recent, setRecent] = useState<SocialPostRun[]>([]);
	const [running, setRunning] = useState(false);

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
			toast.success(
				`Published ${result.published} · failed ${result.failed}`
			);
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Run failed");
		} finally {
			setRunning(false);
		}
	};

	const groupedScheduled = useMemo(() => groupByDate(scheduled, "scheduledFor"), [scheduled]);

	return (
		<PageShell>
			<PageHeader
				eyebrow="Calendar"
				title="What ships this week"
				description="Every scheduled post, grouped by day, plus the last things the agent shipped."
				actions={
					<>
						<SecondaryButton onClick={load}>Refresh</SecondaryButton>
						<PrimaryButton onClick={runScheduler} disabled={running}>
							{running ? "Running…" : "Run scheduler now"}
						</PrimaryButton>
					</>
				}
			/>

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : (
				<>
					<SurfaceCard>
						<SectionTitle
							title="Scheduled"
							description="Approved posts waiting for their publish time."
						/>
						{scheduled.length === 0 ? (
							<EmptyState
								icon={<IconCalendarEvent className="h-5 w-5" />}
								title="Nothing scheduled yet"
								description="Approve a draft to put it on the calendar."
								action={
									<Link href="/social/approval-queue">
										<PrimaryButton>Open approval queue</PrimaryButton>
									</Link>
								}
							/>
						) : (
							<div className="space-y-6">
								{groupedScheduled.map((group) => (
									<div key={group.key}>
										<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
											{group.label}
										</p>
										<ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
											{group.items.map((post) => (
												<li key={post.id}>
													<Link
														href={`/social/posts/${post.id}`}
														className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
													>
														<div className="min-w-0 flex-1">
															<p className="line-clamp-1 text-sm font-medium text-slate-800">
																{post.hookText ||
																	post.topic ||
																	post.contentBody.slice(0, 100)}
															</p>
															<MetaRow
																items={[
																	{
																		label: "At",
																		value: post.scheduledFor
																			? new Date(
																					post.scheduledFor
																				).toLocaleTimeString([], {
																					hour: "2-digit",
																					minute: "2-digit",
																				})
																			: "—",
																	},
																	{
																		label: "Status",
																		value: (
																			<StatusPill status={post.status} />
																		),
																	},
																	post.approvalChannel
																		? {
																				label: "Channel",
																				value: post.approvalChannel,
																			}
																		: null,
																].filter(Boolean) as any}
															/>
														</div>
														<span className="text-slate-400">→</span>
													</Link>
												</li>
											))}
										</ul>
									</div>
								))}
							</div>
						)}
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="Recently published"
							description="The last 10 LinkedIn posts the agent shipped on your behalf."
						/>
						{recent.length === 0 ? (
							<p className="text-sm text-slate-500">
								Nothing published yet. Your first shipped post will appear here.
							</p>
						) : (
							<ul className="divide-y divide-slate-100">
								{recent.map((post) => (
									<li key={post.id}>
										<Link
											href={`/social/posts/${post.id}`}
											className="flex items-start justify-between gap-3 py-3 transition hover:bg-slate-50"
										>
											<div className="min-w-0 flex-1">
												<p className="line-clamp-1 text-sm font-medium text-slate-800">
													{post.hookText ||
														post.topic ||
														post.contentBody.slice(0, 100)}
												</p>
												<MetaRow
													items={[
														{
															label: "Published",
															value: post.publishedAt
																? new Date(post.publishedAt).toLocaleString()
																: "—",
														},
														{
															label: "Status",
															value: <StatusPill status={post.status} />,
														},
														post.linkedinPostUrn
															? {
																	label: "URN",
																	value: post.linkedinPostUrn.slice(-10),
																}
															: null,
													].filter(Boolean) as any}
												/>
											</div>
											<span className="text-slate-400">→</span>
										</Link>
									</li>
								))}
							</ul>
						)}
					</SurfaceCard>

					{scheduled.length === 0 && recent.length > 0 && (
						<InlineAlert
							tone="info"
							title="Your posting cadence looks empty"
							description="No upcoming posts are scheduled. Draft your next piece in Post Studio."
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
				</>
			)}
		</PageShell>
	);
}

function groupByDate(
	posts: SocialPostRun[],
	field: "scheduledFor" | "publishedAt"
) {
	const groups = new Map<string, { key: string; label: string; items: SocialPostRun[] }>();
	for (const post of posts) {
		const raw = post[field];
		if (!raw) continue;
		const date = new Date(raw);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
		const label = date.toLocaleDateString(undefined, {
			weekday: "long",
			month: "short",
			day: "numeric",
		});
		if (!groups.has(key)) {
			groups.set(key, { key, label, items: [] });
		}
		groups.get(key)!.items.push(post);
	}
	return Array.from(groups.values()).sort((a, b) => (a.key < b.key ? -1 : 1));
}
