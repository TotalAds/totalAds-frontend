import type { ComponentType, ReactNode } from "react";

export type IntegrationId =
  | "developer-api"
  | "mcp-chatgpt"
  | "mcp-claude"
  | "mcp-api-keys"
  | "reoon"
  | "leadhub";

export type IntegrationCategory =
  | "Developer"
  | "AI clients"
  | "Data & deliverability";

export type IntegrationConnectionState =
  | "loading"
  | "connected"
  | "not_connected"
  | "locked";

export type IntegrationStatus = {
  state: IntegrationConnectionState;
  /** Short line under the badge, e.g. "2 active keys". */
  detail?: string;
};

export type GuideStep = {
  title: string;
  body: string;
  bullets?: string[];
  warning?: string;
};

export type GuideTroubleshootingEntry = {
  problem: string;
  fix: string;
};

export type IntegrationGuideContent = {
  summary: string;
  worksWith?: string[];
  prerequisites?: string[];
  steps: GuideStep[];
  capabilities?: {
    allowed: string[];
    blocked?: string[];
  };
  troubleshooting?: GuideTroubleshootingEntry[];
  security?: string[];
  docsHref?: string;
  docsLabel?: string;
};

export type IntegrationDefinition = {
  id: IntegrationId;
  name: string;
  /** One line shown on the card tile. Keep under ~100 characters. */
  tagline: string;
  category: IntegrationCategory;
  icon: ComponentType<{ className?: string }>;
  /** Short labels rendered as chips on the tile. */
  tags: string[];
  /** Requires workspace billing permission to view or configure. */
  requiresBillingRole?: boolean;
  guide: IntegrationGuideContent;
  /** Interactive configuration UI rendered in the detail modal. */
  panel: () => ReactNode;
};
