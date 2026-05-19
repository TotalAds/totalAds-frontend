"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { completeSocialOnboarding, getSocialAccess } from "@/utils/api/socialClient";
import {
  createSocialSubscription,
  verifySocialPayment,
  getSocialPricing,
  SocialPricingTier,
} from "@/utils/api/socialBillingClient";
import {
  IconBrandLinkedin,
  IconCheck,
  IconLoader2,
  IconBrain,
  IconCreditCard,
} from "@tabler/icons-react";
import { toast } from "react-hot-toast";

export default function SocialOnboardingPage() {
  const router = useRouter();
  const { state, refreshUser } = useAuthContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [pricingTier, setPricingTier] = useState<SocialPricingTier | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay checkout script
  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Fetch access + pricing when authenticated
  useEffect(() => {
    const init = async () => {
      if (!state.isAuthenticated) {
        router.push("/login?product=socialsnipper");
        return;
      }

      try {
        const [access, tiers] = await Promise.all([
          getSocialAccess(),
          getSocialPricing(),
        ]);

        setHasSubscription(access.enabled);
        setLinkedinConnected(access.linkedinConnected);

        const linkedInTier = tiers.find((t) => t.includesLinkedIn) || tiers[0];
        setPricingTier(linkedInTier || null);

        if (access.enabled && access.linkedinConnected) {
          if (!access.socialOnboardingCompleted) {
            await completeSocialOnboarding();
            await refreshUser();
          }
          router.replace("/social/dashboard");
          return;
        }

        if (access.enabled && !access.linkedinConnected) {
          setStep(2);
        }
      } catch (error) {
        console.error("Error loading onboarding:", error);
        toast.error("Failed to load onboarding. Please refresh the page.");
      } finally {
        setPricingLoading(false);
        setLoading(false);
      }
    };

    init();
  }, [state.isAuthenticated, router, refreshUser]);

  // Handle Razorpay payment
  const handleRazorpayPayment = useCallback(async () => {
    if (!pricingTier || !razorpayLoaded) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create subscription on backend
      const orderData = await createSocialSubscription(pricingTier.id);

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SocialSnipper",
        description: `${pricingTier.displayName} - Monthly`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.name || state.user?.name || "",
          email: orderData.email || state.user?.email || "",
        },
        theme: {
          color: "#3b82f6",
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            await verifySocialPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              tierId: pricingTier.id,
              paidAmountInPaise: orderData.amount,
              lockedPriceInPaise: orderData.lockedPriceInPaise ?? orderData.amount,
            });

            toast.success("Payment successful! Welcome to SocialSnipper.");
            setHasSubscription(true);
            await refreshUser();
            setStep(2);
          } catch (verifyError) {
            console.error("Payment verification failed:", verifyError);
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast("Payment cancelled. You can try again when ready.", {
              icon: "ℹ️",
            });
          },
        },
      };

      const Razorpay = (window as Window & { Razorpay?: new (opts: object) => { open: () => void } })
        .Razorpay;
      if (!Razorpay) {
        toast.error("Payment system not ready. Please refresh the page.");
        setIsProcessing(false);
        return;
      }
      const razorpay = new Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Failed to initiate payment:", error);
      toast.error("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  }, [pricingTier, razorpayLoaded, state.user, refreshUser]);

  const handleCompleteOnboarding = async () => {
    try {
      await completeSocialOnboarding();
      await refreshUser();
      toast.success("Welcome to SocialSnipper!");
      router.replace("/social/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Could not save onboarding progress. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-brand-main mx-auto mb-4" />
          <p className="text-text-200">Loading...</p>
        </div>
      </div>
    );
  }

  const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

  return (
    <>
      <div className="min-h-screen bg-bg-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < 3 ? "flex-1" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s <= step
                      ? "bg-brand-main text-white"
                      : "bg-bg-200 text-text-300"
                  }`}
                >
                  {s < step ? <IconCheck className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? "bg-brand-main" : "bg-bg-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-text-300">
            <span>Subscribe</span>
            <span>Connect LinkedIn</span>
            <span>Memory Setup</span>
          </div>
        </div>

        {/* Step 1: Subscription */}
        {step === 1 && !hasSubscription && (
          <div className="bg-bg-200 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-main/10 rounded-2xl mb-4">
                <IconCreditCard className="w-8 h-8 text-brand-main" />
              </div>
              <h1 className="text-2xl font-bold text-text-100 mb-2">
                Subscribe to SocialSnipper
              </h1>
              <p className="text-text-200">
                Get started with AI-powered LinkedIn automation
                {pricingTier
                  ? ` for just ${formatPrice(pricingTier.monthlyPriceInPaise)}/month.`
                  : "."}
              </p>
            </div>

            <div className="bg-bg-100 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-text-100">
                    {pricingTier?.displayName || "LinkedIn Monthly"}
                  </h3>
                  <p className="text-sm text-text-300">Full access to all features</p>
                </div>
                <div className="text-right">
                  {pricingLoading ? (
                    <span className="text-sm text-text-300">Loading...</span>
                  ) : pricingTier ? (
                    <>
                      <span className="text-2xl font-bold text-text-100">
                        {formatPrice(pricingTier.monthlyPriceInPaise)}
                      </span>
                      <span className="text-text-300">/month</span>
                    </>
                  ) : (
                    <span className="text-sm text-red-400">Unavailable</span>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {[
                  "AI-generated LinkedIn posts",
                  `Up to ${pricingTier?.maxDailyPosts || 2} posts per day`,
                  "Smart scheduling & calendar",
                  "Approval workflows",
                  "Performance analytics",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-text-200"
                  >
                    <IconCheck className="w-4 h-4 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessing || !razorpayLoaded || pricingLoading || !pricingTier}
                className="w-full py-3 bg-brand-main text-white rounded-xl font-semibold hover:bg-brand-main/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {!razorpayLoaded ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    Loading payment...
                  </>
                ) : isProcessing ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : pricingLoading ? (
                  <>Loading pricing...</>
                ) : pricingTier ? (
                  <>Subscribe Now - {formatPrice(pricingTier.monthlyPriceInPaise)}/month</>
                ) : (
                  <>Pricing unavailable</>
                )}
              </button>
            </div>

            <p className="text-center text-sm text-text-300">
              Already subscribed?{" "}
              <button
                onClick={() => setStep(2)}
                className="text-brand-main hover:underline"
              >
                Continue to LinkedIn setup
              </button>
            </p>
          </div>
        )}

        {/* Step 2: LinkedIn Connect */}
        {step === 2 && (
          <div className="bg-bg-200 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-2xl mb-4">
                <IconBrandLinkedin className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-text-100 mb-2">
                Connect Your LinkedIn
              </h1>
              <p className="text-text-200">
                Link your LinkedIn account so we can publish posts on your behalf.
              </p>
            </div>

            {!linkedinConnected ? (
              <div className="space-y-4">
                <div className="bg-bg-100 rounded-xl p-6">
                  <h3 className="font-semibold text-text-100 mb-4">
                    What you&apos;ll get:
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Automated post publishing to your LinkedIn profile",
                      "Engagement tracking and analytics",
                      "AI-generated content tailored to your voice",
                      "100% secure - we never store your password",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm text-text-200"
                      >
                        <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => router.push("/social/linkedin")}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <IconBrandLinkedin className="w-5 h-5" />
                  Connect LinkedIn Account
                </button>

                <p className="text-center text-xs text-text-300">
                  You can revoke access anytime from your LinkedIn settings.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full mb-4">
                  <IconCheck className="w-5 h-5" />
                  LinkedIn Connected
                </div>
                <p className="text-text-200 mb-4">
                  Your LinkedIn account is successfully connected!
                </p>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-brand-main text-white rounded-xl font-semibold hover:bg-brand-main/90 transition-colors"
                >
                  Continue to Memory Setup
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Memory Setup */}
        {step === 3 && (
          <div className="bg-bg-200 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-2xl mb-4">
                <IconBrain className="w-8 h-8 text-purple-500" />
              </div>
              <h1 className="text-2xl font-bold text-text-100 mb-2">
                Set Up Your Memory
              </h1>
              <p className="text-text-200">
                Tell us about yourself so our AI can create content that sounds like you.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-bg-100 rounded-xl p-6">
                <h3 className="font-semibold text-text-100 mb-4">
                  Memory helps SocialSnipper:
                </h3>
                <ul className="space-y-3">
                  {[
                    "Learn your writing style and tone",
                    "Understand your industry and expertise",
                    "Create relevant content your audience loves",
                    "Remember what topics perform best",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-text-200"
                    >
                      <IconCheck className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => router.push("/social/memory/onboarding")}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
              >
                Set Up Memory
              </button>

              <button
                onClick={handleCompleteOnboarding}
                className="w-full py-3 bg-transparent border border-bg-300 text-text-200 rounded-xl font-semibold hover:bg-bg-300 transition-colors"
              >
                Skip for now (you can set this up later)
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-text-300 hover:text-text-100 transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => router.push("/email/dashboard")}
            className="text-text-300 hover:text-text-100 transition-colors text-sm"
          >
            Back to LeadSnipper →
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
