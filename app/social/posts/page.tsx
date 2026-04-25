"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
	EmptyState,
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
	listPosts,
	SocialPostRun,
	SocialPostStatus,
} from "@/utils/api/socialClient";
import { IconSearch, IconStack2 } from "@tabler/icons-react";

const FILTERS: Array<{
	label: string;
	value: "all" | SocialPostStatus;
}> = [
	{ label: "All", value: "all" },
	{ label: "Draft", value: "draft" },
	{ label: "In review", value: "in_review" },
	{ label: "Scheduled", value: "scheduled" },
	{ label: "Published", value: "published" },
	{ label: "Failed", value: "failed" },
	{ label: "Rejected", value: "rejected" },
];

export default function SocialPostsPage() {
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
	const [posts, setPosts] = useState<SocialPostRun[]>([]);
	const [search, setSearch] = useState("");

	const load = async () => {
		try {
			setLoading(true);
			const data = await listPosts({
				status: filter === "all" ? undefined : filter,
				limit: 200,
			});
			setPosts(data);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load posts");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filter]);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return posts;
		return posts.filter((post) => {
			const haystack = [post.topic, post.hookText, post.contentBody]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return haystack.includes(term);
		});
	}, [posts, search]);

	const counts = useMemo(() => {
		const base: Record<string, number> = { all: posts.length };
		for (const post of posts) {
			base[post.status] = (base[post.status] || 0) + 1;
		}
		return base;
	}, [posts]);

	return (
		<PageShell>
			<PageHeader
				eyebrow="Posts"
				title="Post history"
				description="Every LinkedIn draft the agent has ever produced for you, filterable by status."
				actions={
					<Link href="/social/post-studio">
						<PrimaryButton>New post</PrimaryButton>
					</Link>
				}
			/>

			<SurfaceCard padded={false}>
				<div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-wrap gap-1">
						{FILTERS.map((f) => (
							<button
								key={f.value}
								onClick={() => setFilter(f.value)}
								className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
									filter === f.value
										? "bg-slate-900 text-white"
										: "bg-slate-100 text-slate-600 hover:bg-slate-200"
								}`}
							>
								{f.label}
								{counts[f.value] !== undefined && (
									<span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
										{counts[f.value]}
									</span>
								)}
							</button>
						))}
					</div>
					<div className="relative w-full md:w-72">
						<IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search topic, hook or body…"
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
						icon={<IconStack2 className="h-5 w-5" />}
						title="No posts match"
						description={
							search
								? "Try a different search term or clear the filter."
								: "Kick off a new run in Post Studio and the agent will draft one."
						}
						action={
							<Link href="/social/post-studio">
								<PrimaryButton>Open Post Studio</PrimaryButton>
							</Link>
						}
					/>
				) : (
					<ul className="divide-y divide-slate-100">
						{filtered.map((post) => (
							<li key={post.id}>
								<Link
									href={`/social/posts/${post.id}`}
									className="block px-5 py-4 transition hover:bg-slate-50"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<StatusPill status={post.status} />
												<span className="text-[11px] text-slate-400">
													#{post.id}
												</span>
												{post.userEditedBody && (
													<StatusPill tone="info" label="Edited" />
												)}
												{post.linkedinPostUrn && (
													<StatusPill tone="positive" label="On LinkedIn" />
												)}
											</div>
											<p className="mt-2 line-clamp-2 text-sm font-medium text-slate-800">
												{post.hookText ||
													post.topic ||
													post.contentBody.slice(0, 140)}
											</p>
											<MetaRow
												items={[
													{
														label: "Topic",
														value: post.topic || "—",
													},
													{
														label: "Created",
														value: new Date(post.createdAt).toLocaleString(),
													},
													post.scheduledFor
														? {
																label: "Scheduled",
																value: new Date(
																	post.scheduledFor
																).toLocaleString(),
															}
														: null,
													post.publishedAt
														? {
																label: "Published",
																value: new Date(
																	post.publishedAt
																).toLocaleString(),
															}
														: null,
												].filter(Boolean) as any}
											/>
										</div>
										<SecondaryButton>Open →</SecondaryButton>
									</div>
								</Link>
							</li>
						))}
					</ul>
				)}
			</SurfaceCard>
		</PageShell>
	);
}
