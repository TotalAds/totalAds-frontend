"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
	InlineAlert,
	PageHeader,
	PageShell,
	PrimaryButton,
	SecondaryButton,
	SectionTitle,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	enrichMemoryFromWebsite,
	getProfileMemory,
	getSocialAccess,
	saveMemoryOnboarding,
	uploadBrandLogo,
	type MemoryBrainPayload,
} from "@/utils/api/socialClient";

const DRAFT_KEY = "social_memory_onboarding_draft_v2";

const GOAL_OPTIONS = [
	"Build authority",
	"Generate leads",
	"Grow audience",
	"Increase engagement",
	"Promote product",
	"Build trust",
	"Educate audience",
	"Drive website traffic",
];
const TONE_OPTIONS = [
	"Professional",
	"Founder-led",
	"Casual",
	"Contrarian",
	"Analytical",
	"Educational",
	"Technical",
	"Bold",
	"Storytelling",
	"Opinionated",
];
const FORMAT_OPTIONS = [
	"Storytelling",
	"Contrarian opinion",
	"Founder insight",
	"Case study",
	"Problem → Solution",
	"Listicle",
	"Framework breakdown",
	"Data-backed insight",
	"Tactical guide",
];
const PILLAR_OPTIONS = [
	"Founder lessons",
	"Industry insights",
	"Customer pain points",
	"How-to education",
	"Product strategy",
	"Case studies",
	"Behind the scenes",
	"Myth vs reality",
];

function parseMemoryStringList(value: unknown): string[] {
	if (value == null) return [];
	if (Array.isArray(value)) {
		return value.map((entry) => String(entry).trim()).filter(Boolean);
	}
	if (typeof value === "string") {
		return value
			.split(/[,\n]/)
			.map((entry) => entry.trim())
			.filter(Boolean);
	}
	return [String(value).trim()].filter(Boolean);
}

/** Map stored values onto canonical chip labels (case-insensitive). */
function matchChipOptions(parts: string[], options: readonly string[]): string[] {
	const byLower = new Map(options.map((option) => [option.toLowerCase(), option]));
	const matched: string[] = [];
	for (const part of parts) {
		const hit = byLower.get(part.toLowerCase());
		if (hit && !matched.includes(hit)) matched.push(hit);
	}
	return matched;
}

type StepId = "basics" | "autofill" | "audience" | "tone" | "review";

const STEPS: Array<{ id: StepId; label: string; description: string }> = [
	{ id: "basics", label: "Brand basics", description: "Minimal setup to start smart autofill" },
	{ id: "autofill", label: "AI autofill", description: "Review and accept AI suggestions" },
	{ id: "audience", label: "Audience & goals", description: "Select who you want to influence" },
	{ id: "tone", label: "Tone & style", description: "Train your ghostwriter voice" },
	{ id: "review", label: "Review", description: "Save and start generating better posts" },
];

type Form = {
	founderName: string;
	companyName: string;
	productName: string;
	website: string;
	productCategory: string;
	linkedinHeadline: string;
	oneLineDescription: string;
	detailedDescription: string;
	icpDescription: string;
	targetAudience: string;
	industry: string;
	brandPositioning: string;
	usp: string;
	preferredCtaStyle: string;
	postFormatPreference: string;
	keyPainPointsRaw: string;
	productFeaturesRaw: string;
	competitorsRaw: string;
	contentPillars: string[];
	goalTags: string[];
	toneTags: string[];
	forbiddenPhrasesRaw: string;
	writingPreferences: string;
	founderProfile: string;
	// Brand recognition fields (v1.1)
	instagramHandle: string;
	brandLogoUrl: string;
	brandLogoFile: File | null;
	// Brand visual identity fields (v1.2) - stored in social_memory_items
	mobileNumber: string;
	brandColor: string;
	// Note: includeContactInImage is now controlled per-post on the post detail page
};

