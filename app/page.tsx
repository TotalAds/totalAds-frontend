"use client";

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { useAuthContext } from '@/context/AuthContext';

export default function Home() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && state.user) {
        if (!state.user.emailVerified) {
          router.push("/verify-email");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, state.user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Redirecting...
        </h3>
      </div>
    </div>
  );
}
