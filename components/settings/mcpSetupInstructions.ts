import type { ChatgptPluginConfig, McpOAuthEndpoints } from "@/utils/api/mcpClient";
import { formatChatgptPluginSetup } from "@/utils/api/mcpClient";

export type McpClientTab = "chatgpt" | "claude" | "cursor" | "generic";

export type McpSetupStep = {
  title: string;
  body: string;
  warning?: string;
  bullets?: string[];
};

export type ChatgptSetupField = {
  /** Display order in ChatGPT's app form (matches top-to-bottom in the UI). */
  order: number;
  section: string;
  field: string;
  value: string;
  copyable: boolean;
  hint?: string;
};

export const MCP_ONE_TIME_NOTICE =
  "OAuth Client Secret and MCP API keys are shown only once at creation. Store them securely — never share in docs, screenshots, or chat.";

export const MCP_ALERT_CLASS =
  "rounded-xl border-2 border-amber-500/70 bg-[#1a1408] px-4 py-3 text-sm text-amber-100 leading-relaxed";

export const CHATGPT_MCP_APP_LABEL = "ChatGPT MCP App";

/** Steps shown before the user creates a LeadSnipper OAuth app. */
export function getChatgptPreCreateSteps(): McpSetupStep[] {
  return [
    {
      title: "Enable Developer mode in ChatGPT",
      body: "ChatGPT → Settings → Security and login → Developer mode → ON. Required for custom MCP apps on Plus, Pro, Team, Business, Enterprise, or Edu.",
    },
    {
      title: "Create a new MCP app in ChatGPT",
      body: "ChatGPT → Settings → Apps (or chatgpt.com/apps) → Create app / New app. Give it a name like LeadSnipper.",
    },
    {
      title: "Copy the Callback URL from ChatGPT",
      body: "In your ChatGPT app → Authentication → OAuth → Advanced settings → User-Defined OAuth Client. Copy the read-only Callback URL (https://chatgpt.com/connector/oauth/…). You will paste this into LeadSnipper in the next step.",
      warning: "Do not paste your ls_mcp_* API key anywhere in the ChatGPT OAuth form.",
    },
  ];
}

/** Ordered fields matching ChatGPT's app configuration form (top to bottom). */
export function getChatgptSetupFields(
  oauth: McpOAuthEndpoints,
  plugin?: Partial<ChatgptPluginConfig>
): ChatgptSetupField[] {
  return [
    {
      order: 1,
      section: "Connection",
      field: "MCP Server URL",
      value: plugin?.mcpServerUrl || oauth.mcpUrl,
      copyable: true,
      hint: "Connection type: Server URL",
    },
    {
      order: 2,
      section: "Authentication",
      field: "Authentication",
      value: "OAuth",
      copyable: false,
    },
    {
      order: 3,
      section: "Authentication",
      field: "Client setup method",
      value: plugin?.clientSetupMethod || "User-Defined OAuth Client",
      copyable: false,
      hint: "Advanced OAuth settings",
    },
    {
      order: 4,
      section: "Authentication",
      field: "OAuth Client ID",
      value: plugin?.oauthClientId || "Create OAuth app in LeadSnipper first",
      copyable: Boolean(plugin?.oauthClientId),
    },
    {
      order: 5,
      section: "Authentication",
      field: "OAuth Client Secret",
      value: plugin?.oauthClientSecret
        ? plugin.oauthClientSecret
        : "Shown once when you create the OAuth app in LeadSnipper",
      copyable: Boolean(plugin?.oauthClientSecret),
      hint: "Never paste this into docs or share publicly",
    },
    {
      order: 6,
      section: "Authentication",
      field: "Authorization endpoint",
      value: plugin?.authorizationEndpoint || oauth.authorizationEndpoint,
      copyable: true,
    },
    {
      order: 7,
      section: "Authentication",
      field: "Token endpoint",
      value: plugin?.tokenEndpoint || oauth.tokenEndpoint,
      copyable: true,
    },
    {
      order: 8,
      section: "Authentication",
      field: "Scopes",
      value: plugin?.scopes || "openid email offline_access",
      copyable: true,
    },
    {
      order: 9,
      section: "Authentication",
      field: "Token endpoint auth method",
      value: plugin?.tokenEndpointAuthMethod || "client_secret_post",
      copyable: false,
    },
    {
      order: 10,
      section: "Note",
      field: "Callback URL",
      value:
        "Read-only in ChatGPT — copy FROM ChatGPT and paste into LeadSnipper when creating your OAuth app. Must match exactly.",
      copyable: false,
    },
  ];
}

