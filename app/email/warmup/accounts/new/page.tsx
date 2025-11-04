"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import {
  createWarmupAccount,
  CreateWarmupAccountRequest,
} from "@/utils/api/warmupClient";
import { IconArrowLeft, IconMail } from "@tabler/icons-react";

type Provider = "gmail" | "outlook" | "yahoo" | "zoho" | "custom";

const PROVIDER_INFO: Record<Provider, { name: string; icon: string }> = {
  gmail: { name: "Gmail / G-Suite", icon: "📧" },
  outlook: { name: "Microsoft Outlook", icon: "📨" },
  yahoo: { name: "Yahoo Mail", icon: "🔔" },
  zoho: { name: "Zoho Mail", icon: "⚙️" },
  custom: { name: "Custom IMAP/SMTP", icon: "🔌" },
};

export default function CreateWarmupAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useAuthContext();

  const provider = (searchParams.get("provider") as Provider) || "gmail";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWarmupAccountRequest>({
    email: "",
    provider,
    displayName: "",
    dailyLimit: 10,
  });

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated && state.user) {
      if (!state.user.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }
    }
  }, [state.isLoading, state.isAuthenticated, state.user, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "dailyLimit" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email) {
      toast.error("Email address is required");
      return;
    }

    if (!formData.displayName) {
      toast.error("Display name is required");
      return;
    }

    if (
      !formData.dailyLimit ||
      formData.dailyLimit < 5 ||
      formData.dailyLimit > 150
    ) {
      toast.error("Daily limit must be between 5 and 150");
      return;
    }

    try {
      setLoading(true);
      const toastId = toast.loading("Creating warmup account...");

      const account = await createWarmupAccount(formData);

      toast.dismiss(toastId);
      toast.success("Warmup account created successfully!");

      // Redirect to accounts page after 1 second
      setTimeout(() => {
        router.push("/email/warmup/accounts");
      }, 1000);
    } catch (error: any) {
      console.error("Failed to create account:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to create warmup account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/email/warmup/accounts"
            className="flex items-center gap-2 text-text-200 hover:text-text-100 transition mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-text-100">
            Create Warmup Account
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Set up a new email account for warmup
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Provider Info Card */}
        <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{PROVIDER_INFO[provider].icon}</div>
            <div>
              <h2 className="text-xl font-bold text-text-100">
                {PROVIDER_INFO[provider].name}
              </h2>
              <p className="text-text-200 text-sm mt-1">
                Connect your {PROVIDER_INFO[provider].name} account for email
                warmup
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-text-100 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your-email@example.com"
              className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
              required
            />
            <p className="text-text-300 text-xs mt-1">
              Must be a verified email address from a verified domain
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-semibold text-text-100 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="e.g., Sales Account 1"
              className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
              required
            />
            <p className="text-text-300 text-xs mt-1">
              A friendly name to identify this account
            </p>
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-semibold text-text-100 mb-2">
              Daily Email Limit
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                name="dailyLimit"
                min="5"
                max="150"
                step="5"
                value={formData.dailyLimit}
                onChange={handleInputChange}
                className="flex-1 h-2 bg-bg-300 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-right min-w-[60px]">
                <span className="text-lg font-bold text-brand-main">
                  {formData.dailyLimit}
                </span>
                <p className="text-text-300 text-xs">emails/day</p>
              </div>
            </div>
            <p className="text-text-300 text-xs mt-2">
              Start with a lower limit and increase as your account warms up.
              Recommended: 10-20 emails/day
            </p>
          </div>

          {/* Info Box */}
          <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-text-200 text-sm">
              <span className="font-semibold text-blue-400">💡 Tip:</span> Start
              with a conservative daily limit and gradually increase it as your
              account builds reputation. This helps maintain high deliverability
              rates.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/email/warmup/accounts"
              className="flex-1 px-6 py-3 bg-bg-200 hover:bg-bg-300 text-text-100 rounded-lg transition text-center font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-brand-main hover:bg-brand-main/80 disabled:bg-brand-main/50 text-text-100 rounded-lg transition font-medium"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-bg-300">
          <h3 className="text-lg font-bold text-text-100 mb-4">
            What happens next?
          </h3>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-brand-main font-bold">1.</span>
              <span className="text-text-200 text-sm">
                Your account will be verified and connected
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-main font-bold">2.</span>
              <span className="text-text-200 text-sm">
                Warmup will begin with your configured daily limit
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-main font-bold">3.</span>
              <span className="text-text-200 text-sm">
                Monitor statistics and adjust limits as needed
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
