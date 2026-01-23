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
import emailClient from "@/utils/api/emailClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import { getBrowserTimezone, TIMEZONES } from "@/utils/timezones";
import {
  IconArrowLeft,
  IconBrandGoogle,
  IconMail,
  IconSettings,
  IconCheck,
  IconAlertCircle,
  IconExternalLink,
} from "@tabler/icons-react";

import type { ChangeEvent, FormEvent } from "react";

type Provider = "gmail" | "outlook" | "yahoo" | "zoho" | "custom";
type OAuthProvider = "gmail" | "outlook" | "zoho";

interface EmailSender {
  id: string;
  email: string;
  displayName?: string;
  domainId: string;
  verificationStatus: string;
  domain?: string;
}

interface Domain {
  id: string;
  domain: string;
  verificationStatus: string;
}

interface ProviderOption {
  id: Provider;
  name: string;
  icon: React.ReactNode;
  authType: "oauth" | "imap";
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
    icon: <IconBrandGoogle className="w-5 h-5" />,
    authType: "oauth",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    icon: <IconMail className="w-5 h-5" />,
    authType: "oauth",
  },
  {
    id: "zoho",
    name: "Zoho Mail",
    icon: <IconSettings className="w-5 h-5" />,
    authType: "oauth",
  },
  {
    id: "custom",
    name: "Custom SMTP/IMAP",
    icon: <IconMail className="w-5 h-5" />,
    authType: "imap",
  },
];