/** @deprecated Use getChatgptSetupFields — kept for table compatibility */
export type ChatgptOAuthFieldGuideRow = {
  field: string;
  where: string;
  value: string;
};

export function getChatgptOAuthFieldGuide(
  oauth: McpOAuthEndpoints,
  plugin?: Partial<ChatgptPluginConfig>
): ChatgptOAuthFieldGuideRow[] {
  return getChatgptSetupFields(oauth, plugin).map((row) => ({
    field: row.field,
    where: row.section,
    value: row.value,
  }));
}

export function getMcpSetupSteps(
  client: McpClientTab,
  mcpUrl: string,
  apiKey: string,
  oauth?: McpOAuthEndpoints,
  chatgptPlugin?: ChatgptPluginConfig
): McpSetupStep[] {
  const endpoints = oauth || {
    issuer: "",
    authorizationEndpoint: "(load Integrations page)",
    tokenEndpoint: "(load Integrations page)",
    metadataUrl: "",
    mcpUrl,
  };

  switch (client) {
    case "chatgpt":
      return [
        ...getChatgptPreCreateSteps(),
        {
          title: "Create OAuth app in LeadSnipper",
          body: `Integrations → ${CHATGPT_MCP_APP_LABEL} → paste the ChatGPT Callback URL → Connect. Copy Client ID and Client Secret immediately.`,
          warning: MCP_ONE_TIME_NOTICE,
        },
        {
          title: "Fill ChatGPT app form (in this order)",
          body: "Back in ChatGPT, configure your app using the field guide below — MCP Server URL first, then OAuth credentials and endpoints.",
          bullets: getChatgptSetupFields(endpoints, chatgptPlugin).map(
            (f) => `${f.field}: ${f.copyable && f.value.length < 80 ? f.value : "(see field guide)"}`
          ),
        },
        {
          title: "Save and Scan Tools",
          body: "Save your ChatGPT app → Scan Tools. ChatGPT discovers OAuth via your MCP server, completes PKCE authorization, and lists LeadSnipper tools.",
        },
        {
          title: "Approve access in LeadSnipper",
          body: "When ChatGPT connects, sign in to LeadSnipper (if needed) and click Allow on the consent screen.",
        },
      ];

    case "claude":
      return [
        {
          title: "Claude web Connectors ≠ ChatGPT MCP apps",
          body: "Claude Connectors use OAuth only. For ls_mcp_* keys, use Claude Desktop config below.",
          warning: "Do not paste ChatGPT OAuth Client ID/Secret into Claude.",
        },
        {
          title: "Open Claude Desktop config",
          body: "Settings → Developer → Edit Config, or edit claude_desktop_config.json directly.",
        },
        {
          title: "Merge the leadsnipper JSON block",
          body: "Copy the Claude Desktop config below (uses mcp-remote + your ls_mcp_* key).",
        },
        {
          title: "Restart Claude Desktop",
          body: "Quit fully and reopen. Look for the tools icon when connected.",
        },
      ];

    case "cursor":
      return [
        {
          title: "Open Cursor MCP settings",
          body: "Settings → MCP, or edit ~/.cursor/mcp.json.",
        },
        {
          title: "Add LeadSnipper server",
          body: "Paste Cursor JSON with MCP URL + Authorization Bearer header using your ls_mcp_* key.",
        },
        {
          title: "Reload MCP",
          body: "Save and restart Cursor or refresh MCP tools.",
        },
      ];

    case "generic":
      return [
        {
          title: "Remote MCP endpoint",
          body: `URL: ${mcpUrl}. Auth: Bearer ls_mcp_* key or OAuth access token from ChatGPT flow.`,
        },
        {
          title: "Stdio clients",
          body: "Use npx mcp-remote with --header Authorization:${LEADSNIPPER_MCP_AUTH}.",
        },
      ];
  }
}

export function getChatgptPluginSummary(
  plugin: ChatgptPluginConfig,
  options?: { includeSecret?: boolean }
): string {
  return formatChatgptPluginSetup(plugin, options);
}

export const MCP_CLIENT_TABS: { id: McpClientTab; label: string }[] = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude Desktop" },
  { id: "cursor", label: "Cursor" },
  { id: "generic", label: "Other" },
];
