"use client";

import axios from "axios";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/context/AuthContext";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import { getBrowserTimezone, TIMEZONES } from "@/utils/timezones";
import {
  IconArrowLeft,
  IconBrandGoogle,
  IconBrandYahoo,
  IconMail,
  IconSettings,
} from "@tabler/icons-react";

import type { ChangeEvent, FormEvent } from "react";
type Provider = "gmail" | "outlook" | "yahoo" | "zoho" | "custom";
type OAuthProvider = "gmail" | "outlook" | "zoho";

interface ProviderOption {
  id: Provider;
  name: string;
  description: string;
  icon: React.ReactNode;
  authType: "oauth" | "imap";
  color: string;
}

interface OAuthConfigFormData {
  displayName: string;
  username: string;
  timezone: string;
  dailyLimit: number;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: "gmail",
    name: "Gmail / Google Workspace",
    description: "Connect with one-click OAuth authentication",
    icon: <IconBrandGoogle className="w-8 h-8" />,
    authType: "oauth",
    color: "from-red-500/20 to-orange-500/20",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Connect with one-click OAuth authentication",
    icon: <IconMail className="w-8 h-8" />,
    authType: "oauth",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "zoho",
    name: "Zoho Mail",
    description: "Connect with one-click OAuth authentication",
    icon: <IconSettings className="w-8 h-8" />,
    authType: "oauth",
    color: "from-yellow-500/20 to-orange-500/20",
  },
  // Temporarily disabled - Yahoo OAuth implementation ready but not yet enabled
  // {
  //   id: "yahoo",
  //   name: "Yahoo Mail",
  //   description: "Connect with one-click OAuth authentication",
  //   icon: <IconBrandYahoo className="w-8 h-8" />,
  //   authType: "oauth",
  //   color: "from-purple-500/20 to-pink-500/20",
  // },
  {
    id: "custom",
    name: "Custom SMTP",
    description: "Connect any email provider with IMAP/SMTP",
    icon: <IconMail className="w-8 h-8" />,
    authType: "imap",
    color: "from-gray-500/20 to-slate-500/20",
  },
];

