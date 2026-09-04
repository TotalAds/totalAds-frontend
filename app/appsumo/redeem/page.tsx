"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { LegalAcceptanceCheckbox } from "@/components/authentication/LegalAcceptanceCheckbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { LEGAL_VERSION } from "@/lib/legal";
import {
  redeemAppsumoLicense,
  redeemAppsumoLicenseOnSession,
} from "@/utils/api/appsumoClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

const TIER_LABELS: Record<string, string> = {
  appsumo_starter: "Starter — Tier 1",
  appsumo_growth: "Growth — Tier 2",
  appsumo_scale: "Scale — Tier 3",
};

type GuestMode = "signup" | "login";
type LoggedInMode = "session" | "other";

function AppsumoRedeemInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, refreshUser, logoutUser } = useAuthContext();

  const redeemToken = searchParams.get("token");
  const callbackError = searchParams.get("error");

  const isLoggedIn = state.isAuthenticated && Boolean(state.user);
  const authLoading = state.isLoading;

  const [guestMode, setGuestMode] = useState<GuestMode>("signup");
  const [loggedInMode, setLoggedInMode] = useState<LoggedInMode>("session");
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

  // If the user chooses "use a different account", clear the current session
  // so they can sign up / log in as someone else without leaving this page.
  useEffect(() => {
    if (!isLoggedIn || loggedInMode !== "other") return;
    // Prefill nothing — they are switching accounts.
  }, [isLoggedIn, loggedInMode]);

  const finishRedeem = async (result: {
    accessToken: string;
    expiresIn: number;
    redirectTo: string;
  }) => {
    if (!result.accessToken) {
      throw new Error(
        "Activation succeeded but no session was returned. Please try signing in."
      );
    }
    tokenStorage.setTokens(result.accessToken, result.expiresIn, true);
    await refreshUser();
    router.replace(result.redirectTo || "/email/dashboard");
  };

  const handleSessionRedeem = async () => {
    if (!redeemToken) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await redeemAppsumoLicenseOnSession(redeemToken);
      await finishRedeem(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not redeem your AppSumo license. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const handleGuestSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!redeemToken) return;

    setError(null);
    setIsSubmitting(true);
    try {
      // Soft-clear the current session so the new account tokens win.
      // Never call logout({ redirect: true }) here — that navigates to /login
      // and drops the redeem token from the URL.
      if (isLoggedIn) {
        await logoutUser({ redirect: false });
      }

      const result = await redeemAppsumoLicense({
        redeemToken,
        mode: guestMode,
        email: email.trim(),
        password,
        ...(guestMode === "signup"
          ? {
              name: name.trim(),
              acceptedLegal,
              acceptedLegalVersion: LEGAL_VERSION,
            }
          : {}),
      });

      await finishRedeem(result);
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

  if (authLoading) {
    return (
      <Shell>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand-main" />
        <p className="text-sm text-text-200">Checking your session…</p>
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
          {isLoggedIn
            ? "Choose which account should receive it."
            : "Create an account or sign in to claim it."}
        </p>
      </div>

      {isLoggedIn ? (
        <div className="space-y-4 text-left">
          <div className="flex rounded-lg border border-brand-main/20 p-1 text-sm">
            {(
              [
                ["session", "Use this account"],
                ["other", "Use a different account"],
              ] as const
            ).map(([option, label]) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setLoggedInMode(option);
                  setError(null);
                }}
                className={`flex-1 rounded-md px-3 py-2 font-medium transition ${
                  loggedInMode === option
                    ? "bg-brand-main text-bg-100"
                    : "text-text-200 hover:text-text-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loggedInMode === "session" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-brand-main/10 bg-bg-200/60 px-4 py-3 text-sm">
                <p className="text-text-200">Signed in as</p>
                <p className="font-medium text-text-100">
                  {state.user?.name || "LeadSnipper user"}
                </p>
                <p className="text-text-200">{state.user?.email}</p>
              </div>
              <p className="text-xs text-text-200">
                If this account already has a paid Razorpay plan, cancel it first
                or redeem on a different account.
              </p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="button"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void handleSessionRedeem()}
              >
                {isSubmitting
                  ? "Activating…"
                  : "Activate on this account"}
              </Button>
            </div>
          ) : (
            <GuestRedeemForm
              guestMode={guestMode}
              setGuestMode={setGuestMode}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              acceptedLegal={acceptedLegal}
              setAcceptedLegal={setAcceptedLegal}
              error={error}
              isSubmitting={isSubmitting}
              onSubmit={handleGuestSubmit}
              hint="This will sign you out of your current account and attach the license to the account below."
            />
          )}
        </div>
      ) : (
        <GuestRedeemForm
          guestMode={guestMode}
          setGuestMode={setGuestMode}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          acceptedLegal={acceptedLegal}
          setAcceptedLegal={setAcceptedLegal}
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={handleGuestSubmit}
        />
      )}
    </Shell>
  );
}

function GuestRedeemForm({
  guestMode,
  setGuestMode,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  acceptedLegal,
  setAcceptedLegal,
  error,
  isSubmitting,
  onSubmit,
  hint,
}: {
  guestMode: GuestMode;
  setGuestMode: (mode: GuestMode) => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  acceptedLegal: boolean;
  setAcceptedLegal: (value: boolean) => void;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-4 text-left">
      <div className="flex rounded-lg border border-brand-main/20 p-1 text-sm">
        {(["signup", "login"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setGuestMode(option)}
            className={`flex-1 rounded-md px-3 py-2 font-medium transition ${
              guestMode === option
                ? "bg-brand-main text-bg-100"
                : "text-text-200 hover:text-text-100"
            }`}
          >
            {option === "signup" ? "Create new account" : "Sign in"}
          </button>
        ))}
      </div>

      {hint && <p className="text-xs text-text-200">{hint}</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        {guestMode === "signup" && (
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
              guestMode === "signup" ? "new-password" : "current-password"
            }
          />
        </div>

        {guestMode === "signup" && (
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
          disabled={isSubmitting || (guestMode === "signup" && !acceptedLegal)}
        >
          {isSubmitting
            ? "Activating…"
            : guestMode === "signup"
              ? "Create account & activate"
              : "Sign in & activate"}
        </Button>
      </form>
    </div>
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
