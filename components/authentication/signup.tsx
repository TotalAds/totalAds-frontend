"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import GetLogo from "@/components/common/getLogo";
import { useAuthContext } from "@/context/AuthContext";
import { appendUtmToPath } from "@/utils/analytics/utm";
import { IconLogin } from "@tabler/icons-react";

export function SignupComponent() {
  const router = useRouter();
  const { state, registerUser, clearError } = useAuthContext();
  const { isLoading, error } = state;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Please enter a valid email";

    if (!password) errors.password = "Password is required";
    else if (
      !/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/.test(
        password
      )
    )
      errors.password =
        "Password requires 8-16 characters, at least one number, uppercase letter, lowercase letter, and special character";

    if (!confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Clear any previous errors
    clearError();

    try {
      const user = await registerUser(name, email, password, confirmPassword);

      // Check if email verification is required
      if (!user.emailVerified) {
        router.push("/verify-email");
      } else if (!user.onboardingCompleted) {
        // After email verification, redirect to onboarding
        router.push("/onboarding");
      } else {
        // If both email and onboarding are complete, go to dashboard
        router.push("/email/dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error instanceof Error ? error.message : "Registration failed";
      if (
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("account with this email")
      ) {
        setFormErrors((prev) => ({ ...prev, email: message }));
        clearError();
      }
      // Other errors are handled by AuthContext and will be displayed
    }
  };

  return (
    <div className="h-screen bg-bg-100 flex overflow-hidden">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-main via-brand-main/80 to-brand-secondary relative overflow-hidden items-center justify-center p-8">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-tertiary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full"></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-white/40 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-white/30 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 flex gap-2">
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-md">
          <h2 className="text-2xl font-bold mb-4">Get started now!</h2>
          <p className="text-base text-white/90">
            Join thousands of businesses extracting leads and growing their
            sales pipeline.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full h-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 overflow-y-auto py-4">
        <div className="w-full h-full max-w-sm">
          {/* Main Signup Card */}
          <div className="bg-white dark:bg-bg-100 rounded-lg p-6 shadow-lg">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-brand-main rounded-lg">
                  <GetLogo className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                Sign Up
              </h1>
              <p className="text-gray-600 dark:text-text-200 text-sm">
                Create your account
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm"
                  role="alert"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={clearError}
                      className="text-red-200 hover:text-red-100 transition-colors ml-4"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="firstname"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
                >
                  Full Name
                </label>
                <input
                  id="firstname"
                  placeholder="John Doe"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                />
                {formErrors.name && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  placeholder="john@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                />
                {formErrors.email && (
                  <p className="text-red-400 text-xs mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
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
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                />
                {formErrors.password && (
                  <p className="text-red-400 text-xs mt-1">
                    {formErrors.password}
                  </p>
                )}
                {!formErrors.password && (
                  <p className="text-gray-600 dark:text-text-200 text-xs mt-1">
                    8+ characters with number, uppercase & lowercase
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold text-gray-900 dark:text-text-100"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 text-white font-semibold rounded-lg text-sm transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <IconLogin className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-brand-main/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white dark:bg-brand-main/5 rounded-full text-gray-600 dark:text-text-200">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Login button */}
              <button
                type="button"
                onClick={() => router.push(appendUtmToPath("/login"))}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-brand-main/10 hover:bg-gray-200 dark:hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-xl text-sm transition-all duration-200 border border-gray-300 dark:border-brand-main/20 hover:border-gray-400 dark:hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50"
              >
                Sign In Instead
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-600 dark:text-text-200 text-xs">
              Need help? Contact our support team at{" "}
              <a
                href="mailto:hello@leadsnipper.com"
                className="text-brand-main hover:text-brand-secondary transition-colors"
              >
                hello@leadsnipper.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
