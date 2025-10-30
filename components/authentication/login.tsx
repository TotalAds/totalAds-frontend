"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import GetLogo from "@/components/common/getLogo";
import { useAuthContext } from "@/context/AuthContext";
import { appendUtmToPath } from "@/utils/analytics/utm";
import { IconUserCircle } from "@tabler/icons-react";

export function LoginComponent() {
  const router = useRouter();
  const { state, loginUser, clearError } = useAuthContext();
  const { isLoading, error, isAuthenticated } = state;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect based on authentication, email verification, and onboarding status
  useEffect(() => {
    if (isAuthenticated && state.user) {
      if (!state.user.emailVerified) {
        router.push("/verify-email");
      } else if (!state.user.onboardingCompleted) {
        router.push("/onboarding");
      } else {
        router.push("/email/dashboard");
      }
    }
  }, [isAuthenticated, state.user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear any previous errors
    clearError();

    try {
      await loginUser(email, password, rememberMe);
      // The redirect will be handled by the AuthContext and useEffect in the component
      // No need to manually redirect here as the auth state change will trigger it
    } catch (error) {
      console.error("Login error:", error);
      // Error is handled by the AuthContext and will be displayed. Friendly message already comes from backend.
    }
  };
  return (
    <div className="h-screen bg-bg-100 flex overflow-hidden">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-main via-brand-main/80 to-brand-secondary relative overflow-hidden items-center justify-center p-8">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-tertiary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full"></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-white/40 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-white/30 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 flex gap-2">
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-md">
          <h2 className="text-2xl font-bold mb-4">Welcome back!</h2>
          <p className="text-base text-white/90">
            You can sign in to access with your existing account.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Main Login Card */}
          <div className="bg-white dark:bg-bg-100 rounded-lg p-6 shadow-lg">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-brand-main rounded-lg">
                  <GetLogo className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                Sign In
              </h1>
              <p className="text-gray-600 dark:text-text-200 text-sm">
                Access your account
              </p>
            </div>
            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="bg-red-500/20 border border-red-500/30 text-red-200 px-3 py-2 rounded-lg text-xs"
                  role="alert"
                >
                  <div className="flex items-center justify-between">
                    <p>{error}</p>
                    <button
                      onClick={clearError}
                      className="text-red-200 hover:text-red-100 transition-colors ml-2"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-3 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                />
              </div>

              <div className="space-y-1.5">
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
                  className="w-full px-3 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
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
                <div>
                  <a
                    href="/forgot-password"
                    className="text-xs font-medium text-brand-main hover:text-brand-secondary transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 text-white font-medium rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <IconUserCircle className="w-4 h-4 mr-1.5" />
                    Sign In
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-brand-main/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-brand-main/5 rounded-full text-gray-600 dark:text-text-200">
                    New to Leadsnipper?
                  </span>
                </div>
              </div>

              {/* Signup button */}
              <button
                type="button"
                onClick={() => router.push(appendUtmToPath("/signup"))}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-brand-main/10 hover:bg-gray-200 dark:hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-lg text-sm transition-all duration-200 border border-gray-300 dark:border-brand-main/20 hover:border-gray-400 dark:hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50"
              >
                Create Your Account
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-gray-600 dark:text-text-200 text-xs">
              Need help? Contact our support team at{" "}
              <a
                href="mailto:hello@leadsnipper.com"
                className="text-brand-main hover:text-brand-secondary transition-colors"
              >
                hello@leadsnipper.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
