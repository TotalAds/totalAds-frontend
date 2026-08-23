import type { ChatgptPluginConfig, McpOAuthEndpoints } from "@/utils/api/mcpClient";
import { formatChatgptPluginSetup } from "@/utils/api/mcpClient";

export type McpClientTab = "chatgpt" | "claude" | "cursor" | "generic";

export type McpSetupStep = {
  title: string;
  body: string;
  warning?: string;
  bullets?: string[];
};

export const MCP_ONE_TIME_NOTICE =
  "Your MCP API key and ChatGPT OAuth credentials are shown only once when you create them. Revoke and recreate to view again.";

export const MCP_ALERT_CLASS =
  "rounded-xl border-2 border-amber-500/70 bg-[#1a1408] px-4 py-3 text-sm text-amber-100 leading-relaxed";

export type ChatgptOAuthFieldGuideRow = {
  field: string;
  where: string;
  value: string;
};

export function getChatgptOAuthFieldGuide(
  oauth: McpOAuthEndpoints,
  plugin?: Partial<ChatgptPluginConfig>
): ChatgptOAuthFieldGuideRow[] {
  return [
    {
      field: "Authentication",
      where: "Plugin form",
      value: "OAuth (not No Auth)",
    },
    {
      field: "Client setup method",
      where: "Advanced OAuth settings",
      value: "User-Defined OAuth Client",
    },
    {
      field: "Callback URL",
      where: "ChatGPT plugin form (read-only)",
      value:
        "Copy from ChatGPT → paste into LeadSnipper when creating the OAuth app. Must match exactly.",
    },
    {
      field: "OAuth Client ID",
      where: "ChatGPT plugin form",
      value: plugin?.oauthClientId || "From LeadSnipper after you create ChatGPT OAuth app",
    },
    {
      field: "OAuth Client Secret",
      where: "ChatGPT plugin form",
      value: plugin?.oauthClientSecret || "From LeadSnipper (shown once at creation)",
    },
    {
      field: "Authorization endpoint",
      where: "Advanced OAuth → OAuth endpoints",
      value: plugin?.authorizationEndpoint || oauth.authorizationEndpoint,
    },
    {
      field: "Token endpoint",
      where: "Advanced OAuth → OAuth endpoints",
      value: plugin?.tokenEndpoint || oauth.tokenEndpoint,
    },
    {
      field: "Scopes",
      where: "Advanced OAuth settings",
      value: plugin?.scopes || "openid email offline_access",
    },
    {
      field: "Token endpoint client auth",
      where: "Advanced OAuth settings",
      value: plugin?.tokenEndpointAuthMethod || "client_secret_post",
    },
    {
      field: "OpenID / OIDC",
      where: "Advanced OAuth settings",
      value: "Optional — not required for developer-mode plugins",
    },
    {
      field: "MCP Server URL",
      where: "Plugin → Connection → Server URL",
      value: plugin?.mcpServerUrl || oauth.mcpUrl,
    },
  ];
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
        {
          title: "Create a ChatGPT OAuth app in LeadSnipper",
          body: 'In Integrations → "ChatGPT plugin (OAuth)" section, paste the Callback URL from ChatGPT (https://chatgpt.com/connector/oauth/…) and click Create OAuth app. Copy Client ID and Client Secret immediately.',
          warning: MCP_ONE_TIME_NOTICE,
        },
        {
          title: "Enable Developer mode in ChatGPT",
          body: "ChatGPT → Settings → Security and login → Developer mode → ON. Required for custom plugins on Plus, Pro, Team, Business, Enterprise, or Edu.",
        },
        {
          title: "Create a New Plugin",
          body: "ChatGPT → Settings → Plugins (sidebar) or chatgpt.com/plugins → + New Plugin. ChatGPT calls this a plugin — not a connector.",
        },
        {
          title: "Plugin connection details",
          body: `Name: LeadSnipper. Connection: Server URL. URL: ${endpoints.mcpUrl}. Description: optional.`,
        },
        {
          title: "Set Authentication to OAuth",
          body: "Authentication dropdown → OAuth. Expand Advanced OAuth settings → User-Defined OAuth Client.",
          warning:
            "Do not use No Auth — LeadSnipper requires authentication. Do not paste your ls_mcp_* API key into OAuth Client ID or Secret.",
        },
        {
          title: "Fill OAuth fields from LeadSnipper",
          body: chatgptPlugin
            ? `Client ID: ${chatgptPlugin.oauthClientId}. Client Secret: (copied at creation). Authorization: ${chatgptPlugin.authorizationEndpoint}. Token: ${chatgptPlugin.tokenEndpoint}. Scopes: ${chatgptPlugin.scopes}. Token auth: client_secret_post.`
            : `Use the OAuth field guide below. Authorization endpoint: ${endpoints.authorizationEndpoint}. Token endpoint: ${endpoints.tokenEndpoint}.`,
          bullets: [
            "Callback URL: copy FROM ChatGPT into LeadSnipper when creating the OAuth app",
            "Client ID + Secret: copy FROM LeadSnipper into ChatGPT plugin form",
          ],
        },
        {
          title: "Scan tools and authorize",
          body: "Save the plugin → Scan Tools. When ChatGPT connects, you will be redirected to LeadSnipper to sign in and click Allow ChatGPT.",
        },
        {
          title: "Path to a verified public plugin",
          body: "After developer-mode testing works, submit the plugin for OpenAI review to list it publicly.",
          bullets: [
            "Test all MCP tools in Developer mode",
            "Document privacy and write-action confirmations",
            "Submit via OpenAI plugin submission portal (developers.openai.com/apps-sdk)",
          ],
        },
      ];

    case "claude":
      return [
        {
          title: "Claude web Connectors ≠ ChatGPT plugins",
          body: "Claude Connectors use OAuth only. For ls_mcp_* keys, use Claude Desktop config below.",
          warning: "Do not paste OAuth Client ID/Secret meant for ChatGPT into Claude.",
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
  plugin: ChatgptPluginConfig
): string {
  return formatChatgptPluginSetup(plugin);
}

export const MCP_CLIENT_TABS: { id: McpClientTab; label: string }[] = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude Desktop" },
  { id: "cursor", label: "Cursor" },
  { id: "generic", label: "Other" },
];
