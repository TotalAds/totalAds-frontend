"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useEmailProvider } from "@/hooks/useEmailProvider";
import { getSubscriptionInfo, SubscriptionInfo } from "@/utils/api/emailClient";
import { cn } from "@/utils/cn";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconLayoutDashboard,
  IconMail,
  IconSettings,
  IconUsers,
  IconWorld,
  IconX,
  IconBuilding,
  IconHelp,
} from "@tabler/icons-react";

import GetLogo from "../common/getLogo";
import SidebarUserFooter from "./SidebarUserFooter";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "green" | "yellow" | "blue";
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface MainSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
}

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
const HOVER_COLLAPSE_MS = 220;

/** LeadSnipper-only sidebar (email routes). SocialSnipper uses SocialSidebar. */
const MainSidebar: React.FC<MainSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { state } = useAuthContext();
  const { user } = state;
  const { canManageMembers } = useWorkspace();
  const { usesSesDomains: showDomainsNav } = useEmailProvider();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const hoverCollapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const emailSub = await getSubscriptionInfo();
        setSubscriptionInfo(emailSub);
      } catch (error) {
        console.error("Failed to fetch subscription info:", error);
      }
    };
    if (state.isAuthenticated) {
      fetchData();
    }
  }, [state.isAuthenticated]);

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

  const showExpandedChrome = !isCollapsed || isHoverExpanded;

  const navSections: NavSection[] = useMemo(() => {
    const sections: NavSection[] = [];

    if (user?.onboardingCompleted) {
      const mainItems = [
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
      ];

      if (showDomainsNav) {
        mainItems.push({
          name: "Domains",
          href: "/email/domains",
          icon: <IconWorld className="w-5 h-5" />,
        });
      }

      mainItems.push({
        name: "Sending Accounts",
        href: "/email/sending-accounts",
        icon: <IconMail className="w-5 h-5" />,
      });

      mainItems.push({
        name: "Pricing",
        href: "/email/pricing",
        icon: <IconCreditCard className="w-5 h-5" />,
      });

      if (canManageMembers) {
        mainItems.push({
          name: "Team & Workspaces",
          href: "/email/workspaces",
          icon: <IconBuilding className="w-5 h-5" />,
        });
      }

      sections.push({ items: mainItems });
    }

    const supportItems: NavItem[] = [
      {
        name: "Help",
        href: "/help",
        icon: <IconHelp className="w-5 h-5" />,
      },
      {
        name: "Settings",
        href: "/email/settings",
        icon: <IconSettings className="w-5 h-5" />,
      },
    ];

    sections.push({
      title: "Support",
      items: supportItems,
    });

    return sections;
  }, [user?.onboardingCompleted, showDomainsNav, canManageMembers]);

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
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "relative h-screen w-0 shrink-0 overflow-visible transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
          isCollapsed ? "md:w-[72px]" : "md:w-64"
        )}
      >
        <motion.div
          data-tour="sidebar"
          onPointerEnter={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) return;
            clearHoverCollapseTimer();
            if (isCollapsed) setIsHoverExpanded(true);
          }}
          onPointerLeave={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) return;
            if (!isCollapsed) return;
            clearHoverCollapseTimer();
            hoverCollapseTimer.current = setTimeout(() => {
              setIsHoverExpanded(false);
              hoverCollapseTimer.current = null;
            }, HOVER_COLLAPSE_MS);
          }}
          className={cn(
            "bg-sidebar overflow-x-hidden shadow-xl",
            "fixed left-0 top-0 z-[45] h-screen w-64 transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none md:absolute md:left-0 md:top-0 md:z-[45]",
            isCollapsed && !isHoverExpanded ? "md:w-[72px]" : "md:w-64",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col">
            <motion.div
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
                        LeadSnipper
                      </h1>
                      <p className="whitespace-nowrap text-xs text-sidebar-muted">
                        Email outbound
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
                  >
                    <IconChevronLeft className="h-5 w-5" />
                  </button>
                )}
              </div>

              {!showExpandedChrome && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleCollapse();
                  }}
                  className="mt-3 hidden w-full items-center justify-center rounded-md py-2 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text md:flex"
                >
                  <IconChevronRight className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={onClose}
                className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>

              {user?.onboardingCompleted && (
                <div className={cn("mt-4", !showExpandedChrome && "px-0")}>
                  <WorkspaceSwitcher
                    collapsed={!showExpandedChrome}
                    variant="sidebar"
                  />
                </div>
              )}
            </motion.div>

            <nav
              className={cn(
                "sidebar-scrollbar no-scrollbar flex-1 overflow-y-auto py-4",
                showExpandedChrome ? "px-3" : "px-2"
              )}
            >
              {navSections.map((section, sectionIndex) => (
                <div key={section.title ?? `section-${sectionIndex}`} className="mb-6">
                  {showExpandedChrome && section.title && (
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

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => {
                            if (window.innerWidth < 768) onClose();
                          }}
                          title={!showExpandedChrome ? item.name : undefined}
                          className={cn(
                            "group relative flex items-center py-2.5 text-sm font-medium transition-all duration-200",
                            showExpandedChrome
                              ? "rounded-lg px-3"
                              : "justify-center rounded-lg px-0",
                            isActive
                              ? "bg-brand-main text-white shadow-md"
                              : "text-sidebar-text hover:bg-sidebar-hover"
                          )}
                        >
                          <span className={cn("flex-shrink-0", showExpandedChrome && "mr-3")}>
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
                                    "rounded-full px-2 py-0.5 text-xs",
                                    getBadgeClasses(item.badgeColor)
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <SidebarUserFooter
              product="leadsnipper"
              planLabel={subscriptionInfo?.tierDisplayName || "Free Plan"}
              settingsHref="/email/settings"
              showExpandedChrome={showExpandedChrome}
              onCloseSidebar={onClose}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default MainSidebar;
