"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { getSubscriptionInfo, SubscriptionInfo } from "@/utils/api/emailClient";
import { cn } from "@/utils/cn";
import {
  IconBrain,
  IconChartBar,
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

const MainSidebar: React.FC<MainSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { state, logoutUser } = useAuthContext();
  const { user } = state;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);

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

  // Toggle collapsed state and persist to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
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
    if (user?.userType === "admin") {
      emailItems.push({
        name: "AI Knowledge",
        href: "/email/admin/knowledge",
        icon: <IconBrain className="w-5 h-5" />,
        badge: "Admin",
        badgeColor: "blue",
      });
    }
    return [
      {
        title: "EMAIL",
        items: emailItems,
      },
    // {
   //   title: "WHATSAPP",
    //   items: [
    //     {
    //       name: "Dashboard",
    //       href: "/whatsapp/dashboard",
    //       icon: <IconLayoutDashboard className="w-5 h-5" />,
    //     },
    //     {
    //       name: "Campaigns",
    //       href: "/whatsapp/campaigns",
    //       icon: <IconMail className="w-5 h-5" />,
    //     },
    //     {
    //       name: "Templates",
    //       href: "/whatsapp/templates",
    //       icon: <IconMail className="w-5 h-5" />,
    //     },
    //     {
    //       name: "Contacts",
    //       href: "/whatsapp/contacts",
    //       icon: <IconUsers className="w-5 h-5" />,
    //     },
    //     {
    //       name: "Chat",
    //       href: "/whatsapp/chat",
    //       icon: <IconUsers className="w-5 h-5" />,
    //     },
    //   ],
    // },
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
  }, [user?.userType]);

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

      {/* Sidebar - Dark Navy Theme */}
      <div
        data-tour="sidebar"
        className={cn(
          "bg-sidebar transition-all duration-300 ease-in-out shadow-xl flex-shrink-0",
          // Width based on collapsed state (desktop only)
          isCollapsed ? "md:w-[72px]" : "w-64",
          // Mobile behavior: fixed overlay, always full width
          "fixed left-0 top-0 h-screen z-40 md:relative w-64",
          // Show/hide behavior
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {/* Header - Company Logo with Collapse Toggle */}
          <div
            className={cn(
              "py-5 border-b border-sidebar-border",
              isCollapsed ? "px-3" : "px-4"
            )}
          >
            <div className="flex items-center justify-between">
              <Link
                href="/email/dashboard"
                className={cn(
                  "flex items-center",
                  isCollapsed ? "justify-center w-full" : "space-x-3"
                )}
              >
                {/* Show only icon when collapsed */}
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <GetLogo className="w-8 h-8" color="#3b82f6" />
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <h1 className="text-base font-bold text-sidebar-text whitespace-nowrap">
                      Leadsnipper
                    </h1>
                    <p className="text-xs text-sidebar-muted whitespace-nowrap">
                      Email Marketing
                    </p>
                  </div>
                )}
              </Link>

              {/* Desktop Collapse Toggle Button - visible inside sidebar */}
              {!isCollapsed && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleCollapse();
                  }}
                  className="hidden md:flex items-center justify-center w-8 h-8 rounded-md text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors ml-2"
                  title="Collapse sidebar"
                >
                  <IconChevronLeft className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Expand button when collapsed - below logo */}
            {isCollapsed && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleCollapse();
                }}
                className="hidden md:flex w-full items-center justify-center mt-3 py-2 rounded-md text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors"
                title="Expand sidebar"
              >
                <IconChevronRight className="w-5 h-5" />
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
              "flex-1 py-4 overflow-y-auto sidebar-scrollbar no-scrollbar",
              isCollapsed ? "px-2" : "px-3"
            )}
          >
            {navSections.map((section) => (
              <div key={section.title} className="mb-6">
                {/* Section title - hidden when collapsed */}
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-muted tracking-wider whitespace-nowrap">
                    {section.title}
                  </h3>
                )}
                {/* Divider line when collapsed */}
                {isCollapsed && (
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
                          if (window.innerWidth < 768) {
                            onClose();
                          }
                        }}
                        title={isCollapsed ? item.name : undefined}
                        className={cn(
                          "flex items-center py-2.5 text-sm font-medium transition-all duration-200 group relative",
                          isCollapsed
                            ? "px-0 justify-center rounded-lg"
                            : "px-3 rounded-lg",
                          isActive
                            ? "bg-brand-main text-white shadow-md"
                            : "text-sidebar-text hover:bg-sidebar-hover"
                        )}
                      >
                        <span
                          className={cn(
                            "transition-colors flex-shrink-0",
                            !isCollapsed && "mr-3",
                            isActive
                              ? "text-white"
                              : "text-sidebar-muted group-hover:text-sidebar-text"
                          )}
                        >
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 whitespace-nowrap overflow-hidden">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "px-2 py-0.5 text-xs font-semibold rounded-full",
                                  getBadgeClasses(item.badgeColor)
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {/* Badge indicator dot when collapsed */}
                        {isCollapsed && item.badge && (
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
              "py-4 border-t border-sidebar-border mt-auto",
              isCollapsed ? "px-2" : "px-3"
            )}
          >
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={isCollapsed ? user?.name || "User" : undefined}
                className={cn(
                  "w-full flex items-center py-2.5 rounded-lg hover:bg-sidebar-hover transition-colors",
                  isCollapsed ? "px-0 justify-center" : "px-3"
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-brand-main flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                {!isCollapsed && (
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
                      "absolute bottom-full mb-2 bg-sidebar-hover rounded-lg shadow-lg border border-sidebar-border overflow-hidden",
                      isCollapsed
                        ? "left-full ml-2 bottom-0 mb-0 min-w-[180px]"
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
    </>
  );
};

export default MainSidebar;