export default function ConnectWarmupAccountPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [loading, setLoading] = useState<Provider | null>(null);
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(
    null
  );
  const [oauthForm, setOauthForm] = useState<OAuthConfigFormData>({
    displayName: "",
    username: "",
    timezone: getBrowserTimezone(),
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

  const handleOAuthConnect = async (provider: Provider) => {
    try {
      setLoading(provider);
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        toast.error("Not authenticated. Please login first.");
        setLoading(null);
        return;
      }

      const emailServiceUrl =
        process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";

      // Get OAuth URL from backend
      const { data } = await axios.get(
        `${emailServiceUrl}/api/warmup/oauth/${provider}/url`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (data?.success && data?.data?.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.data.authUrl;
      } else {
        throw new Error("Failed to get OAuth URL");
      }
    } catch (error: any) {
      console.error("OAuth initiation error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to initiate OAuth flow"
      );
      setLoading(null);
    }
  };

  const handleImapConnect = (provider: Provider) => {
    // Redirect to IMAP/SMTP configuration page
    router.push(`/email/warmup/connect/imap?provider=${provider}`);
  };

  const handleOAuthFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setOauthForm((prev) => ({
      ...prev,
      [name]: name === "dailyLimit" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleOAuthConfigSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!oauthProvider) return;

    if (!oauthForm.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!oauthForm.timezone) {
      toast.error("Timezone is required");
      return;
    }

    if (
      !oauthForm.dailyLimit ||
      oauthForm.dailyLimit < 5 ||
      oauthForm.dailyLimit > 150
    ) {
      toast.error("Daily limit must be between 5 and 150");
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `warmup:oauth:settings:${oauthProvider}`,
        JSON.stringify({
          displayName: oauthForm.displayName,
          username: oauthForm.username,
          timezone: oauthForm.timezone,
          dailyLimit: oauthForm.dailyLimit,
        })
      );
    }

    await handleOAuthConnect(oauthProvider);
  };

  const handleProviderClick = (provider: ProviderOption) => {
    if (provider.authType === "oauth") {
      const oauthId = provider.id as OAuthProvider;
      setOauthProvider(oauthId);
    } else {
      handleImapConnect(provider.id);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/email/warmup/accounts"
            className="inline-flex items-center gap-2 text-text-200 hover:text-text-100 transition mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Accounts
          </Link>
          <h1 className="text-3xl font-bold text-text-100">
            Connect Email Account
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Choose your email provider to get started with warmup
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Banner */}
        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-text-100 mb-2">
            Before you connect
          </h3>
          <ul className="space-y-2 text-sm text-text-200">
            <li className="flex items-start gap-2">
              <span className="text-brand-main mt-0.5">•</span>
              <span>
                You must have a verified domain and at least one verified email
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-main mt-0.5">•</span>
              <span>You need at least 100 leads in your lead list</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-main mt-0.5">•</span>
              <span>
                OAuth providers (Gmail, Outlook, Zoho) offer one-click setup
              </span>
            </li>
          </ul>
        </div>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROVIDERS.map((provider, index) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => handleProviderClick(provider)}
                disabled={loading !== null}
                className={`w-full text-left backdrop-blur-xl bg-gradient-to-br ${provider.color} border border-brand-main/20 rounded-2xl p-6 hover:border-brand-main/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-brand-main">{provider.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-100 mb-1">
                      {provider.name}
                    </h3>
                    <p className="text-text-200 text-sm mb-4">
                      {provider.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {loading === provider.id ? (
                        <span className="text-sm text-brand-main">
                          Connecting...
                        </span>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-brand-main">
                            {provider.authType === "oauth"
                              ? "Connect with OAuth"
                              : "Configure IMAP/SMTP"}
                          </span>
                          <span className="text-brand-main">→</span>
                        </>
                      )}
                    </div>
                    {/* OAuth account settings modal */}
                    <Dialog
                      open={oauthProvider === provider.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setOauthProvider(null);
                        }
                      }}
                    >
                      {oauthProvider && (
                        <DialogContent className="bg-brand-main/5 border border-brand-main/20 max-w-xl w-full backdrop-blur-xl">
                          <DialogHeader>
                            <DialogTitle className="text-text-100 text-xl">
                              Account settings for{" "}
                              {PROVIDERS.find((p) => p.id === oauthProvider)
                                ?.name || "selected provider"}
                            </DialogTitle>
                            <DialogDescription className="text-text-200/70 text-sm">
                              Configure how this account should behave for
                              warmup. These settings will be saved together with
                              your OAuth connection.
                            </DialogDescription>
                          </DialogHeader>

                          <form
                            onSubmit={handleOAuthConfigSubmit}
                            className="space-y-4 mt-4"
                          >
                            <div>
                              <label className="block text-sm font-semibold text-text-100 mb-2">
                                Display name
                              </label>
                              <input
                                type="text"
                                name="displayName"
                                value={oauthForm.displayName}
                                onChange={handleOAuthFormChange}
                                placeholder="Optional, e.g. Sales Team"
                                className="w-full rounded-md bg-bg-200 border border-bg-300 px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-text-100 mb-2">
                                  Username *
                                </label>
                                <input
                                  type="text"
                                  name="username"
                                  value={oauthForm.username}
                                  onChange={handleOAuthFormChange}
                                  placeholder="e.g. hello"
                                  className="w-full rounded-md bg-bg-200 border border-bg-300 px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                                />
                                <p className="text-xs text-text-300 mt-1">
                                  Usually the part before @ in your email
                                  address.
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-text-100 mb-2">
                                  Timezone *
                                </label>
                                <select
                                  name="timezone"
                                  value={oauthForm.timezone}
                                  onChange={handleOAuthFormChange}
                                  className="w-full rounded-md bg-bg-200 border border-bg-300 px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                                >
                                  <option value="">Select timezone</option>
                                  <optgroup label="Detected">
                                    <option value={getBrowserTimezone()}>
                                      {getBrowserTimezone()} (Browser detected)
                                    </option>
                                  </optgroup>
                                  <optgroup label="All Timezones">
                                    {TIMEZONES.map((tz) => (
                                      <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                                <p className="text-xs text-text-300 mt-1">
                                  Used for scheduling warmup emails during
                                  business hours.
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-text-100 mb-2">
                                  Daily warmup limit *
                                </label>
                                <input
                                  type="number"
                                  name="dailyLimit"
                                  min={5}
                                  max={150}
                                  value={oauthForm.dailyLimit}
                                  onChange={handleOAuthFormChange}
                                  className="w-full rounded-md bg-bg-200 border border-bg-300 px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                                />
                                <p className="text-xs text-text-300 mt-1">
                                  Must be between 5 and 150 emails per day.
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setOauthProvider(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={loading !== null}>
                                {loading === provider.id
                                  ? "Connecting..."
                                  : "Continue to OAuth"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t border-bg-300">
          <h3 className="text-lg font-bold text-text-100 mb-4">
            Need help choosing?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
              <h4 className="font-semibold text-text-100 mb-2">
                OAuth Providers (Recommended)
              </h4>
              <p className="text-text-200">
                Gmail, Outlook, and Zoho offer secure one-click authentication.
                No need to manage passwords or app-specific credentials.
              </p>
            </div>
            <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
              <h4 className="font-semibold text-text-100 mb-2">
                Custom SMTP Provider
              </h4>
              <p className="text-text-200">
                Custom SMTP requires manual configuration. You will need your
                IMAP and SMTP server details and credentials.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
