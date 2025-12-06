"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import EmailVerificationBanner from "@/components/common/EmailVerificationBanner";
import { useAuthContext } from "@/context/AuthContext";
import { IconMenu2 } from "@tabler/icons-react";

// Dynamically import components that pull in framer-motion to avoid SSR vendor-chunk issues
const MainSidebar = dynamic(
  () => import("@/components/navigation/MainSidebar"),
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
    <div className="h-screen flex bg-bg-100">
      {/* Sidebar */}
      {isAuthenticated && (
        <MainSidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          onToggle={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header - Only visible on mobile when sidebar is closed */}
        {isAuthenticated && !isSidebarOpen && (
          <div className="md:hidden flex items-center px-4 py-3 bg-bg-200 border-b border-gray-200">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-text-200 hover:bg-gray-100 transition-colors"
            >
              <IconMenu2 className="h-6 w-6" />
            </button>
            <span className="ml-3 font-semibold text-text-100">
              Leadsnipper
            </span>
          </div>
        )}

        <main className="flex-1 overflow-auto thin-scrollbar">
          {/* Email Verification Banner - only show for authenticated users with unverified email */}
          {isAuthenticated && state.user && !state.user.emailVerified && (
            <div className="p-4">
              <EmailVerificationBanner variant="banner" />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default ConditionalLayout;
