"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { getSubscriptionInfo, SubscriptionInfo } from "@/utils/api/emailClient";
import { getSocialAccess } from "@/utils/api/socialClient";
import { cn } from "@/utils/cn";
import {
  IconBrain,
  IconBrandLinkedin,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconFlame,
  IconGift,
  IconLayoutDashboard,
  IconLogout,
  IconMail,
  IconSettings,
  IconUsers,
  IconWorld,
  IconX,
} from "@tabler/icons-react";

import GetLogo from "../common/getLogo";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "green" | "yellow" | "blue";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface MainSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
}

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
const HOVER_COLLAPSE_MS = 220;

const MainSidebar: React.FC<MainSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { state, logoutUser } = useAuthContext();
  const { user } = state;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const hoverCollapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [linkedinExternalUrl, setLinkedinExternalUrl] = useState<string>(
    "https://www.linkedin.com/feed/"
  );

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  // Fetch subscription info for plan display
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const info = await getSubscriptionInfo();
        setSubscriptionInfo(info);
      } catch (error) {
        // Silently fail - subscription info is optional
        console.error("Failed to fetch subscription info:", error);
      }
    };
    if (state.isAuthenticated) {
      fetchSubscription();
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    const loadSocial = async () => {
      if (!state.isAuthenticated || !user?.socialLinkedinConnected) return;
      try {
        const access = await getSocialAccess();
        if (access.linkedinExternalUrl) {
          setLinkedinExternalUrl(access.linkedinExternalUrl);
        }
      } catch {
        // Keep default external URL fallback
      }
    };
    loadSocial();
  }, [state.isAuthenticated, user?.socialLinkedinConnected]);

  // Toggle collapsed state and persist to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
    if (!newState) {
      setIsHoverExpanded(false);
    }
  };

  const clearHoverCollapseTimer = () => {
    if (hoverCollapseTimer.current) {
      clearTimeout(hoverCollapseTimer.current);
      hoverCollapseTimer.current = null;
    }
  };

  useEffect(() => () => clearHoverCollapseTimer(), []);

  /** Desktop: when icon-only (collapsed), hover temporarily expands labels + width */
  const showExpandedChrome = !isCollapsed || isHoverExpanded;

  const handleSidebarPointerEnter = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    clearHoverCollapseTimer();
    if (isCollapsed) {
      setIsHoverExpanded(true);
    }
  };

  const handleSidebarPointerLeave = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    if (!isCollapsed) return;
    clearHoverCollapseTimer();
    hoverCollapseTimer.current = setTimeout(() => {
      setIsHoverExpanded(false);
      hoverCollapseTimer.current = null;
    }, HOVER_COLLAPSE_MS);
  };

  // Navigation sections — AI Knowledge only for admin `userType`
  const navSections: NavSection[] = useMemo(() => {
    const emailItems: NavItem[] = [
      {
        name: "Dashboard",
        href: "/email/dashboard",
        icon: <IconLayoutDashboard className="w-5 h-5" />,
      },
      {
        name: "Campaigns",
        href: "/email/campaigns",
        icon: <IconMail className="w-5 h-5" />,
      },
      {
        name: "Leads",
        href: "/email/leads",
        icon: <IconUsers className="w-5 h-5" />,
      },
      {
        name: "Domains",
        href: "/email/domains",
        icon: <IconWorld className="w-5 h-5" />,
      },
    ];
    // if (user?.userType === "admin") {
    //   emailItems.push({
    //     name: "AI Knowledge",
    //     href: "/email/admin/knowledge",
    //     icon: <IconBrain className="w-5 h-5" />,
    //     badge: "Admin",
    //     badgeColor: "blue",
    //   });
    // }
    if (user?.socialLinkedinConnected) {
      emailItems.push({
        name: "LinkedIn",
        href: "/social/dashboard",
        icon: <IconBrandLinkedin className="w-5 h-5" />,
        badge: "LIVE",
        badgeColor: "green",
      });
    }

    return [
      {
        title: "EMAIL",
        items: emailItems,
      },
      {
        title: "SUPPORT",
        items: [
          {
            name: "Settings",
            href: "/email/settings",
            icon: <IconSettings className="w-5 h-5" />,
          },
          {
            name: "Affiliate",
            href: "/email/affiliate",
            icon: <IconGift className="w-5 h-5" />,
            badge: "NEW",
            badgeColor: "green",
          },
          {
            name: "Pricing & Plans",
            href: "/email/pricing",
            icon: <IconCreditCard className="w-5 h-5" />,
          },
        ],
      },
    ];
  }, [user?.userType, user?.socialLinkedinConnected, linkedinExternalUrl]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const getBadgeClasses = (color?: "green" | "yellow" | "blue") => {
    switch (color) {
      case "green":
        return "bg-green-500/20 text-green-400";
      case "yellow":
        return "bg-yellow-500/20 text-yellow-400";
      case "blue":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-blue-500/20 text-blue-400";
    }
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

      {/* Flex spacer (desktop) keeps a narrow gutter when collapsed; panel overflows on hover */}
      <div
        className={cn(
          "relative h-screen w-0 shrink-0 overflow-visible transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
          isCollapsed ? "md:w-[72px]" : "md:w-64"
        )}
      >
        <div
          data-tour="sidebar"
          onPointerEnter={handleSidebarPointerEnter}
          onPointerLeave={handleSidebarPointerLeave}
          className={cn(
            "bg-sidebar overflow-x-hidden shadow-xl",
            "fixed left-0 top-0 z-[45] h-screen w-64 transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none md:absolute md:left-0 md:top-0 md:z-[45]",
            isCollapsed && !isHoverExpanded ? "md:w-[72px]" : "md:w-64",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
        {/* Sidebar Content */}
        <div className="flex h-full flex-col">
          {/* Header - Company Logo with Collapse Toggle */}
          <div
            className={cn(
              "py-5 border-b border-sidebar-border",
              showExpandedChrome ? "px-4" : "px-3"
            )}
          >
            <div className="flex items-center justify-between">
              <Link
                href="/email/dashboard"
                className={cn(
                  "flex items-center",
                  showExpandedChrome ? "space-x-3" : "w-full justify-center"
                )}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                  <GetLogo className="h-8 w-8" color="#3b82f6" />
                </div>
                {showExpandedChrome && (
                  <div className="overflow-hidden">
                    <h1 className="whitespace-nowrap text-base font-bold text-sidebar-text">
                      Leadsnipper
                    </h1>
                    <p className="whitespace-nowrap text-xs text-sidebar-muted">
                      Email Marketing
                    </p>
                  </div>
                )}
              </Link>

              {showExpandedChrome && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleCollapse();
                  }}
                  className="ml-2 hidden h-8 w-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text md:flex"
                  title="Collapse sidebar"
                >
                  <IconChevronLeft className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Expand control when icon-only (no hover); hover still expands without this row */}
            {!showExpandedChrome && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleCollapse();
                }}
                className="mt-3 hidden w-full items-center justify-center rounded-md py-2 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text md:flex"
                title="Expand sidebar (pinned)"
              >
                <IconChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text transition-colors"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav
            className={cn(
              "sidebar-scrollbar no-scrollbar flex-1 overflow-y-auto py-4",
              showExpandedChrome ? "px-3" : "px-2"
            )}
          >
            {navSections.map((section, sectionIndex) => (
              <div key={section.title} className="mb-6">
                {showExpandedChrome && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted whitespace-nowrap">
                    {section.title}
                  </h3>
                )}
                {!showExpandedChrome && sectionIndex > 0 && (
                  <div className="mx-2 mb-3 border-t border-sidebar-border" />
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/email/dashboard" &&
                        pathname.startsWith(item.href));

                    const isExternal = item.href.startsWith("http");
                    const commonClass = cn(
                      "group relative flex items-center py-2.5 text-sm font-medium transition-all duration-200",
                      showExpandedChrome
                        ? "rounded-lg px-3"
                        : "justify-center rounded-lg px-0",
                      isActive
                        ? "bg-brand-main text-white shadow-md"
                        : "text-sidebar-text hover:bg-sidebar-hover"
                    );

                    return isExternal ? (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            onClose();
                          }
                        }}
                        title={!showExpandedChrome ? item.name : undefined}
                        className={commonClass}
                      >
                        <span
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            showExpandedChrome && "mr-3",
                            isActive
                              ? "text-white"
                              : "text-sidebar-muted group-hover:text-sidebar-text"
                          )}
                        >
                          {item.icon}
                        </span>
                        {showExpandedChrome && (
                          <>
                            <span className="flex-1 overflow-hidden whitespace-nowrap">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                                  getBadgeClasses(item.badgeColor)
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {!showExpandedChrome && item.badge && (
                          <span
                            className={cn(
                              "absolute top-1 right-1 w-2 h-2 rounded-full",
                              item.badgeColor === "green"
                                ? "bg-green-400"
                                : item.badgeColor === "yellow"
                                ? "bg-yellow-400"
                                : "bg-blue-400"
                            )}
                          />
                        )}
                      </a>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            onClose();
                          }
                        }}
                        title={!showExpandedChrome ? item.name : undefined}
                        className={commonClass}
                      >
                        <span
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            showExpandedChrome && "mr-3",
                            isActive
                              ? "text-white"
                              : "text-sidebar-muted group-hover:text-sidebar-text"
                          )}
                        >
                          {item.icon}
                        </span>
                        {showExpandedChrome && (
                          <>
                            <span className="flex-1 overflow-hidden whitespace-nowrap">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                                  getBadgeClasses(item.badgeColor)
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {!showExpandedChrome && item.badge && (
                          <span
                            className={cn(
                              "absolute top-1 right-1 h-2 w-2 rounded-full",
                              item.badgeColor === "green"
                                ? "bg-green-400"
                                : item.badgeColor === "yellow"
                                ? "bg-yellow-400"
                                : "bg-blue-400"
                            )}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Section */}
          <div
            className={cn(
              "mt-auto border-t border-sidebar-border py-4",
              showExpandedChrome ? "px-3" : "px-2"
            )}
          >
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={!showExpandedChrome ? user?.name || "User" : undefined}
                className={cn(
                  "flex w-full items-center rounded-lg py-2.5 transition-colors hover:bg-sidebar-hover",
                  showExpandedChrome ? "px-3" : "justify-center px-0"
                )}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-main text-sm font-semibold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                {showExpandedChrome && (
                  <>
                    <div className="ml-3 flex-1 text-left overflow-hidden">
                      <p className="text-sm flex gap-1 items-center font-medium text-sidebar-text truncate">
                        {(user?.name.length && user?.name.length <= 10
                          ? user?.name
                          : user?.name.slice(0, 8) + "...") || "User"}{" "}
                        <div>
                          {subscriptionInfo?.tierDisplayName && (
                            <p className="text-[10px] text-sidebar-muted/80 bg-amber-200/80 px-1 flex w-max rounded-full truncate mt-0.5 text-black">
                              {subscriptionInfo.tierDisplayName}
                            </p>
                          )}
                        </div>
                      </p>
                      <p className="text-xs text-sidebar-muted truncate">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                    <IconChevronDown
                      className={cn(
                        "w-4 h-4 text-sidebar-muted transition-transform flex-shrink-0",
                        isUserMenuOpen && "rotate-180"
                      )}
                    />
                  </>
                )}
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute bottom-full mb-2 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-hover shadow-lg",
                      !showExpandedChrome
                        ? "bottom-0 left-full mb-0 ml-2 min-w-[180px]"
                        : "left-0 right-0"
                    )}
                  >
                    <Link
                      href="/email/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center px-4 py-3 text-sm text-sidebar-text hover:bg-sidebar-border transition-colors whitespace-nowrap border-b border-sidebar-border/50"
                    >
                      <IconSettings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-sidebar-text hover:bg-red-500/10 hover:text-red-400 transition-colors whitespace-nowrap"
                    >
                      <IconLogout className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default MainSidebar;
