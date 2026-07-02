"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSocialAccess, SocialAccessResponse } from "@/utils/api/socialClient";
import { SOCIAL_SUBSCRIPTION_UPDATED_EVENT } from "@/utils/social/socialSubscriptionEvents";
import { cn } from "@/utils/cn";
import {
  IconBrandLinkedin,
  IconChevronDown,
  IconCreditCard,
  IconExternalLink,
  IconLogout,
  IconMail,
  IconSettings,
} from "@tabler/icons-react";

export type SidebarProduct = "leadsnipper" | "socialsnipper";

interface SidebarUserFooterProps {
  product: SidebarProduct;
  planLabel?: string;
  billingHref?: string;
  settingsHref: string;
  showExpandedChrome: boolean;
  onCloseSidebar?: () => void;
}

const CROSS_PRODUCT: Record<
  SidebarProduct,
  { name: string; href: string; icon: React.ReactNode }
> = {
  leadsnipper: {
    name: "SocialSnipper",
    href: "/social/dashboard",
    icon: <IconBrandLinkedin className="h-4 w-4 shrink-0" />,
  },
  socialsnipper: {
    name: "LeadSnipper",
    href: "/email/dashboard",
    icon: <IconMail className="h-4 w-4 shrink-0" />,
  },
};

const SidebarUserFooter: React.FC<SidebarUserFooterProps> = ({
  product,
  planLabel = "Free Plan",
  billingHref,
  settingsHref,
  showExpandedChrome,
  onCloseSidebar,
}) => {
  const router = useRouter();
  const { state, logoutUser } = useAuthContext();
  const { user } = state;
  const cross = CROSS_PRODUCT[product];
  const [socialAccess, setSocialAccess] = useState<SocialAccessResponse | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) return;

    const loadSocialAccess = () => {
      getSocialAccess()
        .then(setSocialAccess)
        .catch(() => setSocialAccess(null));
    };

    loadSocialAccess();
    window.addEventListener(SOCIAL_SUBSCRIPTION_UPDATED_EVENT, loadSocialAccess);
    return () => {
      window.removeEventListener(SOCIAL_SUBSCRIPTION_UPDATED_EVENT, loadSocialAccess);
    };
  }, [state.isAuthenticated]);

  const hasLeadSnipperAccess = Boolean(user?.onboardingCompleted);
  const hasSocialSnipperAccess = Boolean(
    user?.socialOnboardingCompleted && socialAccess?.enabled
  );

  const showCrossProductLink =
    product === "leadsnipper" ? false : hasLeadSnipperAccess;

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const closeMobileSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onCloseSidebar?.();
    }
  };

  return (
    <div className="shrink-0 border-t border-sidebar-border bg-sidebar-bg/90 p-3">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center rounded-xl border border-transparent px-3 py-2.5 text-left transition-all",
              "hover:border-sidebar-border/60 hover:bg-sidebar-hover",
              "data-[state=open]:border-sidebar-border data-[state=open]:bg-sidebar-hover",
              showExpandedChrome ? "" : "justify-center px-2"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-main/25 ring-2 ring-brand-main/30">
              <span className="text-sm font-semibold text-brand-main">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            {showExpandedChrome && (
              <>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-text">
                    {user?.name || "User"}
                  </p>
                  <p className="truncate text-xs text-sidebar-muted">{planLabel}</p>
            {billingHref && (
              <Link
                href={billingHref}
                onClick={closeMobileSidebar}
                className="mt-0.5 inline-block text-[11px] text-brand-main hover:underline"
              >
                Plan & billing →
              </Link>
            )}
                </div>
                <IconChevronDown className="ml-1 h-4 w-4 shrink-0 text-sidebar-muted" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={showExpandedChrome ? "top" : "right"}
          align={showExpandedChrome ? "start" : "end"}
          sideOffset={10}
          collisionPadding={12}
          className="z-[100] w-60 rounded-xl border border-border bg-bg-200 p-1.5 text-text-100 shadow-2xl"
        >
          <DropdownMenuLabel className="px-2 py-2 font-normal">
            <p className="truncate text-sm font-semibold text-text-100">
              {user?.name || "User"}
            </p>
            <p className="truncate text-xs text-text-300">{user?.email}</p>
            <p className="mt-1 text-xs text-text-300">{planLabel}</p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border" />

          {showCrossProductLink && (
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2.5">
              <a
                href={cross.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileSidebar}
                className="flex w-full items-center gap-2.5"
              >
                {cross.icon}
                <span className="flex-1">{cross.name}</span>
                <IconExternalLink className="h-3.5 w-3.5 shrink-0 text-text-300" />
              </a>
            </DropdownMenuItem>
          )}

          {billingHref && product === "socialsnipper" && (
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2.5">
              <Link
                href={billingHref}
                onClick={closeMobileSidebar}
                className="flex w-full items-center gap-2.5"
              >
                <IconCreditCard className="h-4 w-4 shrink-0" />
                Plan & billing
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2.5">
            <Link
              href={settingsHref}
              onClick={closeMobileSidebar}
              className="flex w-full items-center gap-2.5"
            >
              <IconSettings className="h-4 w-4 shrink-0" />
              Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-2.5 py-2.5 text-red-600 focus:bg-red-500/10 focus:text-red-600"
            onClick={handleLogout}
          >
            <IconLogout className="mr-2.5 h-4 w-4 shrink-0" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserFooter;
