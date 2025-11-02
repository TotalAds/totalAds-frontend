"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import EmailVerificationBanner from "@/components/common/EmailVerificationBanner";
import TopNav from "@/components/navigation/TopNav";
import { useAuthContext } from "@/context/AuthContext";

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
    // Return children without navbar and footer for auth pages
    return <>{children}</>;
  }

  // Return children with navbar and footer for other pages
  return (
    <div className="h-screen flex flex-col">
      <TopNav onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
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
          <main className="flex-1 overflow-auto thin-scrollbar">
            {/* Email Verification Banner - only show for authenticated users with unverified email */}
            {isAuthenticated && state.user && !state.user.emailVerified && (
              <div className="p-4">
                <EmailVerificationBanner variant="banner" />
              </div>
            )}
            {children}
          </main>

          {/* Footer */}
          {/* <footer className="backdrop-blur-xl bg-slate-900/80 border-t border-white/10 text-white py-3 text-center">
            <div className="container mx-auto px-4">
              <p className="text-gray-300 text-sm">
                © {new Date().getFullYear()} Leadsnipper. All rights reserved.
              </p>
            </div>
          </footer> */}
        </div>
      </div>
    </div>
  );
};

export default ConditionalLayout;
