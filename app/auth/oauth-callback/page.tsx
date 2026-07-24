"use client";

import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  clearCampaignOAuthSettings,
  clearOnboardingOAuthReturnPath,
  readOnboardingOAuthReturnPath,
  readCampaignOAuthSettings,
} from "@/lib/senderDisplayName";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasProcessed) return;
    setHasProcessed(true);

    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        let provider = searchParams.get("provider");
        const context = searchParams.get("context");

        let decodedState: any | null = null;
        if (state) {
          try {
            const json = atob(state);
            decodedState = JSON.parse(json);
          } catch (error) {
            console.error("Failed to decode OAuth state:", error);
          }
        }

        if (!provider && decodedState?.provider) {
          provider = decodedState.provider;
        }

        const oauthContext = context || decodedState?.context || "warmup";

        if (!code || !state || !provider) {
          throw new Error("Missing OAuth parameters");
        }

        if (!["gmail", "outlook", "zoho", "google_sheets"].includes(provider)) {
          throw new Error("Invalid provider");
        }

        const accessToken = tokenStorage.getAccessToken();
        if (!accessToken) {
          throw new Error("Not authenticated. Please login first.");
        }

        const emailServiceUrl =
          process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";

        const dedupeKey = `oauth:${oauthContext}:${provider}:${code}`;
        if (typeof window !== "undefined") {
          if (sessionStorage.getItem(dedupeKey)) {
            return;
          }
          sessionStorage.setItem(dedupeKey, "1");
        }

        if (oauthContext === "google_sheets" || provider === "google_sheets") {
          const { completeGoogleSheetsOAuth } = await import(
            "@/utils/api/sheetsClient"
          );
          await completeGoogleSheetsOAuth({ code, state });

          toast.success("Google Sheets connected successfully!");
          const returnPath =
            typeof decodedState?.returnPath === "string" && decodedState.returnPath
              ? decodedState.returnPath
              : "/email/campaigns";
          router.push(returnPath);
          return;
        }

        const payload: Record<string, unknown> = { code, state };

        if (oauthContext === "campaign") {
          const campaignSettings = readCampaignOAuthSettings(provider);
          if (campaignSettings?.displayName?.trim()) {
            payload.displayName = campaignSettings.displayName.trim();
          }

          const { data } = await axios.post(
            `${emailServiceUrl}/api/sending-accounts/oauth/${provider}/callback`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!data?.success) {
            throw new Error(data?.message || "Failed to connect account");
          }

          clearCampaignOAuthSettings(provider);
          toast.success("Sending account connected successfully!");
          const onboardingReturnPath = readOnboardingOAuthReturnPath();
          if (onboardingReturnPath) {
            clearOnboardingOAuthReturnPath();
            router.push(`${onboardingReturnPath}&connected=${provider}`);
          } else {
            router.push("/email/sending-accounts");
          }
          return;
        }

        // Warmup flow (existing)
        let displayName: string | undefined;
        let username: string | undefined;
        let timezone: string | undefined;
        let dailyLimit: number | undefined;
        let expectedEmail: string | undefined;

        if (typeof window !== "undefined") {
          try {
            const raw = sessionStorage.getItem(`warmup:oauth:settings:${provider}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              displayName = parsed.displayName || undefined;
              username = parsed.username || undefined;
              timezone = parsed.timezone || undefined;
              if (typeof parsed.dailyLimit === "number") {
                dailyLimit = parsed.dailyLimit;
              }
              expectedEmail = parsed.email || undefined;
            }
          } catch (settingsError) {
            console.error("Failed to read OAuth settings:", settingsError);
          }
        }

        if (displayName) payload.displayName = displayName;
        if (username) payload.username = username;
        if (timezone) payload.timezone = timezone;
        if (typeof dailyLimit === "number") payload.dailyLimit = dailyLimit;
        if (expectedEmail) payload.expectedEmail = expectedEmail;

        const { data } = await axios.post(
          `${emailServiceUrl}/api/warmup/oauth/${provider}/callback`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!data?.success) {
          throw new Error(data?.error || data?.message || "Failed to connect account");
        }

        toast.success("Email account connected successfully!");
        router.push("/email/warmup/accounts");
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to connect email account";

        setError(errorMessage);
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [hasProcessed, router, searchParams]);

  const isCampaign =
    searchParams.get("context") === "campaign" ||
    (() => {
      const state = searchParams.get("state");
      if (!state) return false;
      try {
        return JSON.parse(atob(state))?.context === "campaign";
      } catch {
        return false;
      }
    })();

  if (error) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <IconAlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-text-100 mb-3">Connection Failed</h1>
          <p className="text-text-200 mb-6">{error}</p>
          <Link
            href={isCampaign ? "/email/sending-accounts" : "/email/warmup/connect"}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-main hover:bg-brand-main/90 text-white font-medium rounded-xl transition"
          >
            <IconArrowLeft className="w-4 h-4" />
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <div className="w-12 h-12 border-4 border-brand-main/20 border-t-brand-main rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold text-text-100 mb-2">Connecting your email account...</h1>
        <p className="text-text-200">Please wait while we complete the setup</p>
      </div>
    </div>
  );
}
