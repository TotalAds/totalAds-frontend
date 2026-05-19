"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { IconFileText, IconHistory, IconRefresh, IconSparkles } from "@tabler/icons-react";

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
	getAgentDocument,
	saveAgentDocument,
	restoreAgentDocumentVersion,
	listAgentDocumentVersions,
	type AgentDocumentResponse,
} from "@/utils/api/socialClient";

type EditorMode = "raw" | "builder";

interface SectionField {
	id: string;
	label: string;
	placeholder: string;
	rows: number;
}

const SECTION_FIELDS: SectionField[] = [
	{
		id: "role",
		label: "Role Definition",
		placeholder: "Define the agent's role and purpose...",
		rows: 3,
	},
	{
		id: "voice",
		label: "Voice & Tone",
		placeholder: "Describe how the agent should sound...",
		rows: 4,
	},
	{
		id: "rules",
		label: "Content Rules",
		placeholder: "List specific rules and constraints...",
		rows: 6,
	},
	{
		id: "format",
		label: "Format Preferences",
		placeholder: "Describe preferred formatting...",
		rows: 3,
	},
	{
		id: "product",
		label: "Product Mention Guidelines",
		placeholder: "When and how to mention the product...",
		rows: 3,
	},
];

const DEFAULT_SECTIONS: Record<string, string> = {
	role: "## Role\nYou are a LinkedIn content strategist and ghostwriter for the founder.",
	voice: "## Voice & Tone\n- Sound like the founder, not a marketer\n- Use their actual vocabulary patterns\n- Avoid corporate buzzwords and AI-sounding phrases",
	rules: "## Content Rules\n1. Lead with insight, not the product\n2. One clear idea per post\n3. Hooks should create curiosity without clickbait\n4. CTAs should feel optional, not demanding",
	format: "## Format Preferences\n- Short paragraphs (2-3 lines max)\n- Use line breaks for rhythm\n- Occasional one-sentence paragraphs for emphasis",
	product: "## Product Mentions\n- Only mention product when there's genuine connection to insight\n- Soft mentions > Direct pitches",
};