export default function ConnectWarmupAccountPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  
  // State
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [senders, setSenders] = useState<EmailSender[]>([]);
  const [existingWarmupEmails, setExistingWarmupEmails] = useState<Set<string>>(new Set());
  
  // Selection state
  const [selectedSender, setSelectedSender] = useState<EmailSender | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  
  // OAuth config state
  const [showOAuthConfig, setShowOAuthConfig] = useState(false);
  const [oauthConnecting, setOauthConnecting] = useState(false);
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
    loadData();
  }, [state.isLoading, state.isAuthenticated, state.user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch all verified domains
      const domainsResponse = await emailClient.get("/api/domains", {
        params: { limit: 100 },
      });
      const allDomains = domainsResponse.data?.data?.domains || [];
      const verifiedDomains = allDomains.filter(
        (d: Domain) => d.verificationStatus === "verified"
      );
      setDomains(verifiedDomains);
      
      // Fetch all senders for verified domains
      const allSenders: EmailSender[] = [];
      for (const domain of verifiedDomains) {
        try {
          const sendersResponse = await emailClient.get(
            `/api/email-senders?domainId=${domain.id}`
          );
          const domainSenders = (sendersResponse.data?.data?.senders || [])
            .filter((s: EmailSender) => s.verificationStatus === "verified")
            .map((s: EmailSender) => ({ ...s, domain: domain.domain }));
          allSenders.push(...domainSenders);
        } catch (err) {
          console.error(`Failed to fetch senders for domain ${domain.id}:`, err);
        }
      }
      setSenders(allSenders);
      
      // Fetch existing warmup accounts to mark which senders are already added
      try {
        const warmupResponse = await emailClient.get("/api/warmup/accounts");
        const warmupEmails = new Set<string>(
          (warmupResponse.data?.data || []).map((acc: any) => acc.email.toLowerCase())
        );
        setExistingWarmupEmails(warmupEmails);
      } catch (err) {
        console.error("Failed to fetch warmup accounts:", err);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load verified senders");
    } finally {
      setLoading(false);
    }
  };

  const handleSenderClick = (sender: EmailSender) => {
    if (existingWarmupEmails.has(sender.email.toLowerCase())) {
      toast.error("This email is already added to warmup");
      return;
    }
    setSelectedSender(sender);
    setSelectedProvider(null);
    
    // Pre-fill form with sender info
    setOauthForm({
      displayName: sender.displayName || "",
      username: sender.email.split("@")[0],
      timezone: getBrowserTimezone(),
      dailyLimit: 10,
    });
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    
    if (provider === "custom") {
      // Redirect to IMAP config page
      router.push(`/email/warmup/connect/imap?email=${encodeURIComponent(selectedSender?.email || "")}`);
    } else {
      // Show OAuth config modal
      setShowOAuthConfig(true);
    }
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
    if (!selectedProvider || !selectedSender) return;

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

    // Store settings in sessionStorage for OAuth callback
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `warmup:oauth:settings:${selectedProvider}`,
        JSON.stringify({
          displayName: oauthForm.displayName,
          username: oauthForm.username,
          timezone: oauthForm.timezone,
          dailyLimit: oauthForm.dailyLimit,
          email: selectedSender.email, // Include the selected email
        })
      );
    }

    await initiateOAuth(selectedProvider);
  };

  const initiateOAuth = async (provider: Provider) => {
    try {
      setOauthConnecting(true);
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        toast.error("Not authenticated. Please login first.");
        setOauthConnecting(false);
        return;
      }

      const emailServiceUrl =
        process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";

      const { data } = await axios.get(
        `${emailServiceUrl}/api/warmup/oauth/${provider}/url`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (data?.success && data?.data?.authUrl) {
        window.location.href = data.data.authUrl;
      } else {
        throw new Error("Failed to get OAuth URL");
      }
    } catch (error: any) {
      console.error("OAuth initiation error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to initiate OAuth flow"
      );
      setOauthConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-200">Loading verified senders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/email/warmup"
            className="inline-flex items-center gap-2 text-text-200 hover:text-text-100 transition mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Warmup
          </Link>
          <h1 className="text-2xl font-bold text-text-100">
            Add Warmup Account
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Select a verified email sender to activate warmup
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <IconAlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-text-100 text-sm font-medium">
                Only verified email senders can be added for warmup
              </p>
              <p className="text-text-200 text-sm mt-1">
                Email warmup requires properly verified senders to ensure deliverability. 
                Add new senders in{" "}
                <Link 
                  href="/email/domains" 
                  className="text-brand-main hover:underline inline-flex items-center gap-1"
                >
                  Domain Management
                  <IconExternalLink className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Verified Senders List */}
        {senders.length === 0 ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-xl p-12 text-center">
            <IconMail className="w-16 h-16 text-brand-main/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-100 mb-2">
              No Verified Senders Found
            </h3>
            <p className="text-text-200 mb-6 max-w-md mx-auto">
              You need at least one verified email sender from a verified domain to use warmup.
            </p>
            <Link
              href="/email/domains"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-main hover:bg-brand-main/90 text-white font-medium rounded-xl transition"
            >
              <IconExternalLink className="w-4 h-4" />
              Go to Domain Management
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-text-100 mb-4">
              Your Verified Senders ({senders.length})
            </h2>
            <div className="space-y-3">
              {senders.map((sender, index) => {
                const isAlreadyInWarmup = existingWarmupEmails.has(sender.email.toLowerCase());
                const isSelected = selectedSender?.id === sender.id;
                
                return (
                  <motion.div
                    key={sender.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => handleSenderClick(sender)}
                      disabled={isAlreadyInWarmup}
                      className={`w-full text-left backdrop-blur-xl rounded-xl p-4 border transition-all ${
                        isAlreadyInWarmup
                          ? "bg-bg-300/50 border-bg-300 cursor-not-allowed opacity-60"
                          : isSelected
                          ? "bg-brand-main/20 border-brand-main"
                          : "bg-brand-main/5 border-brand-main/20 hover:border-brand-main/50 hover:bg-brand-main/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isAlreadyInWarmup ? "bg-green-500/20" : "bg-brand-main/20"
                          }`}>
                            {isAlreadyInWarmup ? (
                              <IconCheck className="w-5 h-5 text-green-400" />
                            ) : (
                              <IconMail className="w-5 h-5 text-brand-main" />
                            )}
                          </div>
                          <div>
                            <p className="text-text-100 font-medium">
                              {sender.email}
                            </p>
                            <p className="text-text-200 text-sm">
                              {sender.displayName && `${sender.displayName} • `}
                              {sender.domain}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {isAlreadyInWarmup ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              <IconCheck className="w-3 h-3" />
                              Already in Warmup
                            </span>
                          ) : (
                            <span className="text-brand-main text-sm font-medium">
                              Click to activate →
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Provider Selection Modal */}
        <Dialog
          open={selectedSender !== null && selectedProvider === null && !showOAuthConfig}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSender(null);
            }
          }}
        >
          <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-md w-full backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-text-100 text-lg">
                Select Email Provider
              </DialogTitle>
              <DialogDescription className="text-text-200 text-sm">
                Choose how you want to connect <span className="font-medium text-text-100">{selectedSender?.email}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mt-4">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-brand-main/20 hover:border-brand-main/50 hover:bg-brand-main/10 transition text-left"
                >
                  <div className="text-brand-main">{provider.icon}</div>
                  <div className="flex-1">
                    <p className="text-text-100 font-medium">{provider.name}</p>
                    <p className="text-text-200 text-xs">
                      {provider.authType === "oauth" ? "One-click OAuth" : "Manual IMAP/SMTP config"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedSender(null)}
                className="text-text-200"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* OAuth Config Modal */}
        <Dialog
          open={showOAuthConfig}
          onOpenChange={(open) => {
            if (!open) {
              setShowOAuthConfig(false);
              setSelectedProvider(null);
            }
          }}
        >
          <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-lg w-full backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-text-100 text-lg">
                Configure Warmup Settings
              </DialogTitle>
              <DialogDescription className="text-text-200 text-sm">
                Set up warmup for <span className="font-medium text-text-100">{selectedSender?.email}</span> via{" "}
                {PROVIDERS.find((p) => p.id === selectedProvider)?.name}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleOAuthConfigSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-text-100 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={oauthForm.displayName}
                  onChange={handleOAuthFormChange}
                  placeholder="Optional, e.g. Sales Team"
                  className="w-full rounded-lg bg-bg-300 border border-bg-300 px-3 py-2 text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-100 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={oauthForm.username}
                    onChange={handleOAuthFormChange}
                    placeholder="e.g. hello"
                    className="w-full rounded-lg bg-bg-300 border border-bg-300 px-3 py-2 text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-100 mb-2">
                    Timezone *
                  </label>
                  <select
                    name="timezone"
                    value={oauthForm.timezone}
                    onChange={handleOAuthFormChange}
                    className="w-full rounded-lg bg-bg-300 border border-bg-300 px-3 py-2 text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                  >
                    <option value="">Select</option>
                    <option value={getBrowserTimezone()}>
                      {getBrowserTimezone()} (Detected)
                    </option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-100 mb-2">
                    Daily Limit *
                  </label>
                  <input
                    type="number"
                    name="dailyLimit"
                    min={5}
                    max={150}
                    value={oauthForm.dailyLimit}
                    onChange={handleOAuthFormChange}
                    className="w-full rounded-lg bg-bg-300 border border-bg-300 px-3 py-2 text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                  />
                </div>
              </div>

              <p className="text-text-200 text-xs">
                Daily limit must be between 5 and 150 emails per day.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowOAuthConfig(false);
                    setSelectedProvider(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={oauthConnecting}>
                  {oauthConnecting ? "Connecting..." : "Connect with OAuth"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
