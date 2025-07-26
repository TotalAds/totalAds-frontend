"use client";

import { usePathname } from "next/navigation";
import React from "react";

import TopNav from "@/components/navigation/TopNav";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  // Define paths that should not have navbar and footer
  const authPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
  ];

  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));

  if (isAuthPage) {
    // Return children without navbar and footer for auth pages
    return <>{children}</>;
  }

  // Return children with navbar and footer for other pages
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-grow">{children}</main>
      <footer className="backdrop-blur-xl bg-slate-900/80 border-t border-white/10 text-white py-8 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold">Leadsnipper</span>
          </div>
          <p className="text-gray-300">
            © {new Date().getFullYear()} Leadsnipper. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Powerful website scraping and data extraction platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ConditionalLayout;
