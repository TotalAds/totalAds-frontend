"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import GetLogo from "@/components/common/getLogo";
import { validateResetCode } from "@/utils/api/authClient";
import { IconArrowLeft, IconKey, IconShieldCheck } from "@tabler/icons-react";

const EnterResetCodeComponent = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await validateResetCode(code.toUpperCase());
      if (result.valid) {
        // Redirect to reset password page with the code
        router.push(`/reset-password?code=${code.toUpperCase()}`);
      } else {
        setError(
          "Invalid or expired reset code. Please check your email for the correct code or request a new password reset."
        );
      }
    } catch (error) {
      console.error("Code validation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Invalid or expired reset code. Please check your email for the correct code or request a new password reset."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCode = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    // Limit to 6 characters
    return cleaned.slice(0, 6);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
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
          <h2 className="text-4xl font-bold mb-4">Enter reset code</h2>
          <p className="text-base text-white/90">
            Check your email for the 6-character code we sent you.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Glass morphism card */}
          <div className="bg-white dark:bg-bg-100 rounded-2xl p-6 shadow-lg">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-brand-main rounded-2xl">
                  <GetLogo className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                Enter Reset Code
              </h1>
              <p className="text-gray-600 dark:text-text-200 text-xs">
                Enter the 6-character verification code from your email to reset
                your password securely.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm"
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

              <div className="space-y-1">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-gray-900 dark:text-text-100"
                >
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconKey className="h-5 w-5 text-gray-600 dark:text-text-200" />
                  </div>
                  <input
                    id="code"
                    placeholder="Enter 6-character code"
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    disabled={isLoading}
                    required
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 backdrop-blur-sm text-center text-sm font-mono tracking-widest uppercase"
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-text-200 mt-1">
                  The code is case-insensitive and expires in 15 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-main focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900 dark:text-text-100"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying Code...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <IconShieldCheck className="h-4 w-4 mr-2" />
                    Verify Code
                  </div>
                )}
              </button>

              {/* Alternative options */}
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-text-200 text-xs">
                    Didn&apos;t receive the email or code not working?
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-brand-main/10 hover:bg-gray-200 dark:hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-lg transition-all duration-200 border border-gray-300 dark:border-brand-main/20 hover:border-gray-400 dark:hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50"
                >
                  Request New Reset Email
                </button>

                {/* Back to login */}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-brand-main/10 hover:bg-gray-200 dark:hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-lg transition-all duration-200 border border-gray-300 dark:border-brand-main/20 hover:border-gray-400 dark:hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50"
                >
                  <div className="flex items-center justify-center">
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterResetCodeComponent;
