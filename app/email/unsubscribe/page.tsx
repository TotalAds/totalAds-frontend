"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const EMAIL_SERVICE_URL =
  process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";

export default function EmailUnsubscribePage() {
  const params = useSearchParams();
  const messageId = params.get("m") || "";
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!messageId) return;
      setStatus("loading");
      setError("");
      try {
        // One-click unsubscribe prefers POST per RFC 8058, but GET also supported by backend
        const form = new URLSearchParams();
        form.set("m", messageId);
        const resp = await axios.post(
          `${EMAIL_SERVICE_URL}/api/public/unsubscribe`,
          form.toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
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
    run();
  }, [messageId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-100 via-bg-200 to-bg-300 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl backdrop-blur-md bg-white/10 border border-brand-main/20 p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-100 mb-2">
            Email Preferences
          </h1>
          <p className="text-text-200 text-sm mb-6">
            Manage your email subscription
          </p>
        </div>

        {!messageId && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300">
              Invalid unsubscribe link. Please try again.
            </p>
          </div>
        )}

        {messageId && status === "idle" && (
          <div className="bg-brand-main/10 border border-brand-main/30 rounded-lg p-4">
            <p className="text-text-200">
              Preparing your unsubscribe request…
            </p>
          </div>
        )}

        {status === "loading" && (
          <div className="bg-brand-main/10 border border-brand-main/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-brand-main border-t-transparent animate-spin"></div>
              <p className="text-text-200">Unsubscribing you… please wait.</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-300 font-medium mb-2">
              ✓ Successfully unsubscribed
            </p>
            <p className="text-text-200 text-sm">
              You won't receive further emails from this sender. If this was a
              mistake, you can reply to the original email to request
              resubscription.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 font-medium mb-2">
              ✗ Unsubscribe failed
            </p>
            <p className="text-text-200 text-sm">
              We couldn't process your unsubscribe request.
            </p>
            {error && (
              <p className="text-text-300 text-xs mt-2 bg-red-500/5 p-2 rounded">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-text-300 text-xs text-center">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}

