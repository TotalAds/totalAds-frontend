"use client";

import Link from "next/link";
import toast from "react-hot-toast";

import {
	InlineAlert,
	LoadingCardGrid,
	PageHeader,
	PageShell,
	PrimaryButton,
	SecondaryButton,
	SectionTitle,
	SurfaceCard,
} from "@/components/social/SocialUi";
import { getMemoryBrain, type MemoryBrainPayload } from "@/utils/api/socialClient";
import {
	isSocialServiceUnreachable,
	SOCIAL_SERVICE_UNAVAILABLE_MESSAGE,
} from "@/utils/social/socialServiceErrors";
import { useEffect, useState } from "react";
import { IconSparkles } from "@tabler/icons-react";

import { CustomMemorySection } from "./CustomMemorySection";
import { MemorySetupWizard } from "./MemorySetupWizard";

export default function SocialMemoryPage() {
	const [loading, setLoading] = useState(true);
	const [brain, setBrain] = useState<MemoryBrainPayload | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [showCompulsoryModal, setShowCompulsoryModal] = useState(false);

	const COMPULSORY_KEYS = [
		{ key: "founder_name", label: "Founder Name", description: "Primary name the founder goes by" },
		{ key: "product_name", label: "Product Name", description: "Product the founder is selling" },
		{ key: "icp_description", label: "ICP Description", description: "Ideal customer profile description" },
	];

	const checkCompulsoryKeys = () => {
		if (!brain) return [];
		const allItems = brain.sections.flatMap((s) => s.items);
		return COMPULSORY_KEYS.filter((ck) => {
			const item = allItems.find((i) => i.key === ck.key);
			return !item?.isSet;
		});
	};

	const load = async () => {
		try {
			setLoading(true);
			setLoadError(null);
			const data = await getMemoryBrain();
			setBrain(data);
		} catch (error) {
			const message = isSocialServiceUnreachable(error)
				? SOCIAL_SERVICE_UNAVAILABLE_MESSAGE
				: error instanceof Error
					? error.message
					: "Failed to load memory brain";
			setLoadError(message);
			setBrain(null);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	return (
		<PageShell maxWidth="7xl">
			<PageHeader
				eyebrow="AI Brand Brain"
				title="What your AI understands about your brand"
				description="This intelligence layer powers hooks, format selection, tone consistency, and natural product mentions."
				actions={
					<>
						<Link href="/social/memory/onboarding">
							<SecondaryButton>
								<IconSparkles className="h-4 w-4" />
								Full-screen setup
							</SecondaryButton>
						</Link>
						<Link href="/social/agent">
							<SecondaryButton>Agent Instructions</SecondaryButton>
						</Link>
						<SecondaryButton onClick={() => setShowCompulsoryModal(true)}>
							Required fields
						</SecondaryButton>
						<SecondaryButton onClick={load}>Refresh</SecondaryButton>
					</>
				}
			/>

			{loadError ? (
				<InlineAlert
					tone="warning"
					title="Memory brain unavailable"
					description={loadError}
					action={
						<PrimaryButton onClick={load} className="mt-2">
							Retry
						</PrimaryButton>
					}
				/>
			) : null}

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : loadError ? (
				<SurfaceCard className="p-6 text-sm text-slate-600">
					<p className="font-medium text-slate-900">Start the SocialSnipper backend</p>
					<p className="mt-2">
						Run{" "}
						<code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
							pnpm run start:dev:server
						</code>{" "}
						in{" "}
						<code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
							totalads-social-service
						</code>{" "}
						(port 3005), then click Refresh.
					</p>
				</SurfaceCard>
			) : (
				<>
					<MemorySetupWizard
						embedded
						brainStats={brain}
						onSaved={load}
					/>
					<CustomMemorySection brain={brain} onChanged={load} />
				</>
			)}

			{showCompulsoryModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
					<SurfaceCard className="w-full max-w-lg">
						<SectionTitle
							title="Required Memory Fields"
							description="These fields are required for AI to generate quality content."
						/>
						<div className="mt-4 space-y-3">
							{COMPULSORY_KEYS.map((ck) => {
								const allItems = brain?.sections.flatMap((s) => s.items) || [];
								const item = allItems.find((i) => i.key === ck.key);
								const isSet = item?.isSet ?? false;

								return (
									<div
										key={ck.key}
										className={`flex items-start gap-3 rounded-lg border p-3 ${
											isSet
												? "border-emerald-200 bg-emerald-50/50"
												: "border-amber-200 bg-amber-50/50"
										}`}
									>
										<div className="mt-0.5">
											{isSet ? (
												<svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
												</svg>
											) : (
												<svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
												</svg>
											)}
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium text-slate-800">{ck.label}</p>
											<p className="text-xs text-slate-500">{ck.description}</p>
											{isSet ? (
												<p className="mt-1 text-xs font-medium text-emerald-600">Configured</p>
											) : (
												<p className="mt-1 text-xs font-medium text-amber-600">
													Missing — complete in brand setup above
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
							<p className="text-xs text-slate-500">
								{checkCompulsoryKeys().length === 0
									? "All required fields are set."
									: `${checkCompulsoryKeys().length} required field${checkCompulsoryKeys().length === 1 ? "" : "s"} missing.`}
							</p>
							<SecondaryButton onClick={() => setShowCompulsoryModal(false)}>Close</SecondaryButton>
						</div>
					</SurfaceCard>
				</div>
			)}
		</PageShell>
	);
}
