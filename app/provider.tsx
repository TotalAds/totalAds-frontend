"use client";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import OnboardingProtectionWrapper from "@/components/layout/OnboardingProtectionWrapper";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { identifyUser, resetIdentity } from "@/utils/analytics/track";
import { getUtmForAnalytics, initUtmTracking } from "@/utils/analytics/utm";
import { PostHogProvider } from "@posthog/react";

// Initialize PostHog once
const useInitPosthog = () => {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      autocapture: true,
      capture_pageview: false, // we'll handle SPA pageviews manually
      capture_pageleave: true,
    });
  }, []);
};

const PageViewTracker: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(posthog as any)?.capture) return;
    (posthog as any).capture("$pageview", {
      $current_url: window.location.href,
      app: "frontend",
    });
  }, [pathname, searchParams]);
  return null;
};

const UtmInitializer: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (typeof window === "undefined") return;
    initUtmTracking();
    try {
      const props = getUtmForAnalytics();
      if ((posthog as any)?.register) {
        (posthog as any).register(props);
      }
    } catch {}
  }, [pathname, searchParams]);
  return null;
};

const AuthIdentify: React.FC = () => {
  const { state } = useAuthContext();
  const { isAuthenticated, user } = state;
  useEffect(() => {
    if (isAuthenticated && user) {
      identifyUser({
        id: (user as any).id,
        email: user.email,
        name: user.name,
      });
    } else {
      resetIdentity();
    }
  }, [isAuthenticated, user]);
  return null;
};

const Provider = ({ children }: { children: React.ReactNode }) => {
  useInitPosthog();
  return (
    <PostHogProvider client={posthog}>
      <ThemeProvider>
        <AuthProvider>
          <PageViewTracker />
          <UtmInitializer />
          <AuthIdentify />
          <OnboardingProtectionWrapper>{children}</OnboardingProtectionWrapper>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(15, 23, 42, 0.95)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
};

export default Provider;
