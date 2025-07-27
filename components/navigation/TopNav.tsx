"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import GetLogo from "@/components/common/getLogo";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import {
  IconChevronDown,
  IconMenu2,
  IconMenuDeep,
  IconX,
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

  return (
    <header className="backdrop-blur-xl bg-slate-900/90 border-b border-white/10 flex-shrink-0 z-50">
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
                    ? "text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 hover:text-purple-300"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
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
            <Link href="/" className="flex items-center group">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-200">
                <GetLogo className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Leadsnipper</span>
            </Link>
          </div>

          {/* Right side - User Menu or Auth Links */}
          <div className="flex items-center space-x-6">
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 p-2 hover:bg-white/10 transition-colors duration-200"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="ml-3 text-sm font-medium text-white hidden md:block">
                    {user?.name || "User"}
                  </span>
                  <IconChevronDown className="ml-1 h-4 w-4 text-gray-300 hidden md:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg backdrop-blur-xl bg-slate-900/90 border border-white/10 ring-1 ring-black ring-opacity-5">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      <Link
                        href="/settings/account"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/settings/api-tokens"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        API Tokens
                      </Link>
                      <Link
                        href="/settings/billing"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Billing
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
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
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600"
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
