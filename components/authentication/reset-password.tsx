"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

import GetLogo from "@/components/common/getLogo";
import { resetPassword, validateResetCode } from "@/utils/api/authClient";
import {
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";

type Props = {};

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate reset code on component mount
  useEffect(() => {
    const validateCode = async () => {
      if (!code) {
        setError(
          "Invalid password reset link. Please request a new password reset to continue."
        );
        setIsValidating(false);
        return;
      }

      try {
        const result = await validateResetCode(code);
        if (result.valid) {
          setIsValidCode(true);
        } else {
          setError(
            "This password reset link is invalid or has expired. Please request a new password reset for security."
          );
        }
      } catch (error) {
        console.error("Code validation error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "This password reset link is invalid or has expired. Please request a new password reset for security."
        );
      } finally {
        setIsValidating(false);
      }
    };

    validateCode();
  }, [code]);

  const validatePasswords = () => {
    if (newPassword.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (newPassword !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validatePasswords();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!code) {
      setError("Invalid password reset code. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(code, newPassword);
      setIsSuccess(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update password. Please try again or request a new reset link."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-brand-main/10 backdrop-blur-md rounded-lg shadow-2xl border border-brand-main/20 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-main/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <IconShieldCheck className="w-8 h-8 text-brand-main" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                Validating Reset Code
              </h2>
              <p className="text-gray-600 dark:text-text-200 text-xs">
                Please wait while we verify your reset code...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-brand-main/10 backdrop-blur-md rounded-lg shadow-2xl border border-brand-main/20 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconLock className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600 dark:text-text-200 text-xs mb-6">
                {error ||
                  "This password reset link is invalid or has expired. Please request a new reset link to continue."}
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => router.push("/reset-password/enter-code")}
                  className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-main focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  Enter Code Manually
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-brand-main/10 hover:bg-gray-200 dark:hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-lg text-sm transition-all duration-200 border border-gray-300 dark:border-brand-main/20 hover:border-gray-400 dark:hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50"
                >
                  Request New Reset Link
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-brand-main/10 hover:bg-gray-200 dark:hover:bg-brand-main/20 text-gray-900 dark:text-text-100 font-medium rounded-lg text-sm transition-all duration-200 border border-gray-300 dark:border-brand-main/20 hover:border-gray-400 dark:hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50"
                >
                  <div className="flex items-center justify-center">
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-4xl font-bold mb-4">Create new password</h2>
          <p className="text-base text-white/90">
            Secure your account with a strong new password.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-bg-100 rounded-2xl p-6 shadow-lg">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-brand-main rounded-2xl">
                  <GetLogo className="h-8 w-auto text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                Create New Password
              </h2>
              <p className="text-gray-600 dark:text-text-200 text-xs">
                Please enter a strong new password below to secure your
                Leadsnipper account.
              </p>
            </div>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="newPassword"
                    className="block text-xs font-medium text-gray-900 dark:text-gray-900 dark:text-text-100"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconLock className="h-4 w-4 text-gray-500 dark:text-gray-600 dark:text-text-200" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Enter your new password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-600 dark:text-text-200 hover:text-gray-700 dark:hover:text-gray-900 dark:text-text-100 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <IconEyeOff className="h-4 w-4" />
                      ) : (
                        <IconEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-medium text-gray-900 dark:text-gray-900 dark:text-text-100"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconLock className="h-4 w-4 text-gray-500 dark:text-gray-600 dark:text-text-200" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2.5 bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg text-gray-900 dark:text-gray-900 dark:text-text-100 placeholder-gray-500 dark:placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Confirm your new password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-600 dark:text-text-200 hover:text-gray-700 dark:hover:text-gray-900 dark:text-text-100 transition-colors duration-200"
                    >
                      {showConfirmPassword ? (
                        <IconEyeOff className="h-4 w-4" />
                      ) : (
                        <IconEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-100 dark:bg-brand-main/10 border border-gray-300 dark:border-brand-main/20 rounded-lg p-4">
                  <p className="text-brand-main text-xs mb-2 font-medium">
                    🔒 Password Security Requirements:
                  </p>
                  <ul className="text-gray-600 dark:text-gray-600 dark:text-text-200 text-xs space-y-1">
                    <li className="flex items-center">
                      <span className="w-1 h-1 bg-brand-main rounded-full mr-2"></span>
                      Minimum 8 characters for enhanced security
                    </li>
                    <li className="flex items-center">
                      <span className="w-1 h-1 bg-brand-main rounded-full mr-2"></span>
                      Both password fields must match exactly
                    </li>
                    <li className="flex items-center">
                      <span className="w-1 h-1 bg-brand-main rounded-full mr-2"></span>
                      Use a unique password not used elsewhere
                    </li>
                  </ul>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 disabled:bg-text-200 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-main focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text-100 mr-2"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                {/* Back to login */}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-brand-main/10 hover:bg-brand-main/20 text-gray-900 dark:text-gray-900 dark:text-text-100 font-medium rounded-lg transition-all duration-200 border border-brand-main/20 hover:border-brand-main/30 focus:outline-none focus:ring-2 focus:ring-brand-main/50"
                >
                  <div className="flex items-center justify-center">
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </div>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-main/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconShieldCheck className="w-8 h-8 text-brand-main" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-text-100 mb-2">
                    Password Successfully Updated!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-600 dark:text-gray-600 dark:text-text-200 text-xs mb-6">
                    Your Leadsnipper account password has been successfully
                    updated. You can now sign in securely with your new password
                    and access all your account features.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full py-2.5 px-4 bg-brand-main hover:bg-brand-main/80 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-main focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  Continue to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordComponent = (props: Props) => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-brand-main/10 backdrop-blur-md rounded-lg shadow-2xl border border-brand-main/20 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-main/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <IconShieldCheck className="w-8 h-8 text-brand-main" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-text-100 mb-2">
                  Loading...
                </h2>
                <p className="text-gray-600 dark:text-text-200 text-xs">
                  Please wait while we load the reset password form.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordComponent;
