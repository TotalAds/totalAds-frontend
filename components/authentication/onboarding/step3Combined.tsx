"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import apiClient, { setEmailProviderStep5, type SesProvider } from "@/utils/api/apiClient";

interface Step3CombinedProps {
  onBack: () => void;
  isLoading: boolean;
}

export function OnboardingStep3Combined({ onBack, isLoading }: Step3CombinedProps) {
  const router = useRouter();
  const { refreshUser, state } = useAuthContext();

  const [stage, setStage] = useState<"phone" | "otp" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [selected, setSelected] = useState<SesProvider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const didInitStage = React.useRef(false);

  React.useEffect(() => {
    if (didInitStage.current) return;
    if (state.isLoading) return;
    if (!state.user) return;

    // If phone already verified, jump straight to email selection after refresh.
    if (state.user.phoneVerified) {
      setStage("email");
    }
    didInitStage.current = true;
  }, [state.isLoading, state.user]);

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

    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      toast.error("Please enter phone number in E.164 format (e.g., +919999988888)");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/onboarding/phone/send-otp", { phoneNumber });
      setResendCooldown(70);
      toast.success("OTP sent to your phone!");
      setStage("otp");
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
      await apiClient.post("/onboarding/phone/verify-otp", { otp });
      await refreshUser();
      toast.success("Phone verified successfully!");
      setStage("email");
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.response?.data?.message || "Failed to verify OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!selected) {
      toast.error("Please select an email delivery option");
      return;
    }

    try {
      setSubmitting(true);
      await setEmailProviderStep5(selected);
      await refreshUser();
      toast.success("Setup complete! Welcome to LeadSnipper.");
      router.push("/email/dashboard");
    } catch (error: any) {
      console.error("Set email provider error:", error);
      toast.error(error.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100 mb-2">
        Finish setup
      </h2>
      <p className="text-sm text-text-200 mb-4">
        Verify your phone, then choose how you want to send campaign emails.
      </p>

      {stage === "phone" && (
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
      )}

      {stage === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-100 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
                setStage("phone");
                setOtp("");
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
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setStage("phone");
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

      {stage === "email" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setSelected("leadsnipper_managed")}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected === "leadsnipper_managed"
                  ? "border-brand-main bg-brand-main/10"
                  : "border-bg-200 hover:border-bg-300 bg-bg-100"
              }`}
            >
              <div className="font-medium text-text-100">LeadSnipper Managed</div>
              <div className="text-sm text-text-200 mt-1">
                We manage your sending reputation, throttling, and safety. Add your domain and sender and run campaigns.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelected("custom")}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected === "custom"
                  ? "border-brand-main bg-brand-main/10"
                  : "border-bg-200 hover:border-bg-300 bg-bg-100"
              }`}
            >
              <div className="font-medium text-text-100">Bring your own SES</div>
              <div className="text-sm text-text-200 mt-1">
                Use your own AWS SES account. You manage reputation and limits; we provide the tools. Popular with agencies.
              </div>
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStage("otp")}
              disabled={isLoading || submitting}
              className="flex-1 py-3 px-4 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected || isLoading || submitting}
              className="flex-1 py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Completing..." : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingStep3Combined;

