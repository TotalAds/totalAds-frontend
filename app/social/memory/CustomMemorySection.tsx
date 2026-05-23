"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import {
	InlineAlert,
	PrimaryButton,
	SecondaryButton,
	SectionTitle,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	deprecateMemoryItem,
	upsertMemory,
	type MemoryBrainPayload,
} from "@/utils/api/socialClient";

function slugifyMemoryKey(label: string): string {
	return (
		label
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_|_$/g, "")
			.slice(0, 80) || "custom_field"
	);
}

function formatValue(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value.join("\n");
	return JSON.stringify(value, null, 2);
}

function parseValue(raw: string): unknown {
	const trimmed = raw.trim();
	if (!trimmed) return "";
	if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
		try {
			return JSON.parse(trimmed);
		} catch {
			return trimmed;
		}
	}
	return trimmed;
}

type CustomMemorySectionProps = {
	brain: MemoryBrainPayload | null;
	onChanged: () => Promise<void>;
};

export function CustomMemorySection({ brain, onChanged }: CustomMemorySectionProps) {
	const [saving, setSaving] = useState(false);
	const [deletingKey, setDeletingKey] = useState<string | null>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [newLabel, setNewLabel] = useState("");
	const [newKey, setNewKey] = useState("");
	const [newValue, setNewValue] = useState("");
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");

	const standardKeys = useMemo(() => {
		if (!brain) return new Set<string>();
		return new Set(
			brain.sections
				.filter((s) => s.id !== "custom_memory")
				.flatMap((s) => s.items.map((i) => i.key))
		);
	}, [brain]);

	const customItems = useMemo(() => {
		const section = brain?.sections.find((s) => s.id === "custom_memory");
		return section?.items ?? [];
	}, [brain]);

	const resolvedNewKey = newKey.trim() || slugifyMemoryKey(newLabel);

	const validateCustomKey = (key: string, options?: { allowExisting?: string }) => {
		if (!/^[a-z][a-z0-9_]*$/.test(key)) {
			return "Key must use lowercase letters, numbers, and underscores (start with a letter).";
		}
		if (key.startsWith("__") || key === "memory_md_source") {
			return "That key is reserved.";
		}
		if (standardKeys.has(key) && key !== options?.allowExisting) {
			return "That key is used by brand setup. Edit it in the wizard above.";
		}
		return null;
	};

	const saveEntry = async (key: string, value: string, description?: string) => {
		const keyError = validateCustomKey(key);
		if (keyError) {
			toast.error(keyError);
			return;
		}
		try {
			setSaving(true);
			await upsertMemory({
				layer: "profile",
				key,
				value: parseValue(value),
				description: description || key.replace(/_/g, " "),
			});
			toast.success("Custom memory saved");
			setShowAddForm(false);
			setNewLabel("");
			setNewKey("");
			setNewValue("");
			setEditingKey(null);
			setEditValue("");
			await onChanged();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to save custom memory");
		} finally {
			setSaving(false);
		}
	};

	const handleAdd = async () => {
		const key = resolvedNewKey;
		if (!newLabel.trim() && !newKey.trim()) {
			toast.error("Enter a field name or key");
			return;
		}
		if (!newValue.trim()) {
			toast.error("Enter a value");
			return;
		}
		if (customItems.some((i) => i.key === key)) {
			toast.error("A field with this key already exists. Edit it below or choose another key.");
			return;
		}
		await saveEntry(key, newValue, newLabel.trim() || undefined);
	};

	const handleUpdate = async (key: string, label: string) => {
		if (!editValue.trim()) {
			toast.error("Value cannot be empty");
			return;
		}
		const keyError = validateCustomKey(key, { allowExisting: key });
		if (keyError) {
			toast.error(keyError);
			return;
		}
		await saveEntry(key, editValue, label);
	};

	const handleDelete = async (key: string) => {
		try {
			setDeletingKey(key);
			await deprecateMemoryItem("profile", key);
			toast.success("Custom field removed");
			if (editingKey === key) {
				setEditingKey(null);
				setEditValue("");
			}
			await onChanged();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to remove field");
		} finally {
			setDeletingKey(null);
		}
	};

	return (
		<SurfaceCard className="mt-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<SectionTitle
					title="Custom memory"
					description="Add extra facts for your AI ghostwriter — launch notes, pricing angles, proof points, or anything not covered above."
				/>
				{!showAddForm ? (
					<PrimaryButton type="button" onClick={() => setShowAddForm(true)}>
						<IconPlus className="h-4 w-4" />
						Add field
					</PrimaryButton>
				) : null}
			</div>

			{showAddForm ? (
				<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
					<p className="text-sm font-medium text-slate-800">New custom field</p>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<label className="block">
							<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
								Label
							</span>
							<input
								value={newLabel}
								onChange={(e) => setNewLabel(e.target.value)}
								placeholder="e.g. Launch date"
								className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
							/>
						</label>
						<label className="block">
							<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
								Key (optional)
							</span>
							<input
								value={newKey}
								onChange={(e) => setNewKey(e.target.value)}
								placeholder={resolvedNewKey || "launch_date"}
								className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
							/>
							<p className="mt-1 text-[11px] text-slate-500">
								Stored as <span className="font-mono">{resolvedNewKey || "…"}</span>
							</p>
						</label>
					</div>
					<label className="block">
						<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
							Value
						</span>
						<textarea
							value={newValue}
							onChange={(e) => setNewValue(e.target.value)}
							rows={3}
							placeholder="What should the AI remember?"
							className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						/>
					</label>
					<div className="flex flex-wrap justify-end gap-2">
						<SecondaryButton
							type="button"
							onClick={() => {
								setShowAddForm(false);
								setNewLabel("");
								setNewKey("");
								setNewValue("");
							}}
						>
							Cancel
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleAdd} disabled={saving}>
							{saving ? "Saving..." : "Save field"}
						</PrimaryButton>
					</div>
				</div>
			) : null}

			{customItems.length === 0 && !showAddForm ? (
				<div className="mt-4">
					<InlineAlert
						tone="info"
						title="No custom fields yet"
						description='Use "Add field" for one-off context your brand setup does not cover.'
					/>
				</div>
			) : (
				<div className="mt-4 space-y-3">
					{customItems.map((item) => {
						const isEditing = editingKey === item.key;
						return (
							<div
								key={item.key}
								className="rounded-xl border border-slate-200 bg-white p-4"
							>
								<div className="flex flex-wrap items-start justify-between gap-2">
									<div>
										<p className="text-sm font-semibold text-slate-900">{item.label}</p>
										<p className="font-mono text-[11px] text-slate-500">{item.key}</p>
									</div>
									<div className="flex items-center gap-2">
										{!isEditing ? (
											<SecondaryButton
												type="button"
												onClick={() => {
													setEditingKey(item.key);
													setEditValue(formatValue(item.value));
												}}
											>
												Edit
											</SecondaryButton>
										) : null}
										<SecondaryButton
											type="button"
											onClick={() => handleDelete(item.key)}
											disabled={deletingKey === item.key}
											className="text-red-600 hover:text-red-700"
										>
											<IconTrash className="h-4 w-4" />
											{deletingKey === item.key ? "Removing..." : "Remove"}
										</SecondaryButton>
									</div>
								</div>
								{isEditing ? (
									<div className="mt-3 space-y-2">
										<textarea
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											rows={4}
											className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
										/>
										<div className="flex justify-end gap-2">
											<SecondaryButton
												type="button"
												onClick={() => {
													setEditingKey(null);
													setEditValue("");
												}}
											>
												Cancel
											</SecondaryButton>
											<PrimaryButton
												type="button"
												onClick={() => handleUpdate(item.key, item.label)}
												disabled={saving}
											>
												{saving ? "Saving..." : "Save"}
											</PrimaryButton>
										</div>
									</div>
								) : (
									<p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
										{item.isSet ? formatValue(item.value) : "—"}
									</p>
								)}
							</div>
						);
					})}
				</div>
			)}
		</SurfaceCard>
	);
}
