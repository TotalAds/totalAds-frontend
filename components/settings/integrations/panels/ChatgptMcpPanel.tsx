"use client";

import ChatgptMcpOAuthSection from "@/components/settings/ChatgptMcpOAuthSection";
import { useMcpData } from "@/components/settings/integrations/useMcpData";
import PanelLoading from "@/components/settings/integrations/panels/PanelLoading";

export default function ChatgptMcpPanel() {
  const { oauthClients, oauth, isLoading, refresh } = useMcpData();

  if (isLoading) return <PanelLoading label="Loading MCP configuration…" />;

  if (!oauth) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-200">
        MCP OAuth endpoints are unavailable right now. Refresh the page, or use an
        MCP API key with Cursor or Claude Desktop instead.
      </p>
    );
  }

  return (
    <ChatgptMcpOAuthSection
      oauthClients={oauthClients}
      oauth={oauth}
      onRefresh={refresh}
    />
  );
}
