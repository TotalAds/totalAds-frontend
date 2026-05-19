"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  createSocialSubscription,
  getSocialPricing,
  getSocialSubscription,
  SocialPricingTier,
  verifySocialPayment,
} from "@/utils/api/socialBillingClient";
import { getSocialAccess } from "@/utils/api/socialClient";
import { IconCheck, IconBrandLinkedin, IconLoader2 } from "@tabler/icons-react";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SocialPricingPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [tiers, setTiers] = useState<SocialPricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isFoundingMember, setIsFoundingMember] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pricingData, subscriptionData, accessData] = await Promise.all([
          getSocialPricing(),
          getSocialSubscription(),
          getSocialAccess(),
        ]);

        setTiers(pricingData);
        setCurrentSubscription(subscriptionData);
        setIsFoundingMember(accessData.subscription?.lockedPriceInPaise !== null);
      } catch (error) {
        console.error("Error loading pricing data:", error);
        toast.error("Failed to load pricing information");
      } finally {
        setLoading(false);
      }
    };

    if (state.isAuthenticated) {
      loadData();
    }
  }, [state.isAuthenticated]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (tier: SocialPricingTier) => {
    if (!state.isAuthenticated) {
      router.push("/login?product=socialsnipper");
      return;
    }

    if (processing) return;
    setProcessing(true);

    try {
      const orderData = await createSocialSubscription(tier.id);

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SocialSnipper",
        description: `${tier.displayName} - Monthly Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.name || state.user?.name || "",
          email: orderData.email || state.user?.email || "",
        },
        theme: {
          color: "#3b82f6",
        },
        handler: function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          handlePaymentSuccess(response, tier);
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      toast.error(error.message || "Failed to start checkout");
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (
    response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
    tier: SocialPricingTier
  ) => {
    try {
      toast.success("Payment successful! Activating your subscription...");

      await verifySocialPayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        tierId: tier.id,
        paidAmountInPaise: tier.monthlyPriceInPaise,
        lockedPriceInPaise:
          tier.monthlyPriceInPaise <= 9900 ? 9900 : tier.monthlyPriceInPaise,
      });

      const subscription = await getSocialSubscription();
      setCurrentSubscription(subscription);
      toast.success("Subscription activated!");
      router.push("/social/onboarding");
    } catch (error) {
      console.error("Error handling payment success:", error);
      toast.error("Payment verification failed. Please contact support.");
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-brand-main mx-auto mb-4" />
          <p className="text-text-200">Loading pricing...</p>
        </div>
      </div>
    );
  }

  // Default tier if none fetched
  const defaultTier: SocialPricingTier = {
    id: 1,
    name: "linkedin_monthly",
    displayName: "LinkedIn Monthly",
    description: "AI-powered LinkedIn automation for consistent social presence",
    monthlyPriceInPaise: 9900,
    originalPriceInPaise: null,
    includesLinkedIn: true,
    includesTwitter: false,
    includesAgent: true,
    maxDailyPosts: 2,
    includesImageGeneration: false,
    includesApprovalWorkflows: true,
    includesAnalytics: true,
  };

  const displayTiers = tiers.length > 0 ? tiers : [defaultTier];

  return (
    <div className="min-h-screen bg-bg-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-main/10 rounded-2xl mb-6">
            <IconBrandLinkedin className="w-8 h-8 text-brand-main" />
          </div>
          <h1 className="text-3xl font-bold text-text-100 mb-3">
            SocialSnipper Pricing
          </h1>
          <p className="text-text-200 max-w-lg mx-auto">
            AI-powered LinkedIn automation to grow your personal brand and generate leads on autopilot.
          </p>
          {isFoundingMember && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm">
              <IconCheck className="w-4 h-4" />
              Founding Member - ₹99/month locked price!
            </div>
          )}
        </div>

        {/* Current Subscription Status */}
        {currentSubscription?.subscription && (
          <div className="mb-8 p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-1">
                  Active Subscription
                </h3>
                <p className="text-text-200 text-sm">
                  Your {currentSubscription.tier?.displayName || "subscription"} is active until{" "}
                  {new Date(currentSubscription.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => router.push("/social/dashboard")}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                currentSubscription?.subscription
                  ? "border-bg-200 opacity-75"
                  : "border-brand-main bg-brand-main/5"
              }`}
            >
              {/* Badge */}
              {tier.name === "linkedin_monthly" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-main text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              {/* Tier Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-text-100 mb-2">
                  {tier.displayName}
                </h3>
                <p className="text-text-300 text-sm mb-4">{tier.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-text-100">
                    {formatPrice(tier.monthlyPriceInPaise)}
                  </span>
                  <span className="text-text-300">/month</span>
                </div>
                {tier.originalPriceInPaise && (
                  <p className="text-text-300 text-sm line-through mt-1">
                    {formatPrice(tier.originalPriceInPaise)}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-text-200">
                  <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>AI-generated LinkedIn posts</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-200">
                  <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Up to {tier.maxDailyPosts} posts per day</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-200">
                  <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Smart scheduling & calendar</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-200">
                  <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Approval workflows</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-200">
                  <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Performance analytics</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-200">
                  <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Memory-driven content</span>
                </li>
                {tier.includesImageGeneration && (
                  <li className="flex items-center gap-3 text-sm text-text-200">
                    <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>AI image generation</span>
                  </li>
                )}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(tier)}
                disabled={processing || !!currentSubscription?.subscription}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                  currentSubscription?.subscription
                    ? "bg-bg-200 text-text-300 cursor-not-allowed"
                    : "bg-brand-main text-white hover:bg-brand-main/90"
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : currentSubscription?.subscription ? (
                  "Already Subscribed"
                ) : (
                  `Subscribe - ${formatPrice(tier.monthlyPriceInPaise)}/mo`
                )}
              </button>

              {/* Founding Member Note */}
              {isFoundingMember && !currentSubscription?.subscription && (
                <p className="mt-3 text-center text-xs text-green-400">
                  Founding member price locked at ₹99/month
                </p>
              )}
            </div>
          ))}
        </div>

        {/* FAQ / Info */}
        <div className="mt-12 p-6 bg-bg-200/50 rounded-xl">
          <h3 className="text-lg font-semibold text-text-100 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-text-200 mb-1">
                What happens after I subscribe?
              </h4>
              <p className="text-sm text-text-300">
                You&apos;ll get immediate access to all SocialSnipper features. Complete the
                LinkedIn onboarding to start generating and scheduling posts.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-text-200 mb-1">
                Can I cancel anytime?
              </h4>
              <p className="text-sm text-text-300">
                Yes, you can cancel your subscription anytime from your account settings. Your
                access will continue until the end of your billing period.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-text-200 mb-1">
                Is my LinkedIn account safe?
              </h4>
              <p className="text-sm text-text-300">
                Yes, we use official LinkedIn APIs and OAuth. We never store your password and you
                can revoke access anytime from your LinkedIn settings.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/email/dashboard")}
            className="text-text-300 hover:text-text-100 transition-colors text-sm"
          >
            ← Back to LeadSnipper Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
