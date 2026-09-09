"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import emailClient from "@/utils/api/emailClient";

/**
 * Product / lifecycle email unsubscribe (not campaign outreach).
 * Token is HMAC user-level from LeadSnipper lifecycle emails.
 */
export default function LifecycleUnsubscribePage() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  const handleUnsubscribe = async () => {
    if (!token) return;
    setStatus("loading");
    setError("");
    try {
      const resp = await emailClient.post(
        `/api/public/lifecycle-unsubscribe`,
        { token },
        { params: { token } }
      );
      if (resp.data?.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setError(resp.data?.message || "Failed to unsubscribe");
      }
    } catch (e: any) {
      setStatus("error");
      setError(
        e?.response?.data?.message || e?.message || "Failed to unsubscribe"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-100 via-bg-200 to-bg-300 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl backdrop-blur-md bg-white/10 border border-brand-main/20 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-text-100 mb-2">
            Product email preferences
          </h1>
          <p className="text-text-200 text-sm">
            Stop LeadSnipper tips, activation nudges, and deliverability digests.
            Transactional mail (billing, security, auto-pause) may still send.
          </p>
        </div>

        {!token && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300">
              Invalid unsubscribe link. Please use the link from your email.
            </p>
          </div>
        )}

        {token && status === "idle" && (
          <div className="space-y-4">
            <button
              onClick={handleUnsubscribe}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
            >
              Unsubscribe from product emails
            </button>
            <a
              href="/"
              className="block text-center text-sm text-text-200 hover:text-text-100"
            >
              Keep receiving emails
            </a>
          </div>
        )}

        {status === "loading" && (
          <p className="text-text-200 text-center text-sm">Updating…</p>
        )}

        {status === "success" && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-emerald-200 text-sm">
              You&apos;re unsubscribed from LeadSnipper product emails. You can
              still use the product normally.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
