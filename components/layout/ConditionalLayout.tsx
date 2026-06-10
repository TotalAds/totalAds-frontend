"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import EmailVerificationBanner from "@/components/common/EmailVerificationBanner";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import { IconMenu2 } from "@tabler/icons-react";

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
  const { state } = useAuthContext();
  const { isAuthenticated } = state;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Define paths that should not have navbar and footer
  const authPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/verify-email",
    "/email/unsubscribe",
    "/unsubscribe",
  ];

  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));
  const isSocialRoute = pathname.startsWith("/social");

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
            "thin-scrollbar min-w-0 flex-1",
            isSocialRoute
              ? "overflow-y-auto overflow-x-hidden md:overflow-auto"
              : "overflow-auto"
          )}
        >
          {/* Email Verification Banner - only show for authenticated users with unverified email */}
          {isAuthenticated && state.user && !state.user.emailVerified && (
            <div className="p-4">
              <EmailVerificationBanner variant="banner" />
            </div>
          )}
          {isSocialRoute && isAuthenticated ? (
            <SocialLimitShell>{children}</SocialLimitShell>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
};

export default ConditionalLayout;
