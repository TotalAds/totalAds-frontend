"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import { resendVerificationCode } from "@/utils/api/authClient";

export interface EmailVerificationState {
  isVerified: boolean;
  isLoading: boolean;
  showBanner: boolean;
  showModal: boolean;
}

export interface EmailVerificationActions {
  resendCode: () => Promise<void>;
  dismissBanner: () => void;
  showVerificationModal: () => void;
  hideVerificationModal: () => void;
  redirectToVerification: () => void;
}

export const useEmailVerification = (): EmailVerificationState & EmailVerificationActions => {
  const { state } = useAuthContext();
  const { user, isLoading } = state;
  const router = useRouter();
  
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isVerified = user?.emailVerified ?? false;

  useEffect(() => {
    // Show banner if user is logged in but not verified
    if (user && !isVerified && !isLoading) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [user, isVerified, isLoading]);

  const resendCode = async (): Promise<void> => {
    if (isResending) return;
    
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

  const dismissBanner = (): void => {
    setShowBanner(false);
  };

  const showVerificationModal = (): void => {
    setShowModal(true);
  };

  const hideVerificationModal = (): void => {
    setShowModal(false);
  };

  const redirectToVerification = (): void => {
    router.push("/verify-email");
  };

  return {
    isVerified,
    isLoading,
    showBanner,
    showModal,
    resendCode,
    dismissBanner,
    showVerificationModal,
    hideVerificationModal,
    redirectToVerification,
  };
};

export default useEmailVerification;
