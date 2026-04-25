"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
	getAgentLearningRules,
	LearningRule,
} from "@/utils/api/socialClient";
import { IconSparkles } from "@tabler/icons-react";

const TYPE_LABEL: Record<LearningRule["ruleType"], string> = {
	hook_pattern: "Hook pattern",
	cta_style: "CTA style",
	topic: "Topic",
	format: "Format",
	timing: "Timing",
	audience: "Audience",
	avoid: "Avoid",
};

export default function LearningRulesPage() {
	const [rules, setRules] = useState<LearningRule[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<"all" | LearningRule["ruleType"]>("all");

	const load = async () => {
		try {
			setLoading(true);
			const data = await getAgentLearningRules();
			setRules(data);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const filtered = useMemo(
		() => (filter === "all" ? rules : rules.filter((r) => r.ruleType === filter)),
		[rules, filter]
	);

	const types = useMemo(() => {
		const base = new Set<LearningRule["ruleType"]>();
		for (const rule of rules) base.add(rule.ruleType);
		return Array.from(base);
	}, [rules]);

	const activeCount = rules.filter((r) => r.status === "active").length;
	const autoAppliedCount = rules.filter(
		(r) => r.status === "active" && r.autoApplyToPrompt
	).length;

	return (
		<PageShell>
			<PageHeader
				eyebrow="Learning rules"
				title="Patterns the agent has proven"
				description="Machine-written rules derived from your own post outcomes. Rules only appear after 3+ published posts with 7+ days of engagement."
				actions={<SecondaryButton onClick={load}>Refresh</SecondaryButton>}
			/>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
				<StatTile label="Active rules" value={activeCount} />
				<StatTile label="Auto-applied to prompt" value={autoAppliedCount} />
				<StatTile label="Rule types seen" value={types.length} />
			</div>

			<SurfaceCard padded={false}>
				<div className="flex flex-wrap gap-1 p-3">
					<button
						onClick={() => setFilter("all")}
						className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
							filter === "all"
								? "bg-slate-900 text-white"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200"
						}`}
					>
						All
					</button>
					{types.map((type) => (
						<button
							key={type}
							onClick={() => setFilter(type)}
							className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
								filter === type
									? "bg-slate-900 text-white"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							{TYPE_LABEL[type]}
						</button>
					))}
				</div>

				{loading ? (
					<div className="p-6">
						<LoadingCardGrid cards={3} />
					</div>
				) : filtered.length === 0 ? (
					<EmptyState
						icon={<IconSparkles className="h-5 w-5" />}
						title="No rules yet"
						description="The weekly learning pass will create rules once you have enough engagement data. Keep shipping."
					/>
				) : (
					<ul className="divide-y divide-slate-100">
						{filtered.map((rule) => (
							<li key={rule.id} className="p-5">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<StatusPill
												tone="info"
												label={TYPE_LABEL[rule.ruleType]}
											/>
											<StatusPill status={rule.status} />
											{rule.autoApplyToPrompt ? (
												<StatusPill tone="positive" label="Auto-applied" />
											) : (
												<StatusPill tone="muted" label="Not applied" />
											)}
										</div>
										<p className="mt-2 text-sm font-semibold text-slate-900">
											{rule.title}
										</p>
										<p className="mt-1 max-w-3xl text-sm text-slate-600">
											{rule.description}
										</p>
									</div>
									<div className="flex flex-col items-end text-right">
										<span className="text-lg font-semibold text-slate-900">
											{Math.round(rule.confidence * 100)}%
										</span>
										<span className="text-[10px] uppercase tracking-wide text-slate-400">
											confidence
										</span>
										<span className="mt-1 text-xs text-slate-500">
											{rule.evidenceCount} post{rule.evidenceCount === 1 ? "" : "s"}
										</span>
									</div>
								</div>
								{rule.sourcePostRunIds && rule.sourcePostRunIds.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-1.5">
										{rule.sourcePostRunIds.slice(0, 6).map((pid) => (
											<Link
												key={pid}
												href={`/social/posts/${pid}`}
												className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-blue-100 hover:text-blue-700"
											>
												#{pid}
											</Link>
										))}
										{rule.sourcePostRunIds.length > 6 && (
											<span className="text-[10px] text-slate-400">
												+{rule.sourcePostRunIds.length - 6} more
											</span>
										)}
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</SurfaceCard>

			<SurfaceCard>
				<SectionTitle
					title="How rules are produced"
					description="Your posts drive the learning pass."
				/>
				<ol className="space-y-2 text-sm text-slate-600">
					<li>
						<span className="font-semibold text-slate-800">1 ·</span> The agent
						ships posts and tracks their engagement hourly for 7 days.
					</li>
					<li>
						<span className="font-semibold text-slate-800">2 ·</span> Once a
						week, the learning summariser finds hook patterns and edit
						patterns that consistently outperform your average.
					</li>
					<li>
						<span className="font-semibold text-slate-800">3 ·</span> Patterns
						with at least 3 supporting posts become rules. Rules with
						Auto-applied get injected into every prompt.
					</li>
				</ol>
			</SurfaceCard>
		</PageShell>
	);
}

function StatTile({
	label,
	value,
}: {
	label: string;
	value: number | string;
}) {
	return (
		<SurfaceCard>
			<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
				{label}
			</p>
			<p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
		</SurfaceCard>
	);
}
