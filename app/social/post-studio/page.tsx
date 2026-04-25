"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { PostPreview } from "@/components/social/PostPreview";
import {
	EmptyState,
	InlineAlert,
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
	AgentDraft,
	AgentRunOutput,
	approvePost,
	listPosts,
	rejectPost,
	runAgent,
	SocialPostRun,
} from "@/utils/api/socialClient";
import {
	IconBrandLinkedin,
	IconBulb,
	IconChevronRight,
	IconRotateClockwise,
	IconSparkles,
} from "@tabler/icons-react";

export default function SocialPostStudioPage() {
	const [form, setForm] = useState({
		topic: "",
		angle: "",
		audience: "",
		proofPoint: "",
		cta: "",
		seriesName: "",
		extraInstructions: "",
	});
	const [isGenerating, setIsGenerating] = useState(false);
	const [latestRun, setLatestRun] = useState<AgentRunOutput | null>(null);
	const [drafts, setDrafts] = useState<SocialPostRun[]>([]);
	const [isBusy, setIsBusy] = useState<number | null>(null);

	const loadDrafts = async () => {
		try {
			const [draftPosts, reviewPosts] = await Promise.all([
				listPosts({ status: "draft", limit: 20 }),
				listPosts({ status: "in_review", limit: 20 }),
			]);
			setDrafts([...reviewPosts, ...draftPosts]);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to load drafts"
			);
		}
	};

	useEffect(() => {
		loadDrafts();
	}, []);

	const set = (field: keyof typeof form, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const onGenerate = async () => {
		if (form.topic.trim().length < 3) {
			toast.error("Topic must be at least 3 characters");
			return;
		}
		try {
			setIsGenerating(true);
			setLatestRun(null);
			const run = await runAgent({
				topic: form.topic.trim(),
				angle: form.angle || undefined,
				audience: form.audience || undefined,
				proofPoint: form.proofPoint || undefined,
				cta: form.cta || undefined,
				seriesName: form.seriesName || undefined,
				extraInstructions: form.extraInstructions || undefined,
			});
			setLatestRun(run);
			toast.success("Draft generated");
			await loadDrafts();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to generate draft"
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const approveLatest = async (postNow = false) => {
		if (!latestRun) return;
		try {
			setIsBusy(latestRun.postRunId);
			await approvePost(latestRun.postRunId, { postNow });
			toast.success(
				postNow ? "Approved and publishing now" : "Approved and scheduled"
			);
			setLatestRun(null);
			await loadDrafts();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Approval failed"
			);
		} finally {
			setIsBusy(null);
		}
	};

	const rejectLatest = async () => {
		if (!latestRun) return;
		try {
			setIsBusy(latestRun.postRunId);
			await rejectPost(latestRun.postRunId, "rejected_from_studio");
			toast.success("Draft rejected");
			setLatestRun(null);
			await loadDrafts();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Rejection failed"
			);
		} finally {
			setIsBusy(null);
		}
	};

	return (
		<PageShell>
			<PageHeader
				eyebrow="Post Studio"
				title="Draft a new LinkedIn post"
				description="Give the agent a brief. It reads your profile memory + proven learning rules and drafts a single, ready-to-ship post."
				actions={
					<Link href="/social/memory">
						<SecondaryButton>
							<IconBulb className="h-4 w-4" />
							Tune memory
						</SecondaryButton>
					</Link>
				}
			/>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
				<SurfaceCard className="lg:col-span-3">
					<SectionTitle
						title="Brief"
						description="Fields marked optional are used only when provided. Topic is the only required input."
					/>
					<div className="grid grid-cols-1 gap-4">
						<Field
							label="Topic"
							required
							value={form.topic}
							onChange={(v) => set("topic", v)}
							placeholder="e.g. Why CPM is a vanity metric in D2C Meta ads"
						/>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Field
								label="Angle"
								optional
								value={form.angle}
								onChange={(v) => set("angle", v)}
								placeholder="Contrarian · Story · Breakdown"
							/>
							<Field
								label="Audience"
								optional
								value={form.audience}
								onChange={(v) => set("audience", v)}
								placeholder="Who is this for?"
							/>
						</div>
						<Field
							label="Proof point"
							optional
							value={form.proofPoint}
							onChange={(v) => set("proofPoint", v)}
							placeholder="A concrete datapoint, number, or case study"
						/>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Field
								label="CTA style"
								optional
								value={form.cta}
								onChange={(v) => set("cta", v)}
								placeholder="DM me · Reply below · No CTA"
							/>
							<Field
								label="Series / campaign"
								optional
								value={form.seriesName}
								onChange={(v) => set("seriesName", v)}
								placeholder="Ad Spend Myths — 5-post series"
							/>
						</div>
						<Field
							label="Extra instructions"
							optional
							multiline
							value={form.extraInstructions}
							onChange={(v) => set("extraInstructions", v)}
							placeholder="Anything else the agent should bear in mind — tone, references, forbidden words."
						/>
					</div>
					<div className="mt-5 flex flex-wrap items-center gap-2">
						<PrimaryButton onClick={onGenerate} disabled={isGenerating}>
							{isGenerating ? (
								<>
									<IconRotateClockwise className="h-4 w-4 animate-spin" />
									Drafting…
								</>
							) : (
								<>
									<IconSparkles className="h-4 w-4" />
									Draft post
								</>
							)}
						</PrimaryButton>
						{latestRun && (
							<SecondaryButton onClick={() => setLatestRun(null)}>
								Clear preview
							</SecondaryButton>
						)}
					</div>
				</SurfaceCard>

				<div className="space-y-5 lg:col-span-2">
					<SurfaceCard>
						<SectionTitle
							title="How the agent writes"
							description="Every draft is generated against your memory stack."
						/>
						<ul className="space-y-3 text-sm text-slate-600">
							<li className="flex items-start gap-2">
								<span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
								<p>
									<span className="font-medium text-slate-800">Profile memory</span>{" "}
									— founder name, tone keywords, forbidden phrases, CTA style.
								</p>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
								<p>
									<span className="font-medium text-slate-800">Work memory</span>{" "}
									— what campaign or series you&apos;re running right now.
								</p>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
								<p>
									<span className="font-medium text-slate-800">Learning rules</span>{" "}
									— hook / CTA / format patterns proven by your past posts.
								</p>
							</li>
						</ul>
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="Hygiene checklist"
							description="Check these once before kicking off."
						/>
						<ul className="space-y-3 text-sm">
							<ChecklistItem
								href="/social/memory"
								label="Profile memory has a founder name + tone + forbidden phrases"
							/>
							<ChecklistItem
								href="/social/linkedin"
								label="LinkedIn session is healthy (so publish-now works)"
							/>
							<ChecklistItem
								href="/social/telegram"
								label="Telegram bot is linked (so you can approve from your phone)"
							/>
						</ul>
					</SurfaceCard>
				</div>
			</div>

			{latestRun && <LatestRunPanel
				run={latestRun}
				busy={isBusy === latestRun.postRunId}
				onApproveSchedule={() => approveLatest(false)}
				onApproveNow={() => approveLatest(true)}
				onReject={rejectLatest}
			/>}

			<SurfaceCard>
				<SectionTitle
					title="Drafts + awaiting approval"
					description="Every post still in the pipeline. Jump into any to edit or approve."
					action={
						<Link
							href="/social/posts"
							className="text-xs font-semibold text-blue-600 hover:text-blue-700"
						>
							All posts →
						</Link>
					}
				/>
				{drafts.length === 0 ? (
					<EmptyState
						icon={<IconSparkles className="h-5 w-5" />}
						title="No drafts yet"
						description="Your generated drafts will live here until they're approved, scheduled or published."
					/>
				) : (
					<ul className="divide-y divide-slate-100">
						{drafts.map((draft) => (
							<li key={draft.id} className="py-3">
								<Link
									href={`/social/posts/${draft.id}`}
									className="flex items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-slate-50"
								>
									<div className="min-w-0 flex-1">
										<p className="line-clamp-1 text-sm font-medium text-slate-800">
											{draft.hookText || draft.topic || draft.contentBody.slice(0, 100)}
										</p>
										<MetaRow
											items={[
												{
													label: "Status",
													value: <StatusPill status={draft.status} />,
												},
												{
													label: "Created",
													value: new Date(draft.createdAt).toLocaleString(),
												},
												draft.userEditedBody
													? {
															label: "Edited",
															value: "By you",
														}
													: null,
											].filter(Boolean) as any}
										/>
									</div>
									<IconChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
								</Link>
							</li>
						))}
					</ul>
				)}
			</SurfaceCard>
		</PageShell>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	required,
	optional,
	multiline,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	required?: boolean;
	optional?: boolean;
	multiline?: boolean;
}) {
	return (
		<label className="block">
			<span className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-600">
				<span>{label}</span>
				{required && <span className="text-rose-500">Required</span>}
				{optional && <span className="text-slate-400">Optional</span>}
			</span>
			{multiline ? (
				<textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					rows={3}
					className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				/>
			) : (
				<input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				/>
			)}
		</label>
	);
}

