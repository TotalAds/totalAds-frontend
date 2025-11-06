"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import GetLogo from "@/components/common/getLogo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useAuthContext } from "@/context/AuthContext";
import {
  ContactMetrics,
  getContactMetrics,
  getSubscriptionInfo,
  SubscriptionInfo,
} from "@/utils/api/emailClient";
import { cn } from "@/utils/cn";
import {
  IconChevronDown,
  IconInfoCircle,
  IconMenu2,
  IconMenuDeep,
} from "@tabler/icons-react";

interface TopNavProps {
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

const TopNav: React.FC<TopNavProps> = ({ onSidebarToggle, isSidebarOpen }) => {
  const pathname = usePathname();

  const { state, logoutUser } = useAuthContext();
  const { isAuthenticated, user } = state;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const handleLogout = async () => {
    await logoutUser();
  };

  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [metrics, setMetrics] = useState<ContactMetrics | null>(null);

  const refreshSubscriptionInfo = async () => {
    if (isAuthenticated) {
      try {
        const [info, contactMetrics] = await Promise.all([
          getSubscriptionInfo(),
          getContactMetrics(),
        ]);
        setSubInfo(info);
        setMetrics(contactMetrics);
      } catch (e: unknown) {
        console.warn("Failed to load subscription info", e);
        setSubInfo(null);
        setMetrics(null);
      }
    }
  };

  useEffect(() => {
    refreshSubscriptionInfo();
  }, [isAuthenticated]);

  // Refresh subscription info when page becomes visible (user returns from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        refreshSubscriptionInfo();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  return (
    <header className="backdrop-blur-xl bg-bg-200 border-b border-brand-main/20 flex-shrink-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Sidebar Toggle */}
          <div className="flex items-center">
            {isAuthenticated && (
              <button
                onClick={onSidebarToggle}
                className={cn(
                  "p-2 rounded-xl transition-all duration-200 mr-3",
                  isSidebarOpen
                    ? "text-brand-main bg-brand-main/10 hover:bg-brand-main/20 hover:text-brand-secondary"
                    : "text-text-200 hover:bg-brand-main/10 hover:text-brand-main"
                )}
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isSidebarOpen ? (
                  <IconMenuDeep className="h-6 w-6" />
                ) : (
                  <IconMenu2 className="h-6 w-6" />
                )}
              </button>
            )}
            <Link href="/email/dashboard" className="flex items-center group">
              <div className="p-2 bg-brand-main rounded-xl mr-3 group-hover:scale-110 transition-transform duration-200">
                <GetLogo className="h-6 w-6 text-text-100" />
              </div>
              <span className="text-xl font-bold text-text-100">
                Leadsnipper
              </span>
            </Link>
          </div>

          {/* Right side - User Menu or Auth Links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated && subInfo && metrics && (
              <div className="relative group">
                <button
                  className="p-2 rounded-xl hover:bg-brand-main/10"
                  aria-label="Plan & quota"
                  title="Plan & quota"
                >
                  <IconInfoCircle className="h-5 w-5 text-text-200" />
                </button>
                <div className="absolute right-0 mt-2 w-96 p-4 rounded-xl bg-bg-100 border border-brand-main/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="text-sm text-text-100 space-y-3">
                    {/* Plan Chip */}
                    <div className="font-semibold">
                      <Link
                        href="/email/pricing"
                        className="inline-block px-3 py-1 bg-brand-main rounded-full text-sm text-white hover:bg-brand-secondary transition"
                      >
                        {subInfo.tierDisplayName || subInfo.tierName}
                      </Link>
                    </div>

                    {/* Contact Metrics */}
                    <div className="bg-brand-main/5 rounded-lg p-3 border border-brand-main/10">
                      <div className="text-xs text-text-200 mb-2">Contacts</div>
                      <div className="text-lg font-semibold text-text-100">
                        {metrics.contacts.total} / {metrics.contacts.limit}
                      </div>
                      <div className="w-full bg-brand-main/10 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-brand-tertiary h-1.5 rounded-full"
                          style={{
                            width: `${
                              metrics.contacts.limit > 0
                                ? Math.min(
                                    100,
                                    (metrics.contacts.total /
                                      metrics.contacts.limit) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Email Metrics */}
                    <div className="bg-brand-main/5 rounded-lg p-3 border border-brand-main/10">
                      <div className="text-xs text-text-200 mb-2">
                        Emails This Month
                      </div>
                      <div className="text-lg font-semibold text-text-100">
                        {metrics.emails.used} / {metrics.emails.allocated}
                      </div>
                      <div className="w-full bg-brand-main/10 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-brand-main h-1.5 rounded-full"
                          style={{
                            width: `${
                              metrics.emails.allocated > 0
                                ? Math.min(
                                    100,
                                    (metrics.emails.used /
                                      metrics.emails.allocated) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      {metrics.emails.remaining > 0 && (
                        <div className="text-xs text-text-200 mt-1">
                          {metrics.emails.remaining} remaining
                        </div>
                      )}
                    </div>

                    {/* Daily Limit */}
                    <div className="bg-brand-main/5 rounded-lg p-3 border border-brand-main/10">
                      <div className="text-xs text-text-200 mb-1">
                        Daily Limit
                      </div>
                      <div className="text-lg font-semibold text-text-100">
                        {subInfo.dailyRemaining} / {subInfo.dailyCap} today
                      </div>
                      <div className="text-xs text-text-200 mt-1">
                        Resets:{" "}
                        {new Date(subInfo.dailyResetAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-main p-2 hover:bg-brand-main/10 transition-colors duration-200"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-xl bg-brand-main flex items-center justify-center text-text-100 font-semibold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="ml-3 text-sm font-medium text-text-100 hidden md:block">
                    {user?.name || "User"}
                  </span>
                  <IconChevronDown className="ml-1 h-4 w-4 text-text-200 hidden md:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg backdrop-blur-xl bg-bg-100 border border-brand-main/10 ring-1 ring-black ring-opacity-5 transition-colors duration-300">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      {/* <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-text-200 hover:bg-brand-main/10 hover:text-brand-main"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/billing"
                        className="block px-4 py-2 text-sm text-text-200 hover:bg-brand-main/10 hover:text-brand-main"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Billing
                      </Link> */}

                      <button
                        onClick={() => {
                          handleLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-text-200 hover:bg-brand-main/10 hover:text-brand-main"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-text-200 hover:text-text-100"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-main rounded-xl hover:bg-brand-main/80"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
