"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import emailClient from '@/utils/api/emailClient';
import { IconCheck, IconLoader, IconX } from '@tabler/icons-react';

export default function VerifySenderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      try {
        // Use public endpoint (no auth required) for email verification from link
        const response = await emailClient.post(
          "/api/public/email-senders/verify-token",
          {
            token,
          }
        );

        if (response.data.success) {
          setStatus("success");
          setMessage(
            response.data.message || "Email sender verified successfully!"
          );
          setEmail(response.data.data?.email || "");

          // Redirect to email settings after 3 seconds
          setTimeout(() => {
            router.push("/email/settings");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(response.data.message || "Failed to verify email sender");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            error.message ||
            "Failed to verify email sender. Please try again."
        );
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-100 to-bg-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-300/50 border border-brand-main/20 rounded-lg p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-100 mb-2">
              Email Verification
            </h1>
            <p className="text-text-200 text-sm">
              Verifying your email sender...
            </p>
          </div>

          {/* Status Content */}
          <div className="space-y-6">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-main to-brand-main/50 rounded-full opacity-20 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconLoader className="w-8 h-8 text-brand-main animate-spin" />
                  </div>
                </div>
                <p className="text-text-200 text-sm text-center">
                  Please wait while we verify your email sender...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconCheck className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-green-400 font-semibold mb-2">
                    Verification Successful!
                  </p>
                  {email && (
                    <p className="text-text-200 text-sm mb-4">
                      Email{" "}
                      <span className="font-mono text-brand-main">{email}</span>{" "}
                      has been verified
                    </p>
                  )}
                  <p className="text-text-300 text-xs">
                    Redirecting to email settings in 3 seconds...
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconX className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-red-400 font-semibold mb-2">
                    Verification Failed
                  </p>
                  <p className="text-text-200 text-sm mb-4">{message}</p>
                  <button
                    onClick={() => router.push("/email/settings")}
                    className="inline-block bg-brand-main hover:bg-brand-main/90 text-white py-2 px-4 rounded text-sm transition-colors"
                  >
                    Go to Email Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-brand-main/10">
            <p className="text-text-300 text-xs text-center">
              If you didn't request this verification, you can safely ignore
              this email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
