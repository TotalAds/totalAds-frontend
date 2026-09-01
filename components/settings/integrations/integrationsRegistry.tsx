import {
  IconBolt,
  IconCode,
  IconMessageChatbot,
  IconShieldCheck,
  IconSparkles,
  IconTerminal2,
} from "@tabler/icons-react";

import DeveloperApiKeysCard from "@/components/developer/DeveloperApiKeysCard";
import LeadhubIntegrationsCard from "@/components/settings/LeadhubIntegrationsCard";
import ChatgptMcpPanel from "./panels/ChatgptMcpPanel";
import ClaudeMcpPanel from "./panels/ClaudeMcpPanel";
import McpApiKeysPanel from "./panels/McpApiKeysPanel";
import ReoonPanel from "./panels/ReoonPanel";
import { INTEGRATION_GUIDES } from "./integrationGuides";
import type { IntegrationCategory, IntegrationDefinition } from "./types";

export const INTEGRATION_CATEGORY_ORDER: IntegrationCategory[] = [
  "AI clients",
  "Developer",
  "Data & deliverability",
];

export const CATEGORY_DESCRIPTIONS: Record<IntegrationCategory, string> = {
  "AI clients":
    "Let ChatGPT, Claude, or your editor read your campaign data over MCP. Read and draft-edit only — never send.",
  Developer: "Drive LeadSnipper from your own code over HTTP.",
  "Data & deliverability":
    "Third-party services that verify and enrich leads before they enter a campaign.",
};

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "mcp-chatgpt",
    name: "ChatGPT MCP App",
    tagline: "Ask ChatGPT about your campaigns, leads, and deliverability.",
    category: "AI clients",
    icon: IconSparkles,
    tags: ["OAuth", "Read-only"],
    guide: INTEGRATION_GUIDES["mcp-chatgpt"],
    panel: () => <ChatgptMcpPanel />,
  },
  {
    id: "mcp-claude",
    name: "Claude Custom Connector",
    tagline: "Add LeadSnipper as a custom connector inside Claude.ai.",
    category: "AI clients",
    icon: IconMessageChatbot,
    tags: ["OAuth", "Read-only"],
    guide: INTEGRATION_GUIDES["mcp-claude"],
    panel: () => <ClaudeMcpPanel />,
  },
  {
    id: "mcp-api-keys",
    name: "Other MCP clients",
    tagline: "Key-based MCP access for Cursor, Claude Desktop, and custom clients.",
    category: "AI clients",
    icon: IconTerminal2,
    tags: ["API key", "Local config"],
    guide: INTEGRATION_GUIDES["mcp-api-keys"],
    panel: () => <McpApiKeysPanel />,
  },
  {
    id: "developer-api",
    name: "Developer REST API",
    tagline: "Send email and manage campaigns and leads from your own backend.",
    category: "Developer",
    icon: IconCode,
    tags: ["REST", "Scale plan"],
    guide: INTEGRATION_GUIDES["developer-api"],
    panel: () => <DeveloperApiKeysCard embedded />,
  },
  {
    id: "reoon",
    name: "Reoon Email Verifier",
    tagline: "Verify addresses at import and before a campaign sends.",
    category: "Data & deliverability",
    icon: IconShieldCheck,
    tags: ["Bring your own key"],
    requiresBillingRole: true,
    guide: INTEGRATION_GUIDES.reoon,
    panel: () => <ReoonPanel />,
  },
  {
    id: "leadhub",
    name: "LeadHub Autopilot",
    tagline: "Sync enriched leads and skip verification LeadHub already ran.",
    category: "Data & deliverability",
    icon: IconBolt,
    tags: ["Lead sync", "Enrichment"],
    requiresBillingRole: true,
    guide: INTEGRATION_GUIDES.leadhub,
    panel: () => <LeadhubIntegrationsCard embedded />,
  },
];
