"use client";

import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

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
    // Prevent double execution in React strict mode
    if (hasProcessed) return;
    setHasProcessed(true);

    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        let provider = searchParams.get("provider");

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

        if (!code || !state || !provider) {
          throw new Error("Missing OAuth parameters");
        }

        // Validate provider
        // Note: "yahoo" is temporarily disabled in frontend but backend support exists
        if (!["gmail", "outlook", "zoho"].includes(provider)) {
          throw new Error("Invalid provider");
        }

        // Get access token from storage
        const accessToken = tokenStorage.getAccessToken();
        if (!accessToken) {
          throw new Error("Not authenticated. Please login first.");
        }

        const emailServiceUrl =
          process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";

        // Prevent duplicate submissions across remounts (React Strict Mode)
        const dedupeKey = `oauth:${provider}:${code}`;
        if (typeof window !== "undefined") {
          if (sessionStorage.getItem(dedupeKey)) {
            return; // already processed
          }
          sessionStorage.setItem(dedupeKey, "1");
        }

        // Read OAuth warmup settings from sessionStorage (set on connect page)
        let displayName: string | undefined;
        let username: string | undefined;
        let timezone: string | undefined;
        let dailyLimit: number | undefined;
        let expectedEmail: string | undefined;

        if (typeof window !== "undefined") {
          try {
            const raw = sessionStorage.getItem(
              `warmup:oauth:settings:${provider}`
            );
            if (raw) {
              const parsed = JSON.parse(raw);
              displayName = parsed.displayName || undefined;
              username = parsed.username || undefined;
              timezone = parsed.timezone || undefined;
              if (typeof parsed.dailyLimit === "number") {
                dailyLimit = parsed.dailyLimit;
              }
              // Get expected email for validation (from verified sender selection)
              expectedEmail = parsed.email || undefined;
            }
          } catch (settingsError) {
            console.error(
              "Failed to read OAuth settings from sessionStorage:",
              settingsError
            );
          }
        }

        const payload: any = {
          code,
          state,
        };

        if (displayName) payload.displayName = displayName;
        if (username) payload.username = username;
        if (timezone) payload.timezone = timezone;
        if (typeof dailyLimit === "number") payload.dailyLimit = dailyLimit;
        // Pass expected email for backend validation
        if (expectedEmail) payload.expectedEmail = expectedEmail;

        // Send callback to backend using axios (project convention)
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
          throw new Error(
            data?.error || data?.message || "Failed to connect account"
          );
        }

        if (data.success) {
          toast.success("Email account connected successfully!");
          // Redirect to warmup accounts page
          router.push("/email/warmup/accounts");
        } else {
          throw new Error(data.message || "Failed to connect account");
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        // Show backend error message if available (e.g., email mismatch)
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

  // Show error state with proper UI
  if (error) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <IconAlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-text-100 mb-3">
            Connection Failed
          </h1>
          <p className="text-text-200 mb-6">
            {error}
          </p>
          <Link
            href="/email/warmup/connect"
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
        <h1 className="text-2xl font-bold text-text-100 mb-2">
          Connecting your email account...
        </h1>
        <p className="text-text-200">Please wait while we complete the setup</p>
      </div>
    </div>
  );
}
