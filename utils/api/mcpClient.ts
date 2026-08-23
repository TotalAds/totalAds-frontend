import emailClient from "./emailClient";

export type McpApiKeyMeta = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

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
  chatgpt: {
    mcpUrl: string;
    token: string;
  };
  generic: {
    url: string;
    authorization: string;
  };
};

export type ListMcpKeysResponse = {
  keys: McpApiKeyMeta[];
  mcpUrl: string;
};

export type CreateMcpKeyResponse = {
  key: string;
  mcpUrl: string;
  clientConfigs: McpClientConfigs;
  keyMeta: McpApiKeyMeta;
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
