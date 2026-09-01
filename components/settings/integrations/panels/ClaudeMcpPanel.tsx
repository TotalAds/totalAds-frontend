"use client";

import ClaudeMcpOAuthSection from "@/components/settings/ClaudeMcpOAuthSection";
import { useMcpData } from "@/components/settings/integrations/useMcpData";
import PanelLoading from "@/components/settings/integrations/panels/PanelLoading";

export default function ClaudeMcpPanel() {
  const { oauthClients, oauth, isLoading, refresh } = useMcpData();

  if (isLoading) return <PanelLoading label="Loading MCP configuration…" />;

  if (!oauth) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-200">
        MCP OAuth endpoints are unavailable right now. Refresh the page, or use an
        MCP API key with Claude Desktop instead.
      </p>
    );
  }

  return (
    <ClaudeMcpOAuthSection
      oauthClients={oauthClients}
      oauth={oauth}
      onRefresh={refresh}
    />
  );
}
