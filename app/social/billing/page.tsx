"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import SocialCheckoutModal from "@/components/social/SocialCheckoutModal";
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
	getSocialPricing,
	getSocialSubscription,
	SocialPricingTier,
} from "@/utils/api/socialBillingClient";
import { getSocialAccess, SocialAccessResponse } from "@/utils/api/socialClient";
import { formatPriceInr } from "@/utils/social/formatPrice";
import { tierFeatureLines } from "@/utils/social/planCopy";
import {
	IconArrowUpRight,
	IconCheck,
	IconCreditCard,
	IconPlug,
} from "@tabler/icons-react";

function UsageMeter({
	label,
	used,
	limit,
	unlimited,
}: {
	label: string;
	used: number;
	limit: number;
	unlimited?: boolean;
}) {
	const pct = unlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
	const nearLimit = !unlimited && limit > 0 && used >= limit * 0.85;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-sm">
				<span className="text-text-200">{label}</span>
				<span className={`font-medium ${nearLimit ? "text-amber-500" : "text-text-100"}`}>
					{unlimited ? `${used} (unlimited)` : `${used} / ${limit}`}
				</span>
			</div>
			{!unlimited && (
				<div className="h-2 rounded-full bg-bg-200 overflow-hidden">
					<div
						className={`h-full rounded-full transition-all ${nearLimit ? "bg-amber-500" : "bg-brand-main"}`}
						style={{ width: `${pct}%` }}
					/>
				</div>
			)}
		</div>
	);
}

