"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { LegalAcceptanceCheckbox } from "@/components/authentication/LegalAcceptanceCheckbox";
import { SsoButtons } from "@/components/authentication/SsoButtons";
import LeadSnipperBrandLockup from "@/components/common/LeadSnipperBrandLockup";
import { useAuthContext } from "@/context/AuthContext";
import { appendUtmToPath } from "@/utils/analytics/utm";
import {
  parseProduct,
  ProductType,
  resolvePostAuthPath,
} from "@/utils/auth/productIntent";
import { IconUserCircle } from "@tabler/icons-react";

const fieldClass =
  "w-full px-3 py-2 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm";

export function LoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, loginUser, clearError } = useAuthContext();
  const { isLoading, error, isAuthenticated, user } = state;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);

  const product: ProductType = React.useMemo(() => {
    return "leadsnipper" as ProductType;
  }, []);

  useEffect(() => {
    const err = searchParams.get("ssoError");
    if (err) {
      setSsoError(err);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const resolvedProduct =
        product || parseProduct(user.signupProduct ?? null);
      const redirectPath = resolvePostAuthPath(searchParams, resolvedProduct, {
        emailVerified: user.emailVerified,
        onboardingCompleted: user.onboardingCompleted,
        socialOnboardingCompleted: user.socialOnboardingCompleted,
      });
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router, product, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    setSsoError(null);
    try {
      await loginUser(email, password, rememberMe, product || undefined);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const getSignupUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ssoError");
    return appendUtmToPath(
      params.toString() ? `/signup?${params.toString()}` : "/signup",
    );
  };

  const getForgotPasswordUrl = () => {
    const params = new URLSearchParams();
    if (product) {
      params.set("product", product);
    }
    return params.toString()
      ? `/forgot-password?${params.toString()}`
      : "/forgot-password";
  };

  const displayError = ssoError || error;

  return (
    <div className="h-screen bg-bg-100 flex overflow-hidden">
      {/* Left — narrower brand panel */}
      <div className="hidden lg:flex lg:w-[36%] xl:w-[34%] bg-gradient-to-br from-brand-main via-brand-main/80 to-brand-secondary relative overflow-hidden items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-72 h-72 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 h-72 bg-brand-tertiary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        </div>
        <div className="relative z-10 text-center text-white max-w-xs px-2">
          <h2 className="text-xl font-bold mb-2">Welcome back!</h2>
          <p className="text-sm text-white/90">
            Sign in to LeadSnipper to continue growing your business.
          </p>
        </div>
      </div>

      {/* Right — wider form column with scroll */}
      <div className="w-full lg:w-[64%] xl:w-[66%] h-full flex items-stretch justify-center overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-5 py-5 my-auto">
          <div className="bg-white dark:bg-bg-100 rounded-lg p-5 shadow-lg">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-3">
                <LeadSnipperBrandLockup size={40} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-text-100">
                Sign In
              </h1>
              <p className="text-gray-600 dark:text-text-200 text-xs mt-0.5">
                Access your account
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {displayError && (
                <div
                  className="bg-red-500/20 border border-red-500/30 text-red-600 px-3 py-2 rounded-lg text-xs"
                  role="alert"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p>{displayError}</p>
                    <button
                      onClick={() => {
                        clearError();
                        setSsoError(null);
                      }}
                      className="text-red-200 hover:text-red-100 shrink-0"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
                >
                  Email
                </label>
                <input
                  id="email"
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
                >
                  Password
                </label>
                <input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className={fieldClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-3.5 w-3.5 text-brand-main bg-gray-100 dark:bg-brand-main/10 border-gray-300 dark:border-brand-main/20 rounded focus:ring-brand-main focus:ring-2"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-xs text-gray-600 dark:text-text-200"
                  >
                    Keep me signed in
                  </label>
                </div>
                <a
                  href={getForgotPasswordUrl()}
                  className="text-xs font-medium text-brand-main hover:text-brand-secondary transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-brand-main hover:bg-brand-main/80 text-white font-medium rounded-lg text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <IconUserCircle className="w-4 h-4 mr-1.5" />
                    Sign In
                  </>
                )}
              </button>

              <div className="space-y-1">
                <LegalAcceptanceCheckbox
                  checked={acceptedLegal}
                  onCheckedChange={setAcceptedLegal}
                  disabled={isLoading}
                  product={product}
                />
                <p className="text-[10px] text-gray-500 dark:text-text-200 pl-6">
                  Needed for new Google/Microsoft accounts only.
                </p>
              </div>

              <SsoButtons
                acceptedLegal={acceptedLegal}
                rememberMe={rememberMe}
                returnTo={searchParams.get("redirect")}
                disabled={isLoading}
                onBlocked={(message) => setSsoError(message)}
              />

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-brand-main/20" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-2 bg-white dark:bg-bg-100 text-gray-600 dark:text-text-200">
                    New here?
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(getSignupUrl())}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-brand-main/10 hover:bg-gray-200 dark:hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-lg text-sm transition-all border border-gray-300 dark:border-brand-main/20"
              >
                Create Your Account
              </button>
            </form>
          </div>

          <p className="text-center mt-3 text-gray-600 dark:text-text-200 text-[11px]">
            Need help?{" "}
            <a
              href="mailto:hello@leadsnipper.com"
              className="text-brand-main hover:text-brand-secondary"
            >
              hello@leadsnipper.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
