"use client";

import { useCallback, useEffect, useState } from "react";

import { listDeveloperApiKeys } from "@/utils/api/developerApiClient";
import { getLeadhubStatus } from "@/utils/api/leadhubClient";
import { getOauthClientProvider, listMcpApiKeys } from "@/utils/api/mcpClient";
import { getReoonStatus } from "@/utils/api/reoonClient";

import type { IntegrationId, IntegrationStatus } from "./types";

const LOADING: IntegrationStatus = { state: "loading" };

const INITIAL: Record<IntegrationId, IntegrationStatus> = {
  "developer-api": LOADING,
  "mcp-chatgpt": LOADING,
  "mcp-claude": LOADING,
  "mcp-api-keys": LOADING,
  reoon: LOADING,
  leadhub: LOADING,
};

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

/**
 * Loads just enough from each integration to render a status badge on its tile.
 * The detail panels fetch their own full state when they mount.
 */
export function useIntegrationStatuses(canManageBilling: boolean) {
  const [statuses, setStatuses] =
    useState<Record<IntegrationId, IntegrationStatus>>(INITIAL);

  const refresh = useCallback(async () => {
    const patch = (next: Partial<Record<IntegrationId, IntegrationStatus>>) =>
      setStatuses((prev) => ({ ...prev, ...next }));

    const developer = listDeveloperApiKeys()
      .then((data) => {
        if (!data.apiAccessEnabled) {
          patch({
            "developer-api": {
              state: "locked",
              detail: "Requires Scale or Custom",
            },
          });
          return;
        }
        patch({
          "developer-api": data.keys.length
            ? { state: "connected", detail: plural(data.keys.length, "active key") }
            : { state: "not_connected", detail: "No keys yet" },
        });
      })
      .catch(() => patch({ "developer-api": { state: "not_connected" } }));

    const mcp = listMcpApiKeys()
      .then((data) => {
        const clients = data.oauthClients || [];
        const chatgpt = clients.filter(
          (c) => getOauthClientProvider(c) === "chatgpt"
        ).length;
        const claude = clients.filter(
          (c) => getOauthClientProvider(c) === "claude"
        ).length;
        const keys = (data.keys || []).length;

        patch({
          "mcp-chatgpt": chatgpt
            ? { state: "connected", detail: plural(chatgpt, "OAuth app") }
            : { state: "not_connected", detail: "OAuth app not created" },
          "mcp-claude": claude
            ? { state: "connected", detail: plural(claude, "connector") }
            : { state: "not_connected", detail: "Connector not created" },
          "mcp-api-keys": keys
            ? { state: "connected", detail: plural(keys, "active key") }
            : { state: "not_connected", detail: "No keys yet" },
        });
      })
      .catch(() =>
        patch({
          "mcp-chatgpt": { state: "not_connected" },
          "mcp-claude": { state: "not_connected" },
          "mcp-api-keys": { state: "not_connected" },
        })
      );

    if (!canManageBilling) {
      patch({
        reoon: { state: "locked", detail: "Admins only" },
        leadhub: { state: "locked", detail: "Admins only" },
      });
      await Promise.all([developer, mcp]);
      return;
    }

    const reoon = getReoonStatus(false)
      .then((s) =>
        patch({
          reoon: s.isConfigured
            ? { state: "connected", detail: "Verification active" }
            : { state: "not_connected", detail: "API key required" },
        })
      )
      .catch(() => patch({ reoon: { state: "not_connected" } }));

    const leadhub = getLeadhubStatus()
      .then((s) =>
        patch({
          leadhub: s.isConfigured
            ? { state: "connected", detail: "Workspace linked" }
            : { state: "not_connected", detail: "Workspace not linked" },
        })
      )
      .catch(() => patch({ leadhub: { state: "not_connected" } }));

    await Promise.all([developer, mcp, reoon, leadhub]);
  }, [canManageBilling]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { statuses, refresh };
}
