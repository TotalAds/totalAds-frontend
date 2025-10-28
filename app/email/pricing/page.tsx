"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

import RazorpayPayment from "@/components/payment/RazorpayPayment";

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

export default function PricingPage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);

  const handlePaymentSuccess = (tier: PricingTier) => {
    setSelectedTier(tier);
    toast.success(`Successfully subscribed to ${tier.displayName}!`);
    setTimeout(() => {
      router.push("/email/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-bg-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-100 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-text-200">
            Choose the perfect plan for your email marketing needs
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="mb-12">
          <RazorpayPayment onSuccess={handlePaymentSuccess} />
        </div>

        {/* Features Comparison */}
        <div className="bg-brand-main/10 backdrop-blur-md border border-brand-main/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-text-100 mb-6">
            Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-text-200">
              <thead>
                <tr className="border-b border-brand-main/20">
                  <th className="text-left py-3 px-4 text-text-100 font-semibold">
                    Feature
                  </th>
                  <th className="text-center py-3 px-4">Free Trial</th>
                  <th className="text-center py-3 px-4">Starter</th>
                  <th className="text-center py-3 px-4">Growth</th>
                  <th className="text-center py-3 px-4">Pay-as-you-go</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-brand-main/10">
                  <td className="py-3 px-4">Monthly Emails</td>
                  <td className="text-center">100</td>
                  <td className="text-center">1,000</td>
                  <td className="text-center">2,000</td>
                  <td className="text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-brand-main/10">
                  <td className="py-3 px-4">Volume Sending</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b border-brand-main/10">
                  <td className="py-3 px-4">Analytics</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b border-brand-main/10">
                  <td className="py-3 px-4">Custom Domain</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Priority Support</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-brand-main/10 backdrop-blur-md border border-brand-main/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-text-100 mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-text-100 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-text-200">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-100 mb-2">
                What happens when I exceed my monthly limit?
              </h3>
              <p className="text-text-200">
                You'll be notified when you're approaching your limit. You can
                upgrade to a higher tier or use pay-as-you-go for additional
                emails.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-100 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-text-200">
                We offer a 7-day money-back guarantee for new subscriptions. No
                questions asked.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-100 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-text-200">
                No, there are no setup fees or hidden charges. You only pay for
                what you use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
