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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                <GetLogo className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-300 text-sm">
              We sent a 6-character verification code to your email. Enter it
              below to verify your account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="code"
                className="text-sm font-medium text-gray-200"
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
                className="mt-1 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            {resent && !error && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-200 text-sm rounded-lg p-3">
                A new verification code has been sent to your email.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Verify Email
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleResend}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <div className="flex items-center justify-center">
                <IconRefresh className="h-4 w-4 mr-2" /> Resend Code
              </div>
            </button>

            <div className="text-center text-gray-300 text-xs">
              Didn’t get the email?
              <br />
              Check your spam folder or click Resend Code.
            </div>

            <div className="flex items-center justify-center text-gray-300 text-sm">
              <IconMail className="h-4 w-4 mr-2" />
              Logged in as {user?.email || "your email"}
            </div>

            {/* Session Timer */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm rounded-lg p-3 text-center">
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
              className="w-full py-3 px-4 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 font-medium rounded-xl transition-all duration-200 border border-gray-500/20 hover:border-gray-500/30 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailComponent;
