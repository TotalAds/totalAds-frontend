"use client";

import { IconCheck, IconClock, IconRocket } from "@tabler/icons-react";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "planned";
  quarter: string;
  category: string;
}

const RoadmapSection = () => {
  const roadmapItems: RoadmapItem[] = [
    {
      id: "1",
      title: "Advanced Email Analytics",
      description: "Detailed engagement metrics with real-time tracking",
      status: "completed",
      quarter: "Q3 2024",
      category: "Analytics",
    },
    {
      id: "2",
      title: "A/B Testing for Campaigns",
      description: "Test different subject lines and content variations",
      status: "in-progress",
      quarter: "Q4 2024",
      category: "Features",
    },
    {
      id: "3",
      title: "Email Template Library",
      description: "Pre-built professional email templates",
      status: "in-progress",
      quarter: "Q4 2024",
      category: "Features",
    },
    {
      id: "4",
      title: "Automation Workflows",
      description: "Create automated email sequences and triggers",
      status: "planned",
      quarter: "Q1 2025",
      category: "Features",
    },
    {
      id: "5",
      title: "API Rate Limit Increase",
      description: "Higher API limits for enterprise users",
      status: "planned",
      quarter: "Q1 2025",
      category: "Infrastructure",
    },
    {
      id: "6",
      title: "Multi-language Support",
      description: "Support for multiple languages in campaigns",
      status: "planned",
      quarter: "Q2 2025",
      category: "Features",
    },
    {
      id: "7",
      title: "Webhook Integrations",
      description: "Connect with external services via webhooks",
      status: "planned",
      quarter: "Q2 2025",
      category: "Integrations",
    },
    {
      id: "8",
      title: "Advanced Segmentation",
      description: "Segment leads based on custom criteria",
      status: "planned",
      quarter: "Q2 2025",
      category: "Features",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IconCheck className="w-5 h-5 text-green-400" />;
      case "in-progress":
        return <IconRocket className="w-5 h-5 text-yellow-400" />;
      case "planned":
        return <IconClock className="w-5 h-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 border-green-500/40";
      case "in-progress":
        return "bg-yellow-500/20 border-yellow-500/40";
      case "planned":
        return "bg-blue-500/20 border-blue-500/40";
      default:
        return "bg-gray-500/20 border-gray-500/40";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "planned":
        return "Planned";
      default:
        return status;
    }
  };

  const groupedByStatus = {
    completed: roadmapItems.filter((item) => item.status === "completed"),
    "in-progress": roadmapItems.filter((item) => item.status === "in-progress"),
    planned: roadmapItems.filter((item) => item.status === "planned"),
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-100 mb-2">
          Product Roadmap
        </h2>
        <p className="text-text-200 text-sm">
          Upcoming features and improvements for LeadSnipper Email Service
        </p>
      </div>

      {/* Completed */}
      {groupedByStatus.completed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <IconCheck className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-text-100">Completed</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groupedByStatus.completed.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-5 shadow-sm hover:shadow-md transition ${getStatusColor(
                  item.status
                )}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-text-100">{item.title}</h4>
                  {getStatusIcon(item.status)}
                </div>
                <p className="text-text-200 text-sm mb-3">{item.description}</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-bg-300 text-text-200">
                    {item.quarter}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-bg-300 text-text-200">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress */}
      {groupedByStatus["in-progress"].length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <IconRocket className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-text-100">In Progress</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groupedByStatus["in-progress"].map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-5 shadow-sm hover:shadow-md transition ${getStatusColor(
                  item.status
                )}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-text-100">{item.title}</h4>
                  {getStatusIcon(item.status)}
                </div>
                <p className="text-text-200 text-sm mb-3">{item.description}</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-bg-300 text-text-200">
                    {item.quarter}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-bg-300 text-text-200">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planned */}
      {groupedByStatus.planned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <IconClock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-text-100">Planned</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groupedByStatus.planned.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-5 shadow-sm hover:shadow-md transition ${getStatusColor(
                  item.status
                )}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-text-100">{item.title}</h4>
                  {getStatusIcon(item.status)}
                </div>
                <p className="text-text-200 text-sm mb-3">{item.description}</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-bg-300 text-text-200">
                    {item.quarter}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-bg-300 text-text-200">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapSection;
