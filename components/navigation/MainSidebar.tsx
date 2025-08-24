"use client";

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { cn } from '@/utils/cn';
import {
    IconBook, IconBrain, IconChartBar, IconChevronDown, IconChevronLeft, IconCreditCard,
    IconDashboard, IconHistory, IconKey, IconSparkles, IconTarget, IconUser, IconWorldWww, IconX
} from '@tabler/icons-react';

import GetLogo from '../common/getLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  isNew?: boolean;
  subItems?: {
    name: string;
    href: string;
    badge?: string;
    isNew?: boolean;
  }[];
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
  const [expandedItems, setExpandedItems] = useState<string[]>(["API Docs"]);

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <IconDashboard className="w-5 h-5" />,
    },
    {
      name: "Sales Intelligence",
      href: "/scraper",
      icon: <IconWorldWww className="w-5 h-5" />,
      badge: "AI",
    },
    {
      name: "ICP Profiles",
      href: "/icp-profiles",
      icon: <IconTarget className="w-5 h-5" />,
      isNew: true,
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
      name: "Docs",
      href: "/docs",
      icon: <IconBook className="w-5 h-5" />,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <IconUser className="w-5 h-5" />,
    },
  ];

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

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

          {/* Header with brand */}
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <GetLogo className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Leadsnipper</h2>
                  <p className="text-xs text-gray-400">AI-Powered</p>
                </div>
              </div>
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
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-2 flex-1 overflow-y-auto thin-scrollbar">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href + "/") &&
                  !navItems.some(
                    (otherItem) =>
                      otherItem.href !== item.href &&
                      otherItem.href.startsWith(item.href + "/") &&
                      pathname === otherItem.href
                  ));
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.name);

              return (
                <div key={item.name}>
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                          : "text-gray-300 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-white/5"
                      )}
                    >
                      <div className="flex items-center">
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
                        <span>{item.name}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "ml-2 px-2 py-0.5 text-xs font-semibold rounded-full",
                              item.badge === "AI"
                                ? "bg-green-500/20 text-green-300"
                                : item.badge === "Pro"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-blue-500/20 text-blue-300"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.isNew && (
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-300 rounded-full"
                          >
                            NEW
                          </motion.span>
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                  ) : (
                    <Link
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
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "ml-2 px-2 py-0.5 text-xs font-semibold rounded-full",
                            item.badge === "AI"
                              ? "bg-green-500/20 text-green-300"
                              : item.badge === "Pro"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-blue-500/20 text-blue-300"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.isNew && (
                        <motion.span
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-300 rounded-full"
                        >
                          NEW
                        </motion.span>
                      )}
                    </Link>
                  )}

                  {/* Sub-items */}
                  <AnimatePresence>
                    {hasSubItems && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 mt-2 space-y-1 overflow-hidden"
                      >
                        {item.subItems?.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={cn(
                                "flex items-center px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group",
                                isSubActive
                                  ? "bg-white/10 text-white shadow-sm"
                                  : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
                              )}
                              onClick={() => {
                                if (window.innerWidth < 768) {
                                  onClose();
                                }
                              }}
                            >
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full mr-3 transition-colors",
                                  isSubActive
                                    ? "bg-purple-400"
                                    : "bg-gray-500 group-hover:bg-gray-400"
                                )}
                              ></span>
                              <span className="flex-1">{subItem.name}</span>
                              {subItem.badge && (
                                <span
                                  className={cn(
                                    "ml-2 px-2 py-0.5 text-xs font-semibold rounded-full",
                                    subItem.badge === "AI"
                                      ? "bg-green-500/20 text-green-300"
                                      : subItem.badge === "Pro"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : "bg-blue-500/20 text-blue-300"
                                  )}
                                >
                                  {subItem.badge}
                                </span>
                              )}
                              {subItem.isNew && (
                                <motion.span
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-300 rounded-full"
                                >
                                  NEW
                                </motion.span>
                              )}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-white/10 mt-auto">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>© 2024 LeadSnipper</span>
              <span className="flex items-center space-x-1">
                <span>v1.0.0</span>
                <IconSparkles className="w-3 h-3 text-yellow-400" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainSidebar;
