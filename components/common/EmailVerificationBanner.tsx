"use client";

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useAuthContext } from '@/context/AuthContext';
import { resendVerificationCode } from '@/utils/api/authClient';
import { IconMail, IconRefresh, IconX } from '@tabler/icons-react';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
  variant?: "banner" | "modal";
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  onDismiss,
  variant = "banner",
}) => {
  const { state } = useAuthContext();
  const { user } = state;
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user is verified or banner is dismissed
  if (user?.emailVerified || isDismissed) {
    return null;
  }

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await resendVerificationCode();
      toast.success("Verification email sent! Check your inbox.");
    } catch (error) {
      console.error("Failed to resend verification code:", error);
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyEmail = () => {
    router.push("/verify-email");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <IconMail className="h-6 w-6 text-[var(--primary-200)] mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Verify Your Email
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Please verify your email address to access all Leadsnipper features
            and receive your welcome credits.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleVerifyEmail}
              className="w-full bg-[var(--primary-200)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--primary-300)] transition-colors"
            >
              Verify Email Now
            </button>

            <button
              onClick={handleResendCode}
              disabled={isResending}
              className="w-full bg-white text-[var(--primary-200)] py-3 px-4 rounded-lg font-medium border border-[var(--primary-200)] hover:bg-[var(--primary-200)]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center">
                <IconRefresh
                  className={`h-4 w-4 mr-2 ${
                    isResending ? "animate-spin" : ""
                  }`}
                />
                {isResending ? "Sending..." : "Resend Code"}
              </div>
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Sent to: {user?.email}
          </p>
        </div>
      </div>
    );
  }

  // Banner variant - Short and compact design
  return (
    <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl p-3 mb-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-amber-500/20 rounded-full">
            <IconMail className="h-4 w-4 text-amber-300" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-medium">
              📧 Verify your email to unlock all features
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyEmail}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Verify Now
          </button>
          <button
            onClick={handleResendCode}
            disabled={isResending}
            className="text-amber-300 hover:text-amber-200 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend"}
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors ml-1"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
