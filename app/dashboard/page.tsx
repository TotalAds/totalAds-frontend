"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { getSubscriptionInfo } from "@/utils/api/emailClient";
import { getSocialAccess } from "@/utils/api/socialClient";
import {
  IconBolt,
  IconBrandLinkedin,
  IconCheck,
  IconMail,
  IconPlus,
} from "@tabler/icons-react";

interface ProductCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  status: "active" | "needs-setup" | "locked";
  statusText: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  features: string[];
}

function ProductCard({
  title,
  description,
  icon,
  iconBg,
  status,
  statusText,
  primaryAction,
  secondaryAction,
  features,
}: ProductCardProps) {
  const statusColors = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    "needs-setup": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    locked: "bg-bg-200 text-text-300 border-bg-300",
  };

  return (
    <div className="bg-bg-100 rounded-2xl p-6 border border-bg-200 hover:border-brand-main/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}
        >
          {statusText}
        </span>
      </div>

      <h2 className="text-xl font-bold text-text-100 mb-2">{title}</h2>
      <p className="text-text-200 text-sm mb-4">{description}</p>

      <ul className="space-y-2 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-text-200">
            <IconCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Link
          href={primaryAction.href}
          className="block w-full py-2.5 px-4 bg-brand-main text-white text-center rounded-xl font-medium hover:bg-brand-main/90 transition-colors"
        >
          {primaryAction.label}
        </Link>
        {secondaryAction && (
          <Link
            href={secondaryAction.href}
            className="block w-full py-2.5 px-4 bg-transparent border border-bg-300 text-text-200 text-center rounded-xl font-medium hover:bg-bg-200 transition-colors"
          >
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function DashboardHubPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const { user, isAuthenticated, isLoading } = state;
  const [loading, setLoading] = useState(true);
  const [emailSub, setEmailSub] = useState<any>(null);
  const [socialAccess, setSocialAccess] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [emailData, socialData] = await Promise.all([
          getSubscriptionInfo(),
          getSocialAccess(),
        ]);
        setEmailSub(emailData);
        setSocialAccess(socialData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-main mx-auto mb-4"></div>
          <p className="text-text-200">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine product statuses
  const emailOnboardingComplete = user?.onboardingCompleted;
  const socialOnboardingComplete = user?.socialOnboardingCompleted;
  const hasSocialSubscription = socialAccess?.enabled;

  return (
    <div className="min-h-screen bg-bg-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-text-100 mb-3">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-text-200 max-w-lg mx-auto">
            Access all your TotalAds products from one place. Choose a product to get started.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* LeadSnipper Card */}
          <ProductCard
            title="LeadSnipper"
            description="Cold email outreach platform with verified domains, AWS SES delivery, and deliverability safeguards."
            icon={<IconMail className="w-6 h-6 text-white" />}
            iconBg="bg-blue-500"
            status={emailOnboardingComplete ? "active" : "needs-setup"}
            statusText={emailOnboardingComplete ? "Active" : "Needs Setup"}
            primaryAction={{
              label: emailOnboardingComplete ? "Go to Dashboard" : "Complete Setup",
              href: emailOnboardingComplete ? "/email/dashboard" : "/onboarding",
            }}
            features={[
              "Verified domains & sender management",
              "Campaign builder with analytics",
              "Email verification & warmup",
              "From ₹499/month",
            ]}
          />

          {/* SocialSnipper Card */}
          <ProductCard
            title="SocialSnipper"
            description="AI-powered LinkedIn automation for consistent social presence and personal brand growth."
            icon={<IconBrandLinkedin className="w-6 h-6 text-white" />}
            iconBg="bg-[#0077b5]"
            status={
              !socialOnboardingComplete
                ? "needs-setup"
                : hasSocialSubscription
                ? "active"
                : "locked"
            }
            statusText={
              !socialOnboardingComplete
                ? "Needs Setup"
                : hasSocialSubscription
                ? "Active"
                : "Subscribe to Access"
            }
            primaryAction={{
              label: !socialOnboardingComplete
                ? "Complete Setup"
                : hasSocialSubscription
                ? "Go to Dashboard"
                : "Subscribe - ₹99/month",
              href: !socialOnboardingComplete
                ? "/social/onboarding"
                : hasSocialSubscription
                ? "/social/dashboard"
                : "/social/pricing",
            }}
            secondaryAction={
              !socialOnboardingComplete && hasSocialSubscription
                ? {
                    label: "Go to Dashboard",
                    href: "/social/dashboard",
                  }
                : undefined
            }
            features={[
              "AI-generated LinkedIn posts",
              "Up to 2 posts per day",
              "Smart scheduling & calendar",
              "₹99/month",
            ]}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-bg-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-100 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {emailOnboardingComplete && (
              <Link
                href="/email/campaigns/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors"
              >
                <IconPlus className="w-4 h-4" />
                New Email Campaign
              </Link>
            )}
            {hasSocialSubscription && socialOnboardingComplete && (
              <Link
                href="/social/post-studio"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5]/10 text-[#0077b5] rounded-xl hover:bg-[#0077b5]/20 transition-colors"
              >
                <IconPlus className="w-4 h-4" />
                Create LinkedIn Post
              </Link>
            )}
            <Link
              href="/email/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-bg-100 text-text-200 rounded-xl hover:bg-bg-300 transition-colors"
            >
              Account Settings
            </Link>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 text-center text-sm text-text-300">
          <p>
            Need help? Contact{" "}
            <a href="mailto:hello@leadsnipper.com" className="text-brand-main hover:underline">
              hello@leadsnipper.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
