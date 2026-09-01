"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { LegalAcceptanceCheckbox } from "@/components/authentication/LegalAcceptanceCheckbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { LEGAL_VERSION } from "@/lib/legal";
import { redeemAppsumoLicense } from "@/utils/api/appsumoClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

const TIER_LABELS: Record<string, string> = {
  appsumo_starter: "Starter — Tier 1",
  appsumo_growth: "Growth — Tier 2",
  appsumo_scale: "Scale — Tier 3",
};

function AppsumoRedeemInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuthContext();

  const redeemToken = searchParams.get("token");
  const callbackError = searchParams.get("error");

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tierLabel = useMemo(() => {
    const tier = searchParams.get("tier");
    return tier ? (TIER_LABELS[tier] ?? tier) : null;
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!redeemToken) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const result = await redeemAppsumoLicense({
        redeemToken,
        mode,
        email: email.trim(),
        password,
        ...(mode === "signup"
          ? {
              name: name.trim(),
              acceptedLegal,
              acceptedLegalVersion: LEGAL_VERSION,
            }
          : {}),
      });

      if (result.accessToken) {
        tokenStorage.setTokens(result.accessToken, result.expiresIn, true);
      }
      await refreshUser();
      router.replace(result.redirectTo);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not redeem your AppSumo license. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  if (callbackError || !redeemToken) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-text-100">
          We could not verify your AppSumo license
        </h1>
        <p className="text-sm text-red-400">
          {callbackError ||
            "This redemption link is missing its token. Start again from your AppSumo account."}
        </p>
        <a
          href="https://appsumo.com/account/products/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand-main hover:text-brand-secondary"
        >
          Go to AppSumo
        </a>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-1 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
          AppSumo Lifetime Deal
        </p>
        <h1 className="text-2xl font-semibold text-text-100">
          Activate your LeadSnipper account
        </h1>
        <p className="text-sm text-text-200">
          {tierLabel
            ? `Your ${tierLabel} license is ready.`
            : "Your license is ready."}{" "}
          {mode === "signup"
            ? "Create your account to claim it."
            : "Sign in to attach it to your existing account."}
        </p>
      </div>

      <div className="flex rounded-lg border border-brand-main/20 p-1 text-sm">
        {(["signup", "login"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setError(null);
            }}
            className={`flex-1 rounded-md px-3 py-2 font-medium transition ${
              mode === option
                ? "bg-brand-main text-bg-100"
                : "text-text-200 hover:text-text-100"
            }`}
          >
            {option === "signup" ? "I'm new here" : "I already have an account"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {mode === "signup" && (
          <div className="space-y-1">
            <label htmlFor="appsumo-name" className="text-sm text-text-200">
              Full name
            </label>
            <Input
              id="appsumo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="appsumo-email" className="text-sm text-text-200">
            Email
          </label>
          <Input
            id="appsumo-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="appsumo-password" className="text-sm text-text-200">
            Password
          </label>
          <Input
            id="appsumo-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
          />
        </div>

        {mode === "signup" && (
          <LegalAcceptanceCheckbox
            checked={acceptedLegal}
            onCheckedChange={setAcceptedLegal}
            disabled={isSubmitting}
            product="leadsnipper"
          />
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || (mode === "signup" && !acceptedLegal)}
        >
          {isSubmitting ? "Activating…" : "Activate lifetime access"}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-100 p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-brand-main/10 bg-bg-300/40 p-6 text-center shadow-lg">
        {children}
      </div>
    </div>
  );
}

export default function AppsumoRedeemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-100">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-main" />
        </div>
      }
    >
      <AppsumoRedeemInner />
    </Suspense>
  );
}
