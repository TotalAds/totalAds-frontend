"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";

export default function Home() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before doing any redirects
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [mounted, isAuthenticated, isLoading, router]);

  // Always show loading while determining authentication status or mounting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>
  );
}
