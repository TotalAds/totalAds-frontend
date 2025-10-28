"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreditsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect old Credits page to the new Pricing & Plans page
    router.replace("/email/pricing");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center p-8 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">
          Credits moved to Pricing & Plans
        </h1>
        <p className="text-gray-300 mb-4">
          Redirecting you to the new pricing page...
        </p>
        <a
          href="/email/pricing"
          className="text-purple-300 hover:text-purple-200 underline"
        >
          Go to Pricing & Plans
        </a>
      </div>
    </div>
  );
}
