"use client";

import dynamic from "next/dynamic";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";

import EmailVerificationBanner from "@/components/common/EmailVerificationBanner";
import WorkspaceLimitBanner from "@/components/workspace/WorkspaceLimitBanner";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import { IconMenu2, IconLock, IconArrowRight, IconLogout, IconCheck } from "@tabler/icons-react";
import { getSubscriptionInfo } from "@/utils/api/emailClient";

// Dynamically import components that pull in framer-motion to avoid SSR vendor-chunk issues
const MainSidebar = dynamic(
  () => import("@/components/navigation/MainSidebar"),
  { ssr: false }
);
const SocialSidebar = dynamic(
  () => import("@/components/navigation/SocialSidebar"),
  { ssr: false }
);
const SocialLimitShell = dynamic(
  () => import("@/components/social/SocialLimitShell"),
  { ssr: false }
);

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state, logoutUser } = useAuthContext();
  const { isAuthenticated } = state;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [subStatus, setSubStatus] = useState<string | null>(null);

  // Load subscription status to check for expired trial/plan
  useEffect(() => {
    const fetchSubStatus = async () => {
      if (!isAuthenticated) {
        setSubStatus(null);
        return;
      }
      try {
        const sub = await getSubscriptionInfo();
        setSubStatus(sub.status || null);
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      }
    };

    fetchSubStatus();
  }, [isAuthenticated, pathname, searchParams]);

  // Define paths that should not have navbar and footer
  const authPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/verify-email",
    "/appsumo",
    "/auth/sso/callback",
    "/email/unsubscribe",
    "/unsubscribe",
    "/email/workspaces/invite",
    "/email/mcp/oauth/consent",
  ];

  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));
  const isSocialRoute = pathname.startsWith("/social");

  // Determine if path is one of the LeadSnipper features blocked on expired subscription
  const isBlockedPath = useMemo(() => {
    if (isSocialRoute) return false;
    if (isAuthPage) return false;

    // Do not block pricing
    if (pathname.startsWith("/email/pricing")) return false;

    // Check settings page specifically - allow Billing and Profile tabs
    if (pathname.startsWith("/email/settings")) {
      const tab = searchParams?.get("tab");
      if (!tab || tab === "profile" || tab === "billing") {
        return false;
      }
      return true; // Block other settings tabs (team, workspaces, email-delivery, usage, integrations, activity, etc.)
    }

    // Block other email routes
    if (pathname.startsWith("/email")) {
      if (pathname.includes("/unsubscribe")) return false;
      return true;
    }

    return false;
  }, [pathname, searchParams, isSocialRoute, isAuthPage]);

  const showExpiredOverlay = isAuthenticated && !isSocialRoute && subStatus === "expired" && isBlockedPath;

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false); // Close on mobile
      } else {
        setIsSidebarOpen(true); // Open on desktop
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  if (isAuthPage) {
    // Return children without sidebar for auth pages
    return <>{children}</>;
  }

  // Return children with sidebar for other pages (no top header)
  return (
    <div className="flex h-screen min-h-0 bg-bg-100">
      {/* Sidebar */}
      {isAuthenticated && (
        isSocialRoute ? (
          // SocialSidebar uses a fragment; wrap so overlay+panel are not extra flex siblings (fixes narrow main column on phones).
          <div className="w-0 shrink-0 overflow-visible md:w-64 md:shrink-0">
            <SocialSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          </div>
        ) : (
          <MainSidebar
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
            onToggle={toggleSidebar}
          />
        )
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Header - Only visible on mobile when sidebar is closed */}
        {isAuthenticated && !isSidebarOpen && (
          <div className="flex items-center border-b border-gray-200 bg-bg-200 px-4 py-3 md:hidden">
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-text-200 transition-colors hover:bg-gray-100"
            >
              <IconMenu2 className="h-6 w-6" />
            </button>
            <span className="ml-3 font-semibold text-text-100">
              {isSocialRoute ? "SocialSnipper" : "LeadSnipper"}
            </span>
          </div>
        )}

        <main
          className={cn(
            "thin-scrollbar min-w-0 flex-1 relative",
            isSocialRoute
              ? "overflow-y-auto overflow-x-hidden md:overflow-auto"
              : (showExpiredOverlay ? "overflow-hidden" : "overflow-auto")
          )}
        >
          {/* Email Verification Banner - only show for authenticated users with unverified email */}
          {isAuthenticated && state.user && !state.user.emailVerified && (
            <div className="p-4">
              <EmailVerificationBanner variant="banner" />
            </div>
          )}
          {isAuthenticated && !isSocialRoute && <WorkspaceLimitBanner />}
          {isSocialRoute && isAuthenticated ? (
            <SocialLimitShell>{children}</SocialLimitShell>
          ) : (
            children
          )}

          {/* Expired Subscription Overlay */}
          {showExpiredOverlay && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-100/70 backdrop-blur-md p-6 pointer-events-auto overflow-y-auto">
              <div className="bg-bg-200 border border-bg-300 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                {/* Background accent glow */}
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

                {/* Icon */}
                <div className="relative mb-6 p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 shadow-inner">
                  <IconLock className="w-8 h-8" />
                </div>

                {/* Badge */}
                <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                  Subscription Expired
                </span>

                {/* Text */}
                <h2 className="text-2xl font-extrabold text-text-100 mb-3 tracking-tight">
                  Unlock LeadSnipper to Continue Sending
                </h2>
                <p className="text-text-200 text-sm mb-6 leading-relaxed">
                  Your 14-day free trial or active subscription has expired. Upgrade your plan to resume your campaigns, connect domains, and land in the inbox.
                </p>

                {/* Locked Features */}
                <div className="w-full bg-bg-300/50 rounded-2xl p-4 mb-6 border border-bg-300 text-left">
                  <p className="text-xs font-bold text-text-300 uppercase tracking-wider mb-2">Locked Features:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-text-200">
                      <IconCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
                      Campaign sending & follow-ups
                    </li>
                    <li className="flex items-center gap-2 text-sm text-text-200">
                      <IconCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
                      Domain & email account setup
                    </li>
                    <li className="flex items-center gap-2 text-sm text-text-200">
                      <IconCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
                      Warmup & reputational analytics
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="w-full space-y-3">
                  <button
                    onClick={() => router.push("/email/settings?tab=billing")}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    Upgrade Subscription
                    <IconArrowRight className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => logoutUser()}
                    className="w-full py-2.5 px-4 bg-transparent border border-bg-300 text-text-200 hover:text-red-500 text-sm font-semibold rounded-xl hover:bg-red-500/10 hover:border-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <IconLogout className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ConditionalLayout;
