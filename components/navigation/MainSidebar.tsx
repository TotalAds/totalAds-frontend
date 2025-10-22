"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import { cn } from "@/utils/cn";
import {
  IconBook,
  IconChevronDown,
  IconChevronLeft,
  IconDashboard,
  IconKey,
  IconSparkles,
  IconTarget,
  IconWorldWww,
  IconX,
} from "@tabler/icons-react";

import GetLogo from "../common/getLogo";

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
  category?: "scraper" | "email" | "general";
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
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Email Service",
    "Lead Enhancement",
  ]);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "scraper",
    "email",
  ]);

  const navItems: NavItem[] = [
    // Lead Enhancement Section
    {
      name: "Enrichment",
      href: "",
      icon: <IconWorldWww className="w-5 h-5" />,
      badge: "AI",
      category: "scraper",
      subItems: [
        {
          name: "Dashboard",
          href: "/dashboard",
        },
        {
          name: "Lead Enhancement",
          href: "/lead-enhancement",
        },
        {
          name: "ICP Profiles",
          href: "/icp-profiles",
          isNew: true,
        },
        {
          name: "API Tokens",
          href: "/api-tokens",
        },
        {
          name: "Docs",
          href: "/docs",
        },
      ],
    },
    // Email Service Section
    {
      name: "Email Service",
      href: "",
      icon: <IconSparkles className="w-5 h-5" />,
      badge: "NEW",
      category: "email",
      subItems: [
        {
          name: "Dashboard",
          href: "/email/dashboard",
        },
        {
          name: "Domains",
          href: "/email/domains",
        },
        {
          name: "Campaigns",
          href: "/email/campaigns",
        },
        {
          name: "Credits",
          href: "/email/credits",
        },
      ],
    },
  ];

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // Group items by category
  const scraperItems = navItems.filter((item) => item.category === "scraper");
  const emailItems = navItems.filter((item) => item.category === "email");
  const generalItems = navItems.filter((item) => item.category === "general");

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
        data-tour="sidebar"
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
          <nav className="px-4 py-6 space-y-6 flex-1 overflow-y-auto thin-scrollbar">
            {/* Scraper Section */}
            {scraperItems.length > 0 && (
              <div className="space-y-2">
                <AnimatePresence>
                  {expandedSections.includes("scraper") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {scraperItems.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          (pathname.startsWith(item.href + "/") &&
                            !scraperItems.some(
                              (otherItem) =>
                                otherItem.href !== item.href &&
                                otherItem.href.startsWith(item.href + "/") &&
                                pathname === otherItem.href
                            ));
                        const hasSubItems =
                          item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedItems.includes(item.name);

                        return (
                          <div key={item.name}>
                            {hasSubItems ? (
                              <button
                                onClick={() => toggleExpanded(item.name)}
                                className={cn(
                                  "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                                  isActive
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "text-gray-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border hover:border-blue-500/20"
                                )}
                              >
                                <div className="flex items-center">
                                  <span
                                    className={cn(
                                      "mr-3 transition-colors duration-200",
                                      isActive
                                        ? "text-blue-300"
                                        : "text-gray-500 group-hover:text-blue-300"
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
                                          : "bg-yellow-500/20 text-yellow-300"
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <motion.div
                                  animate={{
                                    rotate: isExpanded ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <IconChevronDown className="w-3 h-3" />
                                </motion.div>
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                                  isActive
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "text-gray-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border hover:border-blue-500/20"
                                )}
                                onClick={() => {
                                  if (window.innerWidth < 768) {
                                    onClose();
                                  }
                                }}
                              >
                                <span
                                  className={cn(
                                    "mr-3 transition-colors duration-200",
                                    isActive
                                      ? "text-blue-300"
                                      : "text-gray-500 group-hover:text-blue-300"
                                  )}
                                >
                                  {item.icon}
                                </span>
                                <span className="flex-1">{item.name}</span>
                              </Link>
                            )}
                            {hasSubItems && isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1 overflow-hidden pl-4"
                              >
                                {item.subItems!.map((subItem) => {
                                  const isSubActive = pathname === subItem.href;
                                  return (
                                    <Link
                                      key={subItem.name}
                                      href={subItem.href}
                                      className={cn(
                                        "flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 group",
                                        isSubActive
                                          ? "bg-blue-500/30 text-blue-200 border border-blue-500/40"
                                          : "text-gray-400 hover:bg-blue-500/10 hover:text-blue-300"
                                      )}
                                      onClick={() => {
                                        if (window.innerWidth < 768) {
                                          onClose();
                                        }
                                      }}
                                    >
                                      <span className="flex-1">
                                        {subItem.name}
                                      </span>
                                      {subItem.isNew && (
                                        <motion.span
                                          animate={{ scale: [1, 1.1, 1] }}
                                          transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                          }}
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
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Email Service Section */}
            {emailItems.length > 0 && (
              <div className="space-y-2">
                <AnimatePresence>
                  {expandedSections.includes("email") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {emailItems.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          (pathname.startsWith(item.href + "/") &&
                            !emailItems.some(
                              (otherItem) =>
                                otherItem.href !== item.href &&
                                otherItem.href.startsWith(item.href + "/") &&
                                pathname === otherItem.href
                            ));
                        const hasSubItems =
                          item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedItems.includes(item.name);

                        return (
                          <div key={item.name}>
                            {hasSubItems ? (
                              <button
                                onClick={() => toggleExpanded(item.name)}
                                className={cn(
                                  "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                                  isActive
                                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                                    : "text-gray-400 hover:bg-pink-500/10 hover:text-pink-300 hover:border hover:border-pink-500/20"
                                )}
                              >
                                <div className="flex items-center">
                                  <span
                                    className={cn(
                                      "mr-3 transition-colors duration-200",
                                      isActive
                                        ? "text-pink-300"
                                        : "text-gray-500 group-hover:text-pink-300"
                                    )}
                                  >
                                    {item.icon}
                                  </span>
                                  <span>{item.name}</span>
                                  {item.badge && (
                                    <span
                                      className={cn(
                                        "ml-2 px-2 py-0.5 text-xs font-semibold rounded-full",
                                        item.badge === "NEW"
                                          ? "bg-pink-500/20 text-pink-300"
                                          : "bg-yellow-500/20 text-yellow-300"
                                      )}
                                    >
                                      {item.badge}
                                    </span>
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
                                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                                  isActive
                                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                                    : "text-gray-400 hover:bg-pink-500/10 hover:text-pink-300 hover:border hover:border-pink-500/20"
                                )}
                                onClick={() => {
                                  if (window.innerWidth < 768) {
                                    onClose();
                                  }
                                }}
                              >
                                <span
                                  className={cn(
                                    "mr-3 transition-colors duration-200",
                                    isActive
                                      ? "text-pink-300"
                                      : "text-gray-500 group-hover:text-pink-300"
                                  )}
                                >
                                  {item.icon}
                                </span>
                                <span className="flex-1">{item.name}</span>
                                {item.badge && (
                                  <span
                                    className={cn(
                                      "ml-2 px-2 py-0.5 text-xs font-semibold rounded-full",
                                      item.badge === "NEW"
                                        ? "bg-pink-500/20 text-pink-300"
                                        : "bg-yellow-500/20 text-yellow-300"
                                    )}
                                  >
                                    {item.badge}
                                  </span>
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
                                    const isSubActive =
                                      pathname === subItem.href;
                                    return (
                                      <Link
                                        key={subItem.name}
                                        href={subItem.href}
                                        className={cn(
                                          "flex items-center px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group",
                                          isSubActive
                                            ? "bg-pink-500/20 text-pink-300"
                                            : "text-gray-400 hover:bg-pink-500/10 hover:text-pink-300"
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
                                              ? "bg-pink-400"
                                              : "bg-gray-500 group-hover:bg-pink-400"
                                          )}
                                        ></span>
                                        <span className="flex-1">
                                          {subItem.name}
                                        </span>
                                      </Link>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-white/10 mt-auto">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>© 2025 LeadSnipper</span>
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
