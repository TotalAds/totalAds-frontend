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
    "idle" | "loading" | "success" | "error" | "confirmation"
  >("idle");
  const [error, setError] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleUnsubscribe = async () => {
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

  useEffect(() => {
    // Auto-unsubscribe if message ID is present (one-click unsubscribe)
    if (messageId && status === "idle") {
      setShowConfirmation(true);
    }
  }, [messageId, status]);

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

        {messageId && showConfirmation && status === "idle" && (
          <div className="space-y-4">
            <div className="bg-brand-main/10 border border-brand-main/30 rounded-lg p-4">
              <p className="text-text-200 text-sm mb-4">
                Are you sure you want to unsubscribe from emails from this
                sender?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleUnsubscribe}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Unsubscribe
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-brand-main/20 hover:bg-brand-main/30 text-text-100 font-medium py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="bg-brand-main/10 border border-brand-main/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-brand-main border-t-transparent animate-spin"></div>
              <p className="text-text-200">Processing your request…</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✓</div>
                <div>
                  <p className="text-green-300 font-medium mb-1">
                    Successfully unsubscribed
                  </p>
                  <p className="text-text-200 text-sm">
                    You have been removed from this mailing list. You won't
                    receive further emails from this sender.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-text-200/10 border border-text-200/20 rounded-lg p-4">
              <p className="text-text-200 text-sm">
                <strong>Note:</strong> If this was a mistake, you can reply to
                the original email to request resubscription.
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✗</div>
                <div>
                  <p className="text-red-300 font-medium mb-1">
                    Unsubscribe failed
                  </p>
                  <p className="text-text-200 text-sm">
                    We couldn't process your unsubscribe request. Please try
                    again or contact support.
                  </p>
                </div>
              </div>
            </div>
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <p className="text-text-300 text-xs">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
            <button
              onClick={handleUnsubscribe}
              className="w-full bg-brand-main hover:bg-brand-main/90 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Try Again
            </button>
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
