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
	StatCard,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	AgentBriefing,
	enableSocialAccess,
	getAccountPreferences,
	getAgentBriefing,
	getLinkedinStatus,
	getSocialAccess,
	listEvents,
	listPosts,
	runSchedulerNow,
	SocialAccessResponse,
	SocialEvent,
	SocialPostRun,
	LinkedinStatus,
	AccountPreferences,
} from "@/utils/api/socialClient";
import {
	IconBolt,
	IconBrain,
	IconBrandLinkedin,
	IconBrandTelegram,
	IconCalendarEvent,
	IconInbox,
	IconPencilPlus,
	IconSparkles,
} from "@tabler/icons-react";

export default function SocialDashboardPage() {
	const [loading, setLoading] = useState(true);
	const [runningScheduler, setRunningScheduler] = useState(false);
	const [access, setAccess] = useState<SocialAccessResponse | null>(null);
	const [linkedin, setLinkedin] = useState<LinkedinStatus | null>(null);
	const [briefing, setBriefing] = useState<AgentBriefing | null>(null);
	const [prefs, setPrefs] = useState<AccountPreferences | null>(null);
	const [recentPosts, setRecentPosts] = useState<SocialPostRun[]>([]);
	const [recentEvents, setRecentEvents] = useState<SocialEvent[]>([]);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		try {
			setLoading(true);
			setError(null);
			const accessPayload = await getSocialAccess();
			setAccess(accessPayload);

			if (!accessPayload.enabled) {
				setLoading(false);
				return;
			}

			const [linkedinStatus, agentBriefing, preferences, posts, events] =
				await Promise.allSettled([
					getLinkedinStatus(),
					getAgentBriefing(),
					getAccountPreferences(),
					listPosts({ limit: 6 }),
					listEvents({ limit: 5 }),
				]);

			if (linkedinStatus.status === "fulfilled") setLinkedin(linkedinStatus.value);
			if (agentBriefing.status === "fulfilled") setBriefing(agentBriefing.value);
			if (preferences.status === "fulfilled") setPrefs(preferences.value);
			if (posts.status === "fulfilled") setRecentPosts(posts.value);
			if (events.status === "fulfilled") setRecentEvents(events.value);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load the dashboard"
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const onEnable = async () => {
		try {
			await enableSocialAccess(false);
			toast.success("SocialSniper enabled for your account");
			await load();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to enable social access"
			);
		}
	};

	const onRunScheduler = async () => {
		try {
			setRunningScheduler(true);
			const result = await runSchedulerNow();
			toast.success(
				`Scheduler run complete — ${result.published} published, ${result.failed} failed`
			);
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Scheduler failed");
		} finally {
			setRunningScheduler(false);
		}
	};

	const linkedinTone = useMemo(() => {
		const connected = linkedin?.connected;
		const session = linkedin?.connection?.sessionStatus || "";
		if (!connected) return "danger" as const;
		if (session === "healthy") return "positive" as const;
		if (session === "needs_refresh") return "warning" as const;
		return "warning" as const;
	}, [linkedin]);

	if (loading) {
		return (
			<PageShell>
				<PageHeader
					eyebrow="Social Agent"
					title="Command center"
					description="Drafts, approvals, LinkedIn session, learning rules — one place."
				/>
				<LoadingCardGrid cards={4} />
			</PageShell>
		);
	}

	if (!access?.enabled) {
		return (
			<PageShell>
				<PageHeader
					eyebrow="Welcome"
					title="Turn on the LinkedIn agent"
					description="SocialSniper ghost-writes posts in your voice, gets them approved via Telegram, then schedules and publishes them."
				/>
				<SurfaceCard className="border-dashed">
					<div className="grid gap-6 md:grid-cols-3">
						<Feature
							icon={<IconPencilPlus className="h-5 w-5" />}
							title="Memory-aware drafts"
							description="Every post is written against your profile memory and the learning rules your own posts have proven."
						/>
						<Feature
							icon={<IconBrandTelegram className="h-5 w-5" />}
							title="Approve from Telegram"
							description="Tap Approve / Reject / Post now directly in Telegram. No dashboard round-trip."
						/>
						<Feature
							icon={<IconSparkles className="h-5 w-5" />}
							title="Learns from outcomes"
							description="Hourly snapshots + weekly learning pass surface which hooks, CTAs and formats actually work."
						/>
					</div>
					<div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
						<div>
							<p className="text-sm font-semibold text-slate-800">
								Enable SocialSniper for your account
							</p>
							<p className="text-xs text-slate-500">
								We&apos;ll generate an access key and unlock the full agent stack.
							</p>
						</div>
						<PrimaryButton onClick={onEnable}>Enable SocialSniper</PrimaryButton>
					</div>
				</SurfaceCard>
			</PageShell>
		);
	}

	const pipelineCards = [
		{
			label: "Drafts",
			value: briefing?.counts.drafts ?? 0,
			hint: "Waiting for you to kick off a run",
			icon: <IconPencilPlus className="h-4 w-4" />,
			tone: "neutral" as const,
		},
		{
			label: "In review",
			value: briefing?.counts.inReview ?? 0,
			hint:
				prefs?.approvalChannel === "telegram"
					? "Delivered to Telegram for approval"
					: "Awaiting human approval",
			icon: <IconInbox className="h-4 w-4" />,
			tone: (briefing?.counts.inReview ?? 0) > 0 ? ("warning" as const) : ("neutral" as const),
		},
		{
			label: "Scheduled",
			value: briefing?.counts.scheduled ?? 0,
			hint: "Queued for the posting window",
			icon: <IconCalendarEvent className="h-4 w-4" />,
			tone: "neutral" as const,
		},
		{
			label: "Published (24h)",
			value: briefing?.counts.publishedLast24h ?? 0,
			hint: "Live on LinkedIn",
			icon: <IconBolt className="h-4 w-4" />,
			tone: "positive" as const,
		},
	];

	return (
		<PageShell>
			<PageHeader
				eyebrow="Social Agent"
				title="Command center"
				description="What the agent is drafting, what&apos;s waiting on you, and what is shipping."
				actions={
					<>
						<SecondaryButton onClick={load}>Refresh</SecondaryButton>
						<PrimaryButton
							onClick={onRunScheduler}
							disabled={runningScheduler}
						>
							{runningScheduler ? "Running scheduler…" : "Run scheduler now"}
						</PrimaryButton>
					</>
				}
			/>

			{error && (
				<InlineAlert
					tone="danger"
					title="Something went wrong"
					description={error}
				/>
			)}

			{!linkedin?.connected && (
				<InlineAlert
					tone="warning"
					title="LinkedIn is not connected"
					description="The agent can draft posts but cannot publish until you connect LinkedIn."
					action={
						<Link href="/social/linkedin">
							<PrimaryButton>Connect LinkedIn</PrimaryButton>
						</Link>
					}
				/>
			)}

			{prefs && !prefs.telegramLinked && prefs.approvalChannel === "telegram" && (
				<InlineAlert
					tone="info"
					title="Telegram approval isn&apos;t wired up yet"
					description="Link a Telegram bot so drafts can be approved from your phone."
					action={
						<Link href="/social/telegram">
							<PrimaryButton>Set up Telegram</PrimaryButton>
						</Link>
					}
				/>
			)}

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{pipelineCards.map((card) => (
					<StatCard
						key={card.label}
						label={card.label}
						value={card.value}
						hint={card.hint}
						tone={card.tone}
						icon={card.icon}
					/>
				))}
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<SurfaceCard className="lg:col-span-2">
					<SectionTitle
						title="Morning briefing"
						description="What the agent thinks you should do next."
					/>
					<p className="text-sm text-slate-700">
						{briefing?.recommendation ||
							"Generate your first draft in Post Studio to get started."}
					</p>
					<div className="mt-4 flex flex-wrap gap-2">
						<Link href="/social/post-studio">
							<PrimaryButton>
								<IconPencilPlus className="h-4 w-4" />
								Open Post Studio
							</PrimaryButton>
						</Link>
						<Link href="/social/approval-queue">
							<SecondaryButton>
								<IconInbox className="h-4 w-4" />
								Go to approvals
							</SecondaryButton>
						</Link>
						<Link href="/social/calendar">
							<SecondaryButton>
								<IconCalendarEvent className="h-4 w-4" />
								See calendar
							</SecondaryButton>
						</Link>
					</div>
				</SurfaceCard>

				<SurfaceCard>
					<SectionTitle
						title="System health"
						description="Live connection + approval status"
					/>
					<div className="space-y-3">
						<HealthRow
							icon={<IconBrandLinkedin className="h-4 w-4 text-[#0077B5]" />}
							label="LinkedIn"
							status={
								linkedin?.connected
									? linkedin?.connection?.sessionStatus || "connected"
									: "disconnected"
							}
							tone={linkedinTone}
							helper={
								linkedin?.connection?.tokenExpiresAt
									? `Token expires ${new Date(
											linkedin.connection.tokenExpiresAt
										).toLocaleDateString()}`
									: "Not connected yet"
							}
							href="/social/linkedin"
						/>
						<HealthRow
							icon={<IconBrandTelegram className="h-4 w-4 text-[#2AABEE]" />}
							label="Telegram approval"
							status={prefs?.telegramLinked ? "connected" : "disconnected"}
							tone={prefs?.telegramLinked ? "positive" : "warning"}
							helper={
								prefs?.telegramLinked
									? `Chat ${prefs.autoMode ? "· auto-approve on" : "· manual approval"}`
									: "Bot not linked"
							}
							href="/social/telegram"
						/>
						<HealthRow
							icon={<IconBrain className="h-4 w-4 text-purple-600" />}
							label="Memory onboarding"
							status={
								prefs && access.enabled && briefing
									? "active"
									: "warning"
							}
							tone="positive"
							helper="Profile memory powers every draft"
							href="/social/memory"
						/>
					</div>
				</SurfaceCard>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<SurfaceCard className="lg:col-span-2">
					<SectionTitle
						title="Recent drafts"
						description="Last 6 posts the agent produced for you"
						action={
							<Link
								href="/social/posts"
								className="text-xs font-semibold text-blue-600 hover:text-blue-700"
							>
								View all →
							</Link>
						}
					/>
					{recentPosts.length === 0 ? (
						<EmptyState
							icon={<IconPencilPlus className="h-5 w-5" />}
							title="No posts yet"
							description="Kick off a run in Post Studio and the agent will draft your first LinkedIn post."
							action={
								<Link href="/social/post-studio">
									<PrimaryButton>Draft first post</PrimaryButton>
								</Link>
							}
						/>
					) : (
						<div className="divide-y divide-slate-100">
							{recentPosts.map((post) => (
								<RecentPostRow key={post.id} post={post} />
							))}
						</div>
					)}
				</SurfaceCard>

				<SurfaceCard>
					<SectionTitle
						title="Learning rules"
						description="Patterns the agent has proven"
						action={
							<Link
								href="/social/learning-rules"
								className="text-xs font-semibold text-blue-600 hover:text-blue-700"
							>
								All rules →
							</Link>
						}
					/>
					{!briefing?.topLearningRules?.length ? (
						<p className="text-sm text-slate-500">
							No rules yet. Rules appear after ~5 published posts have 7+ days of
							engagement data.
						</p>
					) : (
						<ul className="space-y-3">
							{briefing.topLearningRules.slice(0, 5).map((rule) => (
								<li
									key={rule.id}
									className="rounded-lg border border-slate-200 p-3"
								>
									<div className="flex items-start justify-between gap-2">
										<p className="text-sm font-medium text-slate-800">
											{rule.title}
										</p>
										<StatusPill
											tone="info"
											label={`${Math.round(rule.confidence * 100)}%`}
										/>
									</div>
									<p className="mt-1 text-xs text-slate-500">
										{rule.description}
									</p>
								</li>
							))}
						</ul>
					)}
				</SurfaceCard>
			</div>

			<SurfaceCard>
				<SectionTitle
					title="Activity feed"
						description="Top 5 latest events. Open full log for complete history."
					action={
						<Link
							href="/social/events"
							className="text-xs font-semibold text-blue-600 hover:text-blue-700"
						>
							See full log →
						</Link>
					}
				/>
				{recentEvents.length === 0 ? (
					<p className="text-sm text-slate-500">
						No events yet. Events appear as soon as the agent runs.
					</p>
				) : (
					<ul className="space-y-2">
						{recentEvents.map((event) => (
							<EventRow key={event.id} event={event} />
						))}
					</ul>
				)}
			</SurfaceCard>
		</PageShell>
	);
}

