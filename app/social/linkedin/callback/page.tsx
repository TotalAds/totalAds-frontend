"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { connectLinkedin } from "@/utils/api/socialClient";

export default function LinkedInCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Connecting LinkedIn...");

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setMessage(
          decodeURIComponent(
            errorDescription ||
              (error === "user_cancelled_authorize"
                ? "LinkedIn authorization was cancelled."
                : error === "user_cancelled_login"
                  ? "LinkedIn login was cancelled."
                  : `LinkedIn authorization failed: ${error}`)
          )
        );
        return;
      }

      if (!code) {
        setMessage("Missing LinkedIn code. Please try again.");
        return;
      }
      if (!state) {
        setMessage("Missing LinkedIn state. Please restart LinkedIn connect.");
        return;
      }

      try {
        await connectLinkedin({
          code,
          state,
          redirectUri: `${window.location.origin}/social/linkedin/callback`,
        });
        setMessage("LinkedIn connected successfully. Redirecting...");
        setTimeout(() => router.replace("/social/linkedin"), 1000);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? `LinkedIn connection failed: ${error.message}`
            : "LinkedIn connection failed."
        );
      }
    };

    run();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-bg-100 flex items-center justify-center px-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-lg w-full">
        <h1 className="text-lg font-semibold text-text-100">LinkedIn OAuth</h1>
        <p className="mt-2 text-sm text-text-200">{message}</p>
      </div>
    </div>
  );
}
