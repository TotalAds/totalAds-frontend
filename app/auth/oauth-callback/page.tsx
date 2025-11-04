"use client";

import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Prevent double execution in React strict mode
    if (hasProcessed) return;
    setHasProcessed(true);

    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const provider = searchParams.get("provider");

        if (!code || !state || !provider) {
          throw new Error("Missing OAuth parameters");
        }

        // Validate provider
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

        // Send callback to backend using axios (project convention)
        const { data } = await axios.post(
          `${emailServiceUrl}/api/warmup/oauth/${provider}/callback`,
          {
            code,
            state,
            displayName: searchParams.get("displayName") || undefined,
            dailyLimit: searchParams.get("dailyLimit")
              ? parseInt(searchParams.get("dailyLimit")!)
              : undefined,
          },
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
        const errorMessage = error.message || "Failed to connect email account";
        toast.error(errorMessage);
        // Redirect back to connect page
        setTimeout(() => {
          router.push("/email/warmup/connect");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [hasProcessed, router, searchParams]);

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
