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

export default function AgentEditorPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [document, setDocument] = useState<AgentDocumentResponse | null>(null);
	const [rawContent, setRawContent] = useState("");
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

	const handleSave = async () => {
		if (rawContent.length > LIMIT) {
			toast.error(`Content exceeds ${LIMIT} character limit`);
			return;
		}

		try {
			setSaving(true);
			const result = await saveAgentDocument(rawContent);
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
			setCharCount((document?.template || "").length);
			toast.success("Reset to template");
		}
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

					<SurfaceCard>
						<div className="space-y-3">
							<SectionTitle
								title="Agent instructions"
								description="Edit your agent instructions directly using Markdown formatting."
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
					</SurfaceCard>

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
									brand memory
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