function Feature({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
				{icon}
			</div>
			<div>
				<p className="text-sm font-semibold text-slate-900">{title}</p>
				<p className="mt-1 text-xs text-slate-500">{description}</p>
			</div>
		</div>
	);
}

function HealthRow({
	icon,
	label,
	status,
	tone,
	helper,
	href,
}: {
	icon: React.ReactNode;
	label: string;
	status: string;
	tone: "neutral" | "positive" | "warning" | "danger" | "info" | "muted";
	helper?: string;
	href: string;
}) {
	return (
		<Link
			href={href}
			className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-blue-200 hover:bg-blue-50/40"
		>
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50">
					{icon}
				</div>
				<div>
					<p className="text-sm font-medium text-slate-800">{label}</p>
					{helper && <p className="text-[11px] text-slate-500">{helper}</p>}
				</div>
			</div>
			<StatusPill tone={tone} label={humanize(status)} />
		</Link>
	);
}

function RecentPostRow({ post }: { post: SocialPostRun }) {
	return (
		<Link
			href={`/social/posts/${post.id}`}
			className="block py-3 transition hover:bg-slate-50"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="line-clamp-1 text-sm font-medium text-slate-800">
						{post.hookText || post.topic || post.contentBody.slice(0, 80)}
					</p>
					<MetaRow
						items={[
							{
								label: "Status",
								value: <StatusPill status={post.status} />,
							},
							{
								label: "Created",
								value: new Date(post.createdAt).toLocaleDateString(),
							},
							post.scheduledFor
								? {
										label: "Scheduled",
										value: new Date(post.scheduledFor).toLocaleString(),
									}
								: null,
						].filter(Boolean) as any}
					/>
				</div>
				<span className="text-xs text-slate-400">→</span>
			</div>
		</Link>
	);
}

function EventRow({ event }: { event: SocialEvent }) {
	return (
		<li className="flex items-start justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 text-sm">
			<div className="min-w-0 flex-1">
				<p className="font-medium text-slate-800">
					{humanize(event.eventType)}
				</p>
				<p className="text-xs text-slate-500">
					{event.actor} · {new Date(event.occurredAt).toLocaleString()}
				</p>
			</div>
			{event.entityType && (
				<StatusPill
					tone="neutral"
					label={`${event.entityType}${event.entityId ? ` #${event.entityId}` : ""}`}
				/>
			)}
		</li>
	);
}

function humanize(value: string) {
	return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
