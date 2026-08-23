import emailClient from "./emailClient";

export type DeveloperApiScope = "read" | "write" | "send";

export type DeveloperApiKeyMeta = {
  id: string;
  name: string;
  keyPrefix: string;
  environment: "live" | "test";
  scopes: DeveloperApiScope[];
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export type ListDeveloperKeysResponse = {
  keys: DeveloperApiKeyMeta[];
  apiBaseUrl: string;
  apiAccessEnabled: boolean;
  tierName: string;
};

export type CreateDeveloperKeyResponse = {
  key: string;
  apiBaseUrl: string;
  keyMeta: DeveloperApiKeyMeta;
};

export async function listDeveloperApiKeys(): Promise<ListDeveloperKeysResponse> {
  const response = await emailClient.get("/api/developer/keys");
  return response.data.data as ListDeveloperKeysResponse;
}

export async function createDeveloperApiKey(params: {
  name: string;
  scopes?: DeveloperApiScope[];
  environment?: "live" | "test";
}): Promise<CreateDeveloperKeyResponse> {
  const response = await emailClient.post("/api/developer/keys", params);
  return response.data.data as CreateDeveloperKeyResponse;
}

export async function revokeDeveloperApiKey(
  keyId: string
): Promise<DeveloperApiKeyMeta> {
  const response = await emailClient.delete(`/api/developer/keys/${keyId}`);
  return response.data.data as DeveloperApiKeyMeta;
}
