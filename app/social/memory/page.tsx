"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
	EmptyState,
	InlineAlert,
	LoadingCardGrid,
	PageHeader,
	PageShell,
	PrimaryButton,
	SecondaryButton,
	SectionTitle,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	getMemoryBrain,
	type MemoryBrainPayload,
	type MemoryBrainSection,
	upsertMemory,
} from "@/utils/api/socialClient";
import { useEffect } from "react";
import { IconBrain, IconSearch, IconSparkles } from "@tabler/icons-react";

export default function SocialMemoryPage() {
	const [loading, setLoading] = useState(true);
	const [brain, setBrain] = useState<MemoryBrainPayload | null>(null);
	const [activeSection, setActiveSection] = useState<string>("brand_product");
	const [query, setQuery] = useState("");
	const [editor, setEditor] = useState<{
		key: string;
		label: string;
		value: string;
	} | null>(null);
	const [saving, setSaving] = useState(false);

	const load = async () => {
		try {
			setLoading(true);
			const data = await getMemoryBrain();
			setBrain(data);
			if (data.sections?.[0]?.id) setActiveSection((prev) => prev || data.sections[0].id);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to load memory brain");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const active = brain?.sections.find((section) => section.id === activeSection) || brain?.sections[0];
	const filteredItems = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!active) return [];
		if (!q) return active.items;
		return active.items.filter((item) =>
			`${item.label} ${item.key} ${item.hint} ${String(item.value || "")}`.toLowerCase().includes(q)
		);
	}, [active, query]);

	const saveQuickEdit = async () => {
		if (!editor) return;
		try {
			setSaving(true);
			let nextValue: unknown = editor.value;
			if (editor.value.trim().startsWith("[") || editor.value.trim().startsWith("{")) {
				try {
					nextValue = JSON.parse(editor.value.trim());
				} catch {
					nextValue = editor.value.trim();
				}
			}
			await upsertMemory({
				layer: "profile",
				key: editor.key,
				value: nextValue,
				description: editor.label,
			});
			setEditor(null);
			toast.success("Memory updated");
			await load();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to update memory");
		} finally {
			setSaving(false);
		}
	};

	return (
		<PageShell maxWidth="7xl">
			<PageHeader
				eyebrow="AI Brand Brain"
				title="What your AI understands about your brand"
				description="This intelligence layer powers hooks, format selection, tone consistency, and natural product mentions."
				actions={
					<>
						<Link href="/social/memory/onboarding">
							<PrimaryButton>
								<IconSparkles className="h-4 w-4" />
								AI setup wizard
							</PrimaryButton>
						</Link>
						<SecondaryButton onClick={load}>Refresh</SecondaryButton>
					</>
				}
			/>

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : !brain ? (
				<SurfaceCard>
					<EmptyState
						icon={<IconBrain className="h-5 w-5" />}
						title="No memory found yet"
						description="Run the AI setup wizard to initialize your brand brain in under 3 minutes."
						action={
							<Link href="/social/memory/onboarding">
								<PrimaryButton>Start AI setup</PrimaryButton>
							</Link>
						}
					/>
				</SurfaceCard>
			) : (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
					<SurfaceCard className="lg:col-span-3">
						<SectionTitle
							title="Brain health"
							description={`${brain.completedFields}/${brain.totalFields} details configured`}
						/>
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
							<p className="text-xs uppercase tracking-wide text-slate-500">Completeness</p>
							<p className="mt-1 text-2xl font-semibold text-slate-900">{brain.completionScore}%</p>
							<p className="mt-1 text-[11px] text-slate-500">
								Weighted score (raw: {brain.rawCompletionScore ?? brain.completionScore}%)
							</p>
							<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
								<div
									className="h-full rounded-full bg-emerald-500 transition-all"
									style={{ width: `${brain.completionScore}%` }}
								/>
							</div>
						</div>
						<div className="mt-3 space-y-2 mb-2">
							{brain.sections.map((section) => (
								<button
									key={section.id}
									type="button"
									onClick={() => setActiveSection(section.id)}
									className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
										active?.id === section.id
											? "border-blue-200 bg-blue-50"
											: "border-slate-200 bg-white hover:border-slate-300"
									}`}
								>
									<div className="flex items-center justify-between">
										<span className="font-medium text-slate-800">{section.label}</span>
										<span className="text-xs text-slate-500">{section.completion}%</span>
									</div>
									<p className="mt-0.5 text-xs text-slate-500">
										{section.completed}/{section.total} filled
									</p>
								</button>
							))}
						</div>
						{brain.missing.length > 0 ? (
							<InlineAlert
								tone="info"
								title="Recommended next details"
								description={brain.missing
									.slice(0, 3)
									.map((m) => `${m.label} (${m.section})`)
									.join(", ")}
							/>
						) : null}
					</SurfaceCard>

					<SurfaceCard className="lg:col-span-9">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
							<div>
								<p className="text-lg font-semibold text-slate-900">
									{active?.label || "Memory section"}
								</p>
								<p className="text-xs text-slate-500">
									Human-readable brand intelligence used by Post Studio and Copilot.
								</p>
							</div>
							<div className="relative w-full max-w-sm">
								<IconSearch className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
								<input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search memory..."
									className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
								/>
							</div>
						</div>
						{active ? (
							<SectionFields
								section={active}
								items={filteredItems}
								onEdit={(item) =>
									setEditor({
										key: item.key,
										label: item.label,
										value:
											typeof item.value === "string"
												? item.value
												: JSON.stringify(item.value, null, 2),
									})
								}
							/>
						) : null}
					</SurfaceCard>
				</div>
			)}

			{editor ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
					<SurfaceCard className="w-full max-w-xl">
						<SectionTitle title={`Quick edit: ${editor.label}`} description="Update this memory detail in plain language." />
						<label className="block">
							<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
								Value
							</span>
							<textarea
								value={editor.value}
								onChange={(e) => setEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
								rows={6}
								className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
							/>
						</label>
						<div className="mt-4 flex justify-end gap-2">
							<SecondaryButton onClick={() => setEditor(null)}>Cancel</SecondaryButton>
							<PrimaryButton onClick={saveQuickEdit} disabled={saving}>
								{saving ? "Saving..." : "Save"}
							</PrimaryButton>
						</div>
					</SurfaceCard>
				</div>
			) : null}
		</PageShell>
	);
}

function SectionFields({
	section,
	items,
	onEdit,
}: {
	section: MemoryBrainSection;
	items: MemoryBrainSection["items"];
	onEdit: (item: MemoryBrainSection["items"][number]) => void;
}) {
	if (!items.length) {
		return (
			<EmptyState
				icon={<IconBrain className="h-5 w-5" />}
				title={`No details in ${section.label}`}
				description="Use the onboarding wizard for AI-assisted setup, or add details with quick edit."
			/>
		);
	}
	return (
		<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
			{items.map((item) => (
				<div key={item.key} className="rounded-xl border border-slate-200 bg-white p-3">
					<div className="flex items-center justify-between gap-2">
						<p className="text-sm font-semibold text-slate-900">{item.label}</p>
						<span
							className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
								item.isSet ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
							}`}
						>
							{item.isSet ? "Configured" : "Missing"}
						</span>
					</div>
					<p className="mt-1 text-xs text-slate-500">{item.hint}</p>
					<p className="mt-1 text-[11px] text-slate-400">
						Used in {Number(item.usedInPostsCount || 0)} post
						{Number(item.usedInPostsCount || 0) === 1 ? "" : "s"}
						{Array.isArray(item.usedInPosts) && item.usedInPosts.length
							? ` · recent IDs: ${item.usedInPosts.join(", ")}`
							: ""}
					</p>
					<p className="mt-2 min-h-[36px] text-sm text-slate-700">
						{item.isSet
							? typeof item.value === "string"
								? item.value
								: JSON.stringify(item.value)
							: "Add this detail to improve content quality."}
					</p>
					<div className="mt-3 flex justify-end">
						<SecondaryButton onClick={() => onEdit(item)}>
							{item.isSet ? "Edit" : "Add"}
						</SecondaryButton>
					</div>
				</div>
			))}
		</div>
	);
}
