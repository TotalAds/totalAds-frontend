export type McpClientTab = "chatgpt" | "claude" | "cursor" | "generic";

export type McpSetupStep = {
  title: string;
  body: string;
  warning?: string;
};

export const MCP_ONE_TIME_NOTICE =
  "Your MCP API key and client setup instructions are shown only once when you generate a key. To view them again, revoke the key and create a new one.";

export function getMcpSetupSteps(
  client: McpClientTab,
  mcpUrl: string,
  apiKey: string
): McpSetupStep[] {
  switch (client) {
    case "chatgpt":
      return [
        {
          title: "Enable Developer Mode",
          body: "In ChatGPT, open Settings → Apps & Connectors → Advanced settings, then turn on Developer mode. (Plus, Pro, Team, Business, Enterprise, or Edu required.)",
        },
        {
          title: "Create a custom connector",
          body: "Go to Settings → Apps & Connectors → Create (or the + button under Connectors).",
        },
        {
          title: "Enter connector details",
          body: `Name: LeadSnipper (or any label you prefer). Connector URL: ${mcpUrl}. Description: optional.`,
        },
        {
          title: "Choose Token authentication — not OAuth",
          body: `Select Authentication → Token (or API key / Bearer token). Paste your MCP key exactly as shown: ${apiKey}. Do not use OAuth — LeadSnipper uses a static API key, not client ID/secret.`,
          warning:
            "If ChatGPT asks for a client ID and client secret, you picked OAuth. Go back and choose Token instead.",
        },
        {
          title: "Scan tools and use in chat",
          body: "Click Create, wait for tools to scan, then start a new chat → + → Apps / Connectors → enable LeadSnipper.",
        },
      ];

    case "claude":
      return [
        {
          title: "Do not use Claude web Connectors or chat paste",
          body: "You cannot connect by pasting config into a Claude chat, and Claude's Connectors UI only supports OAuth — not Bearer tokens. Use Claude Desktop with the config file instead.",
          warning:
            "Claude Connectors will ask for OAuth client ID/secret. That flow does not work with LeadSnipper MCP.",
        },
        {
          title: "Open Claude Desktop config",
          body: "In Claude Desktop: Settings → Developer → Edit Config. Or edit the file directly: macOS ~/Library/Application Support/Claude/claude_desktop_config.json · Windows %APPDATA%\\Claude\\claude_desktop_config.json",
        },
        {
          title: "Merge the leadsnipper block",
          body: "Copy the Claude Desktop JSON below into the mcpServers object (merge with any existing servers). Requires Node.js so npx can run mcp-remote.",
        },
        {
          title: "Restart Claude Desktop fully",
          body: "Quit Claude Desktop completely and reopen it. You should see a hammer/tools icon when LeadSnipper MCP is connected.",
        },
      ];

    case "cursor":
      return [
        {
          title: "Open Cursor MCP settings",
          body: "In Cursor: Settings → MCP (or edit ~/.cursor/mcp.json on macOS/Linux, %USERPROFILE%\\.cursor\\mcp.json on Windows).",
        },
        {
          title: "Add the LeadSnipper server",
          body: "Copy the Cursor JSON below into mcpServers. Cursor supports remote URL + Authorization header directly — no mcp-remote bridge needed.",
        },
        {
          title: "Reload MCP in Cursor",
          body: "Save the file and restart Cursor or use the MCP refresh action. LeadSnipper tools should appear in the agent/tool list.",
        },
      ];

    case "generic":
      return [
        {
          title: "Remote Streamable HTTP endpoint",
          body: `MCP URL: ${mcpUrl}. Send Authorization: Bearer ${apiKey} on every request.`,
        },
        {
          title: "Client-specific setup",
          body: "If your client only supports stdio, use npx mcp-remote with --header Authorization:${LEADSNIPPER_MCP_AUTH} and put Bearer <key> in an env var (same pattern as Claude Desktop).",
        },
      ];
  }
}

export const MCP_CLIENT_TABS: { id: McpClientTab; label: string }[] = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude Desktop" },
  { id: "cursor", label: "Cursor" },
  { id: "generic", label: "Other" },
];
