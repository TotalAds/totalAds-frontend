"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import SocialCheckoutModal from "@/components/social/SocialCheckoutModal";
import { useAuthContext } from "@/context/AuthContext";
import {
  getSocialPricing,
  getSocialSubscription,
  SocialPricingTier,
} from "@/utils/api/socialBillingClient";
import { getSocialAccess } from "@/utils/api/socialClient";
import { formatPriceInr } from "@/utils/social/formatPrice";
import { tierFeatureLines } from "@/utils/social/planCopy";
import { IconBrandLinkedin, IconCheck, IconLoader2 } from "@tabler/icons-react";

export default function SocialPricingPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [tiers, setTiers] = useState<SocialPricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [currentTierName, setCurrentTierName] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [checkoutTier, setCheckoutTier] = useState<SocialPricingTier | null>(null);

  const reload = async () => {
    const [pricingData, subscriptionData, accessData] = await Promise.all([
      getSocialPricing(),
      getSocialSubscription(),
      getSocialAccess(),
    ]);
    setTiers(pricingData);
    setCurrentSubscription(subscriptionData);
    setCurrentTierName(accessData.subscription?.tierName ?? null);
    setUsage(accessData.usage);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (state.isAuthenticated) {
          await reload();
        } else {
          setTiers(await getSocialPricing());
        }
      } catch {
        toast.error("Failed to load pricing information");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [state.isAuthenticated]);

  const handleSelectTier = (tier: SocialPricingTier) => {
    if (!state.isAuthenticated) {
      router.push("/login?product=socialsnipper");
      return;
    }
    if (currentTierName === tier.name && !tier.isFreeTier) return;
    setCheckoutTier(tier);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <IconLoader2 className="w-8 h-8 animate-spin text-brand-main" />
      </div>
    );
  }

  const displayTiers =
    tiers.length > 0
      ? tiers
      : ([
          {
            id: 0,
            name: "free",
            displayName: "Free",
            description: "",
            monthlyPriceInPaise: 0,
            maxMonthlyPosts: 20,
            maxMonthlyImages: 5,
            imageTier: "tier_1",
            includesByok: false,
            includesArticles: false,
            includesAdvancedAnalytics: false,
            isFreeTier: true,
            includesImageGeneration: true,
            includesLinkedIn: true,
            includesTwitter: false,
            includesAgent: true,
            maxDailyPosts: 10,
            includesApprovalWorkflows: true,
            includesAnalytics: true,
            originalPriceInPaise: null,
          },
          {
            id: 0,
            name: "pro",
            displayName: "Pro",
            description: "",
            monthlyPriceInPaise: 49900,
            maxMonthlyPosts: 50,
            maxMonthlyImages: 10,
            imageTier: "tier_1",
            includesByok: true,
            includesArticles: false,
            includesAdvancedAnalytics: false,
            isFreeTier: false,
            includesImageGeneration: true,
            includesLinkedIn: true,
            includesTwitter: false,
            includesAgent: true,
            maxDailyPosts: 10,
            includesApprovalWorkflows: true,
            includesAnalytics: true,
            originalPriceInPaise: null,
          },
          {
            id: 0,
            name: "business",
            displayName: "Business",
            description: "",
            monthlyPriceInPaise: 99900,
            maxMonthlyPosts: 200,
            maxMonthlyImages: 30,
            imageTier: "tier_2",
            includesByok: true,
            includesArticles: true,
            includesAdvancedAnalytics: true,
            isFreeTier: false,
            includesImageGeneration: true,
            includesLinkedIn: true,
            includesTwitter: false,
            includesAgent: true,
            maxDailyPosts: 20,
            includesApprovalWorkflows: true,
            includesAnalytics: true,
            originalPriceInPaise: null,
          },
        ] as SocialPricingTier[]);

  return (
    <div className="min-h-screen bg-bg-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-main/10 rounded-2xl mb-6">
            <IconBrandLinkedin className="w-8 h-8 text-brand-main" />
          </div>
          <h1 className="text-3xl font-bold text-text-100 mb-3">SocialSnipper Pricing</h1>
          <p className="text-text-200 max-w-xl mx-auto">
            Start free. Upgrade for more posts, basic and advanced AI images, and unlimited
            images with your own API key.
          </p>
        </div>

        {usage && (
          <div className="mb-8 grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-bg-200/50 border border-bg-200">
              <p className="text-xs text-text-300 uppercase tracking-wide">Posts this month</p>
              <p className="text-lg font-semibold text-text-100">
                {usage.monthlyPosts} / {usage.postsRemaining + usage.monthlyPosts}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg-200/50 border border-bg-200">
              <p className="text-xs text-text-300 uppercase tracking-wide">Platform images</p>
              <p className="text-lg font-semibold text-text-100">
                {usage.platformImages} /{" "}
                {usage.platformImages + usage.platformImagesRemaining}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg-200/50 border border-bg-200">
              <p className="text-xs text-text-300 uppercase tracking-wide">BYOK images</p>
              <p className="text-lg font-semibold text-text-100">
                {usage.byokImages} (unlimited)
              </p>
            </div>
          </div>
        )}

        {currentSubscription?.subscription && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400">
            Active: {currentSubscription.tier?.displayName || currentTierName} until{" "}
            {new Date(currentSubscription.subscription.currentPeriodEnd).toLocaleDateString()}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {displayTiers.map((tier) => {
            const isCurrent = currentTierName === tier.name;
            const isPopular = tier.name === "pro";
            return (
              <div
                key={tier.name}
                className={`relative p-6 rounded-2xl border-2 ${
                  isPopular ? "border-brand-main bg-brand-main/5" : "border-bg-200"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-main text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-text-100">{tier.displayName}</h3>
                  <p className="text-text-300 text-sm mt-2 min-h-[40px]">{tier.description}</p>
                  <div className="mt-4 text-4xl font-bold text-text-100">
                    {formatPriceInr(tier.monthlyPriceInPaise)}
                    {tier.monthlyPriceInPaise > 0 && (
                      <span className="text-base font-normal text-text-300">/mo</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 mb-8">
                  {tierFeatureLines(tier).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-200">
                      <IconCheck className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectTier(tier)}
                  disabled={isCurrent && !tier.isFreeTier}
                  className={`w-full py-3 rounded-xl font-semibold ${
                    isCurrent && !tier.isFreeTier
                      ? "bg-bg-200 text-text-300 cursor-not-allowed"
                      : "bg-brand-main text-white hover:bg-brand-main/90"
                  }`}
                >
                  {isCurrent
                    ? "Current plan"
                    : tier.isFreeTier
                      ? "Get started free"
                      : `Upgrade — ${formatPriceInr(tier.monthlyPriceInPaise)}/mo`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <SocialCheckoutModal
        tier={checkoutTier}
        open={Boolean(checkoutTier)}
        onClose={() => setCheckoutTier(null)}
        onSuccess={async () => {
          await reload();
          router.push("/social/dashboard");
        }}
      />
    </div>
  );
}
