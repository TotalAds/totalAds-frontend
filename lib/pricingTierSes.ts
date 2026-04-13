/**
 * Managed vs BYO (Bring Your Own SES) pricing tiers.
 * Kept in sync with totalads-shared/src/utils/pricingTierSes.ts — do not import
 * totalads-shared from client components (its bundle pulls native bcrypt).
 */

function isByoTierName(name: string | null | undefined): boolean {
	if (!name) return false;
	return name === "byo_trial" || name === "byo_pro";
}

function isCustomEnterpriseTierName(name: string | null | undefined): boolean {
	return name === "custom";
}

/**
 * Whether a subscription tier is valid for the user's SES mode.
 * - custom (BYO): only BYO tiers + custom enterprise
 * - leadsnipper_managed or null (not set): only managed tiers + custom enterprise
 */
export function tierAllowedForSesProvider(
	tierName: string,
	sesProvider: "leadsnipper_managed" | "custom" | null | undefined,
): boolean {
	if (isCustomEnterpriseTierName(tierName)) return true;
	if (sesProvider === "custom") {
		return isByoTierName(tierName);
	}
	if (isByoTierName(tierName)) return false;
	return (
		tierName === "trial" ||
		tierName === "starter" ||
		tierName === "business"
	);
}
