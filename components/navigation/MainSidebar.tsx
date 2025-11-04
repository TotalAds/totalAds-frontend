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
  IconWorld,
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
  ]);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "scraper",
    "email",
  ]);

  const navItems: NavItem[] = [
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
          name: "Campaigns",
          href: "/email/campaigns",
        },
        {
          name: "Leads",
          href: "/email/leads",
        },
        {
          name: "Domains",
          href: "/email/domains",
        },
        {
          name: "Warmup",
          href: "/email/warmup/accounts",
          badge: "BETA",
        },
        {
          name: "Pricing & Plans",
          href: "/email/pricing",
        },
        {
          name: "Settings",
          href: "/email/settings",
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
          "w-64 backdrop-blur-xl bg-bg-200 border-r border-brand-main/20 transition-all duration-300 ease-in-out shadow-xl flex-shrink-0",
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
              className="p-2 rounded-xl text-text-200 hover:bg-brand-main/10 hover:text-brand-main transition-colors duration-200"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          {/* Header with brand */}
          <div className="px-6 py-6 border-b border-brand-main/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-brand-main rounded-lg flex items-center justify-center">
                  <GetLogo className="w-5 h-5 text-text-100" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-100">
                    Leadsnipper
                  </h2>
                  <p className="text-xs text-text-200">AI-Powered</p>
                </div>
              </div>
              {onToggle && (
                <button
                  onClick={onToggle}
                  className="hidden md:flex p-1.5 rounded-lg text-text-200 hover:bg-brand-main/10 hover:text-brand-main transition-colors duration-200"
                  title="Collapse sidebar"
                >
                  <IconChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-6 flex-1 overflow-y-auto thin-scrollbar">
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
                          pathname.includes(item.href) ||
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
                                    ? "bg-brand-main/20 text-brand-main border border-brand-main/30"
                                    : "text-text-200 hover:bg-brand-main/10 hover:text-brand-main hover:border hover:border-brand-main/20"
                                )}
                              >
                                <div className="flex items-center">
                                  <span
                                    className={cn(
                                      "mr-3 transition-colors duration-200",
                                      isActive
                                        ? "text-brand-main"
                                        : "text-text-200 group-hover:text-brand-main"
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
                                          ? "bg-brand-main/20 text-brand-main"
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
                                    ? "bg-brand-main/20 text-brand-main border border-brand-main/30"
                                    : "text-text-200 hover:bg-brand-main/10 hover:text-brand-main hover:border hover:border-brand-main/20"
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
                                      ? "text-brand-main"
                                      : "text-text-200 group-hover:text-brand-main"
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
                                        ? "bg-brand-main/20 text-brand-main"
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
                                    const isSubActive = pathname.includes(
                                      subItem.href
                                    );
                                    return (
                                      <Link
                                        key={subItem.name}
                                        href={subItem.href}
                                        className={cn(
                                          "flex items-center px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group",
                                          isSubActive
                                            ? "bg-brand-main/20 text-brand-main"
                                            : "text-text-200 hover:bg-brand-main/10 hover:text-brand-main"
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
                                              ? "bg-brand-main"
                                              : "bg-text-200 group-hover:bg-brand-main"
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
          <div className="px-4 py-4 border-t border-brand-main/10 mt-auto">
            <div className="flex items-center justify-between text-xs text-text-200">
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
