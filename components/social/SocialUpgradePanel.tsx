"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialAccessResponse } from "@/utils/api/socialClient";
import { IconArrowUpRight, IconCreditCard } from "@tabler/icons-react";

interface SocialUpgradePanelProps {
	access: SocialAccessResponse | null;
	onUpgrade?: () => void;
}

export default function SocialUpgradePanel({
	access,
	onUpgrade,
}: SocialUpgradePanelProps) {
	const pathname = usePathname();
	const isBillingRoute =
		pathname?.startsWith("/social/billing") ||
		pathname?.startsWith("/social/pricing");

	if (!access?.enabled || isBillingRoute) return null;

	const usage = access.usage;
	const postsLimit = access.subscription?.maxMonthlyPosts ?? 20;
	const postsUsed = usage?.monthlyPosts ?? 0;
	const postsRemaining = usage?.postsRemaining ?? postsLimit;
	const postLimitReached = postsRemaining <= 0;
	const imagesLimit = access.subscription?.maxMonthlyImages ?? 5;
	const imagesRemaining = usage?.platformImagesRemaining ?? imagesLimit;
	const imageLimitReached =
		imagesRemaining <= 0 && !access.hasValidByok;

	if (!postLimitReached && !imageLimitReached) return null;

	return (
		<aside className="hidden xl:flex w-72 shrink-0 flex-col border-l border-bg-300 bg-bg-200/30">
			<div className="sticky top-0 flex flex-col gap-4 p-5">
				<div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-brand-main/5 p-4">
					<div className="flex items-center gap-2 text-amber-600">
						<IconCreditCard className="h-5 w-5" />
						<p className="text-sm font-semibold">
							{postLimitReached ? "Monthly post limit reached" : "Image limit reached"}
						</p>
					</div>
					<p className="mt-2 text-xs leading-relaxed text-text-300">
						{postLimitReached ? (
							<>
								Scheduled posts will not publish until you upgrade or your plan
								resets. Post Studio, Telegram, and profile access are paused for
								new posts.
							</>
						) : (
							<>
								You&apos;ve used all included platform images this month. Upgrade
								for more, or add your API key in Settings → Integrations.
							</>
						)}
					</p>

					{usage && (
						<div className="mt-4 space-y-2 text-xs">
							<div className="flex justify-between text-text-300">
								<span>Posts this month</span>
								<span className="font-medium text-text-100">
									{postsUsed} / {postsLimit}
								</span>
							</div>
							<div className="h-1.5 overflow-hidden rounded-full bg-bg-300">
								<div
									className="h-full rounded-full bg-amber-500"
									style={{
										width: `${Math.min(100, (postsUsed / Math.max(postsLimit, 1)) * 100)}%`,
									}}
								/>
							</div>
						</div>
					)}

					<p className="mt-3 text-xs text-text-300">
						Current plan:{" "}
						<span className="font-semibold text-text-100">
							{access.subscription?.tierDisplayName ?? "Free"}
						</span>
					</p>

					<div className="mt-4 flex flex-col gap-2">
						{onUpgrade ? (
							<button
								type="button"
								onClick={onUpgrade}
								className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-main px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-main/90"
							>
								Upgrade plan
								<IconArrowUpRight className="h-4 w-4" />
							</button>
						) : (
							<Link
								href="/social/billing"
								className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-main px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-main/90"
							>
								Upgrade plan
								<IconArrowUpRight className="h-4 w-4" />
							</Link>
						)}
						<Link
							href="/social/billing"
							className="text-center text-xs text-brand-main hover:underline"
						>
							View usage & billing
						</Link>
					</div>
				</div>

				{access.subscription?.tierName !== "business" && (
					<div className="rounded-xl border border-bg-300 bg-bg-100 p-4 text-xs text-text-300">
						<p className="font-medium text-text-200">Need more volume?</p>
						<p className="mt-1">
							Pro: 50 posts/mo · Business: 200 posts/mo with advanced images and
							articles.
						</p>
					</div>
				)}
			</div>
		</aside>
	);
}