const initialForm: Form = {
	founderName: "",
	companyName: "",
	productName: "",
	website: "",
	productCategory: "",
	linkedinHeadline: "",
	oneLineDescription: "",
	detailedDescription: "",
	icpDescription: "",
	targetAudience: "",
	industry: "",
	brandPositioning: "",
	usp: "",
	preferredCtaStyle: "",
	postFormatPreference: "",
	keyPainPointsRaw: "",
	productFeaturesRaw: "",
	competitorsRaw: "",
	contentPillars: [],
	goalTags: [],
	toneTags: [],
	forbiddenPhrasesRaw: "",
	writingPreferences: "",
	founderProfile: "",
	// Brand recognition fields (v1.1)
	instagramHandle: "",
	brandLogoUrl: "",
	brandLogoFile: null,
	// Brand visual identity fields (v1.2)
	mobileNumber: "",
	brandColor: "",
	// Note: includeContactInImage is now controlled per-post on the post detail page
};

export type MemorySetupWizardProps = {
	/** Renders inside memory page (no outer page shell/header). */
	embedded?: boolean;
	/** Called after a successful save when embedded. */
	onSaved?: () => void;
	/** Optional brain stats for completeness banner. */
	brainStats?: MemoryBrainPayload | null;
};

export function MemorySetupWizard({
	embedded = false,
	onSaved,
	brainStats = null,
}: MemorySetupWizardProps) {
	const router = useRouter();
	const [stepIdx, setStepIdx] = useState(0);
	const [form, setForm] = useState<Form>(initialForm);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [enriching, setEnriching] = useState(false);
	const [enrichment, setEnrichment] = useState<{
		summary?: string;
		suggestions?: Record<string, { value: string | string[]; confidence: number; reason: string }>;
		recommendedMissing?: string[];
	} | null>(null);
	const [appliedSuggestionKeys, setAppliedSuggestionKeys] = useState<string[]>([]);

	const step = STEPS[stepIdx];

	const update = <K extends keyof Form>(key: K, value: Form[K]) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const toList = (raw: string) =>
		raw
			.split(/[,\n]/)
			.map((s) => s.trim())
			.filter(Boolean);

	const completionScore = useMemo(() => {
		const checks = [
			form.founderName,
			form.companyName,
			form.productName,
			form.website,
			form.icpDescription,
			form.targetAudience,
			form.brandPositioning,
			form.preferredCtaStyle,
			form.postFormatPreference,
			form.goalTags.length ? "ok" : "",
			form.toneTags.length ? "ok" : "",
			form.contentPillars.length ? "ok" : "",
		];
		const done = checks.filter((x) => String(x).trim().length > 0).length;
		return Math.round((done / checks.length) * 100);
	}, [form]);

	useEffect(() => {
		if (embedded) return;
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				setForm((prev) => ({ ...prev, ...parsed, brandLogoFile: null }));
			}
		} catch {
			// ignore local draft parse errors
		}
	}, [embedded]);

	useEffect(() => {
		if (embedded) return;
		localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, brandLogoFile: null }));
	}, [form, embedded]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				if (!embedded) {
					const access = await getSocialAccess();
					if (!access.enabled) {
						if (!cancelled) {
							toast.error("SocialSnipper is not enabled for your account.");
							router.replace("/social/dashboard");
						}
						return;
					}
				}
				const items = await getProfileMemory();
				if (cancelled || !items.length) return;
				const map = new Map(items.map((item) => [item.key, item.value]));
				const asText = (v: unknown) =>
					Array.isArray(v) ? v.join("\n") : typeof v === "string" ? v : v ? String(v) : "";
				setForm((prev) => ({
					...prev,
					founderName: String(map.get("founder_name") ?? prev.founderName),
					companyName: String(map.get("company") ?? prev.companyName),
					productName: String(map.get("product_name") ?? prev.productName),
					website: String(map.get("company_website") ?? prev.website),
					productCategory: String(map.get("product_category") ?? prev.productCategory),
					linkedinHeadline: String(map.get("linkedin_headline") ?? prev.linkedinHeadline),
					icpDescription: String(map.get("icp_description") ?? prev.icpDescription),
					targetAudience: String(map.get("target_audience") ?? prev.targetAudience),
					industry: String(map.get("industry") ?? prev.industry),
					brandPositioning: String(map.get("brand_positioning") ?? prev.brandPositioning),
					usp: String(map.get("usp") ?? prev.usp),
					preferredCtaStyle: String(map.get("preferred_cta_style") ?? prev.preferredCtaStyle),
					postFormatPreference: String(
						map.get("post_format_preference") ?? prev.postFormatPreference
					),
					keyPainPointsRaw: asText(map.get("key_pain_points")) || prev.keyPainPointsRaw,
					productFeaturesRaw: asText(map.get("product_features")) || prev.productFeaturesRaw,
					competitorsRaw: asText(map.get("competitors")) || prev.competitorsRaw,
					founderProfile: String(map.get("founder_profile") ?? prev.founderProfile),
					writingPreferences: String(
						map.get("writing_preferences") ?? prev.writingPreferences
					),
					forbiddenPhrasesRaw: asText(map.get("forbidden_phrases")) || prev.forbiddenPhrasesRaw,
					contentPillars: map.has("content_pillars")
						? matchChipOptions(
								parseMemoryStringList(map.get("content_pillars")),
								PILLAR_OPTIONS
							)
						: prev.contentPillars,
					goalTags: map.has("user_goals")
						? matchChipOptions(parseMemoryStringList(map.get("user_goals")), GOAL_OPTIONS)
						: prev.goalTags,
					toneTags: map.has("tone_keywords")
						? matchChipOptions(parseMemoryStringList(map.get("tone_keywords")), TONE_OPTIONS)
						: prev.toneTags,
					// Brand recognition fields (v1.1)
					instagramHandle: String(map.get("instagram_handle") ?? prev.instagramHandle).replace(/^@/, ""),
					brandLogoUrl: String(map.get("brand_logo_url") ?? prev.brandLogoUrl),
					// Brand visual identity fields (v1.2)
					mobileNumber: String(map.get("mobile_number") ?? prev.mobileNumber),
					brandColor: String(map.get("brand_color") ?? prev.brandColor),
					// Note: includeContactInImage is now controlled per-post on the post detail page
				}));
			} catch (error) {
				if (!cancelled) {
					toast.error(error instanceof Error ? error.message : "Failed to load memory");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [router, embedded]);

	const runAutofill = async () => {
		try {
			setEnriching(true);
			const data = await enrichMemoryFromWebsite({
				website: form.website || undefined,
				companyName: form.companyName || undefined,
				productName: form.productName || undefined,
				founderName: form.founderName || undefined,
				linkedinHeadline: form.linkedinHeadline || undefined,
			});
			setEnrichment(data);
			setAppliedSuggestionKeys([]);
			toast.success("AI suggestions ready");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "AI autofill failed");
		} finally {
			setEnriching(false);
		}
	};

	const applySuggestion = (
		key: string,
		value: string | string[],
		options?: { silent?: boolean }
	) => {
		const text = Array.isArray(value) ? value.join("\n") : value;
		if (key === "companyName") update("companyName", text);
		if (key === "productName") update("productName", text);
		if (key === "productCategory") update("productCategory", text);
		if (key === "icpDescription") update("icpDescription", text);
		if (key === "targetAudience") update("targetAudience", text);
		if (key === "brandPositioning") update("brandPositioning", text);
		if (key === "competitors") update("competitorsRaw", text);
		if (key === "keyPainPoints") update("keyPainPointsRaw", text);
		if (key === "contentPillars")
			update("contentPillars", Array.isArray(value) ? value : toList(text));
		if (key === "toneKeywords")
			update("toneTags", Array.isArray(value) ? value : toList(text));
		if (key === "preferredCtaStyle") update("preferredCtaStyle", text);
		if (key === "postFormatPreference") update("postFormatPreference", text);
		if (key === "userGoals")
			update("goalTags", Array.isArray(value) ? value : toList(text));
		if (key === "oneLineDescription") update("oneLineDescription", text);
		if (key === "detailedDescription") update("detailedDescription", text);
		if (key === "industry") update("industry", text);
		if (key === "usp") update("usp", text);
		if (!appliedSuggestionKeys.includes(key)) {
			setAppliedSuggestionKeys((prev) => [...prev, key]);
		}
		if (!options?.silent) {
			toast.success(`Applied suggestion: ${key}`);
		}
	};

	const applyAllHighConfidenceSuggestions = (minConfidence = 0.7) => {
		if (!enrichment?.suggestions) {
			toast("Generate AI suggestions first.");
			return;
		}
		let applied = 0;
		for (const [key, suggestion] of Object.entries(enrichment.suggestions)) {
			if (Number(suggestion.confidence || 0) >= minConfidence) {
				applySuggestion(key, suggestion.value, { silent: true });
				applied += 1;
			}
		}
		if (!applied) {
			toast("No suggestions met that confidence threshold.");
			return;
		}
		toast.success(`Applied ${applied} high-confidence suggestion${applied === 1 ? "" : "s"}`);
	};

	const applyAllSuggestions = () => {
		if (!enrichment?.suggestions) {
			toast("Generate AI suggestions first.");
			return;
		}
		let applied = 0;
		for (const [key, suggestion] of Object.entries(enrichment.suggestions)) {
			applySuggestion(key, suggestion.value, { silent: true });
			applied += 1;
		}
		toast.success(`Applied ${applied} AI suggestion${applied === 1 ? "" : "s"}`);
		goNext();
	};

	const onSave = async () => {
		try {
			setSaving(true);

			// Upload logo if a file is selected
			let brandLogoUrl = form.brandLogoUrl;
			if (form.brandLogoFile) {
				const uploadResult = await uploadBrandLogo({
					file: form.brandLogoFile,
					mimeType: form.brandLogoFile.type as
						| "image/png"
						| "image/jpeg"
						| "image/jpg"
						| "image/webp",
				});
				brandLogoUrl = uploadResult.publicUrl;
			}

		await saveMemoryOnboarding({
				founderName: form.founderName || "Founder",
				companyName: form.companyName || undefined,
				productName: form.productName || undefined,
				website: form.website || undefined,
				productCategory: form.productCategory || undefined,
				linkedinHeadline: form.linkedinHeadline || undefined,
				icpDescription: form.icpDescription || undefined,
				targetAudience: form.targetAudience || undefined,
				industry: form.industry || undefined,
				brandPositioning: form.brandPositioning || undefined,
				usp: form.usp || undefined,
				preferredCtaStyle: form.preferredCtaStyle || undefined,
				postFormatPreference: form.postFormatPreference || undefined,
				keyPainPoints: toList(form.keyPainPointsRaw),
				productFeatures: toList(form.productFeaturesRaw),
				competitors: toList(form.competitorsRaw),
				founderProfile: form.founderProfile || undefined,
				writingPreferences: form.writingPreferences || undefined,
				contentPillars: form.contentPillars,
				toneKeywords: form.toneTags,
				forbiddenPhrases: toList(form.forbiddenPhrasesRaw),
				brandTone: form.toneTags.join(", ") || undefined,
				userGoals: form.goalTags.length ? form.goalTags : undefined,
				// Brand recognition fields (v1.1)
				instagramHandle: form.instagramHandle || undefined,
				brandLogoUrl: brandLogoUrl || undefined,
				// Brand visual identity fields (v1.2)
				mobileNumber: form.mobileNumber || undefined,
				brandColor: form.brandColor || undefined,
				// Note: includeContactInImage is now controlled per-post on the post detail page
			});
			if (!embedded) localStorage.removeItem(DRAFT_KEY);
			toast.success("AI Brand Brain saved");
			if (embedded) {
				onSaved?.();
			} else {
				router.push("/social/memory");
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to save onboarding");
		} finally {
			setSaving(false);
		}
	};

	const goNext = () => setStepIdx((idx) => Math.min(idx + 1, STEPS.length - 1));
	const goBack = () => setStepIdx((idx) => Math.max(idx - 1, 0));

	const completionTitle = embedded && brainStats
		? `Brain completeness: ${brainStats.completionScore}%`
		: `Setup progress: ${completionScore}%`;
	const completionDescription = embedded && brainStats
		? `${brainStats.completedFields}/${brainStats.totalFields} details configured. Update fields below — same guided flow as setup.`
		: "Everything is optional. Skip anything and refine later from the AI Brand Brain dashboard.";

	const wizardCard = (
			<SurfaceCard padded={false}>
				<div className="border-b border-slate-100 px-5 py-4">
					<div className="flex flex-wrap gap-2">
						{STEPS.map((s, index) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setStepIdx(index)}
								className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
									index === stepIdx
										? "bg-slate-900 text-white"
										: index < stepIdx
											? "bg-emerald-100 text-emerald-700"
											: "bg-slate-100 text-slate-600"
								}`}
							>
								{s.label}
							</button>
						))}
					</div>
					<p className="mt-2 text-xs text-slate-500">{step.description}</p>
				</div>
				<div className="p-5 md:p-6">
					{loading ? (
						<p className="text-sm text-slate-500">Loading your existing memory...</p>
					) : step.id === "basics" ? (
						<BasicsStep form={form} update={update} onQuickSkip={goNext} />
					) : step.id === "autofill" ? (
						<AutofillStep
							form={form}
							runAutofill={runAutofill}
							enriching={enriching}
							enrichment={enrichment}
							applySuggestion={applySuggestion}
							applyAllHighConfidence={applyAllHighConfidenceSuggestions}
							applyAllSuggestions={applyAllSuggestions}
							appliedSuggestionKeys={appliedSuggestionKeys}
							onSkip={goNext}
						/>
					) : step.id === "audience" ? (
						<AudienceStep form={form} update={update} />
					) : step.id === "tone" ? (
						<ToneStep form={form} update={update} />
					) : (
						<ReviewStep form={form} />
					)}
				</div>
				<div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
					<SecondaryButton onClick={goBack} disabled={stepIdx === 0}>
						Back
					</SecondaryButton>
					<div className="flex items-center gap-2">
						{step.id !== "review" ? (
							<>
								<SecondaryButton onClick={goNext}>Skip</SecondaryButton>
								<PrimaryButton onClick={goNext}>Continue</PrimaryButton>
							</>
						) : (
							<PrimaryButton onClick={onSave} disabled={saving}>
								{saving ? "Saving..." : embedded ? "Save changes" : "Save AI Brand Brain"}
							</PrimaryButton>
						)}
					</div>
				</div>
			</SurfaceCard>
	);

	if (embedded) {
		return (
			<div className="space-y-4">
				<InlineAlert tone="info" title={completionTitle} description={completionDescription} />
				{wizardCard}
			</div>
		);
	}

	return (
		<PageShell maxWidth="6xl">
			<PageHeader
				breadcrumb={[{ label: "Memory", href: "/social/memory" }, { label: "AI Brand Brain Setup" }]}
				eyebrow="AI Brand Brain"
				title="Train your LinkedIn ghostwriter"
				description="2-3 minute setup. Mostly verify AI suggestions instead of filling long forms."
			/>
			<InlineAlert tone="info" title={completionTitle} description={completionDescription} />
			{wizardCard}
		</PageShell>
	);
}

function BasicsStep({
	form,
	update,
	onQuickSkip,
}: {
	form: Form;
	update: <K extends keyof Form>(key: K, value: Form[K]) => void;
	onQuickSkip: () => void;
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Please upload an image file");
			return;
		}

		// Validate file size (max 8MB)
		if (file.size > 8 * 1024 * 1024) {
			toast.error("Logo image must be under 8MB");
			return;
		}

		update("brandLogoFile", file);

		// Create preview URL
		const reader = new FileReader();
		reader.onload = () => {
			update("brandLogoUrl", reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const normalizeInstagram = (handle: string): string => {
		return handle.replace(/^@/, "").trim();
	};

	return (
		<div className="space-y-4">
			<SectionTitle
				title="Start with the essentials"
				description="Add just a few details, then AI prepares a full first draft of your brand memory."
			/>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<Input label="Founder name *" value={form.founderName} onChange={(v) => update("founderName", v)} placeholder="e.g. Rehan Qureshi" />
				<Input label="Company name" value={form.companyName} onChange={(v) => update("companyName", v)} placeholder="e.g. TotalAds" />
				<Input label="Product name" value={form.productName} onChange={(v) => update("productName", v)} placeholder="e.g. SocialSnipper" />
				<Input label="Website" value={form.website} onChange={(v) => update("website", v)} placeholder="https://..." />
				<Input label="LinkedIn headline (optional)" value={form.linkedinHeadline} onChange={(v) => update("linkedinHeadline", v)} placeholder="Founder @ ..." />
				<Input
					label="What does your product do? (optional)"
					value={form.oneLineDescription}
					onChange={(v) => update("oneLineDescription", v)}
					placeholder="One-line product summary"
				/>
				<Input
					label="Primary audience (optional)"
					value={form.targetAudience}
					onChange={(v) => update("targetAudience", v)}
					placeholder="Who you want to reach"
				/>
				<Input
					label="Product category (optional)"
					value={form.productCategory}
					onChange={(v) => update("productCategory", v)}
					placeholder="e.g. B2B SaaS"
				/>
			</div>

			{/* Brand Recognition Section (v1.1) */}
			<div className="mt-6 border-t border-slate-200 pt-6">
				<SectionTitle
					title="Brand Recognition (optional)"
					description="Add your logo and social handles for better brand awareness."
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{/* Logo Upload */}
					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand Logo</p>
						<div className="flex items-center gap-3">
							{form.brandLogoUrl ? (
								<div className="relative">
									<img
										src={form.brandLogoUrl}
										alt="Brand logo preview"
										className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
									/>
									<button
										type="button"
										onClick={() => {
											update("brandLogoUrl", "");
											update("brandLogoFile", null);
										}}
										className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
									>
										<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50"
								>
									<svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
								</button>
							)}
							<div className="flex-1">
								<p className="text-sm text-slate-600">
									{form.brandLogoUrl ? "Logo selected" : "Upload your brand logo"}
								</p>
								<p className="text-xs text-slate-400">PNG, JPG, or WebP. Max 8MB.</p>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg,image/jpg,image/webp"
								onChange={handleLogoUpload}
								className="hidden"
							/>
						</div>
					</div>

				{/* Instagram Handle */}
				<div>
					<Input
						label="Instagram handle"
						value={form.instagramHandle}
						onChange={(v) => update("instagramHandle", normalizeInstagram(v))}
						placeholder="@yourhandle"
					/>
				</div>
			</div>

			{/* Brand Visual Identity Section (v1.2) */}
			<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
				{/* Mobile Number */}
				<div>
					<Input
						label="Mobile number"
						value={form.mobileNumber}
						onChange={(v) => update("mobileNumber", v)}
						placeholder="+1 234 567 8900"
					/>
				</div>
				<div>
					<Input
						label="USP (optional)"
						value={form.usp}
						onChange={(v) => update("usp", v)}
						placeholder="What makes you different"
					/>
				</div>
				{/* Brand Color */}
				<div>
					<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
						Brand color
					</label>
					<div className="flex items-center gap-2">
						<input
							type="color"
							value={form.brandColor || "#6366f1"}
							onChange={(e) => update("brandColor", e.target.value)}
							className="h-9 w-14 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
						/>
						<input
							type="text"
							value={form.brandColor}
							onChange={(e) => update("brandColor", e.target.value)}
							placeholder="#6366f1"
							className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						/>
				</div>
			</div>
		</div>
	</div>

	<InlineAlert
		tone="info"
		title="How AI autofill works"
		description="AI uses your website + company/product basics + headline + product summary to infer category, ICP, tone, pillars, and positioning."
		action={<SecondaryButton onClick={onQuickSkip}>Continue with current info</SecondaryButton>}
	/>
</div>
);
}

function AutofillStep({
	form,
	runAutofill,
	enriching,
	enrichment,
	applySuggestion,
	applyAllHighConfidence,
	applyAllSuggestions,
	appliedSuggestionKeys,
	onSkip,
}: {
	form: Form;
	runAutofill: () => Promise<void>;
	enriching: boolean;
	enrichment: {
		summary?: string;
		suggestions?: Record<string, { value: string | string[]; confidence: number; reason: string }>;
		recommendedMissing?: string[];
	} | null;
	applySuggestion: (
		key: string,
		value: string | string[],
		options?: { silent?: boolean }
	) => void;
	applyAllHighConfidence: (minConfidence?: number) => void;
	applyAllSuggestions: () => void;
	appliedSuggestionKeys: string[];
	onSkip: () => void;
}) {
	const totalSuggestions = enrichment?.suggestions
		? Object.keys(enrichment.suggestions).length
		: 0;
	const appliedCount = appliedSuggestionKeys.length;

	const contextSignals = [
		{ label: "Website", value: form.website },
		{ label: "Company", value: form.companyName },
		{ label: "Product", value: form.productName },
		{ label: "Founder", value: form.founderName },
		{ label: "Headline", value: form.linkedinHeadline },
		{ label: "Product summary", value: form.oneLineDescription },
		{ label: "Audience", value: form.targetAudience },
	].filter((signal) => String(signal.value || "").trim().length > 0);

	return (
		<div className="space-y-4">
			<SectionTitle title="AI autofill suggestions" description="We prefill most fields so you mostly approve/edit instead of typing." />
			{totalSuggestions > 0 ? (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
					<p className="text-sm font-semibold text-emerald-800">
						Applied {appliedCount} / {totalSuggestions} suggestions
					</p>
					<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
						<div
							className="h-full rounded-full bg-emerald-500 transition-all"
							style={{
								width: `${Math.round((appliedCount / Math.max(totalSuggestions, 1)) * 100)}%`,
							}}
						/>
					</div>
				</div>
			) : null}
			<div className="rounded-xl border border-slate-200 bg-white p-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
					Context signals used for autofill ({contextSignals.length})
				</p>
				<div className="mt-2 flex flex-wrap gap-2">
					{contextSignals.length ? (
						contextSignals.map((signal) => (
							<span
								key={signal.label}
								className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
							>
								{signal.label}
							</span>
						))
					) : (
						<span className="text-xs text-slate-500">
							Add at least website/company/product in the previous step for stronger suggestions.
						</span>
					)}
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
				<PrimaryButton onClick={runAutofill} disabled={enriching}>
					{enriching ? "Generating suggestions..." : "Generate AI suggestions"}
				</PrimaryButton>
				<SecondaryButton onClick={() => applyAllHighConfidence(0.7)}>
					Apply all high-confidence
				</SecondaryButton>
				<SecondaryButton onClick={applyAllSuggestions}>Use all suggestions & continue</SecondaryButton>
				<SecondaryButton onClick={onSkip}>Skip for now</SecondaryButton>
			</div>
			{enrichment?.summary ? (
				<InlineAlert tone="info" title="AI summary" description={enrichment.summary} />
			) : null}
			{enrichment?.suggestions ? (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					{Object.entries(enrichment.suggestions).map(([key, suggestion]) => (
						<div key={key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
							<div className="flex items-center justify-between gap-2">
								<p className="text-sm font-semibold text-slate-900">
									{key
										.replace(/([A-Z])/g, " $1")
										.replace(/_/g, " ")
										.replace(/\b\w/g, (c) => c.toUpperCase())
										.trim()}
								</p>
								<span
									className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
										Number(suggestion.confidence || 0) >= 0.7
											? "bg-emerald-100 text-emerald-700"
											: "bg-amber-100 text-amber-700"
									}`}
								>
									AI confidence {Math.round((suggestion.confidence || 0) * 100)}%
								</span>
							</div>
							<p className="mt-2 text-sm text-slate-700">
								{Array.isArray(suggestion.value) ? suggestion.value.join(", ") : suggestion.value}
							</p>
							<p className="mt-1 text-xs text-slate-500">Why suggested: {suggestion.reason}</p>
							<div className="mt-3 flex items-center gap-2">
								<SecondaryButton onClick={() => applySuggestion(key, suggestion.value)}>
									{appliedSuggestionKeys.includes(key) ? "Applied" : "Use this suggestion"}
								</SecondaryButton>
								<SecondaryButton onClick={() => toast("Skipped. You can always apply it later.")}>
									Skip
								</SecondaryButton>
							</div>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}

