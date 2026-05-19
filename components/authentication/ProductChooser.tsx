"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import GetLogo from "@/components/common/getLogo";
import {
  parseProduct,
  ProductType,
  storeAuthProduct,
} from "@/utils/auth/productIntent";
import { IconBrandLinkedin, IconMail } from "@tabler/icons-react";

interface ProductChooserProps {
  mode: "login" | "signup";
}

interface ProductCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  onClick: () => void;
  primary?: boolean;
}

function ProductCard({
  title,
  description,
  icon,
  features,
  onClick,
  primary = false,
}: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full p-6 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg ${
        primary
          ? "border-brand-main bg-brand-main/5 hover:bg-brand-main/10"
          : "border-gray-200 dark:border-brand-main/20 bg-white dark:bg-bg-100 hover:border-brand-main/50"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-lg ${
            primary
              ? "bg-brand-main text-white"
              : "bg-gray-100 dark:bg-brand-main/10 text-gray-700 dark:text-text-100"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-text-100 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-text-200 mb-3">
            {description}
          </p>
          <ul className="space-y-1">
            {features.map((feature, i) => (
              <li
                key={i}
                className="text-xs text-gray-500 dark:text-text-300 flex items-center gap-1.5"
              >
                <span className="w-1 h-1 bg-brand-main rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-brand-main group-hover:underline">
          Continue with {title}
        </span>
        <span className="text-brand-main transform group-hover:translate-x-1 transition-transform">
          →
        </span>
      </div>
    </button>
  );
}

export function ProductChooser({ mode }: ProductChooserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleProductSelect = (product: ProductType) => {
    // Store in sessionStorage for persistence
    storeAuthProduct(product);

    // Build URL with product param and preserve other params (ref, utm, etc.)
    const params = new URLSearchParams(searchParams.toString());
    if (product) {
      params.set("product", product);
    }

    const targetPath = mode === "login" ? "/login" : "/signup";
    const queryString = params.toString();
    const url = queryString ? `${targetPath}?${queryString}` : targetPath;

    router.push(url);
  };

  const title = mode === "login" ? "Sign In" : "Create Account";
  const subtitle =
    mode === "login"
      ? "Welcome back! Choose a product to continue (you can access both with one account):"
      : "Get started! Choose a product to set up first (you can add the other later):";

  return (
    <div className="h-screen bg-bg-100 flex overflow-hidden">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-main via-brand-main/80 to-brand-secondary relative overflow-hidden items-center justify-center p-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-tertiary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
        </div>

        {/* Decorative shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full" />
        <div className="absolute top-20 right-20 w-3 h-3 bg-white/40 rounded-full" />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-white/30 rounded-full" />

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-md">
          <h2 className="text-2xl font-bold mb-4">One Account, Two Products</h2>
          <p className="text-base text-white/90">
            Choose which product to start with. You can access both LeadSnipper 
            (email) and SocialSnipper (LinkedIn) with the same account.
          </p>
        </div>
      </div>

      {/* Right Side - Product Selection */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-brand-main rounded-lg">
                <GetLogo className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
              {title}
            </h1>
            <p className="text-gray-600 dark:text-text-200 text-sm">
              {subtitle}
            </p>
          </div>

          {/* Product Cards */}
          <div className="space-y-4">
            <ProductCard
              title="LeadSnipper"
              description="Cold email outreach platform with verified domains, AWS SES delivery, and deliverability safeguards."
              icon={<IconMail className="w-6 h-6" />}
              features={[
                "Verified domains & sender management",
                "Campaign builder with analytics",
                "Email verification & warmup",
                "From ₹499/month",
              ]}
              onClick={() => handleProductSelect("leadsnipper")}
              primary
            />

            <ProductCard
              title="SocialSnipper"
              description="AI-powered LinkedIn automation for consistent social presence and founder-led marketing."
              icon={<IconBrandLinkedin className="w-6 h-6" />}
              features={[
                "AI post generation & scheduling",
                "Memory-driven content",
                "Approval workflows",
                "₹99/month (founding member)",
              ]}
              onClick={() => handleProductSelect("socialsnipper")}
            />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-text-300 text-xs">
              One account gives you access to both products. You can switch between 
              LeadSnipper and SocialSnipper anytime from your dashboard.
            </p>
            <div className="mt-4 flex items-center justify-center gap-4">
              {mode === "login" ? (
                <a
                  href="/signup"
                  className="text-sm text-brand-main hover:text-brand-secondary transition-colors"
                >
                  Need an account? Sign up
                </a>
              ) : (
                <a
                  href="/login"
                  className="text-sm text-brand-main hover:text-brand-secondary transition-colors"
                >
                  Already have an account? Sign in
                </a>
              )}
            </div>
          </div>

          {/* Support */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-text-200 text-xs">
              Need help? Contact{" "}
              <a
                href="mailto:hello@leadsnipper.com"
                className="text-brand-main hover:text-brand-secondary transition-colors"
              >
                hello@leadsnipper.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductChooser;
