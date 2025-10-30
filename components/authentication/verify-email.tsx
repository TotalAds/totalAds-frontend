"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import GetLogo from "@/components/common/getLogo";
import { useAuthContext } from "@/context/AuthContext";
import {
  resendVerificationCode,
  verifyEmail as verifyEmailApi,
} from "@/utils/api/authClient";
import { IconMail, IconRefresh, IconShieldCheck } from "@tabler/icons-react";

const VerifyEmailComponent: React.FC = () => {
  const router = useRouter();
  const { state, refreshUser, logoutUser } = useAuthContext();
  const { user } = state;

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    // If already verified, go to onboarding or dashboard
    if (user?.emailVerified) {
      router.replace("/onboarding");
    }
  }, [user?.emailVerified, router]);

  // Session timeout for verification pending state (5 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Session expired, logout user
          logoutUser();
          router.replace("/login");
          toast.error(
            "Your verification session has expired. Please log in again."
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [logoutUser, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resendVerificationCode();
      setResent(true);
      toast.success("Verification email sent. Please check your inbox.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend verification email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await verifyEmailApi(code.trim().toUpperCase());
      await refreshUser();
      toast.success("Email verified successfully!");
      router.replace("/onboarding");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify email. Try again."
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
          <h2 className="text-4xl font-bold mb-4">Verify your email</h2>
          <p className="text-base text-white/90">
            Check your inbox for the verification code we sent you.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-bg-100 rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-brand-main rounded-2xl">
                  <GetLogo className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                Verify Your Email
              </h1>
              <p className="text-gray-600 dark:text-text-200 text-xs">
                We sent a 6-character verification code to your email. Enter it
                below to verify your account.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="code"
                  className="text-xs font-medium text-gray-900 dark:text-text-100"
                >
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="text"
                  placeholder="ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                  className="mt-1 w-full px-3 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              {resent && !error && (
                <div className="bg-brand-main/10 border border-brand-main/30 text-brand-main text-sm rounded-lg p-3">
                  A new verification code has been sent to your email.
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-main focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Verify Email
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleResend}
                className="w-full py-2.5 px-4 bg-brand-main/10 hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-lg transition-all duration-200 border border-brand-main/20 hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50"
              >
                <div className="flex items-center justify-center">
                  <IconRefresh className="h-4 w-4 mr-2" /> Resend Code
                </div>
              </button>

              <div className="text-center text-gray-600 dark:text-text-200 text-xs">
                Didn’t get the email?
                <br />
                Check your spam folder or click Resend Code.
              </div>

              <div className="flex items-center justify-center text-gray-600 dark:text-gray-600 dark:text-text-200 text-xs">
                <IconMail className="h-4 w-4 mr-2" />
                Logged in as {user?.email || "your email"}
              </div>

              {/* Session Timer */}
              <div className="bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary text-xs rounded-lg p-3 text-center">
                Session expires in:{" "}
                <span className="font-bold">{formatTime(timeRemaining)}</span>
              </div>

              {/* Back to Login Button */}
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  router.push("/login");
                }}
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-brand-tertiary/20 hover:bg-gray-200 dark:hover:bg-brand-tertiary/30 text-gray-900 dark:text-brand-tertiary font-medium rounded-lg text-sm transition-all duration-200 border border-gray-300 dark:border-brand-tertiary/20 hover:border-gray-400 dark:hover:border-brand-tertiary/30 focus:outline-none focus:ring-2 focus:ring-brand-tertiary/50"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailComponent;
