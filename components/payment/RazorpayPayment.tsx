"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import emailClient, {
  getSubscriptionInfo,
  SubscriptionInfo,
} from "@/utils/api/emailClient";

import CustomPlanRequestModal from "./CustomPlanRequestModal";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface PricingTier {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPriceInPaise: number;
  originalPriceInPaise?: number | null;
  trialDurationDays?: number | null;
  monthlyEmailLimit: number;
  monthlyCredits: number;
  maxContacts?: number;
  volumeSendingEnabled: boolean;
  apiAccessEnabled: boolean;
  analyticsEnabled: boolean;
  customDomainEnabled: boolean;
  prioritySupportEnabled: boolean;
  warmupEnabled?: boolean;
  warmupDailyLimit?: number;
  badgeText?: string | null;
  badgeColor?: string | null;
}

interface RazorpayPaymentProps {
  onSuccess?: (tier: PricingTier) => void;
  onError?: (error: string) => void;
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  onSuccess,
  onError,
}) => {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionInfo | null>(null);
  const [showCustomPlanModal, setShowCustomPlanModal] = useState(false);

  // Load Razorpay SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setSdkReady(false);
    document.body.appendChild(script);
  }, []);

  // Fetch pricing tiers and current subscription
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tiersResponse, subInfo] = await Promise.all([
          emailClient.get("/api/payment/pricing-tiers"),
          getSubscriptionInfo(),
        ]);
        const fetchedTiers = tiersResponse.data.data || [];

        setTiers(fetchedTiers);
        setCurrentSubscription(subInfo);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load pricing information");
      }
    };
    fetchData();
  }, []);

  const handlePayment = async (tierId: string) => {
    if (!sdkReady) {
      toast.error("Payment system not ready. Please refresh the page.");
      return;
    }

    try {
      setLoading(true);

      // Create Razorpay order
      const orderResponse = await emailClient.post(
        "/api/payment/create-order",
        {
          tierId,
        }
      );

      if (!orderResponse.data.success) {
        toast.error(orderResponse.data.error || "Failed to create order");
        return;
      }

      const orderData = orderResponse.data.data;

      // Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Leadsnipper Email Service",
        description: `Subscribe to ${orderData.name || "plan"}`,
        order_id: orderData.orderId,
        prefill: {
          email: orderData.email,
          name: orderData.name,
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await emailClient.post(
              "/api/payment/verify-payment",
              {
                razorpayOrderId: orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                tierId,
              }
            );

            if (verifyResponse.data.success) {
              toast.success("Payment successful! Subscription updated.");

              // Refresh subscription info to update UI
              try {
                await getSubscriptionInfo();
              } catch (e) {
                console.warn("Failed to refresh subscription info:", e);
              }

              const tier = tiers.find((t) => t.id === tierId);
              if (tier && onSuccess) {
                onSuccess(tier);
              }
            } else {
              toast.error("Payment verification failed");
              if (onError) onError("Payment verification failed");
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
            if (onError) onError("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast("Payment cancelled", { icon: "ℹ️" });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
      if (onError) onError(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get badge styles
  const getBadgeStyles = (color: string | null | undefined) => {
    switch (color) {
      case "green":
        return "bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/25";
      case "orange":
        return "bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/25";
      case "purple":
        return "bg-gradient-to-r from-purple-500 to-violet-500 shadow-purple-500/25";
      default:
        return "bg-gradient-to-r from-primary-100 to-primary-200 shadow-primary-100/25";
    }
  };

  // Get card border/highlight styles
  const getCardStyles = (
    _tier: PricingTier,
    isCurrentPlan: boolean,
    isExpiredCurrentTier: boolean,
    isPopular: boolean
  ) => {
    if (isCurrentPlan) {
      return "border-green-500/50 ring-2 ring-green-500/30 bg-gradient-to-b from-green-500/10 to-transparent";
    }
    if (isExpiredCurrentTier) {
      return "border-red-500/50 ring-2 ring-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent";
    }
    if (isPopular) {
      return "border-primary-100/50 ring-2 ring-primary-100/30 bg-gradient-to-b from-primary-100/10 to-transparent scale-[1.02] shadow-2xl shadow-primary-100/20";
    }
    return "border-white/10 hover:border-white/30 bg-bg-200/80";
  };

  const isPopularTier = (tierName: string) => tierName === "starter";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const isTierMatch =
            !!currentSubscription && currentSubscription.tierName === tier.name;
          const status = currentSubscription?.status || "active";
          const isCurrentPlan =
            isTierMatch && (status === "active" || status === "trial");
          const isExpiredCurrentTier = isTierMatch && status === "expired";
          const isCustomPlan = tier.name === "custom";
          const isTrialPlan = tier.name === "trial";
          const isPopular = isPopularTier(tier.name);

          return (
            <div
              key={tier.id}
              className={`relative backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${getCardStyles(
                tier,
                isCurrentPlan,
                isExpiredCurrentTier,
                isPopular
              )}`}
            >
              {/* Popular/Recommended Badge */}
              {isPopular && !isCurrentPlan && !isExpiredCurrentTier && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`${getBadgeStyles(
                      tier.badgeColor
                    )} text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap`}
                  >
                    ⭐ Most Popular
                  </div>
                </div>
              )}

              {/* Early Signup Bonus Badge (for non-popular tiers) */}
              {tier.badgeText &&
                !isPopular &&
                !isCurrentPlan &&
                !isExpiredCurrentTier && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div
                      className={`${getBadgeStyles(
                        tier.badgeColor
                      )} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg whitespace-nowrap`}
                    >
                      {tier.badgeText}
                    </div>
                  </div>
                )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-green-500/25">
                    ✓ Current Plan
                  </div>
                </div>
              )}

              {/* Expired Badge */}
              {!isCurrentPlan && isExpiredCurrentTier && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-red-500/25">
                    ⚠ Expired
                  </div>
                </div>
              )}

              {/* Tier Header */}
              <div className="pt-4 pb-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-text-100 mb-1">
                  {tier.displayName}
                </h3>
                <p className="text-text-200 text-sm h-10">{tier.description}</p>
              </div>

              {/* Pricing */}
              <div className="py-6">
                {/* Original price with strikethrough */}
                {tier.originalPriceInPaise && tier.originalPriceInPaise > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-text-200 line-through text-lg">
                      ₹{(tier.originalPriceInPaise / 100).toFixed(0)}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      Save{" "}
                      {Math.round(
                        ((tier.originalPriceInPaise -
                          tier.monthlyPriceInPaise) /
                          tier.originalPriceInPaise) *
                          100
                      )}
                      %
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-1">
                  {isCustomPlan ? (
                    <span className="text-3xl font-bold text-text-100">
                      Contact Us
                    </span>
                  ) : tier.monthlyPriceInPaise === 0 ? (
                    <>
                      <span className="text-4xl font-bold text-text-100">
                        ₹0
                      </span>
                      <span className="text-text-200 text-sm">/month</span>
                      {isTrialPlan && tier.trialDurationDays && (
                        <span className="ml-2 text-xs text-primary-100 bg-primary-100/10 px-2 py-0.5 rounded-full">
                          {tier.trialDurationDays} days
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-text-100">
                        ₹{(tier.monthlyPriceInPaise / 100).toFixed(0)}
                      </span>
                      <span className="text-text-200 text-sm">/month</span>
                    </>
                  )}
                </div>

                {/* Usage Info */}
                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-text-200 text-sm">
                    <svg
                      className="w-4 h-4 text-primary-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {tier.monthlyEmailLimit === 0
                        ? "Unlimited emails"
                        : `${tier.monthlyEmailLimit.toLocaleString()} emails/month`}
                    </span>
                  </div>
                  {tier.maxContacts !== undefined && tier.maxContacts > 0 && (
                    <div className="flex items-center gap-2 text-text-200 text-sm">
                      <svg
                        className="w-4 h-4 text-primary-100"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{tier.maxContacts.toLocaleString()} contacts</span>
                    </div>
                  )}
                  {isCustomPlan && (
                    <div className="flex items-center gap-2 text-text-200 text-sm">
                      <svg
                        className="w-4 h-4 text-primary-100"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Unlimited everything</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      tier.volumeSendingEnabled
                        ? "bg-green-500/20"
                        : "bg-gray-500/20"
                    }`}
                  >
                    {tier.volumeSendingEnabled ? (
                      <svg
                        className="w-3 h-3 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={
                      tier.volumeSendingEnabled
                        ? "text-text-100"
                        : "text-text-200"
                    }
                  >
                    Volume Sending
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      tier.customDomainEnabled
                        ? "bg-green-500/20"
                        : "bg-gray-500/20"
                    }`}
                  >
                    {tier.customDomainEnabled ? (
                      <svg
                        className="w-3 h-3 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={
                      tier.customDomainEnabled
                        ? "text-text-100"
                        : "text-text-200"
                    }
                  >
                    Custom Domain
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      tier.warmupEnabled ? "bg-green-500/20" : "bg-gray-500/20"
                    }`}
                  >
                    {tier.warmupEnabled ? (
                      <svg
                        className="w-3 h-3 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={
                      tier.warmupEnabled ? "text-text-100" : "text-text-200"
                    }
                  >
                    Email Warmup
                    {tier.warmupEnabled &&
                      tier.warmupDailyLimit !== undefined &&
                      tier.warmupDailyLimit > 0 && (
                        <span className="text-primary-100 ml-1">
                          ({tier.warmupDailyLimit}/day)
                        </span>
                      )}
                    {tier.warmupEnabled &&
                      (tier.warmupDailyLimit === 0 ||
                        tier.warmupDailyLimit === undefined) && (
                        <span className="text-primary-100 ml-1">
                          (Unlimited)
                        </span>
                      )}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      tier.analyticsEnabled
                        ? "bg-green-500/20"
                        : "bg-gray-500/20"
                    }`}
                  >
                    {tier.analyticsEnabled ? (
                      <svg
                        className="w-3 h-3 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={
                      tier.analyticsEnabled ? "text-text-100" : "text-text-200"
                    }
                  >
                    Analytics & Reports
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      tier.prioritySupportEnabled
                        ? "bg-green-500/20"
                        : "bg-gray-500/20"
                    }`}
                  >
                    {tier.prioritySupportEnabled ? (
                      <svg
                        className="w-3 h-3 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={
                      tier.prioritySupportEnabled
                        ? "text-text-100"
                        : "text-text-200"
                    }
                  >
                    Priority Support
                  </span>
                </li>
              </ul>

              {/* CTA Button */}
              {isCustomPlan ? (
                <button
                  onClick={() => setShowCustomPlanModal(true)}
                  className="w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 bg-white/10 hover:bg-white/20 text-text-100 border border-white/20 hover:border-white/40"
                >
                  Contact Us
                </button>
              ) : (
                <button
                  onClick={() => handlePayment(tier.id)}
                  disabled={loading || isCurrentPlan}
                  className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 ${
                    isCurrentPlan
                      ? "bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30"
                      : isPopular
                      ? "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-100/90 hover:to-primary-200/90 text-white shadow-lg shadow-primary-100/25 hover:shadow-xl hover:shadow-primary-100/30"
                      : isTrialPlan
                      ? "bg-white/10 hover:bg-white/20 text-text-100 border border-white/20 hover:border-white/40"
                      : "bg-primary-100 hover:bg-primary-100/90 text-white"
                  } disabled:opacity-50`}
                >
                  {isCurrentPlan
                    ? "✓ Current Plan"
                    : loading
                    ? "Processing..."
                    : isTrialPlan
                    ? "Start Free Trial"
                    : isPopular
                    ? "Get Started →"
                    : "Subscribe"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Plan Request Modal */}
      <CustomPlanRequestModal
        isOpen={showCustomPlanModal}
        onClose={() => setShowCustomPlanModal(false)}
      />
    </div>
  );
};

export default RazorpayPayment;
