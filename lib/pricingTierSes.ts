/**
 * Active pricing tier ladder (2026 LeadSnipper Pricing Upgrade) and sending-setup helpers.
 *
 * Kept in sync with totalads-shared/src/utils/pricingTierSes.ts — do not import
 * totalads-shared from client components (its bundle pulls native bcrypt).
 *
 * Replaces the prior MANAGED_TIER_NAMES / BYO_TIER_NAMES split with a single
 * ACTIVE_TIER_NAMES list. Onboarding is gmail / outlook / zoho / smtp only — managed_ses and byo_ses
 * are no longer exposed as onboarding choices. BYO SES tiers (byo_trial / byo_pro) are retired
 * from public pricing but legacy rows are kept in the DB with isActive=0 for existing customers.
 */

export const ACTIVE_TIER_NAMES = [
	"trial",
	"starter",
	"growth",
	"scale",
	"custom",
] as const;

export type ActiveTierName = (typeof ACTIVE_TIER_NAMES)[number];

export type PrimarySendingMethod =
	| "managed_ses"
	| "byo_ses"
	| "gmail"
	| "outlook"
	| "zoho"
	| "smtp";

export type SesProvider = "leadsnipper_managed" | "custom";

export type SesServiceMode = "managed_ses" | "byo_ses";

export type UserSendingContext = {
	primarySendingMethod?: PrimarySendingMethod | null;
	sesProvider?: SesProvider | null;
	sesServiceEnabled?: boolean | null;
	sesServiceMode?: SesServiceMode | null;
};

function isByoTierName(name: string | null | undefined): boolean {
	if (!name) return false;
	return name === "byo_trial" || name === "byo_pro";
}

function isCustomEnterpriseTierName(name: string | null | undefined): boolean {
	return name === "custom";
}

/** True for any tier in the active ladder (trial/starter/growth/scale/custom). */
export function isActiveTierName(name: string | null | undefined): name is ActiveTierName {
	if (!name) return false;
	return (ACTIVE_TIER_NAMES as readonly string[]).includes(name);
}

export function isSesServiceEnabled(ctx: UserSendingContext): boolean {
	return ctx.sesServiceEnabled === true;
}

export function isManagedSendingUser(ctx: UserSendingContext): boolean {
	if (ctx.sesServiceEnabled && ctx.sesServiceMode === "managed_ses") return true;
	if (ctx.primarySendingMethod === "managed_ses") return true;
	if (ctx.primarySendingMethod != null) return false;
	return ctx.sesProvider === "leadsnipper_managed";
}

export function isByoSideSendingUser(ctx: UserSendingContext): boolean {
	if (ctx.sesServiceEnabled && ctx.sesServiceMode === "byo_ses") return true;
	if (
		ctx.primarySendingMethod === "byo_ses" ||
		ctx.primarySendingMethod === "gmail" ||
		ctx.primarySendingMethod === "outlook" ||
		ctx.primarySendingMethod === "zoho" ||
		ctx.primarySendingMethod === "smtp"
	) {
		return true;
	}
	if (ctx.primarySendingMethod === "managed_ses") return false;
	return ctx.sesProvider === "custom";
}

export function usesSesDomains(ctx: UserSendingContext): boolean {
	if (ctx.sesServiceEnabled) return true;
	if (
		ctx.primarySendingMethod === "managed_ses" ||
		ctx.primarySendingMethod === "byo_ses"
	) {
		return true;
	}
	if (ctx.primarySendingMethod != null) return false;
	return (
		ctx.sesProvider === "leadsnipper_managed" || ctx.sesProvider === "custom"
	);
}

/** True only when the account should use /api/ses-credentials (BYO AWS keys). */
export function usesByoSesCredentials(ctx: UserSendingContext): boolean {
	if (ctx.sesServiceEnabled && ctx.sesServiceMode === "byo_ses") return true;
	if (ctx.primarySendingMethod === "byo_ses") return true;
	if (ctx.primarySendingMethod != null) return false;
	return ctx.sesProvider === "custom";
}

export function isConnectedInboxSendingUser(ctx: UserSendingContext): boolean {
	return (
		ctx.primarySendingMethod === "gmail" ||
		ctx.primarySendingMethod === "outlook" ||
		ctx.primarySendingMethod === "zoho" ||
		ctx.primarySendingMethod === "smtp"
	);
}

/**
 * Whether a subscription tier is valid for the user's account.
 *
 * 2026 upgrade: onboarding is gmail / outlook / zoho / smtp only (no managed_ses / byo_ses onboarding
 * choice) and there is a single active ladder (ACTIVE_TIER_NAMES). The prior SES-provider
 * gating has been removed — any active tier is allowed for any user. The `ctx` parameter is
 * retained for backward compatibility with existing call sites; it is intentionally unused.
 */
export function tierAllowedForSendingUser(
	tierName: string,
	_ctx?: UserSendingContext,
): boolean {
	return isActiveTierName(tierName);
}

/** @deprecated Use tierAllowedForSendingUser with UserSendingContext */
export function tierAllowedForSesProvider(
	tierName: string,
	sesProvider: SesProvider | null | undefined,
	primarySendingMethod?: PrimarySendingMethod | null,
): boolean {
	return tierAllowedForSendingUser(tierName, {
		sesProvider,
		primarySendingMethod,
	});
}

export const BYO_DEFAULT_DAILY_SEND_CAP = 100;
