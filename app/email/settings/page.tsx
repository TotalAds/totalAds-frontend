"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import BillingSection from "@/components/settings/BillingSection";
import IntegrationsSection from "@/components/settings/IntegrationsSection";
import ProfileSection from "@/components/settings/ProfileSection";
import RoadmapSection from "@/components/settings/RoadmapSection";
import UsageSection from "@/components/settings/UsageSection";
import { useAuthContext } from "@/context/AuthContext";
import {
  IconChevronRight,
  IconCreditCard,
  IconMap,
  IconPlug,
  IconRoadSign,
  IconUser,
} from "@tabler/icons-react";

type SettingsTab = "profile" | "billing" | "roadmap" | "usage" | "integrations";

interface SettingsNavItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SettingsPage = () => {
  const router = useRouter();
  const { state } = useAuthContext();
  const { isAuthenticated, user } = state;

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only redirect if we've finished loading and user is not authenticated
    if (!state.isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [state.isLoading, isAuthenticated, router]);

  const navItems: SettingsNavItem[] = [
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
      description: "Manage third-party integrations like Reoon",
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-100 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-100 mb-2">Settings</h1>
          <p className="text-text-200 text-sm">
            Manage your account, domains, billing, and usage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-4 space-y-2 sticky top-24">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                    activeTab === item.id
                      ? "bg-brand-main/20 border border-brand-main/40 text-brand-main"
                      : "text-text-200 hover:bg-bg-300 hover:text-text-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {activeTab === item.id && (
                    <IconChevronRight className="w-4 h-4 text-brand-main" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 md:p-8">
              {/* Profile Section */}
              {activeTab === "profile" && <ProfileSection />}

              {/* Billing Section */}
              {activeTab === "billing" && <BillingSection />}

              {/* Usage Section */}
              {activeTab === "usage" && <UsageSection />}

              {/* Integrations Section */}
              {activeTab === "integrations" && <IntegrationsSection />}

              {/* Roadmap Section */}
              {activeTab === "roadmap" && <RoadmapSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
