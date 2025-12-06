"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";

import { OnboardingData } from "../onboarding";

interface Step4Props {
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isLoading: boolean;
  formData: OnboardingData;
}

export function OnboardingStep4({
  onComplete,
  onBack,
  isLoading,
  formData,
}: Step4Props) {
  const router = useRouter();
  const { refreshUser } = useAuthContext();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  // Cooldown timer effect
  React.useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }

    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      toast.error(
        "Please enter phone number in E.164 format (e.g., +919999988888)"
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post("/onboarding/phone/send-otp", {
        phoneNumber,
      });

      setOtpSent(true);
      setOtpExpiry(response.data.payload.expiresIn);
      setResendCooldown(70); // 70-second cooldown
      toast.success("OTP sent to your phone!");
      setStep("otp");
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("OTP is required");
      return;
    }

    if (otp.length !== 6) {
      toast.error("OTP must be 6 digits");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/onboarding/phone/verify-otp", {
        otp,
      });

      toast.success("Phone verified successfully!");
      onComplete({ phoneNumber });

      // Mark onboarding as completed
      try {
        await apiClient.post("/onboarding/mark-complete");
        // Refresh user state to update onboardingCompleted flag in AuthContext
        await refreshUser();
      } catch (error) {
        console.error("Error marking onboarding complete:", error);
        // Continue anyway, user can still access dashboard
      }

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/email/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.response?.data?.message || "Failed to verify OTP");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100 mb-4">
        Verify Your Phone
      </h2>

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-100 mb-1">
              Phone Number (E.164 Format)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+919999988888"
              className="w-full px-3 py-2 text-sm border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100"
            />
            <p className="text-xs text-text-200 mt-1">
              Format: +[country code][number] (e.g., +919999988888)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading || submitting}
              className="flex-1 py-3 px-4 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || submitting}
              className="flex-1 py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-100 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              maxLength={6}
              className="w-full px-3 py-2 border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-main bg-bg-100 text-text-100 text-center text-lg tracking-widest"
            />
            <p className="text-xs text-text-200 mt-1">
              We sent a 6-digit code to {phoneNumber}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setOtpSent(false);
              }}
              className="text-xs text-brand-main hover:underline"
            >
              Change phone number
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={resendCooldown > 0 || submitting}
              className="text-xs text-brand-main hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
              disabled={isLoading || submitting}
              className="flex-1 py-3 px-4 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || submitting}
              className="flex-1 py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default OnboardingStep4;
