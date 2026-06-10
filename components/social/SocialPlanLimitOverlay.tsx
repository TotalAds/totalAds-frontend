"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialAccessResponse } from "@/utils/api/socialClient";
import { IconCreditCard, IconLock } from "@tabler/icons-react";

interface SocialPlanLimitOverlayProps {
	access: SocialAccessResponse | null;
	onUpgrade?: () => void;
}

export default function SocialPlanLimitOverlay({
	access,
	onUpgrade,
}: SocialPlanLimitOverlayProps) {
	const pathname = usePathname();
	const isExempt =
		pathname?.startsWith("/social/billing") ||
		pathname?.startsWith("/social/pricing") ||
		pathname?.startsWith("/social/settings");

	if (!access?.enabled || isExempt) return null;

	const postsRemaining = access.usage?.postsRemaining ?? 1;
	if (postsRemaining > 0) return null;

	return (
		<div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-bg-100/85 p-6 backdrop-blur-[2px]">
			<div className="max-w-md rounded-2xl border border-brand-main/30 bg-bg-100 p-8 text-center shadow-xl">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
					<IconLock className="h-7 w-7 text-amber-500" />
				</div>
				<h2 className="text-xl font-bold text-text-100">
					Your plan has reached its limit
				</h2>
				<p className="mt-3 text-sm leading-relaxed text-text-300">
					Scheduled posts will not publish until you upgrade or your billing period
					resets. You cannot create new posts from Post Studio, connected profiles,
					or Telegram until you upgrade.
				</p>
				<p className="mt-2 text-xs text-text-300">
					Plan:{" "}
					<span className="font-semibold text-text-200">
						{access.subscription?.tierDisplayName ?? "Free"}
					</span>
					{" · "}
					{access.usage?.monthlyPosts ?? 0} posts used this month
				</p>
				<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
					{onUpgrade ? (
						<button
							type="button"
							onClick={onUpgrade}
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-main px-6 py-3 text-sm font-semibold text-white hover:bg-brand-main/90"
						>
							<IconCreditCard className="h-4 w-4" />
							Upgrade plan
						</button>
					) : (
						<Link
							href="/social/billing"
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-main px-6 py-3 text-sm font-semibold text-white hover:bg-brand-main/90"
						>
							<IconCreditCard className="h-4 w-4" />
							Upgrade plan
						</Link>
					)}
					<Link
						href="/social/billing"
						className="inline-flex items-center justify-center rounded-xl border border-bg-300 px-6 py-3 text-sm font-semibold text-text-200 hover:bg-bg-200"
					>
						View usage
					</Link>
				</div>
			</div>
		</div>
	);
}
