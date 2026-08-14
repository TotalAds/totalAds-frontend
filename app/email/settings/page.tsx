"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ActivityLogTable from "@/components/workspace/ActivityLogTable";
import TeamMembersTable from "@/components/workspace/TeamMembersTable";
import WorkspaceRoleBanner from "@/components/workspace/WorkspaceRoleBanner";
import WorkspaceUsageCard from "@/components/workspace/WorkspaceUsageCard";
import WorkspacesSection from "@/components/workspace/WorkspacesSection";
import BillingSection from "@/components/settings/BillingSection";
import EmailDeliverySection from "@/components/settings/EmailDeliverySection";
import IntegrationsSection from "@/components/settings/IntegrationsSection";
import ProfileSection from "@/components/settings/ProfileSection";
import RoadmapSection from "@/components/settings/RoadmapSection";
import UsageSection from "@/components/settings/UsageSection";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  IconActivity,
  IconChevronRight,
  IconCreditCard,
  IconMail,
  IconMap,
  IconPlug,
  IconRoadSign,
  IconUser,
  IconUsers,
  IconBuilding,
} from "@tabler/icons-react";

type SettingsTab =
  | "profile"
  | "billing"
  | "email-delivery"
  | "roadmap"
  | "usage"
  | "integrations"
  | "team"
  | "activity"
  | "workspaces";

interface SettingsNavItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  adminOnly?: boolean;
}

const SettingsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useAuthContext();
  const { isAuthenticated } = state;
  const { canManageMembers, canViewAuditLog, canManageBilling, canCreateWorkspaces } = useWorkspace();

  const tabFromUrl = searchParams.get("tab") as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(tabFromUrl || "profile");

  useEffect(() => {
    const valid: SettingsTab[] = [
      "profile",
      "billing",
      "email-delivery",
      "roadmap",
      "usage",
      "integrations",
      "team",
      "activity",
      "workspaces",
    ];
    if (tabFromUrl && valid.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (!state.isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [state.isLoading, isAuthenticated, router]);

  const navItems: SettingsNavItem[] = useMemo(() => {
    const items: SettingsNavItem[] = [
      {
        id: "profile",
        label: "Profile",
        icon: <IconUser className="w-5 h-5" />,
        description: "Manage your profile information",
      },
      {
        id: "billing",
        label: "Billing",
        icon: <IconCreditCard className="w-5 h-5" />,
        description: "View billing and payment history",
        adminOnly: true,
      },
      {
        id: "email-delivery",
        label: "Email delivery",
        icon: <IconMail className="w-5 h-5" />,
        description: "Sending mode and AWS SES credentials",
        adminOnly: true,
      },
      {
        id: "usage",
        label: "Usage",
        icon: <IconMap className="w-5 h-5" />,
        description: "Email usage and quota tracking",
      },
      {
        id: "integrations",
        label: "Integrations",
        icon: <IconPlug className="w-5 h-5" />,
        description: "MCP, Reoon, and third-party integrations",
      },
      {
        id: "team",
        label: "Team",
        icon: <IconUsers className="w-5 h-5" />,
        description: "Members and invites",
        adminOnly: true,
      },
      {
        id: "activity",
        label: "Activity",
        icon: <IconActivity className="w-5 h-5" />,
        description: "Workspace audit log",
        adminOnly: true,
      },
      {
        id: "workspaces",
        label: "Workspaces",
        icon: <IconBuilding className="w-5 h-5" />,
        description: "Manage workspaces on your plan",
        adminOnly: true,
      },
    ];
    return items.filter((item) => {
      if (!item.adminOnly) return true;
      if (item.id === "team") return canManageMembers;
      if (item.id === "activity") return canViewAuditLog;
      if (item.id === "workspaces") return canCreateWorkspaces;
      if (item.id === "billing" || item.id === "email-delivery") {
        return canManageBilling;
      }
      return true;
    });
  }, [canManageMembers, canViewAuditLog, canManageBilling, canCreateWorkspaces]);

  useEffect(() => {
    const adminOnlyTabs: SettingsTab[] = [
      "billing",
      "email-delivery",
      "team",
      "activity",
      "workspaces",
    ];
    if (adminOnlyTabs.includes(activeTab)) {
      const allowed =
        (activeTab === "team" && canManageMembers) ||
        (activeTab === "activity" && canViewAuditLog) ||
        (["billing", "email-delivery"].includes(activeTab) &&
          canManageBilling) ||
        (activeTab === "workspaces" && canCreateWorkspaces);
      if (!allowed) setActiveTab("profile");
    }
  }, [activeTab, canManageBilling, canManageMembers, canViewAuditLog, canCreateWorkspaces]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-100 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-100 mb-2">Settings</h1>
          <p className="text-text-200 text-sm">
            Manage your account, team, workspaces, billing, and usage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-4 space-y-2 sticky top-24">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                    activeTab === item.id
                      ? "bg-brand-main text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={activeTab === item.id ? "text-white" : ""}>
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {activeTab === item.id && (
                    <IconChevronRight className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {(activeTab === "team" || activeTab === "workspaces") && (
              <div className="space-y-3">
                <WorkspaceUsageCard />
                <p className="text-xs text-text-200">
                  <a
                    href="/email/workspaces"
                    className="font-medium text-brand-main hover:underline"
                  >
                    Open workspace management hub →
                  </a>
                </p>
              </div>
            )}
            {!canManageBilling &&
              activeTab !== "profile" &&
              activeTab !== "usage" &&
              activeTab !== "roadmap" &&
              activeTab !== "integrations" && (
              <WorkspaceRoleBanner variant="team-settings" />
            )}
            <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 md:p-8">
              {activeTab === "profile" && <ProfileSection />}
              {activeTab === "billing" && canManageBilling && <BillingSection />}
              {activeTab === "email-delivery" && canManageBilling && (
                <EmailDeliverySection />
              )}
              {activeTab === "usage" && <UsageSection />}
              {activeTab === "integrations" && <IntegrationsSection />}
              {activeTab === "roadmap" && <RoadmapSection />}
              {activeTab === "team" && <TeamMembersTable />}
              {activeTab === "activity" && <ActivityLogTable />}
              {activeTab === "workspaces" && <WorkspacesSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
