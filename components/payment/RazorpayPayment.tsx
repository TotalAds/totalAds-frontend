"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";
import emailClient, {
  getSubscriptionInfo,
  SubscriptionInfo,
} from "@/utils/api/emailClient";

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
  monthlyEmailLimit: number;
  monthlyCredits: number;
  volumeSendingEnabled: boolean;
  apiAccessEnabled: boolean;
  analyticsEnabled: boolean;
  customDomainEnabled: boolean;
  prioritySupportEnabled: boolean;
}

interface RazorpayPaymentProps {
  onSuccess?: (tier: PricingTier) => void;
  onError?: (error: string) => void;
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  onSuccess,
  onError,
}) => {
  const { state } = useAuthContext();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionInfo | null>(null);

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
        setTiers(tiersResponse.data.data || []);
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
        name: "TotalAds Email Service",
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const isCurrentPlan =
            currentSubscription && currentSubscription.tierName === tier.name;

          return (
            <div
              key={tier.id}
              className={`relative bg-white/10 backdrop-blur-md border rounded-xl p-6 transition-all ${
                isCurrentPlan
                  ? "border-green-500/50 ring-2 ring-green-500/20"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute top-3 right-3 bg-brand-tertiary text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Current Plan
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">
                {tier.displayName}
              </h3>
              <p className="text-gray-300 text-sm mb-4">{tier.description}</p>

              <div className="mb-4">
                <div className="text-3xl font-bold text-white">
                  {tier.monthlyPriceInPaise === 0 ? (
                    "Free"
                  ) : (
                    <>
                      ₹{(tier.monthlyPriceInPaise / 100).toFixed(0)}
                      <span className="text-sm text-gray-300">/month</span>
                    </>
                  )}
                </div>
                <p className="text-gray-300 text-sm mt-2">
                  {tier.monthlyEmailLimit === 0
                    ? "Unlimited emails"
                    : `${tier.monthlyEmailLimit.toLocaleString()} emails/month`}
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li
                  className={tier.volumeSendingEnabled ? "text-green-400" : ""}
                >
                  {tier.volumeSendingEnabled ? "✓" : "✗"} Volume Sending
                </li>
                <li className={tier.analyticsEnabled ? "text-green-400" : ""}>
                  {tier.analyticsEnabled ? "✓" : "✗"} Analytics
                </li>
                <li
                  className={tier.customDomainEnabled ? "text-green-400" : ""}
                >
                  {tier.customDomainEnabled ? "✓" : "✗"} Custom Domain
                </li>
                <li
                  className={
                    tier.prioritySupportEnabled ? "text-green-400" : ""
                  }
                >
                  {tier.prioritySupportEnabled ? "✓" : "✗"} Priority Support
                </li>
              </ul>

              <button
                onClick={() => handlePayment(tier.id)}
                disabled={loading || !!isCurrentPlan}
                className={`w-full font-semibold py-2 px-4 rounded-lg transition-all ${
                  isCurrentPlan
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-brand-main hover:bg-brand-main/80 text-white"
                } disabled:opacity-50`}
              >
                {isCurrentPlan
                  ? "Current Plan"
                  : loading
                  ? "Processing..."
                  : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RazorpayPayment;
