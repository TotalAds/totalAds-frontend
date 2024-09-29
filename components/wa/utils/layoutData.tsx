import { MessageCircle, Rocket, SquareUser } from "lucide-react";
import React from "react";

import {
  IconChartHistogram,
  IconDashboard,
  IconMessageChatbot,
} from "@tabler/icons-react";

export const waMenuItem = [
  {
    icon: (
      <IconDashboard className="w-8 h-8 text-text-200 transition duration-75  group-hover:text-text-100 " />
    ),
    text: "Dashboard",
    link: "/wa/dashboard",
    value: "wa_dashboard",
  },
  {
    icon: (
      <SquareUser className="w-8 h-8 text-text-200 transition duration-75  group-hover:text-text-100 " />
    ),
    text: "Contact",
    link: "/wa/contact",
    value: "wa_contact",
  },
  {
    icon: (
      <IconMessageChatbot className="w-8 h-8 text-text-200 transition duration-75  group-hover:text-text-100 " />
    ),
    text: "Template",
    link: "/wa/template",
    value: "wa_template",
  },
  {
    icon: (
      <Rocket className="w-8 h-8 text-text-200 transition duration-75  group-hover:text-text-100 " />
    ),
    text: "Campaign",
    link: "#",
    value: "wa_campaign",
  },
  {
    icon: (
      <IconChartHistogram className="w-8 h-8 text-text-200 transition duration-75  group-hover:text-text-100 " />
    ),
    text: "Analytics",
    link: "#",
    value: "wa_analytics",
  },
  {
    icon: (
      <MessageCircle className="w-8 h-8 text-text-200 transition duration-75  group-hover:text-text-100 " />
    ),
    text: "Chat",
    link: "#",
    value: "wa_chat",
  },
];

export const getActiveLink = (pathName: string) => {
  switch (pathName) {
    case "/wa/dashboard":
      return "wa_dashboard";
    case "/wa/contact":
      return "wa_contact";
    case "/wa/template":
      return "wa_template";
    // case "/wa/dashboard":
    //   return "wa_analytics";
    // case "/wa/dashboard":
    //   return "wa_chat";
    default:
      "wa_dashboard";
  }
};