function AudienceStep({
	form,
	update,
}: {
	form: Form;
	update: <K extends keyof Form>(key: K, value: Form[K]) => void;
}) {
	return (
		<div className="space-y-4">
			<SectionTitle title="Audience & content goals" description="Pick options quickly. Add details only if you want." />
			<ChipGroup label="Content goals" options={GOAL_OPTIONS} values={form.goalTags} onChange={(values) => update("goalTags", values)} />
			<ChipGroup label="Content pillars" options={PILLAR_OPTIONS} values={form.contentPillars} onChange={(values) => update("contentPillars", values)} />
			<TextArea label="ICP description" value={form.icpDescription} onChange={(v) => update("icpDescription", v)} placeholder="Who do you help most?" />
			<TextArea label="Target audience roles" value={form.targetAudience} onChange={(v) => update("targetAudience", v)} placeholder="Founders, CMOs, RevOps leaders..." />
			<TextArea label="Pain points solved" value={form.keyPainPointsRaw} onChange={(v) => update("keyPainPointsRaw", v)} placeholder="One per line or comma-separated" />
		</div>
	);
}

function ToneStep({
	form,
	update,
}: {
	form: Form;
	update: <K extends keyof Form>(key: K, value: Form[K]) => void;
}) {
	return (
		<div className="space-y-4">
			<SectionTitle title="Tone, style, and strategy" description="Train how your AI ghostwriter should sound and sell." />
			<ChipGroup label="Tone chips" options={TONE_OPTIONS} values={form.toneTags} onChange={(values) => update("toneTags", values)} />
			<ChipGroup label="Preferred formats" options={FORMAT_OPTIONS} values={form.postFormatPreference ? [form.postFormatPreference] : []} onChange={(values) => update("postFormatPreference", values.join(", "))} singleSelect />
			<Input label="Preferred CTA style" value={form.preferredCtaStyle} onChange={(v) => update("preferredCtaStyle", v)} placeholder="e.g. soft CTA with optional DM prompt" />
			<TextArea label="Product positioning" value={form.brandPositioning} onChange={(v) => update("brandPositioning", v)} placeholder="How should your product be positioned in posts?" />
			<TextArea label="Words or phrases to avoid" value={form.forbiddenPhrasesRaw} onChange={(v) => update("forbiddenPhrasesRaw", v)} placeholder="List words to avoid" />
		</div>
	);
}