function ChecklistItem({ href, label }: { href: string; label: string }) {
	return (
		<li>
			<Link
				href={href}
				className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"
			>
				<span className="text-xs">{label}</span>
				<IconChevronRight className="h-4 w-4 text-slate-400" />
			</Link>
		</li>
	);
}

function LatestRunPanel({
	run,
	busy,
	onApproveSchedule,
	onApproveNow,
	onReject,
}: {
	run: AgentRunOutput;
	busy: boolean;
	onApproveSchedule: () => void;
	onApproveNow: () => void;
	onReject: () => void;
}) {
	const { draft, approvalChannel, memoryUsed, status } = run;
	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
			<SurfaceCard className="lg:col-span-3">
				<SectionTitle
					title="Latest draft"
					description={`Agent confidence ${Math.round(draft.confidence * 100)}% · memory used: ${memoryUsed.profileKeyCount} profile, ${memoryUsed.workKeyCount} work, ${memoryUsed.learningRuleCount} rules`}
					action={<StatusPill status={status} />}
				/>
				<PostPreview body={draft.body} hashtags={draft.hashtags} />
				{draft.rationale && (
					<p className="mt-4 text-xs italic text-slate-500">
						Why this will work: {draft.rationale}
					</p>
				)}

				<div className="mt-5 flex flex-wrap gap-2">
					<PrimaryButton onClick={onApproveSchedule} disabled={busy}>
						<IconBrandLinkedin className="h-4 w-4" />
						Approve · schedule
					</PrimaryButton>
					<SecondaryButton onClick={onApproveNow} disabled={busy}>
						Publish now
					</SecondaryButton>
					<SecondaryButton onClick={onReject} disabled={busy}>
						Reject
					</SecondaryButton>
					<Link href={`/social/posts/${run.postRunId}`}>
						<SecondaryButton>Open post →</SecondaryButton>
					</Link>
				</div>

				{approvalChannel === "telegram" && (
					<InlineAlert
						tone="info"
						title="This draft was also sent to Telegram"
						description="You can approve / reject from your phone without coming back here."
					/>
				)}
			</SurfaceCard>

			<SurfaceCard className="lg:col-span-2">
				<SectionTitle
					title="Meta"
					description="Everything the agent attached to this run"
				/>
				<dl className="space-y-3 text-sm">
					<MetaRowItem label="Agent run id" value={run.agentRunId.slice(0, 8)} />
					<MetaRowItem label="Post id" value={`#${run.postRunId}`} />
					<MetaRowItem label="Routing" value={approvalChannel} />
					<MetaRowItem
						label="Hook"
						value={draft.hook ? `"${draft.hook}"` : "—"}
					/>
					<MetaRowItem
						label="Hashtags"
						value={
							draft.hashtags.length
								? draft.hashtags.map((t) => `#${t}`).join(" ")
								: "None"
						}
					/>
				</dl>
			</SurfaceCard>
		</div>
	);
}

function MetaRowItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
			<dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
				{label}
			</dt>
			<dd className="max-w-[60%] break-words text-right text-xs text-slate-700">
				{value}
			</dd>
		</div>
	);
}
