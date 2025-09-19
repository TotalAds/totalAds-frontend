"use client";
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import GetLogo from '@/components/common/getLogo';
import { useAuthContext } from '@/context/AuthContext';
import { IconUserCircle } from '@tabler/icons-react';

export function LoginComponent() {
  const router = useRouter();
  const { state, loginUser, clearError } = useAuthContext();
  const { isLoading, error, isAuthenticated } = state;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect based on authentication and email verification status
  useEffect(() => {
    if (isAuthenticated && state.user) {
      if (!state.user.emailVerified) {
        router.push("/verify-email");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, state.user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear any previous errors
    clearError();

    try {
      await loginUser(email, password, rememberMe);
      // The redirect will be handled by the AuthContext and useEffect in the component
      // No need to manually redirect here as the auth state change will trigger it
    } catch (error) {
      console.error("Login error:", error);
      // Error is handled by the AuthContext and will be displayed. Friendly message already comes from backend.
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl">
                <GetLogo className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Welcome Back! 👋
            </h1>
            <p className="text-gray-300 text-lg">
              Sign in to continue your lead generation journey
            </p>
          </div>
          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div
                className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm"
                role="alert"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-200 hover:text-white transition-colors ml-4"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-white"
              >
                Email Address
              </label>
              <input
                id="email"
                placeholder="your@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-lg"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-white"
              >
                Password
              </label>
              <input
                id="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-lg"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-300"
                >
                  Keep me signed in
                </label>
              </div>
              <div>
                <a
                  href="/forgot-password"
                  className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <IconUserCircle className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/5 rounded-full text-gray-400">
                  New to Leadsnipper?
                </span>
              </div>
            </div>

            {/* Signup button */}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl text-lg transition-all duration-200 border border-white/20 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Create Your Account
            </button>
          </form>
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
