import emailClient from "./emailClient";

export type McpApiKeyMeta = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export type McpOAuthEndpoints = {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  metadataUrl: string;
  openIdConfigurationUrl?: string;
  protectedResourceMetadataUrl?: string;
  mcpUrl: string;
};

export type McpOauthProvider = "chatgpt" | "claude";

export type McpOauthClientMeta = {
  id: string;
  name: string;
  clientId: string;
  clientIdPrefix: string;
  redirectUri: string;
  provider?: McpOauthProvider;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  oauth: McpOAuthEndpoints;
};

export type ChatgptPluginConfig = {
  name: string;
  provider?: McpOauthProvider;
  mcpServerUrl: string;
  authentication: string;
  clientSetupMethod: string;
  oauthClientId: string;
  oauthClientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string;
  tokenEndpointAuthMethod: string;
  redirectUri?: string;
};

/** Alias — same confidential OAuth connector config for ChatGPT and Claude. */
export type McpOauthConnectorConfig = ChatgptPluginConfig;

export type McpClientConfigs = {
  claudeDesktop: {
    mcpServers: {
      leadsnipper: {
        command: string;
        args: string[];
        env: Record<string, string>;
      };
    };
  };
  cursor: {
    mcpServers: {
      leadsnipper: {
        url: string;
        headers: { Authorization: string };
      };
    };
  };
  chatgpt: ChatgptPluginConfig;
  generic: {
    url: string;
    authorization: string;
  };
};

export type ListMcpKeysResponse = {
  keys: McpApiKeyMeta[];
  oauthClients: McpOauthClientMeta[];
  mcpUrl: string;
  oauth: McpOAuthEndpoints;
};

export type CreateMcpKeyResponse = {
  key: string;
  mcpUrl: string;
  clientConfigs: McpClientConfigs;
  keyMeta: McpApiKeyMeta;
};

export type CreateMcpOauthClientResponse = {
  clientSecret: string;
  provider?: McpOauthProvider;
  chatgptPlugin: ChatgptPluginConfig;
  connector?: McpOauthConnectorConfig;
  client: McpOauthClientMeta;
};

export async function listMcpApiKeys(): Promise<ListMcpKeysResponse> {
  const response = await emailClient.get("/api/mcp/keys");
  return response.data.data as ListMcpKeysResponse;
}

export async function createMcpApiKey(
  name: string
): Promise<CreateMcpKeyResponse> {
  const response = await emailClient.post("/api/mcp/keys", { name });
  return response.data.data as CreateMcpKeyResponse;
}

export async function revokeMcpApiKey(keyId: string): Promise<McpApiKeyMeta> {
  const response = await emailClient.delete(`/api/mcp/keys/${keyId}`);
  return response.data.data as McpApiKeyMeta;
}

export async function createMcpOauthClient(params: {
  name: string;
  redirectUri: string;
}): Promise<CreateMcpOauthClientResponse> {
  const response = await emailClient.post("/api/mcp/oauth-clients", params);
  return response.data.data as CreateMcpOauthClientResponse;
}

export async function revokeMcpOauthClient(
  clientId: string
): Promise<McpOauthClientMeta> {
  const response = await emailClient.delete(`/api/mcp/oauth-clients/${clientId}`);
  return response.data.data as McpOauthClientMeta;
}

export async function previewMcpOauthClient(params: {
  clientId: string;
  redirectUri: string;
}): Promise<{
  clientName: string;
  redirectUri: string;
  scopes: string;
  workspaceId: string;
  workspaceName: string;
}> {
  const response = await emailClient.get("/api/mcp/oauth/preview", {
    params: {
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
    },
  });
  return response.data.data;
}

export async function approveMcpOauth(params: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state?: string;
  scope?: string;
}): Promise<{ redirectUrl: string }> {
  const response = await emailClient.post("/api/mcp/oauth/approve", params);
  return response.data.data;
}

export function formatChatgptPluginSetup(
  plugin: ChatgptPluginConfig,
  options?: { includeSecret?: boolean }
): string {
  const secret =
    options?.includeSecret === true
      ? plugin.oauthClientSecret
      : "(paste from LeadSnipper — shown once at creation)";

  if (plugin.provider === "claude") {
    return [
      "=== Claude custom connector — configure in this order ===",
      "",
      "1. Claude → Settings → Connectors → Add custom connector",
      `   Name: ${plugin.name || "LeadSnipper"}`,
      `   Remote MCP server URL: ${plugin.mcpServerUrl}`,
      "",
      "2. Advanced settings",
      `   OAuth Client ID: ${plugin.oauthClientId}`,
      `   OAuth Client Secret: ${secret}`,
      "",
      "3. Add → sign in to LeadSnipper → Allow on the consent screen",
    ].join("\n");
  }

  return [
    "=== ChatGPT MCP App — configure in this order ===",
    "",
    "1. Connection",
    `   MCP Server URL: ${plugin.mcpServerUrl}`,
    "",
    "2. Authentication → OAuth → User-Defined OAuth Client",
    `   OAuth Client ID: ${plugin.oauthClientId}`,
    `   OAuth Client Secret: ${secret}`,
    `   Authorization endpoint: ${plugin.authorizationEndpoint}`,
    `   Token endpoint: ${plugin.tokenEndpoint}`,
    `   Scopes: ${plugin.scopes}`,
    `   Token endpoint auth method: ${plugin.tokenEndpointAuthMethod}`,
    "",
    "3. Callback URL",
    "   Copy FROM ChatGPT (read-only) → paste into LeadSnipper when creating OAuth app",
    "",
    "4. Save → Scan Tools → approve in LeadSnipper when prompted",
  ].join("\n");
}

export const CLAUDE_MCP_REDIRECT_URI =
  "https://claude.ai/api/mcp/auth_callback";

export function getOauthClientProvider(
  client: Pick<McpOauthClientMeta, "redirectUri" | "provider">
): McpOauthProvider {
  if (client.provider === "chatgpt" || client.provider === "claude") {
    return client.provider;
  }
  if (client.redirectUri.includes("claude.ai") || client.redirectUri.includes("claude.com")) {
    return "claude";
  }
  return "chatgpt";
}