function ReviewStep({ form }: { form: Form }) {
	const rows = [
		["Founder", form.founderName],
		["Company", form.companyName],
		["Product", form.productName],
		["Website", form.website],
		["Category", form.productCategory],
		["ICP", form.icpDescription],
		["Audience", form.targetAudience],
		["Tone", form.toneTags.join(", ")],
		["Goals", form.goalTags.join(", ")],
		["Pillars", form.contentPillars.join(", ")],
		["Preferred formats", form.postFormatPreference],
		["CTA style", form.preferredCtaStyle],
		// Brand recognition fields (v1.1)
		["Instagram", form.instagramHandle ? `@${form.instagramHandle}` : ""],
		["Brand Logo", form.brandLogoUrl ? "Uploaded" : ""],
	];
	return (
		<div className="space-y-4">
			<SectionTitle title="Final review" description="Save now, and refine anytime from your AI Brand Brain dashboard." />
			<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
				{rows.map(([label, value]) => (
					<div key={label} className="grid grid-cols-1 gap-1 border-b border-slate-200 py-2 text-sm last:border-0 md:grid-cols-3">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
						<span className="md:col-span-2 text-slate-800">{value || <span className="text-slate-400">Not set</span>}</span>
					</div>
				))}
			</div>
			{form.brandLogoUrl && (
				<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
					<img
						src={form.brandLogoUrl.startsWith("data:") ? form.brandLogoUrl : form.brandLogoUrl}
						alt="Brand logo"
						className="h-12 w-12 rounded-lg object-cover"
					/>
					<div>
						<p className="text-sm font-medium text-slate-800">Brand Logo</p>
						<p className="text-xs text-slate-500">Will be uploaded when you save</p>
					</div>
				</div>
			)}
			<InlineAlert tone="info" title="What happens next?" description="Post Studio and Copilot will use this context for hooks, format selection, CTA style, and natural product mentions." />
		</div>
	);
}

function Input({
	label,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}) {
	return (
		<label className="block">
			<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
			/>
		</label>
	);
}

function TextArea({
	label,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}) {
	return (
		<label className="block">
			<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				rows={3}
				className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
			/>
		</label>
	);
}

function ChipGroup({
	label,
	options,
	values,
	onChange,
	singleSelect,
}: {
	label: string;
	options: string[];
	values: string[];
	onChange: (values: string[]) => void;
	singleSelect?: boolean;
}) {
	return (
		<div>
			<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
			<div className="flex flex-wrap gap-2">
				{options.map((option) => {
					const active = values.includes(option);
					return (
						<button
							key={option}
							type="button"
							onClick={() => {
								if (singleSelect) {
									onChange(active ? [] : [option]);
									return;
								}
								onChange(active ? values.filter((v) => v !== option) : [...values, option]);
							}}
							className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
								active
									? "border-blue-600 bg-blue-600 text-white"
									: "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
							}`}
						>
							{option}
						</button>
					);
				})}
			</div>
		</div>
	);
}
