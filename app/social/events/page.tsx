"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import {
	EmptyState,
	LoadingCardGrid,
	PageHeader,
	PageShell,
	SecondaryButton,
	SectionTitle,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	listEntityEvents,
	listEvents,
	SocialEvent,
} from "@/utils/api/socialClient";
import { IconActivity, IconFilter, IconSearch } from "@tabler/icons-react";

const ENTITY_OPTIONS = [
	"",
	"post",
	"session",
	"memory",
	"approval",
	"agent_run",
	"thread",
	"lead",
	"comment",
] as const;

export default function EventsPage() {
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState<SocialEvent[]>([]);
	const [entityFilter, setEntityFilter] = useState<(typeof ENTITY_OPTIONS)[number]>("");
	const [eventTypeFilter, setEventTypeFilter] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 25;
	const entityIdFromQuery = Number(searchParams.get("entityId") || "");
	const scopedEntityType = searchParams.get("entityType") || "";
	const hasScopedEntity =
		!!scopedEntityType &&
		Number.isFinite(entityIdFromQuery) &&
		entityIdFromQuery > 0;

	const load = async () => {
		try {
			setLoading(true);
			const data = hasScopedEntity
				? await listEntityEvents(scopedEntityType, entityIdFromQuery)
				: await listEvents({
						limit: pageSize,
						offset: (page - 1) * pageSize,
						entityType: entityFilter || undefined,
						eventType: eventTypeFilter || undefined,
				  });
			setEvents(data);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load events");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [entityFilter, eventTypeFilter, page, hasScopedEntity, scopedEntityType, entityIdFromQuery]);

	const eventTypeOptions = useMemo(() => {
		const s = new Set<string>();
		for (const e of events) s.add(e.eventType);
		return Array.from(s).sort();
	}, [events]);

	const filtered = useMemo(() => {
		if (!search.trim()) return events;
		const term = search.trim().toLowerCase();
		return events.filter((event) =>
			[event.eventType, event.entityType || "", String(event.entityId || ""), JSON.stringify(event.payload)]
				.join(" ")
				.toLowerCase()
				.includes(term)
		);
	}, [events, search]);

	return (
		<PageShell>
			<PageHeader
				eyebrow="Audit log"
				title="Event ledger"
				description="Every meaningful action — drafts, approvals, publishes, engagement snapshots, memory writes — is immutably recorded here."
				actions={<SecondaryButton onClick={load}>Refresh</SecondaryButton>}
			/>

			<SurfaceCard padded={false}>
				<div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap gap-2">
						{!hasScopedEntity && (
							<>
								<FilterSelect
									label="Entity"
									icon={<IconFilter className="h-3.5 w-3.5" />}
									value={entityFilter}
									options={ENTITY_OPTIONS.map((o) => ({
										value: o,
										label: o || "All entities",
									}))}
									onChange={(v) => {
										setPage(1);
										setEntityFilter(v as (typeof ENTITY_OPTIONS)[number]);
									}}
								/>
								<FilterSelect
									label="Event type"
									icon={<IconFilter className="h-3.5 w-3.5" />}
									value={eventTypeFilter}
									options={[
										{ value: "", label: "All event types" },
										...eventTypeOptions.map((o) => ({ value: o, label: o })),
									]}
									onChange={(v) => {
										setPage(1);
										setEventTypeFilter(v);
									}}
								/>
							</>
						)}
					</div>
					<div className="relative w-full lg:w-72">
						<IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search event types, payload…"
							className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						/>
					</div>
				</div>

				{loading ? (
					<div className="p-6">
						<LoadingCardGrid cards={3} />
					</div>
				) : filtered.length === 0 ? (
					<EmptyState
						icon={<IconActivity className="h-5 w-5" />}
						title="No events match"
						description="Change filters or search for something else."
					/>
				) : (
					<ol className="divide-y divide-slate-100">
						{filtered.map((event) => (
							<li key={event.id} className="p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-sm font-semibold text-slate-900">
												{event.eventType.replace(/_/g, " ").toLowerCase()}
											</p>
											<StatusPill tone="neutral" label={event.actor} />
											{event.entityType && (
												<StatusPill
													tone="info"
													label={`${event.entityType}${
														event.entityId ? ` #${event.entityId}` : ""
													}`}
												/>
											)}
											{event.sessionId && (
												<StatusPill
													tone="muted"
													label={`run ${event.sessionId.slice(0, 8)}`}
												/>
											)}
										</div>
										<p className="mt-1 text-xs text-slate-500">
											{new Date(event.occurredAt).toLocaleString()}
										</p>
										{event.payload && Object.keys(event.payload).length > 0 && (
											<details className="mt-2">
												<summary className="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-slate-700">
													View payload
												</summary>
												<pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-600">
													{JSON.stringify(event.payload, null, 2)}
												</pre>
											</details>
										)}
									</div>
									{event.entityType === "post" && event.entityId && (
										<Link
											href={`/social/posts/${event.entityId}`}
											className="text-xs font-semibold text-blue-600 hover:text-blue-700"
										>
											Open →
										</Link>
									)}
								</div>
							</li>
						))}
					</ol>
				)}
			</SurfaceCard>
			{!hasScopedEntity && (
				<SurfaceCard>
					<div className="flex items-center justify-between">
						<p className="text-xs text-slate-500">
							Page {page} · Showing up to {pageSize} logs
						</p>
						<div className="flex gap-2">
							<SecondaryButton
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1 || loading}
							>
								Previous
							</SecondaryButton>
							<SecondaryButton
								onClick={() => setPage((p) => p + 1)}
								disabled={loading || events.length < pageSize}
							>
								Next
							</SecondaryButton>
						</div>
					</div>
				</SurfaceCard>
			)}

			<SurfaceCard>
				<SectionTitle
					title="Why we record events"
					description="The ledger is the source of truth for memory, analytics and replay."
				/>
				<p className="text-sm text-slate-600">
					Every post, approval, Telegram tap and engagement snapshot is appended
					here. Memory items and learning rules are derived from these events —
					so if something looks wrong you can trace it back to the raw action.
				</p>
			</SurfaceCard>
		</PageShell>
	);
}

function FilterSelect({
	label,
	icon,
	value,
	options,
	onChange,
}: {
	label: string;
	icon: React.ReactNode;
	value: string;
	options: Array<{ value: string; label: string }>;
	onChange: (value: string) => void;
}) {
	return (
		<label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
			<span className="flex items-center gap-1 text-slate-500">
				{icon}
				{label}
			</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="bg-transparent text-sm text-slate-700 outline-none"
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</label>
	);
}
