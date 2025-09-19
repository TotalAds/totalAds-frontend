"use client";

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import GetLogo from '@/components/common/getLogo';
import { useAuthContext } from '@/context/AuthContext';
import { skipOnboarding } from '@/utils/api/onboardingClient';
import { IconArrowRight, IconRocket, IconSparkles, IconTarget } from '@tabler/icons-react';

export default function OnboardingContainer() {
  const router = useRouter();
  const { refreshUser, state } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = state;

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      // Skip onboarding and go directly to dashboard
      const result = await skipOnboarding();
      toast.success("Welcome to Leadsnipper! 🎉");

      // Refresh user data to update onboarding status
      await refreshUser();

      // Redirect to dashboard
      setTimeout(() => {
        router.push(result.redirectTo || "/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Something went wrong. Redirecting anyway...");

      // Try to refresh user data and redirect anyway
      try {
        await refreshUser();
        router.push("/dashboard");
      } catch (refreshError) {
        console.error("Failed to refresh user data:", refreshError);
        // Force a page reload as fallback
        window.location.href = "/dashboard";
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Main Welcome Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl text-center">
          {/* Logo and Header */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl">
                <GetLogo className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to Leadsnipper! 🎉
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Hi {user?.name || "there"}! You're all set up and ready to start
              extracting valuable leads from any website.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-xl mb-4 mx-auto">
                <IconRocket className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Fast Extraction
              </h3>
              <p className="text-gray-400 text-sm">
                Extract leads from any website in seconds with our powerful
                scraper
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4 mx-auto">
                <IconTarget className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Smart Targeting
              </h3>
              <p className="text-gray-400 text-sm">
                Use ICP profiles to find your ideal customers automatically
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-xl mb-4 mx-auto">
                <IconSparkles className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                AI-Powered
              </h3>
              <p className="text-gray-400 text-sm">
                Get enriched data and insights powered by advanced AI
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Setting up...
                </>
              ) : (
                <>
                  Get Started
                  <IconArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>

            <p className="text-gray-400 text-sm">
              You'll be redirected to your dashboard where you can start
              scraping immediately
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Need help? Contact our support team at{" "}
            <a
              href="mailto:hello@leadsnipper.com"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              hello@leadsnipper.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
