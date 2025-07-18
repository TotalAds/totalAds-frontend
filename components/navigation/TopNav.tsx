"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import GetLogo from "@/components/common/getLogo";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import { IconChevronDown, IconMenu2, IconX } from "@tabler/icons-react";

const TopNav: React.FC = () => {
  const pathname = usePathname();
  const { state, logoutUser } = useAuthContext();
  const { isAuthenticated, user } = state;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const handleLogout = async () => {
    await logoutUser();
  };

  const navItems = isAuthenticated
    ? [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Scraper", href: "/scraper" },
        { name: "API Tokens", href: "/api-tokens" },
        { name: "History", href: "/scraper/history" },
        { name: "Analytics", href: "/analytics" },
        { name: "Billing", href: "/billing" },
        { name: "API Docs", href: "/docs" },
        { name: "Profile", href: "/profile" },
      ]
    : [];

  return (
    <header className="backdrop-blur-xl bg-slate-900/90 border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-200">
                <GetLogo className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Leadsnipper</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                    pathname === item.href
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative ml-4">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 p-2 hover:bg-white/10 transition-colors duration-200"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="ml-3 text-sm font-medium text-white">
                    {user?.name || "User"}
                  </span>
                  <IconChevronDown className="ml-1 h-4 w-4 text-text-200" />
                </button>

                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      <Link
                        href="/settings/account"
                        className="block px-4 py-2 text-sm text-text hover:bg-bg-50"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/settings/api-tokens"
                        className="block px-4 py-2 text-sm text-text hover:bg-bg-50"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        API Tokens
                      </Link>
                      <Link
                        href="/settings/billing"
                        className="block px-4 py-2 text-sm text-text hover:bg-bg-50"
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
                        className="block w-full text-left px-4 py-2 text-sm text-text hover:bg-bg-50"
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
                  className="px-4 py-2 text-sm font-medium text-text-200 hover:text-primary-600"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-400 hover:text-text-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">
                {isMenuOpen ? "Close main menu" : "Open main menu"}
              </span>
              {isMenuOpen ? (
                <IconX className="block h-6 w-6" />
              ) : (
                <IconMenu2 className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  pathname === item.href
                    ? "bg-bg-100 text-primary-600"
                    : "text-text-200 hover:bg-bg-100 hover:text-primary-600"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-4 flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-text">
                    {user?.name || "User"}
                  </div>
                  <div className="text-sm font-medium text-text-200">
                    {user?.email || ""}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  href="/settings/account"
                  className="block px-3 py-2 rounded-md text-base font-medium text-text-200 hover:text-text hover:bg-bg-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  href="/settings/api-tokens"
                  className="block px-3 py-2 rounded-md text-base font-medium text-text-200 hover:text-text hover:bg-bg-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  API Tokens
                </Link>
                <Link
                  href="/settings/billing"
                  className="block px-3 py-2 rounded-md text-base font-medium text-text-200 hover:text-text hover:bg-bg-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Billing
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-text-200 hover:text-text hover:bg-bg-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200 px-4 flex flex-col space-y-2">
              <Link
                href="/login"
                className="block w-full py-2 text-center text-base font-medium text-text-200 hover:text-text border border-bg-200 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="block w-full py-2 text-center text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default TopNav;
