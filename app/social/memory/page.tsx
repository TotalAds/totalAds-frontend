"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
	deprecateMemoryItem,
	getMemoryLayer,
	MemoryItem,
	MemoryLayer,
	upsertMemory,
} from "@/utils/api/socialClient";
import {
	IconBrain,
	IconPlus,
	IconSparkles,
	IconX,
} from "@tabler/icons-react";

const LAYERS: Array<{
	value: MemoryLayer;
	label: string;
	description: string;
	hint: string;
}> = [
	{
		value: "profile",
		label: "Profile",
		description: "Stable, permanent facts about the founder and product.",
		hint: "Change rarely — these drive every post.",
	},
	{
		value: "work",
		label: "Work",
		description: "What you&apos;re working on this week / this campaign.",
		hint: "Updates weekly. Scoped to a campaign when present.",
	},
	{
		value: "learning",
		label: "Learning",
		description: "Rules the system proved by observing your published posts.",
		hint: "Compiled rules live under Learning Rules.",
	},
];

export default function SocialMemoryPage() {
	const [activeLayer, setActiveLayer] = useState<MemoryLayer>("profile");
	const [items, setItems] = useState<MemoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [editor, setEditor] = useState<{
		key: string;
		value: string;
		description: string;
	} | null>(null);
	const [busy, setBusy] = useState(false);

	const load = async (layer: MemoryLayer) => {
		try {
			setLoading(true);
			const data = await getMemoryLayer(layer);
			setItems(data);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load memory");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load(activeLayer);
	}, [activeLayer]);

	const handleSave = async () => {
		if (!editor) return;
		if (!editor.key.trim()) {
			toast.error("Key is required");
			return;
		}
		try {
			setBusy(true);
			let parsedValue: unknown = editor.value.trim();
			if (editor.value.trim().startsWith("[") || editor.value.trim().startsWith("{")) {
				try {
					parsedValue = JSON.parse(editor.value);
				} catch {
					// fall back to string
				}
			}
			await upsertMemory({
				layer: activeLayer,
				key: editor.key.trim(),
				value: parsedValue,
				description: editor.description.trim() || undefined,
			});
			toast.success("Memory saved");
			setEditor(null);
			await load(activeLayer);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async (item: MemoryItem) => {
		try {
			await deprecateMemoryItem(item.layer, item.key);
			toast.success("Deprecated");
			await load(activeLayer);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Delete failed");
		}
	};

	const currentLayerMeta = LAYERS.find((l) => l.value === activeLayer)!;

	return (
		<PageShell>
			<PageHeader
				eyebrow="Memory"
				title="What the agent knows"
				description="Three layers: the founder profile (permanent), the current campaign (weekly), and the learning rules (derived from outcomes)."
				actions={
					<>
						<Link href="/social/memory/onboarding">
							<SecondaryButton>
								<IconSparkles className="h-4 w-4" />
								Onboarding wizard
							</SecondaryButton>
						</Link>
						<PrimaryButton
							onClick={() =>
								setEditor({ key: "", value: "", description: "" })
							}
						>
							<IconPlus className="h-4 w-4" />
							Add memory item
						</PrimaryButton>
					</>
				}
			/>

			{activeLayer === "learning" && (
				<InlineAlert
					tone="info"
					title="Learning memory is machine-written"
					description="Rows here are derived from your published posts. Prefer editing learning through the Learning Rules page."
					action={
						<Link href="/social/learning-rules">
							<PrimaryButton>Open Learning Rules</PrimaryButton>
						</Link>
					}
				/>
			)}

			<SurfaceCard padded={false}>
				<div className="flex flex-wrap gap-1 p-2">
					{LAYERS.map((layer) => (
						<button
							key={layer.value}
							onClick={() => setActiveLayer(layer.value)}
							className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
								activeLayer === layer.value
									? "bg-slate-900 text-white shadow-sm"
									: "text-slate-600 hover:bg-slate-100"
							}`}
						>
							{layer.label}
						</button>
					))}
				</div>
				<div className="border-t border-slate-100 px-5 py-4 text-sm">
					<p className="font-semibold text-slate-900">
						{currentLayerMeta.label} memory
					</p>
					<p className="mt-0.5 text-xs text-slate-500">
						{currentLayerMeta.description}
					</p>
					<p className="mt-1 text-[11px] text-slate-400">{currentLayerMeta.hint}</p>
				</div>
			</SurfaceCard>

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : items.length === 0 ? (
				<EmptyState
					icon={<IconBrain className="h-5 w-5" />}
					title={`No ${currentLayerMeta.label.toLowerCase()} memory yet`}
					description={
						activeLayer === "profile"
							? "Start with the onboarding wizard to capture your voice in one pass."
							: activeLayer === "work"
								? "Add a note about what you&apos;re working on this week so drafts stay on-theme."
								: "Rules here will appear automatically once the weekly learning pass runs."
					}
					action={
						activeLayer === "profile" ? (
							<Link href="/social/memory/onboarding">
								<PrimaryButton>Run onboarding wizard</PrimaryButton>
							</Link>
						) : (
							<PrimaryButton
								onClick={() => setEditor({ key: "", value: "", description: "" })}
							>
								Add first item
							</PrimaryButton>
						)
					}
				/>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					{items.map((item) => (
						<SurfaceCard key={item.id}>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-slate-900">
										{item.key}
									</p>
									{item.description && (
										<p className="mt-0.5 text-xs text-slate-500">
											{item.description}
										</p>
									)}
								</div>
								<StatusPill status={item.status} />
							</div>
							<pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
								{formatValue(item.value)}
							</pre>
							<MetaRow
								items={[
									{
										label: "Confidence",
										value: `${Math.round((item.confidence || 0) * 100)}%`,
									},
									{ label: "Evidence", value: item.evidenceCount },
									{
										label: "Updated",
										value: new Date(item.updatedAt).toLocaleDateString(),
									},
								]}
							/>
							<div className="mt-3 flex justify-end gap-2">
								<SecondaryButton
									onClick={() =>
										setEditor({
											key: item.key,
											value:
												typeof item.value === "string"
													? item.value
													: JSON.stringify(item.value, null, 2),
											description: item.description || "",
										})
									}
								>
									Edit
								</SecondaryButton>
								<DangerButton onClick={() => handleDelete(item)}>
									Deprecate
								</DangerButton>
							</div>
						</SurfaceCard>
					))}
				</div>
			)}

			{editor && (
				<Overlay onClose={() => setEditor(null)}>
					<SurfaceCard className="w-full max-w-lg">
						<SectionTitle
							title={`${currentLayerMeta.label} memory item`}
							description="Keys are stable identifiers the agent looks up (e.g. tone_keywords). Values can be a string, an array or JSON."
						/>
						<div className="space-y-3">
							<Labeled label="Key">
								<input
									value={editor.key}
									onChange={(e) =>
										setEditor((prev) =>
											prev ? { ...prev, key: e.target.value } : prev
										)
									}
									placeholder="tone_keywords"
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
								/>
							</Labeled>
							<Labeled label="Value">
								<textarea
									value={editor.value}
									onChange={(e) =>
										setEditor((prev) =>
											prev ? { ...prev, value: e.target.value } : prev
										)
									}
									rows={5}
									placeholder={
										activeLayer === "profile"
											? `["blunt", "founder-led", "no fluff"]`
											: "Short descriptor, or JSON"
									}
									className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
								/>
								<p className="mt-1 text-[11px] text-slate-400">
									JSON array / object is parsed automatically — plain text is
									saved as a string.
								</p>
							</Labeled>
							<Labeled label="Description (optional)">
								<input
									value={editor.description}
									onChange={(e) =>
										setEditor((prev) =>
											prev ? { ...prev, description: e.target.value } : prev
										)
									}
									placeholder="Short human-readable explanation"
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
								/>
							</Labeled>
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<SecondaryButton onClick={() => setEditor(null)}>
								<IconX className="h-4 w-4" />
								Cancel
							</SecondaryButton>
							<PrimaryButton onClick={handleSave} disabled={busy}>
								Save
							</PrimaryButton>
						</div>
					</SurfaceCard>
				</Overlay>
			)}
		</PageShell>
	);
}

function Labeled({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<label className="block">
			<span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
				{label}
			</span>
			{children}
		</label>
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

function formatValue(value: unknown) {
	if (value === null || value === undefined) return "";
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}
