"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import SocialCheckoutModal from "@/components/social/SocialCheckoutModal";
import SocialPlanLimitModal from "@/components/social/SocialPlanLimitModal";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { getSocialAccess, SocialAccessResponse } from "@/utils/api/socialClient";
import { getSocialPricing, SocialPricingTier } from "@/utils/api/socialBillingClient";
import { SOCIAL_SUBSCRIPTION_UPDATED_EVENT } from "@/utils/social/socialSubscriptionEvents";

interface SocialLimitShellProps {
	children: React.ReactNode;
}

export default function SocialLimitShell({ children }: SocialLimitShellProps) {
	const pathname = usePathname();
	const [access, setAccess] = useState<SocialAccessResponse | null>(null);
	const [tiers, setTiers] = useState<SocialPricingTier[]>([]);
	const [checkoutTier, setCheckoutTier] = useState<SocialPricingTier | null>(null);

	const load = useCallback(async () => {
		try {
			const [accessData, pricing] = await Promise.all([
				getSocialAccess(),
				getSocialPricing(),
			]);
			setAccess(accessData);
			setTiers(pricing);
		} catch {
			setAccess(null);
		}
	}, []);

	useEffect(() => {
		if (!pathname?.startsWith("/social")) return;
		load();
	}, [pathname, load]);

	useEffect(() => {
		const onSubscriptionUpdated = () => {
			void load();
		};
		window.addEventListener(SOCIAL_SUBSCRIPTION_UPDATED_EVENT, onSubscriptionUpdated);
		return () => {
			window.removeEventListener(SOCIAL_SUBSCRIPTION_UPDATED_EVENT, onSubscriptionUpdated);
		};
	}, [load]);

	const postsRemaining = access?.usage?.postsRemaining ?? 1;
	const imagesRemaining = access?.usage?.platformImagesRemaining ?? 1;
	const isExempt =
		pathname?.startsWith("/social/billing") ||
		pathname?.startsWith("/social/pricing") ||
		pathname?.startsWith("/social/settings");
	const limitReached =
		Boolean(access?.enabled) &&
		!isExempt &&
		(postsRemaining <= 0 ||
			(imagesRemaining <= 0 && !access?.hasValidByok));

	useBodyScrollLock(limitReached || Boolean(checkoutTier));

	const openUpgradeCheckout = () => {
		const current = access?.subscription?.tierName ?? "free";
		const next =
			tiers.find((t) => t.name === "pro" && current === "free") ??
			tiers.find((t) => t.name === "business" && current !== "business") ??
			tiers.find((t) => !t.isFreeTier && t.name !== current) ??
			null;
		setCheckoutTier(next);
	};

	return (
		<div className="relative min-h-0 min-w-0 flex-1">
			{children}

			<SocialPlanLimitModal
				access={access}
				tiers={tiers}
				onUpgrade={openUpgradeCheckout}
				hidden={Boolean(checkoutTier)}
			/>

			<SocialCheckoutModal
				tier={checkoutTier}
				open={Boolean(checkoutTier)}
				onClose={() => setCheckoutTier(null)}
				onSuccess={load}
			/>
		</div>
	);
}
