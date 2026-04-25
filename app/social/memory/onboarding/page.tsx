"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { getProfileMemory, saveMemoryOnboarding } from "@/utils/api/socialClient";

const STEPS = [
	"Identity",
	"Audience",
	"Tone",
	"Format + CTA",
	"Review",
] as const;

type Step = (typeof STEPS)[number];

interface OnboardingForm {
	founderName: string;
	productName: string;
	linkedinHeadline: string;
	icpDescription: string;
	toneKeywordsRaw: string;
	forbiddenPhrasesRaw: string;
	preferredCtaStyle: string;
	postFormatPreference: string;
}

const initial: OnboardingForm = {
	founderName: "",
	productName: "",
	linkedinHeadline: "",
	icpDescription: "",
	toneKeywordsRaw: "",
	forbiddenPhrasesRaw: "",
	preferredCtaStyle: "",
	postFormatPreference: "",
};

export default function MemoryOnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState<Step>(STEPS[0]);
	const [form, setForm] = useState<OnboardingForm>(initial);
	const [saving, setSaving] = useState(false);
	const [loadingExisting, setLoadingExisting] = useState(true);

	const idx = STEPS.indexOf(step);
	const isFirst = idx === 0;
	const isLast = idx === STEPS.length - 1;

	const update = <K extends keyof OnboardingForm>(
		field: K,
		value: OnboardingForm[K]
	) => setForm((prev) => ({ ...prev, [field]: value }));

	const onNext = () => {
		if (step === "Identity" && !form.founderName.trim()) {
			toast.error("Founder name is required");
			return;
		}
		setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
	};
	const onBack = () => setStep(STEPS[Math.max(idx - 1, 0)]);

	const onSubmit = async () => {
		if (!form.founderName.trim()) {
			toast.error("Founder name is required");
			setStep("Identity");
			return;
		}
		try {
			setSaving(true);
			const toList = (raw: string) =>
				raw
					.split(/[,\n]/)
					.map((s) => s.trim())
					.filter(Boolean);
			await saveMemoryOnboarding({
				founderName: form.founderName.trim(),
				productName: form.productName.trim() || undefined,
				linkedinHeadline: form.linkedinHeadline.trim() || undefined,
				icpDescription: form.icpDescription.trim() || undefined,
				toneKeywords: form.toneKeywordsRaw
					? toList(form.toneKeywordsRaw)
					: undefined,
				forbiddenPhrases: form.forbiddenPhrasesRaw
					? toList(form.forbiddenPhrasesRaw)
					: undefined,
				preferredCtaStyle: form.preferredCtaStyle.trim() || undefined,
				postFormatPreference: form.postFormatPreference.trim() || undefined,
			});
			toast.success("Profile memory saved");
			router.push("/social/dashboard");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		} finally {
			setSaving(false);
		}
	};

	useEffect(() => {
		const loadExistingMemory = async () => {
			try {
				setLoadingExisting(true);
				const profileItems = await getProfileMemory();
				if (!profileItems.length) return;
				const asMap = new Map(profileItems.map((item) => [item.key, item.value]));
				const toLineList = (value: unknown): string => {
					if (Array.isArray(value)) {
						return value
							.map((item) => (typeof item === "string" ? item : String(item)))
							.join("\n");
					}
					if (typeof value === "string") return value;
					if (value === null || value === undefined) return "";
					return String(value);
				};

				setForm({
					founderName: String(asMap.get("founder_name") ?? ""),
					productName: String(asMap.get("product_name") ?? ""),
					linkedinHeadline: String(asMap.get("linkedin_headline") ?? ""),
					icpDescription: String(asMap.get("icp_description") ?? ""),
					toneKeywordsRaw: toLineList(asMap.get("tone_keywords")),
					forbiddenPhrasesRaw: toLineList(asMap.get("forbidden_phrases")),
					preferredCtaStyle: String(asMap.get("preferred_cta_style") ?? ""),
					postFormatPreference: String(
						asMap.get("post_format_preference") ?? ""
					),
				});
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to load saved memory"
				);
			} finally {
				setLoadingExisting(false);
			}
		};
		loadExistingMemory();
	}, []);

	return (
		<PageShell maxWidth="5xl">
			<PageHeader
				breadcrumb={[
					{ label: "Memory", href: "/social/memory" },
					{ label: "Onboarding" },
				]}
				eyebrow="Memory wizard"
				title="Teach the agent your voice"
				description="Five quick steps. Everything here goes into profile memory — the layer that guides every draft."
			/>

			{loadingExisting && (
				<InlineAlert
					tone="info"
					title="Loading existing profile memory"
					description="If memory already exists, fields are pre-filled so you can edit them."
				/>
			)}

			<SurfaceCard padded={false}>
				<div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-5 py-4 text-xs">
					{STEPS.map((s, i) => (
						<div key={s} className="flex items-center gap-2 whitespace-nowrap">
							<span
								className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
									i <= idx
										? "bg-blue-600 text-white"
										: "bg-slate-200 text-slate-500"
								}`}
							>
								{i + 1}
							</span>
							<span
								className={`font-medium ${
									i <= idx ? "text-slate-900" : "text-slate-400"
								}`}
							>
								{s}
							</span>
							{i < STEPS.length - 1 && (
								<span className="text-slate-300">·</span>
							)}
						</div>
					))}
				</div>

				<div className="p-5 md:p-6">
					{step === "Identity" && (
						<StepIdentity form={form} update={update} />
					)}
					{step === "Audience" && (
						<StepAudience form={form} update={update} />
					)}
					{step === "Tone" && <StepTone form={form} update={update} />}
					{step === "Format + CTA" && (
						<StepFormat form={form} update={update} />
					)}
					{step === "Review" && <StepReview form={form} />}
				</div>

				<div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
					<SecondaryButton onClick={onBack} disabled={isFirst}>
						Back
					</SecondaryButton>
					{isLast ? (
						<PrimaryButton onClick={onSubmit} disabled={saving}>
							{saving ? "Saving…" : "Save profile memory"}
						</PrimaryButton>
					) : (
						<PrimaryButton onClick={onNext}>Next step</PrimaryButton>
					)}
				</div>
			</SurfaceCard>

			<InlineAlert
				tone="info"
				title="You can change any of this later"
				description="Every answer becomes a standalone memory item you can edit from the Memory page."
			/>
		</PageShell>
	);
}

function StepIdentity({
	form,
	update,
}: {
	form: OnboardingForm;
	update: <K extends keyof OnboardingForm>(
		field: K,
		value: OnboardingForm[K]
	) => void;
}) {
	return (
		<div className="space-y-4">
			<SectionTitle
				title="Who is posting?"
				description="This goes into the LinkedIn post as the speaker identity."
			/>
			<Field
				label="Founder name"
				value={form.founderName}
				onChange={(v) => update("founderName", v)}
				placeholder="e.g. Aditya Sharma"
				required
			/>
			<Field
				label="Product name"
				value={form.productName}
				onChange={(v) => update("productName", v)}
				placeholder="e.g. TotalAds"
			/>
			<Field
				label="LinkedIn headline"
				value={form.linkedinHeadline}
				onChange={(v) => update("linkedinHeadline", v)}
				placeholder="Founder @ TotalAds — helping D2C brands stop wasting ad spend"
			/>
		</div>
	);
}

function StepAudience({
	form,
	update,
}: {
	form: OnboardingForm;
	update: <K extends keyof OnboardingForm>(
		field: K,
		value: OnboardingForm[K]
	) => void;
}) {
	return (
		<div className="space-y-4">
			<SectionTitle
				title="Who is this for?"
				description="Describe your ICP in one sentence. The agent writes every post with this reader in mind."
			/>
			<Field
				label="ICP description"
				value={form.icpDescription}
				onChange={(v) => update("icpDescription", v)}
				placeholder="D2C brand owners running Meta ads with $10k–$100k/month spend"
				multiline
			/>
		</div>
	);
}

function StepTone({
	form,
	update,
}: {
	form: OnboardingForm;
	update: <K extends keyof OnboardingForm>(
		field: K,
		value: OnboardingForm[K]
	) => void;
}) {
	return (
		<div className="space-y-4">
			<SectionTitle
				title="How do you sound?"
				description="Keywords describe your voice. Forbidden phrases are the things the agent must never write."
			/>
			<Field
				label="Tone keywords"
				value={form.toneKeywordsRaw}
				onChange={(v) => update("toneKeywordsRaw", v)}
				placeholder="blunt, founder-led, no fluff, data-first"
				multiline
			/>
			<Field
				label="Forbidden phrases"
				value={form.forbiddenPhrasesRaw}
				onChange={(v) => update("forbiddenPhrasesRaw", v)}
				placeholder="game-changer, excited to announce, I'm humbled"
				multiline
			/>
			<p className="text-xs text-slate-400">
				Separate items with commas or newlines.
			</p>
		</div>
	);
}

function StepFormat({
	form,
	update,
}: {
	form: OnboardingForm;
	update: <K extends keyof OnboardingForm>(
		field: K,
		value: OnboardingForm[K]
	) => void;
}) {
	return (
		<div className="space-y-4">
			<SectionTitle
				title="How should the post be structured?"
				description="The agent will try to match these patterns on every draft."
			/>
			<Field
				label="Post format preference"
				value={form.postFormatPreference}
				onChange={(v) => update("postFormatPreference", v)}
				placeholder="short hook → 3-4 line story → 1 insight → soft CTA"
				multiline
			/>
			<Field
				label="Preferred CTA style"
				value={form.preferredCtaStyle}
				onChange={(v) => update("preferredCtaStyle", v)}
				placeholder="Soft ask — DM me if relevant, never hard sell"
			/>
		</div>
	);
}

function StepReview({ form }: { form: OnboardingForm }) {
	return (
		<div className="space-y-4">
			<SectionTitle
				title="Everything looks right?"
				description="Hit save and the agent is live with this memory stack. You can edit anything later."
			/>
			<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
				<ReviewRow label="Founder name" value={form.founderName} />
				<ReviewRow label="Product" value={form.productName} />
				<ReviewRow label="Headline" value={form.linkedinHeadline} />
				<ReviewRow label="ICP" value={form.icpDescription} />
				<ReviewRow label="Tone keywords" value={form.toneKeywordsRaw} />
				<ReviewRow label="Forbidden" value={form.forbiddenPhrasesRaw} />
				<ReviewRow label="Format" value={form.postFormatPreference} />
				<ReviewRow label="CTA style" value={form.preferredCtaStyle} />
			</div>
		</div>
	);
}

function ReviewRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid grid-cols-1 gap-1 border-b border-slate-200 py-2 last:border-0 sm:grid-cols-3">
			<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
				{label}
			</span>
			<span className="col-span-2 break-words text-sm text-slate-800">
				{value || <span className="text-slate-400">—</span>}
			</span>
		</div>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	multiline,
	required,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	multiline?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-600">
				<span>{label}</span>
				{required && <span className="text-rose-500">Required</span>}
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
