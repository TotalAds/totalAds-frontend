"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { exchangeSsoCode } from "@/utils/api/authClient";
import {
  parseProduct,
  resolvePostAuthPath,
} from "@/utils/auth/productIntent";
import { tokenStorage } from "@/utils/auth/tokenStorage";

function SsoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;

    const run = async () => {
      const code = searchParams.get("code");
      if (!code) {
        setError("Missing sign-in code. Please try again.");
        setDone(true);
        return;
      }

      const dedupeKey = `sso-exchange:${code.slice(0, 32)}`;
      if (typeof window !== "undefined" && sessionStorage.getItem(dedupeKey)) {
        return;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem(dedupeKey, "1");
      }

      try {
        const rememberMe = searchParams.get("rememberMe") === "1";
        const { accessToken, expiresIn, user } = await exchangeSsoCode(code);

        if (accessToken && expiresIn) {
          tokenStorage.setTokens(accessToken, expiresIn, rememberMe);
        }

        await refreshUser();

        const returnTo = searchParams.get("returnTo");
        if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
          router.replace(returnTo);
          return;
        }

        const product = parseProduct(user?.signupProduct ?? null) || "leadsnipper";
        const path = resolvePostAuthPath(searchParams, product, {
          emailVerified: user?.emailVerified ?? true,
          onboardingCompleted: user?.onboardingCompleted ?? false,
          socialOnboardingCompleted: user?.socialOnboardingCompleted ?? false,
        });
        router.replace(path);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "SSO sign-in failed. Please try again.";
        setError(message);
        setDone(true);
      }
    };

    void run();
  }, [done, refreshUser, router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Sign-in failed</h1>
          <p className="text-sm text-red-600">{error}</p>
          <a
            href="/login"
            className="inline-block text-sm font-medium text-brand-main hover:text-brand-secondary"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand-main" />
        <p className="text-sm text-gray-600">Completing sign-in…</p>
      </div>
    </div>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-100">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-main" />
        </div>
      }
    >
      <SsoCallbackInner />
    </Suspense>
  );
}
