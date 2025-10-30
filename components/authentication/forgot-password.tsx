"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import GetLogo from "@/components/common/getLogo";
import { requestPasswordReset } from "@/utils/api/authClient";
import { IconArrowLeft, IconMail } from "@tabler/icons-react";

const ForgotPasswordComponent = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send password reset email. Please check your email address and try again."
      );
    } finally {
      setIsLoading(false);
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
          <h2 className="text-4xl font-bold mb-4">Forgot your password?</h2>
          <p className="text-base text-white/90">
            No worries! We'll help you reset it in just a few steps.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Main Forgot Password Card */}
          <div className="bg-white dark:bg-bg-100 rounded-2xl p-6 shadow-lg">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-brand-main rounded-2xl">
                  <GetLogo className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                {isSubmitted ? "Check Your Email! 📧" : "Reset Password 🔐"}
              </h1>
              <p className="text-gray-600 dark:text-text-200 text-sm">
                {isSubmitted
                  ? "We've sent reset instructions to your email. Check your inbox and follow the link to reset your password."
                  : "Enter your email address and we'll send you a secure reset link."}
              </p>
            </div>

            {/* Form */}
            {!isSubmitted ? (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div
                    className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm"
                    role="alert"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-200 hover:text-red-100 transition-colors ml-4"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-text-100"
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
                    className="w-full px-4 py-2.5 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 text-text-100 font-semibold rounded-lg text-sm transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text-100 mr-2"></div>
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      <IconMail className="w-5 h-5 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </button>

                {/* Back to login */}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-brand-main/10 hover:bg-brand-main/20 text-text-100 font-semibold rounded-lg text-sm transition-all duration-200 border border-brand-main/20 hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50 flex items-center justify-center"
                >
                  <IconArrowLeft className="h-5 w-5 mr-2" />
                  Back to Sign In
                </button>
              </form>
            ) : (
              <div className="space-y-8 text-center">
                <div className="w-20 h-20 bg-brand-main/20 rounded-full flex items-center justify-center mx-auto">
                  <IconMail className="w-10 h-10 text-brand-main" />
                </div>

                <p className="text-text-200 text-sm">
                  If an account with that email exists, you&apos;ll receive
                  reset instructions within a few minutes. Please check your
                  inbox and spam folder.
                </p>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => router.push("/reset-password/enter-code")}
                    className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 text-text-100 font-semibold rounded-lg text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Enter Code Manually
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="w-full py-2.5 px-4 bg-brand-main/10 hover:bg-brand-main/20 text-text-100 font-semibold rounded-lg text-sm transition-all duration-200 border border-brand-main/20 hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50 flex items-center justify-center"
                  >
                    <IconArrowLeft className="h-5 w-5 mr-2" />
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

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
    </div>
  );
};

export default ForgotPasswordComponent;
