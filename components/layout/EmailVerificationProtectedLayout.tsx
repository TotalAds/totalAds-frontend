"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";

interface EmailVerificationProtectedLayoutProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean; // Whether this page requires email verification
}

export default function EmailVerificationProtectedLayout({
  children,
  requireEmailVerification = true,
}: EmailVerificationProtectedLayoutProps) {
  const router = useRouter();
  const { state } = useAuthContext();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkEmailVerification = () => {
      // Wait for auth context to finish loading
      if (state.isLoading) {
        return;
      }

      // If user is not authenticated, let auth context handle redirect
      if (!state.isAuthenticated) {
        setIsChecking(false);
        return;
      }

      // If this page doesn't require email verification, allow access
      if (!requireEmailVerification) {
        setIsChecking(false);
        return;
      }

      // Check email verification status from AuthContext user data
      if (!state.user) {
        // If no user data, redirect to login
        router.push("/login");
        return;
      }

      // If email is not verified, redirect to email verification
      if (!state.user.emailVerified) {
        router.push("/verify-email");
        return;
      }

      // Email is verified, allow access
      setIsChecking(false);
    };

    checkEmailVerification();
  }, [
    state.isLoading,
    state.isAuthenticated,
    state.user,
    requireEmailVerification,
    router,
  ]);

  // Show loading while checking authentication and email verification
  if (state.isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children (auth context will handle redirect)
  if (!state.isAuthenticated) {
    return null;
  }

  // If email verification is required but not completed, don't render children (redirect is in progress)
  if (requireEmailVerification && state.user && !state.user.emailVerified) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}
