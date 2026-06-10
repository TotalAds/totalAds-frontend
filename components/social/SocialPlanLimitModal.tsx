"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialAccessResponse } from "@/utils/api/socialClient";
import { SocialPricingTier } from "@/utils/api/socialBillingClient";
import { formatPriceInr } from "@/utils/social/formatPrice";
import { formatImageTierLabel } from "@/utils/social/planCopy";
import {
	IconArrowUpRight,
	IconBan,
	IconCalendarOff,
	IconCreditCard,
	IconSparkles,
} from "@tabler/icons-react";

function UsageRow({
	label,
	used,
	limit,
	overLimit,
	unit = "",
}: {
	label: string;
	used: number;
	limit: number;
	overLimit?: boolean;
	unit?: string;
}) {
	const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

	return (
		<div className="rounded-xl border border-bg-300 bg-bg-100 p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-medium text-text-100">{label}</p>
					<p className="mt-0.5 text-xs text-text-300">
						{overLimit
							? `${used - limit} over your ${limit}${unit} allowance`
							: `${Math.max(0, limit - used)} remaining this month`}
					</p>
				</div>
				<p
					className={`text-lg font-bold tabular-nums ${overLimit ? "text-amber-600" : "text-text-100"}`}
				>
					{used}
					<span className="text-sm font-normal text-text-300"> / {limit}</span>
				</p>
			</div>
			<div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-300">
				<div
					className={`h-full rounded-full transition-all ${overLimit ? "bg-amber-500" : "bg-brand-main"}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

interface SocialPlanLimitModalProps {
	access: SocialAccessResponse | null;
	tiers?: SocialPricingTier[];
	onUpgrade?: () => void;
	hidden?: boolean;
}

export default function SocialPlanLimitModal({
	access,
	tiers = [],
	onUpgrade,
	hidden,
}: SocialPlanLimitModalProps) {
	const pathname = usePathname();
	const isExempt =
		pathname?.startsWith("/social/billing") ||
		pathname?.startsWith("/social/pricing") ||
		pathname?.startsWith("/social/settings");

	const usage = access?.usage;
	const postsLimit = access?.subscription?.maxMonthlyPosts ?? 20;
	const postsUsed = usage?.monthlyPosts ?? 0;
	const postsRemaining = usage?.postsRemaining ?? postsLimit;
	const postLimitReached = postsRemaining <= 0;

	const imagesLimit = access?.subscription?.maxMonthlyImages ?? 5;
	const imagesUsed = usage?.platformImages ?? 0;
	const imagesRemaining = usage?.platformImagesRemaining ?? imagesLimit;
	const imageLimitReached = imagesRemaining <= 0 && !access?.hasValidByok;

	const visible =
		!hidden &&
		Boolean(access?.enabled) &&
		!isExempt &&
		(postLimitReached || imageLimitReached);

	if (!visible) return null;

	const tierName = access?.subscription?.tierName ?? "free";
	const tierDisplay = access?.subscription?.tierDisplayName ?? "Free";
	const rawImageTier = access?.subscription?.imageTier;
	const imageTierLabel = formatImageTierLabel(
		rawImageTier === "tier_1" || rawImageTier === "tier_2" ? rawImageTier : null
	);
	const periodEnd = access?.subscription?.currentPeriodEnd
		? new Date(access.subscription.currentPeriodEnd).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const upgradeOptions = tiers.filter(
		(t) => !t.isFreeTier && t.name !== tierName
	);

	const primaryLimit = postLimitReached ? "posts" : "images";

	return (
		<div className="pointer-events-none fixed inset-0 z-[90] flex md:left-64">
			{/* Backdrop over main content only — sidebar stays clickable */}
			<div
				className="pointer-events-auto hidden flex-1 bg-bg-100/75 backdrop-blur-[4px] sm:block"
				aria-hidden
			/>

			{/* Upgrade panel — only interactive zone in the main area */}
			<aside
				role="dialog"
				aria-modal="true"
				aria-labelledby="plan-limit-title"
				className="pointer-events-auto relative flex h-full w-full flex-col border-l border-bg-300 bg-bg-100 shadow-2xl sm:max-w-[420px] sm:shrink-0"
			>
				{/* Header */}
				<div className="border-b border-bg-300 bg-gradient-to-br from-amber-500/8 to-brand-main/5 px-5 py-5 sm:px-6">
					<div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
						<span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
						{primaryLimit === "posts"
							? "Monthly post limit reached"
							: "Monthly image limit reached"}
					</div>

					<h2
						id="plan-limit-title"
						className="mt-4 text-xl font-bold leading-snug text-text-100"
					>
						{postLimitReached
							? "Publishing is paused until you upgrade"
							: "Image generation is paused until you upgrade"}
					</h2>

					<p className="mt-2 text-sm leading-relaxed text-text-300">
						{postLimitReached ? (
							<>
								You&apos;ve used all {postsLimit} posts on your{" "}
								<span className="font-medium text-text-200">{tierDisplay}</span>{" "}
								plan. Scheduled posts won&apos;t go live, and new drafts are
								blocked until you upgrade or your cycle resets
								{periodEnd ? ` on ${periodEnd}` : ""}.
							</>
						) : (
							<>
								You&apos;ve used all {imagesLimit} included{" "}
								{imageTierLabel.toLowerCase()} on your{" "}
								<span className="font-medium text-text-200">{tierDisplay}</span>{" "}
								plan. Add your API key or upgrade for more.
							</>
						)}
					</p>
				</div>

				{/* Scrollable body */}
				<div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
					<p className="text-xs font-semibold uppercase tracking-wider text-text-300">
						Usage this month
					</p>

					<div className="mt-3 space-y-3">
						<UsageRow
							label="Posts"
							used={postsUsed}
							limit={postsLimit}
							overLimit={postLimitReached}
						/>
						<UsageRow
							label={`AI images (${imageTierLabel.toLowerCase()})`}
							used={imagesUsed}
							limit={imagesLimit}
							overLimit={imageLimitReached}
						/>
						{access?.subscription?.includesByok && (
							<div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
								<span className="text-text-300">Images via your API key</span>
								<span className="font-semibold text-emerald-600">
									{usage?.byokImages ?? 0} · unlimited
								</span>
							</div>
						)}
					</div>

					{postLimitReached && (
						<div className="mt-6">
							<p className="text-xs font-semibold uppercase tracking-wider text-text-300">
								What&apos;s paused
							</p>
							<ul className="mt-3 space-y-2.5">
								{[
									{
										icon: IconCalendarOff,
										text: "Scheduled posts will not publish to LinkedIn",
									},
									{
										icon: IconBan,
										text: "Post Studio and AI draft generation are disabled",
									},
									{
										icon: IconBan,
										text: "Telegram approvals and quick-publish are disabled",
									},
								].map(({ icon: Icon, text }) => (
									<li
										key={text}
										className="flex items-start gap-3 rounded-lg bg-bg-200/60 px-3 py-2.5 text-sm text-text-300"
									>
										<Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
										{text}
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="mt-6 rounded-xl border border-bg-300 bg-bg-200/40 p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-text-300">Your plan</p>
								<p className="text-base font-bold text-text-100">{tierDisplay}</p>
							</div>
							{periodEnd && (
								<p className="text-right text-xs text-text-300">
									Cycle resets
									<br />
									<span className="font-medium text-text-200">{periodEnd}</span>
								</p>
							)}
						</div>
					</div>

					{upgradeOptions.length > 0 && (
						<div className="mt-6">
							<p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-300">
								<IconSparkles className="h-3.5 w-3.5" />
								Recommended upgrades
							</p>
							<div className="mt-3 space-y-2">
								{upgradeOptions.map((tier) => (
									<button
										key={tier.name}
										type="button"
										onClick={onUpgrade}
										className="flex w-full items-center justify-between rounded-xl border border-bg-300 bg-bg-100 px-4 py-3 text-left transition-colors hover:border-brand-main/40 hover:bg-brand-main/5"
									>
										<div>
											<p className="text-sm font-semibold text-text-100">
												{tier.displayName}
											</p>
											<p className="text-xs text-text-300">
												{tier.maxMonthlyPosts} posts ·{" "}
												{tier.maxMonthlyImages} AI images
												{tier.includesByok ? " · BYOK" : ""}
											</p>
										</div>
										<span className="text-sm font-bold text-brand-main">
											{formatPriceInr(tier.monthlyPriceInPaise)}/mo
										</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Sticky footer */}
				<div className="border-t border-bg-300 bg-bg-100 p-5 sm:p-6">
					{onUpgrade ? (
						<button
							type="button"
							onClick={onUpgrade}
							className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-main px-4 py-3.5 text-sm font-semibold text-white hover:bg-brand-main/90"
						>
							<IconCreditCard className="h-4 w-4" />
							Upgrade plan
						</button>
					) : (
						<Link
							href="/social/billing"
							className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-main px-4 py-3.5 text-sm font-semibold text-white hover:bg-brand-main/90"
						>
							<IconCreditCard className="h-4 w-4" />
							Upgrade plan
						</Link>
					)}
					<Link
						href="/social/billing"
						className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-medium text-brand-main hover:underline"
					>
						View full usage & billing
						<IconArrowUpRight className="h-4 w-4" />
					</Link>
				</div>
			</aside>
		</div>
	);
}
