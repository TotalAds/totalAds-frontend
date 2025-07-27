"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { cn } from "@/utils/cn";
import {
  IconBook,
  IconChevronLeft,
  IconCreditCard,
  IconDashboard,
  IconHistory,
  IconKey,
  IconTarget,
  IconUser,
  IconWorldWww,
  IconX,
} from "@tabler/icons-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface MainSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
}) => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <IconDashboard className="w-5 h-5" />,
    },
    {
      name: "Scraper",
      href: "/scraper",
      icon: <IconWorldWww className="w-5 h-5" />,
    },
    {
      name: "ICP Profiles",
      href: "/icp-profiles",
      icon: <IconTarget className="w-5 h-5" />,
    },
    {
      name: "API Tokens",
      href: "/api-tokens",
      icon: <IconKey className="w-5 h-5" />,
    },
    {
      name: "History",
      href: "/scraper/history",
      icon: <IconHistory className="w-5 h-5" />,
    },
    {
      name: "Billing",
      href: "/billing",
      icon: <IconCreditCard className="w-5 h-5" />,
    },
    {
      name: "API Docs",
      href: "/docs",
      icon: <IconBook className="w-5 h-5" />,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <IconUser className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "w-64 backdrop-blur-xl bg-slate-900/95 border-r border-white/20 transition-all duration-300 ease-in-out shadow-2xl flex-shrink-0",
          // Mobile behavior: fixed overlay
          "fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 md:relative md:top-0 md:h-full",
          // Show/hide behavior
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop collapse behavior
          !isOpen && "md:w-0 md:border-r-0"
        )}
      >
        {/* Sidebar Content - only show when not collapsed */}
        <div className={cn("h-full flex flex-col", !isOpen && "md:hidden")}>
          {/* Mobile Close Button */}
          <div className="md:hidden flex justify-end p-4 pt-6">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          {/* Header with collapse button */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </h2>
            {onToggle && (
              <button
                onClick={onToggle}
                className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors duration-200"
                title="Collapse sidebar"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                      : "text-gray-300 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-white/5"
                  )}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                >
                  <span
                    className={cn(
                      "mr-3 transition-colors duration-200",
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-white"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className="text-xs text-gray-400 text-center">
              <p>© 2024 Leadsnipper</p>
              <p className="mt-1 opacity-60">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainSidebar;