export default function AgentEditorPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [mode, setMode] = useState<EditorMode>("raw");
	const [document, setDocument] = useState<AgentDocumentResponse | null>(null);
	const [rawContent, setRawContent] = useState("");
	const [builderSections, setBuilderSections] = useState<Record<string, string>>({});
	const [showHistory, setShowHistory] = useState(false);
	const [versions, setVersions] = useState<
		Awaited<ReturnType<typeof listAgentDocumentVersions>>
	>([]);
	const [charCount, setCharCount] = useState(0);
	const LIMIT = 6000;

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getAgentDocument();
			setDocument(data);
			setRawContent(data.current.content);
			setCharCount(data.current.charCount);

			// Parse existing content into sections for builder mode
			const sections = parseContentToSections(data.current.content);
			setBuilderSections({ ...DEFAULT_SECTIONS, ...sections });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to load agent document");
		} finally {
			setLoading(false);
		}
	}, []);

	const loadVersions = useCallback(async () => {
		try {
			const data = await listAgentDocumentVersions(10);
			setVersions(data);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to load versions");
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	useEffect(() => {
		if (showHistory) {
			loadVersions();
		}
	}, [showHistory, loadVersions]);

	const parseContentToSections = (content: string): Record<string, string> => {
		const sections: Record<string, string> = {};
		const lines = content.split("\n");
		let currentSection = "";
		let currentContent: string[] = [];

		for (const line of lines) {
			const sectionMatch = line.match(/^##\s*(.+)$/);
			if (sectionMatch) {
				if (currentSection && currentContent.length > 0) {
					sections[currentSection] = currentContent.join("\n").trim();
				}
				const sectionName = sectionMatch[1].toLowerCase().replace(/[^a-z]/g, "");
				currentSection = sectionName;
				currentContent = [];
			} else if (currentSection) {
				currentContent.push(line);
			}
		}

		if (currentSection && currentContent.length > 0) {
			sections[currentSection] = currentContent.join("\n").trim();
		}

		return sections;
	};

	const buildContentFromSections = (): string => {
		const parts: string[] = [];
		for (const field of SECTION_FIELDS) {
			const content = builderSections[field.id]?.trim();
			if (content) {
				parts.push(`## ${field.label}\n${content}`);
			}
		}
		return parts.join("\n\n");
	};

	const handleSave = async () => {
		const contentToSave = mode === "raw" ? rawContent : buildContentFromSections();

		if (contentToSave.length > LIMIT) {
			toast.error(`Content exceeds ${LIMIT} character limit`);
			return;
		}

		try {
			setSaving(true);
			const result = await saveAgentDocument(contentToSave);
			toast.success(`Saved as version ${result.version}`);
			await load();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to save");
		} finally {
			setSaving(false);
		}
	};

	const handleRestore = async (versionId: number) => {
		try {
			setSaving(true);
			const result = await restoreAgentDocumentVersion(versionId);
			toast.success(`Restored as version ${result.newVersion}`);
			setShowHistory(false);
			await load();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to restore");
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		if (confirm("Reset to default template? This will overwrite your current content.")) {
			setRawContent(document?.template || "");
			setBuilderSections(DEFAULT_SECTIONS);
			toast.success("Reset to template");
		}
	};

	const updateBuilderSection = (id: string, value: string) => {
		setBuilderSections((prev) => ({ ...prev, [id]: value }));
		// Update char count preview
		const newContent = buildContentFromSections();
		setCharCount(newContent.length);
	};

	const charCountColor =
		charCount > LIMIT * 0.95 ? "text-red-600" : charCount > LIMIT * 0.8 ? "text-amber-600" : "text-emerald-600";

	return (
		<PageShell maxWidth="6xl">
			<PageHeader
				breadcrumb={[{ label: "Memory", href: "/social/memory" }, { label: "Agent Instructions" }]}
				eyebrow="AI Agent Setup"
				title="Customize your LinkedIn ghostwriter"
				description="Edit how the AI writes on your behalf. Changes apply to new drafts immediately."
				actions={
					<>
						<SecondaryButton onClick={() => setShowHistory(!showHistory)}>
							<IconHistory className="mr-1 h-4 w-4" />
							History
						</SecondaryButton>
						<SecondaryButton onClick={handleReset}>
							<IconRefresh className="mr-1 h-4 w-4" />
							Reset
						</SecondaryButton>
						<PrimaryButton onClick={handleSave} disabled={saving || charCount > LIMIT}>
							{saving ? "Saving..." : "Save Changes"}
						</PrimaryButton>
					</>
				}
			/>

			{loading ? (
				<LoadingCardGrid cards={2} />
			) : !document ? (
				<SurfaceCard>
					<EmptyState
						icon={<IconFileText className="h-5 w-5" />}
						title="Could not load agent document"
						description="Try refreshing the page."
						action={<SecondaryButton onClick={load}>Refresh</SecondaryButton>}
					/>
				</SurfaceCard>
			) : (
				<div className="space-y-4">
					{/* Char count indicator */}
					<div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
						<div className="flex items-center gap-2">
							<span className="text-sm text-slate-600">Character count:</span>
							<span className={`font-semibold ${charCountColor}`}>
								{charCount.toLocaleString()} / {LIMIT.toLocaleString()}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-slate-500">Version {document.current.version}</span>
							<span className="text-xs text-slate-400">
								Last updated: {new Date(document.current.updatedAt).toLocaleDateString()}
							</span>
						</div>
					</div>

					{charCount > LIMIT && (
						<InlineAlert
							tone="danger"
							title="Content exceeds limit"
							description={`Your content is ${charCount - LIMIT} characters over the ${LIMIT} limit. Please trim some content before saving.`}
						/>
					)}

					{/* Editor mode tabs */}
					<div className="flex items-center gap-2 border-b border-slate-200">
						<button
							type="button"
							onClick={() => setMode("raw")}
							className={`border-b-2 px-4 py-2 text-sm font-medium ${
								mode === "raw"
									? "border-blue-600 text-blue-600"
									: "border-transparent text-slate-600 hover:text-slate-800"
							}`}
						>
							Raw Markdown
						</button>
						<button
							type="button"
							onClick={() => setMode("builder")}
							className={`border-b-2 px-4 py-2 text-sm font-medium ${
								mode === "builder"
									? "border-blue-600 text-blue-600"
									: "border-transparent text-slate-600 hover:text-slate-800"
							}`}
						>
							Section Builder
						</button>
					</div>

					{/* Editor content */}
					<SurfaceCard>
						{mode === "raw" ? (
							<div className="space-y-3">
								<SectionTitle
									title="Raw Markdown Editor"
									description="Edit the agent instructions directly using Markdown formatting."
								/>
								<textarea
									value={rawContent}
									onChange={(e) => {
										setRawContent(e.target.value);
										setCharCount(e.target.value.length);
									}}
									rows={20}
									className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm leading-relaxed outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
									placeholder="# Agent Instructions&#10;&#10;## Role&#10;Define the agent's role..."
								/>
							</div>
						) : (
							<div className="space-y-4">
								<SectionTitle
									title="Section Builder"
									description="Fill out each section to build your agent instructions."
								/>
								<div className="grid grid-cols-1 gap-4">
									{SECTION_FIELDS.map((field) => (
										<div key={field.id} className="space-y-2">
											<label className="block">
												<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
													{field.label}
												</span>
												<textarea
													value={builderSections[field.id] || ""}
													onChange={(e) => updateBuilderSection(field.id, e.target.value)}
													rows={field.rows}
													placeholder={field.placeholder}
													className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
												/>
											</label>
										</div>
									))}
								</div>
							</div>
						)}
					</SurfaceCard>

					{/* Version History Panel */}
					{showHistory && (
						<SurfaceCard>
							<SectionTitle
								title="Version History"
								description="Restore previous versions (last 10 saved)"
							/>
							{versions.length === 0 ? (
								<p className="text-sm text-slate-500">No previous versions found.</p>
							) : (
								<div className="space-y-2">
									{versions.map((version) => (
										<div
											key={version.id}
											className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
										>
											<div>
												<p className="text-sm font-medium text-slate-800">
													Version {version.version}
													{version.isCurrent && (
														<span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
															Current
														</span>
													)}
												</p>
												<p className="text-xs text-slate-500">
													{version.charCount.toLocaleString()} chars ·{" "}
													{new Date(version.createdAt).toLocaleDateString()}
												</p>
											</div>
											{!version.isCurrent && (
												<SecondaryButton
													onClick={() => handleRestore(version.id)}
													disabled={saving}
												>
													Restore
												</SecondaryButton>
											)}
										</div>
									))}
								</div>
							)}
						</SurfaceCard>
					)}

					{/* Preview / Tips */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<SurfaceCard>
							<SectionTitle title="Tips for better results" description="" />
							<ul className="space-y-2 text-sm text-slate-700">
								<li className="flex items-start gap-2">
									<IconSparkles className="mt-0.5 h-4 w-4 text-amber-500" />
									<span>
										<strong>Be specific about tone</strong> — instead of "professional,"
										try "conversational founder voice like explaining to a peer over coffee"
									</span>
								</li>
								<li className="flex items-start gap-2">
									<IconSparkles className="mt-0.5 h-4 w-4 text-amber-500" />
									<span>
										<strong>List forbidden phrases</strong> — specific words to avoid help
										the AI stay away from buzzwords you hate
									</span>
								</li>
								<li className="flex items-start gap-2">
									<IconSparkles className="mt-0.5 h-4 w-4 text-amber-500" />
									<span>
										<strong>Include examples</strong> — paste 2-3 posts you love as reference
									</span>
								</li>
							</ul>
						</SurfaceCard>

						<SurfaceCard>
							<SectionTitle title="What's this for?" description="" />
							<p className="text-sm text-slate-700">
								These instructions are prepended to every prompt the AI uses when writing
								your LinkedIn content. Think of it as the brief you give a human ghostwriter.
							</p>
							<p className="mt-2 text-sm text-slate-700">
								Combined with your{" "}
								<Link href="/social/memory" className="text-blue-600 hover:underline">
									memory.md
								</Link>{" "}
								(facts about your brand) and previous posts (for style matching), this
								creates a complete context for every new draft.
							</p>
						</SurfaceCard>
					</div>
				</div>
			)}
		</PageShell>
	);
}
