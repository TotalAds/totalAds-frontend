"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import { completeSocialOnboarding, getSocialAccess, SocialAccessResponse } from "@/utils/api/socialClient";
import {
  IconBrandLinkedin,
  IconCheck,
  IconLoader2,
  IconBrain,
  IconSparkles,
  IconRocket,
} from "@tabler/icons-react";

const TOTAL_STEPS = 3;

export default function SocialOnboardingPage() {
  const router = useRouter();
  const { state, refreshUser } = useAuthContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<SocialAccessResponse | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!state.isAuthenticated) {
        router.push("/login?product=socialsnipper");
        return;
      }

      try {
        const accessData = await getSocialAccess();
        setAccess(accessData);

        if (accessData.socialOnboardingCompleted) {
          router.replace("/social/dashboard");
          return;
        }

        if (accessData.linkedinConnected) {
          setStep(3);
        } else if (accessData.enabled) {
          setStep(1);
        }
      } catch (error) {
        console.error("Error loading onboarding:", error);
        toast.error("Failed to load onboarding. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [state.isAuthenticated, router]);

  const handleCompleteOnboarding = async (destination = "/social/dashboard") => {
    if (finishing) return;
    setFinishing(true);
    try {
      await completeSocialOnboarding();
      await refreshUser();
      toast.success("Welcome to SocialSnipper!");
      router.replace(destination);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Could not save onboarding progress. Please try again.");
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-brand-main mx-auto mb-4" />
          <p className="text-text-200">Loading...</p>
        </div>
      </div>
    );
  }

  const tierLabel =
    access?.subscription?.tierDisplayName ||
    (access?.subscription?.isFreeTier ? "Free" : "SocialSnipper");
  const postsRemaining = access?.usage?.postsRemaining ?? 0;
  const maxPosts = access?.limits?.maxMonthlyPosts ?? access?.subscription?.maxMonthlyPosts;

  return (
    <div className="min-h-screen bg-bg-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < TOTAL_STEPS ? "flex-1" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s <= step
                      ? "bg-brand-main text-white"
                      : "bg-bg-200 text-text-300"
                  }`}
                >
                  {s < step ? <IconCheck className="w-5 h-5" /> : s}
                </div>
                {s < TOTAL_STEPS && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? "bg-brand-main" : "bg-bg-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-text-300">
            <span>Free plan</span>
            <span>LinkedIn</span>
            <span>Get started</span>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-bg-200 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-main/10 rounded-2xl mb-4">
                <IconRocket className="w-8 h-8 text-brand-main" />
              </div>
              <h1 className="text-2xl font-bold text-text-100 mb-2">
                Welcome to SocialSnipper
              </h1>
              <p className="text-text-200">
                Your {tierLabel} plan is active. Start exploring AI-powered LinkedIn content.
              </p>
            </div>

            <div className="bg-bg-100 rounded-xl p-6 mb-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-300">Plan</span>
                <span className="font-medium text-text-100">{tierLabel}</span>
              </div>
              {typeof maxPosts === "number" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-300">Posts this month</span>
                  <span className="font-medium text-text-100">
                    {postsRemaining} remaining
                  </span>
                </div>
              )}
              <ul className="space-y-2 pt-2 border-t border-bg-300">
                {[
                  "Generate and preview LinkedIn posts with AI",
                  "Optional LinkedIn connection for publishing",
                  "Upgrade anytime from Billing",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-text-200"
                  >
                    <IconCheck className="w-4 h-4 text-green-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-brand-main text-white rounded-xl font-semibold hover:bg-brand-main/90 transition-colors"
            >
              Continue
            </button>

            {!access?.enabled && (
              <p className="text-center text-sm text-text-300 mt-4">
                No active plan found.{" "}
                <Link href="/social/pricing" className="text-brand-main hover:underline">
                  View pricing
                </Link>
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="bg-bg-200 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-2xl mb-4">
                <IconBrandLinkedin className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-text-100 mb-2">
                Connect LinkedIn
              </h1>
              <p className="text-text-200">
                Optional — connect now to publish and schedule, or add it later from Settings.
              </p>
            </div>

            {access?.linkedinConnected ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full">
                  <IconCheck className="w-5 h-5" />
                  LinkedIn Connected
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-brand-main text-white rounded-xl font-semibold hover:bg-brand-main/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/social/linkedin")}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <IconBrandLinkedin className="w-5 h-5" />
                  Connect LinkedIn
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-transparent border border-bg-300 text-text-200 rounded-xl font-semibold hover:bg-bg-300 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="bg-bg-200 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-2xl mb-4">
                <IconSparkles className="w-8 h-8 text-purple-500" />
              </div>
              <h1 className="text-2xl font-bold text-text-100 mb-2">
                See what SocialSnipper can do
              </h1>
              <p className="text-text-200">
                Create a post to preview AI output, set up memory when you are ready, or go straight to your dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleCompleteOnboarding("/social/post-studio")}
                disabled={finishing}
                className="w-full py-3 bg-brand-main text-white rounded-xl font-semibold hover:bg-brand-main/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <IconSparkles className="w-5 h-5" />
                Create a post in Post Studio
              </button>

              <button
                onClick={() => handleCompleteOnboarding("/social/memory/onboarding")}
                disabled={finishing}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <IconBrain className="w-5 h-5" />
                Set up memory (optional)
              </button>

              <button
                onClick={() => handleCompleteOnboarding("/social/dashboard")}
                disabled={finishing}
                className="w-full py-3 bg-transparent border border-bg-300 text-text-200 rounded-xl font-semibold hover:bg-bg-300 transition-colors disabled:opacity-50"
              >
                {finishing ? "Saving..." : "Go to dashboard"}
              </button>
            </div>

            <p className="text-center text-xs text-text-300 mt-4">
              Copilot scheduling unlocks after you connect LinkedIn and complete memory (80%+).
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-text-300 hover:text-text-100 transition-colors"
            >
              ← Back
            </button>
          )}
          <span className="text-text-300 text-sm ml-auto">
            You can change these settings anytime from the sidebar.
          </span>
        </div>
      </div>
    </div>
  );
}
