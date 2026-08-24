"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

import { LegalAcceptanceCheckbox } from "@/components/authentication/LegalAcceptanceCheckbox";
import { SsoButtons } from "@/components/authentication/SsoButtons";
import LeadSnipperBrandLockup from "@/components/common/LeadSnipperBrandLockup";
import { useAuthContext } from "@/context/AuthContext";
import { appendUtmToPath } from "@/utils/analytics/utm";
import {
  buildUrlWithProduct,
  parseProduct,
  ProductType,
  resolvePostAuthPath,
} from "@/utils/auth/productIntent";
import { IconLogin } from "@tabler/icons-react";

export function SignupComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, registerUser, clearError } = useAuthContext();
  const { isLoading, error } = state;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const inviteToken = searchParams.get("inviteToken");
  const inviteEmail = searchParams.get("inviteEmail");

  // Get product from URL or stored session; workspace invites always use LeadSnipper
  const product: ProductType = React.useMemo(() => {
    // Force leadsnipper to hide all social sniper references
    return "leadsnipper" as ProductType;
  }, []);

  // Extract referral code from URL query parameter
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  useEffect(() => {
    const err = searchParams.get("ssoError");
    if (err) {
      setSsoError(err);
    }
  }, [searchParams]);

  useEffect(() => {
    if (inviteEmail && !email) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail, email]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Please enter a valid email";

    if (!password) errors.password = "Password is required";
    else if (
      !/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/.test(
        password
      )
    )
      errors.password =
        "Password requires 8-16 characters, at least one number, uppercase letter, lowercase letter, and special character";

    if (!confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else     if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    if (!acceptedLegal)
      errors.acceptLegal =
        "You must accept our legal agreements to create an account";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Clear any previous errors
    clearError();

    try {
      const user = await registerUser(
        name,
        email,
        password,
        confirmPassword,
        referralCode || undefined,
        product || undefined,
        acceptedLegal,
        inviteToken || undefined
      );

      // Check if email verification is required
      if (!user.emailVerified) {
        const verifyParams = new URLSearchParams();
        if (product) verifyParams.set("product", product);
        const redirect = searchParams.get("redirect");
        if (redirect) verifyParams.set("redirect", redirect);
        const verifyHref = verifyParams.toString()
          ? `/verify-email?${verifyParams.toString()}`
          : buildUrlWithProduct("/verify-email", product);
        router.push(verifyHref);
      } else {
        const resolvedProduct =
          product || parseProduct(user.signupProduct ?? null);
        router.push(
          resolvePostAuthPath(searchParams, resolvedProduct, {
            emailVerified: user.emailVerified,
            onboardingCompleted: user.onboardingCompleted,
            socialOnboardingCompleted: user.socialOnboardingCompleted,
          })
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error instanceof Error ? error.message : "Registration failed";
      if (
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("account with this email")
      ) {
        setFormErrors((prev) => ({ ...prev, email: message }));
        clearError();
      }
      // Other errors are handled by AuthContext and will be displayed
    }
  };

  const getLoginUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    return appendUtmToPath(
      params.toString() ? `/login?${params.toString()}` : "/login"
    );
  };

  return (
    <div className="h-screen bg-bg-100 flex overflow-hidden">
      {/* Left — narrower brand panel */}
      <div className="hidden lg:flex lg:w-[36%] xl:w-[34%] bg-gradient-to-br from-brand-main via-brand-main/80 to-brand-secondary relative overflow-hidden items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-72 h-72 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 h-72 bg-brand-tertiary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        </div>
        <div className="relative z-10 text-center text-white max-w-xs px-2">
          <h2 className="text-xl font-bold mb-2">Get Started with LeadSnipper</h2>
          <p className="text-sm text-white/90">
            Join thousands of teams sending deliverability-first cold email and
            growing their pipeline.
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
                Sign Up
              </h1>
              <p className="text-gray-600 dark:text-text-200 text-xs mt-0.5">
                Create your account
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {(ssoError || error) && (
                <div
                  className="bg-red-500/20 border border-red-500/30 text-red-600 px-3 py-2 rounded-lg text-xs"
                  role="alert"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p>{ssoError || error}</p>
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
                  htmlFor="firstname"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
                >
                  Full Name
                </label>
                <input
                  id="firstname"
                  placeholder="John Doe"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                />
                {formErrors.name && (
                  <p className="text-red-400 text-[11px]">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
                >
                  Email
                </label>
                <input
                  id="email"
                  placeholder="john@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || Boolean(inviteEmail)}
                  required
                  readOnly={Boolean(inviteEmail)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                />
                {inviteEmail && (
                  <p className="text-[11px] text-slate-500">
                    Invited email — cannot be changed.
                  </p>
                )}
                {formErrors.email && (
                  <p className="text-red-400 text-[11px]">{formErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                  />
                  {formErrors.password ? (
                    <p className="text-red-400 text-[11px]">
                      {formErrors.password}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-text-200 text-[10px]">
                      8–16 chars, upper, lower, number, symbol
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold text-gray-900 dark:text-text-100"
                  >
                    Confirm
                  </label>
                  <input
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-red-400 text-[11px]">
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <LegalAcceptanceCheckbox
                checked={acceptedLegal}
                onCheckedChange={setAcceptedLegal}
                disabled={isLoading}
                product={product}
                error={formErrors.acceptLegal}
              />

              <button
                type="submit"
                disabled={isLoading || !acceptedLegal}
                className="w-full py-2 px-4 bg-brand-main hover:bg-brand-main/80 text-white font-semibold rounded-lg text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <IconLogin className="w-4 h-4 mr-1.5" />
                    Create Account
                  </>
                )}
              </button>

              <SsoButtons
                requireLegal
                acceptedLegal={acceptedLegal}
                referralCode={referralCode}
                inviteToken={inviteToken}
                returnTo={searchParams.get("redirect")}
                disabled={isLoading}
                onBlocked={(message) => {
                  setFormErrors((prev) => ({ ...prev, acceptLegal: message }));
                  setSsoError(message);
                }}
              />

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-brand-main/20" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-2 bg-white dark:bg-bg-100 text-gray-600 dark:text-text-200">
                    Already have an account?
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(getLoginUrl())}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-brand-main/10 hover:bg-gray-200 dark:hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-lg text-sm transition-all border border-gray-300 dark:border-brand-main/20"
              >
                Sign In Instead
              </button>
            </form>
          </div>

          <p className="text-center mt-3 text-gray-600 dark:text-text-200 text-[11px]">
            <a
              href="https://leadsnipper.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-main hover:text-brand-secondary"
            >
              Privacy
            </a>
            {" · "}
            <a
              href="https://leadsnipper.com/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-main hover:text-brand-secondary"
            >
              Terms
            </a>
            {" · "}
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
