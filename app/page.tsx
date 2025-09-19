"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import QuickStart from "@/components/common/QuickStart";
import { useAuthContext } from "@/context/AuthContext";
import { IconCreditCard, IconRocket, IconSparkles } from "@tabler/icons-react";

export default function Home() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

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
