"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import GetLogo from '@/components/common/getLogo';
import { requestPasswordReset } from '@/utils/api/authClient';
import { IconArrowLeft, IconMail } from '@tabler/icons-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Forgot Password Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl">
                <GetLogo className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              {isSubmitted ? "Check Your Email! 📧" : "Reset Password 🔐"}
            </h1>
            <p className="text-gray-300 text-lg">
              {isSubmitted
                ? "We've sent reset instructions to your email. Check your inbox and follow the link to reset your password."
                : "Enter your email address and we'll send you a secure reset link."}
            </p>
          </div>
          {/* Form */}
          {!isSubmitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm"
                  role="alert"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-200 hover:text-white transition-colors ml-4"
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
                  className="text-sm font-semibold text-white"
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
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-lg"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
                className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl text-lg transition-all duration-200 border border-white/20 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 flex items-center justify-center"
              >
                <IconArrowLeft className="h-5 w-5 mr-2" />
                Back to Sign In
              </button>
            </form>
          ) : (
            <div className="space-y-8 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <IconMail className="w-10 h-10 text-green-400" />
              </div>

              <p className="text-gray-300 text-lg">
                If an account with that email exists, you&apos;ll receive reset
                instructions within a few minutes. Please check your inbox and
                spam folder.
              </p>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => router.push("/reset-password/enter-code")}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Enter Code Manually
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl text-lg transition-all duration-200 border border-white/20 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 flex items-center justify-center"
                >
                  <IconArrowLeft className="h-5 w-5 mr-2" />
                  Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Need help? Contact our support team at{" "}
            <a
              href="mailto:hello@leadsnipper.com"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              hello@leadsnipper.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordComponent;
