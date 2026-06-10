export type SocialImageTier = "tier_1" | "tier_2" | null | undefined;

export function formatPlatformImageAllowance(
  maxMonthlyImages: number | null | undefined,
  imageTier?: SocialImageTier
): string | null {
  if (!maxMonthlyImages || maxMonthlyImages <= 0) return null;
  const quality =
    imageTier === "tier_2" ? "Advanced images" : "Basic images";
  return `${maxMonthlyImages} ${quality.toLowerCase()} / month`;
}

export function formatImageTierLabel(imageTier?: SocialImageTier): string {
  return imageTier === "tier_2" ? "Advanced images" : "Basic images";
}

export function tierFeatureLines(tier: {
  maxMonthlyPosts?: number | null;
  maxMonthlyImages?: number | null;
  imageTier?: SocialImageTier;
  includesImageGeneration?: boolean;
  includesByok?: boolean;
  includesArticles?: boolean;
  includesAdvancedAnalytics?: boolean;
}): string[] {
  return [
    `${tier.maxMonthlyPosts ?? 20} posts / month`,
    tier.includesImageGeneration
      ? formatPlatformImageAllowance(tier.maxMonthlyImages, tier.imageTier)
      : null,
    tier.includesByok
      ? "Unlimited images with your own API key (BYOK)"
      : null,
    tier.includesArticles ? "LinkedIn Articles" : null,
    tier.includesAdvancedAnalytics ? "Advanced analytics" : null,
  ].filter(Boolean) as string[];
}
