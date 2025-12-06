"use client";

import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Headphones,
  Mail,
  Shield,
  Users,
  Zap,
} from "lucide-react";
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

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is the Early Signup Bonus?",
    answer:
      "Our Early Signup Bonus gives you up to 50% off on all paid plans. This is a limited-time offer for early adopters who sign up now. Lock in these prices forever!",
  },
  {
    question: "Can I change my plan anytime?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.",
  },
  {
    question: "What happens when I exceed my monthly limit?",
    answer:
      "You'll be notified when you're approaching your limit (at 80% and 90%). You can upgrade to a higher tier for additional capacity or wait for the next billing cycle.",
  },
  {
    question: "How does the trial work?",
    answer:
      "Start with our free trial plan for 1 month with 1,000 emails and 500 contacts. No credit card required. At the end of the trial, simply choose a paid plan to continue.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 7-day money-back guarantee for new subscriptions. No questions asked. Just contact our support team.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption and follow best practices for data security. Your email lists and campaign data are fully protected.",
  },
];

const features = [
  {
    name: "Monthly Emails",
    trial: "1,000",
    starter: "5,000",
    business: "15,000",
    custom: "Unlimited",
  },
  {
    name: "Contacts",
    trial: "500",
    starter: "3,000",
    business: "10,000",
    custom: "Unlimited",
  },
  {
    name: "Email Warmup",
    trial: false,
    starter: "50/day",
    business: "Unlimited",
    custom: "Unlimited",
  },
  {
    name: "Custom Domains",
    trial: false,
    starter: "3",
    business: "Unlimited",
    custom: "Unlimited",
  },
  {
    name: "Analytics & Reports",
    trial: true,
    starter: true,
    business: true,
    custom: true,
  },
  {
    name: "API Access",
    trial: true,
    starter: true,
    business: true,
    custom: true,
  },
  {
    name: "Priority Support",
    trial: false,
    starter: false,
    business: true,
    custom: true,
  },
  {
    name: "Dedicated Account Manager",
    trial: false,
    starter: false,
    business: false,
    custom: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handlePaymentSuccess = (tier: PricingTier) => {
    toast.success(`Successfully subscribed to ${tier.displayName}!`);
    setTimeout(() => {
      router.push("/email/dashboard");
    }, 2000);
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      ) : (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-500/20">
          <svg
            className="w-4 h-4 text-gray-500"
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
        </span>
      );
    }
    return <span className="text-text-100 font-medium">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-100 via-bg-200 to-bg-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100/20 to-primary-300/20 rounded-full border border-primary-100/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-100 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-100"></span>
              </span>
              <span className="text-primary-100 text-sm font-semibold">
                🎉 Early Signup Bonus — Limited Time Offer
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-text-100 mb-4">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-primary-100 to-primary-300 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-200 text-center max-w-2xl mx-auto mb-4">
            Choose the perfect plan for your email marketing needs. No hidden
            fees, no surprises.
          </p>

          <p className="text-center">
            <span className="inline-flex items-center gap-2 text-green-400 font-semibold">
              <Zap className="w-4 h-4" />
              Save up to 50% with our Early Signup Bonus!
            </span>
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <RazorpayPayment onSuccess={handlePaymentSuccess} />
      </div>

      {/* Trust Badges */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Shield,
              text: "Secure Payments",
              subtext: "256-bit SSL encryption",
            },
            {
              icon: Clock,
              text: "Cancel Anytime",
              subtext: "No long-term contracts",
            },
            {
              icon: Zap,
              text: "Instant Setup",
              subtext: "Start in under 2 minutes",
            },
            {
              icon: Headphones,
              text: "24/7 Support",
              subtext: "We're here to help",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-bg-200/50 border border-white/5"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100/10 flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 text-primary-100" />
              </div>
              <p className="text-text-100 font-semibold text-sm">{item.text}</p>
              <p className="text-text-200 text-xs mt-1">{item.subtext}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-100 mb-3">
            Compare All Features
          </h2>
          <p className="text-text-200">
            See exactly what you get with each plan
          </p>
        </div>

        <div className="bg-bg-200/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-5 px-6 text-text-100 font-semibold bg-bg-300/50">
                    Features
                  </th>
                  <th className="text-center py-5 px-4 text-text-200 font-medium bg-bg-300/50 min-w-[100px]">
                    <div className="flex flex-col items-center">
                      <span className="text-text-100">Trial</span>
                      <span className="text-xs text-text-200 mt-1">Free</span>
                    </div>
                  </th>
                  <th className="text-center py-5 px-4 font-medium bg-primary-100/5 border-x border-primary-100/20 min-w-[100px]">
                    <div className="flex flex-col items-center">
                      <span className="text-primary-100 font-semibold">
                        Starter
                      </span>
                      <span className="text-xs text-primary-100/70 mt-1">
                        ₹499/mo
                      </span>
                    </div>
                  </th>
                  <th className="text-center py-5 px-4 text-text-200 font-medium bg-bg-300/50 min-w-[100px]">
                    <div className="flex flex-col items-center">
                      <span className="text-text-100">Business</span>
                      <span className="text-xs text-text-200 mt-1">
                        ₹999/mo
                      </span>
                    </div>
                  </th>
                  <th className="text-center py-5 px-4 text-text-200 font-medium bg-bg-300/50 min-w-[100px]">
                    <div className="flex flex-col items-center">
                      <span className="text-text-100">Custom</span>
                      <span className="text-xs text-text-200 mt-1">
                        Contact Us
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                      idx % 2 === 0 ? "" : "bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-4 px-6 text-text-100 font-medium">
                      {feature.name}
                    </td>
                    <td className="text-center py-4 px-4">
                      {renderFeatureValue(feature.trial)}
                    </td>
                    <td className="text-center py-4 px-4 bg-primary-100/5 border-x border-primary-100/10">
                      {renderFeatureValue(feature.starter)}
                    </td>
                    <td className="text-center py-4 px-4">
                      {renderFeatureValue(feature.business)}
                    </td>
                    <td className="text-center py-4 px-4">
                      {renderFeatureValue(feature.custom)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-100 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-text-200">
            Everything you need to know about our pricing
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`bg-bg-200/80 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-200 ${
                openFaq === idx ? "border-primary-100/30" : "border-white/10"
              }`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-text-100 font-semibold pr-4">
                  {faq.question}
                </span>
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    openFaq === idx ? "bg-primary-100/20" : "bg-white/10"
                  }`}
                >
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-primary-100" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-200" />
                  )}
                </span>
              </button>
              <div
                className={`transition-all duration-200 ease-in-out ${
                  openFaq === idx ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <p className="px-5 pb-5 text-text-200 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-100/20 via-bg-200 to-primary-300/20 rounded-2xl p-8 md:p-12 text-center border border-primary-100/20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-300/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative">
            <h3 className="text-2xl md:text-3xl font-bold text-text-100 mb-3">
              Ready to grow your email marketing?
            </h3>
            <p className="text-text-200 mb-6 max-w-xl mx-auto">
              Start your free trial today and see why thousands of businesses
              trust LeadSnipper for their cold email outreach.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-8 py-3 bg-primary-100 hover:bg-primary-100/90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-100/25 hover:shadow-xl hover:shadow-primary-100/30"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => router.push("/email/dashboard")}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-text-100 font-semibold rounded-xl transition-all border border-white/20"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
