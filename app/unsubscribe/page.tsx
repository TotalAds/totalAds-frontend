"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const EMAIL_SERVICE_URL =
  process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";

export default function UnsubscribePage() {
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
    <div className="min-h-[60vh] flex items-center justify-center bg-brand-black text-white p-6">
      <div className="max-w-md w-full rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold mb-3">Email Preferences</h1>
        {!messageId && (
          <p className="text-slate-300">
            Invalid unsubscribe link. Please try again.
          </p>
        )}
        {messageId && status === "idle" && (
          <p className="text-slate-300">Preparing your unsubscribe request…</p>
        )}
        {status === "loading" && (
          <p className="text-slate-300">Unsubscribing you… please wait.</p>
        )}
        {status === "success" && (
          <div>
            <p className="text-green-300">
              You're unsubscribed. You won't receive further emails from this
              sender.
            </p>
            <p className="text-slate-400 mt-2 text-sm">
              If this was a mistake, you can reply to the original email to
              request resubscription.
            </p>
          </div>
        )}
        {status === "error" && (
          <div>
            <p className="text-red-300">
              We couldn't process your unsubscribe.
            </p>
            {error && <p className="text-slate-300 text-sm mt-1">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
