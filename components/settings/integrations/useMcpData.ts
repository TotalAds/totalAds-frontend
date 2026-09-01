"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  listMcpApiKeys,
  type McpApiKeyMeta,
  type McpOAuthEndpoints,
  type McpOauthClientMeta,
} from "@/utils/api/mcpClient";

export type McpData = {
  keys: McpApiKeyMeta[];
  oauthClients: McpOauthClientMeta[];
  oauth: McpOAuthEndpoints | null;
  mcpUrl: string;
};

const EMPTY: McpData = { keys: [], oauthClients: [], oauth: null, mcpUrl: "" };

export function useMcpData() {
  const [data, setData] = useState<McpData>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await listMcpApiKeys();
      setData({
        keys: result.keys || [],
        oauthClients: result.oauthClients || [],
        oauth: result.oauth || null,
        mcpUrl: result.mcpUrl || "",
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      console.error("Failed to load MCP data", error);
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to load MCP data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...data, isLoading, refresh };
}