export default function SocialBillingPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [tiers, setTiers] = useState<SocialPricingTier[]>([]);
	const [access, setAccess] = useState<SocialAccessResponse | null>(null);
	const [subscription, setSubscription] = useState<Awaited<
		ReturnType<typeof getSocialSubscription>
	> | null>(null);
	const [checkoutTier, setCheckoutTier] = useState<SocialPricingTier | null>(null);

	const currentTierName =
		access?.subscription?.tierName ?? subscription?.tier?.name ?? "free";

	const load = useCallback(async () => {
		try {
			const [pricingData, subData, accessData] = await Promise.all([
				getSocialPricing(),
				getSocialSubscription(),
				getSocialAccess(),
			]);
			setTiers(pricingData);
			setSubscription(subData);
			setAccess(accessData);
		} catch {
			toast.error("Failed to load plan details");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) {
		return (
			<PageShell>
				<LoadingCardGrid count={2} />
			</PageShell>
		);
	}

	const currentTier =
		tiers.find((t) => t.name === currentTierName) ??
		tiers.find((t) => t.isFreeTier) ??
		null;

	const usage = access?.usage;
	const postsLimit =
		access?.subscription?.maxMonthlyPosts ?? currentTier?.maxMonthlyPosts ?? 20;
	const imagesLimit =
		access?.subscription?.maxMonthlyImages ?? currentTier?.maxMonthlyImages ?? 5;

	const periodEnd = access?.subscription?.currentPeriodEnd
		? new Date(access.subscription.currentPeriodEnd).toLocaleDateString()
		: subscription?.subscription?.currentPeriodEnd
			? new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()
			: null;

	const upgradeTiers = tiers.filter((t) => t.name !== currentTierName);

	return (
		<PageShell>
			<PageHeader
				eyebrow="Billing"
				title="Plan & usage"
				description="See your current SocialSnipper tier, monthly limits, and upgrade options."
			/>

			{access?.postLimitReached && (
				<div className="mb-6">
					<InlineAlert
						tone="warning"
						title="Monthly post limit reached"
						description="Scheduled posts will not publish until you upgrade or your billing period resets. Post Studio, Telegram, and profile access are paused for new posts."
					/>
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-3">
				<SurfaceCard className="lg:col-span-2 space-y-6">
					<SectionTitle
						title="Current plan"
						description="Your active subscription and billing period."
						action={
							currentTier?.isFreeTier ? (
								<span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
									Free forever
								</span>
							) : access?.subscription?.isTrial ? (
								<span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">
									Promo / trial
								</span>
							) : null
						}
					/>

					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p className="text-2xl font-bold text-text-100">
								{access?.subscription?.tierDisplayName ??
									currentTier?.displayName ??
									"Free"}
							</p>
							<p className="text-text-300 mt-1">
								{currentTier?.monthlyPriceInPaise
									? `${formatPriceInr(currentTier.monthlyPriceInPaise)}/month`
									: "₹0/month"}
								{periodEnd && (
									<span className="ml-2">· Renews {periodEnd}</span>
								)}
							</p>
						</div>
						{currentTier?.includesByok && (
							<Link
								href="/social/settings?tab=integrations"
								className="inline-flex items-center gap-2 text-sm text-brand-main hover:underline"
							>
								<IconPlug className="w-4 h-4" />
								Manage API keys
							</Link>
						)}
					</div>

					{currentTier && (
						<ul className="grid sm:grid-cols-2 gap-2">
							{tierFeatureLines(currentTier).map((f) => (
								<li key={f} className="flex items-start gap-2 text-sm text-text-200">
									<IconCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
									{f}
								</li>
							))}
						</ul>
					)}
				</SurfaceCard>

				<SurfaceCard className="space-y-5">
					<SectionTitle
						title="This month"
						description="Usage resets each billing period."
					/>
					{usage ? (
						<>
							<UsageMeter
								label="Posts scheduled or published"
								used={usage.monthlyPosts}
								limit={postsLimit}
							/>
							<UsageMeter
								label="Platform-generated images"
								used={usage.platformImages}
								limit={imagesLimit}
							/>
							{access?.subscription?.includesByok && (
								<UsageMeter
									label="BYOK images (your key)"
									used={usage.byokImages}
									limit={0}
									unlimited
								/>
							)}
						</>
					) : (
						<p className="text-sm text-text-300">Usage data unavailable.</p>
					)}
					{(usage?.postsRemaining === 0 ||
						usage?.platformImagesRemaining === 0) && (
						<InlineAlert
							tone="warning"
							title="Limit reached"
							description={
								usage?.postsRemaining === 0
									? "Upgrade your plan for more posts this month."
									: "Upgrade for advanced images, or add a BYOK API key in Settings → Integrations."
							}
						/>
					)}
				</SurfaceCard>
			</div>

			{upgradeTiers.length > 0 && (
				<div className="mt-8 space-y-4">
					<SectionTitle
						title="Upgrade plan"
						description="Compare plans and switch anytime. Upgrades take effect immediately."
					/>

					<div className="grid md:grid-cols-3 gap-4">
						{upgradeTiers.map((tier) => {
							const isPopular = tier.name === "pro";
							const price = formatPriceInr(tier.monthlyPriceInPaise);

							return (
								<SurfaceCard
									key={tier.name}
									className={isPopular ? "ring-2 ring-brand-main/40" : ""}
								>
									{isPopular && (
										<p className="text-xs font-semibold text-brand-main mb-2">
											Most popular
										</p>
									)}
									<p className="text-lg font-bold text-text-100">{tier.displayName}</p>
									<p className="text-2xl font-bold text-text-100 mt-1">
										{price}
										{tier.monthlyPriceInPaise > 0 && (
											<span className="text-sm font-normal text-text-300">/mo</span>
										)}
									</p>
									<ul className="mt-4 space-y-1.5 mb-6">
										{tierFeatureLines(tier).slice(0, 4).map((f) => (
											<li key={f} className="text-xs text-text-300 flex gap-1.5">
												<IconCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
												{f}
											</li>
										))}
									</ul>
									<PrimaryButton
										className="w-full"
										onClick={() => setCheckoutTier(tier)}
									>
										Upgrade to {tier.displayName}
										<IconArrowUpRight className="w-4 h-4 ml-1 inline" />
									</PrimaryButton>
								</SurfaceCard>
							);
						})}
					</div>
				</div>
			)}

			{upgradeTiers.length === 0 && currentTier?.name === "business" && (
				<SurfaceCard className="mt-8">
					<EmptyState
						title="You're on Business"
						description="You have the highest tier — 200 posts/month, advanced images, articles, and advanced analytics."
					/>
				</SurfaceCard>
			)}

			<div className="mt-8 flex flex-wrap gap-3">
				<SecondaryButton onClick={() => router.push("/social/pricing")}>
					<IconCreditCard className="w-4 h-4 mr-2" />
					View full pricing page
				</SecondaryButton>
				<SecondaryButton onClick={() => router.push("/social/settings")}>
					Account settings
				</SecondaryButton>
			</div>

			<SocialCheckoutModal
				tier={checkoutTier}
				open={Boolean(checkoutTier)}
				onClose={() => setCheckoutTier(null)}
				onSuccess={load}
			/>
		</PageShell>
	);
}
