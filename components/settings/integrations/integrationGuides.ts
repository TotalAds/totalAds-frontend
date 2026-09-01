import type { IntegrationGuideContent, IntegrationId } from "./types";

const MCP_CAPABILITIES = {
  allowed: [
    "Read campaigns, sequences, leads, lists, and sending accounts",
    "Read analytics: opens, clicks, replies, bounces, and deliverability health",
    "Create leads and lead lists",
    "Edit campaigns that are in draft or paused state",
  ],
  blocked: [
    "Sending email or starting a campaign",
    "Pausing, resuming, or stopping a campaign that is currently sending",
    "Editing billing, plan, or workspace membership",
  ],
};

export const INTEGRATION_GUIDES: Record<IntegrationId, IntegrationGuideContent> = {
  "developer-api": {
    summary:
      "A REST API for sending email, driving campaigns, and managing leads from your own backend. Keys are scoped to this workspace and carry the ls_live_ prefix.",
    worksWith: ["Any HTTP client", "Zapier / Make", "Your own backend", "n8n"],
    prerequisites: [
      "A Scale or Custom plan — API access is disabled on lower tiers",
      "Workspace owner or admin role to create and revoke keys",
      "At least one verified sending domain if you plan to use the send scope",
    ],
    steps: [
      {
        title: "Choose your scopes",
        body: "Scopes are fixed at creation time and cannot be edited later. Grant the narrowest set that your integration actually needs.",
        bullets: [
          "read — list campaigns, leads, analytics, and sending accounts",
          "write — create and update leads, campaigns, and lists",
          "send — send email and control campaign delivery",
        ],
      },
      {
        title: "Create the key",
        body: "Name the key after the system that will use it, for example 'Production backend' or 'Zapier'. A separate key per consumer means you can revoke one without breaking the others.",
      },
      {
        title: "Copy the secret immediately",
        body: "The full key is shown exactly once. Store it in your secret manager or environment config before dismissing the panel. If you lose it, revoke the key and create a new one.",
        warning:
          "Never commit an ls_live_ key to source control or ship it in frontend code — it grants full workspace access at the scopes you selected.",
      },
      {
        title: "Authenticate your requests",
        body: "Send the key as a bearer token against the base URL shown in the setup tab.",
        bullets: [
          "Header: Authorization: Bearer ls_live_…",
          "Content type: application/json",
        ],
      },
      {
        title: "Verify the connection",
        body: "Call a read-only endpoint first to confirm auth and scopes are correct before wiring up anything that sends email.",
      },
    ],
    troubleshooting: [
      {
        problem: "401 Unauthorized",
        fix: "The key was revoked, mistyped, or is missing the Bearer prefix. Check the key prefix in the active keys list matches the one you are sending.",
      },
      {
        problem: "403 Forbidden on a send endpoint",
        fix: "The key was created without the send scope. Scopes are immutable — create a new key with send enabled and revoke the old one.",
      },
      {
        problem: "Create API key button is disabled",
        fix: "Your plan does not include API access. Upgrade to Scale or Custom from the pricing page.",
      },
    ],
    security: [
      "Keys are hashed at rest — we can never show you the full value again.",
      "Revoking a key takes effect immediately across all servers.",
      "Rotate keys whenever someone with access to them leaves the team.",
    ],
    docsHref: "/email/docs",
    docsLabel: "Full API reference",
  },

  "mcp-chatgpt": {
    summary:
      "Connect LeadSnipper to ChatGPT as a custom MCP app so you can ask ChatGPT about your campaigns, leads, and deliverability in plain language. Authentication uses OAuth, not an API key.",
    worksWith: ["ChatGPT (Plus, Pro, Team, Enterprise)"],
    prerequisites: [
      "A ChatGPT plan that exposes Settings → Connectors → Advanced → Developer mode",
      "Workspace owner or admin role in LeadSnipper",
    ],
    steps: [
      {
        title: "Create the app shell in ChatGPT first",
        body: "In ChatGPT, go to Settings → Connectors → Create. Give it a name and paste the LeadSnipper MCP server URL from the setup tab. Choose OAuth as the authentication method and select User-Defined OAuth Client.",
        warning:
          "Do not paste an ls_mcp_ API key here. ChatGPT requires OAuth Client ID and Secret — API keys are for Cursor and Claude Desktop only.",
      },
      {
        title: "Copy the ChatGPT Callback URL",
        body: "Under Authentication → Advanced OAuth, ChatGPT generates a Callback URL that is unique to your app. Copy it. LeadSnipper needs to register it as an allowed redirect before the handshake will succeed.",
      },
      {
        title: "Register the OAuth app in LeadSnipper",
        body: "Back in the setup tab, paste the Callback URL and create the app. LeadSnipper returns a Client ID and a Client Secret.",
        warning: "The Client Secret is displayed once. Copy it before closing the dialog.",
      },
      {
        title: "Fill in the ChatGPT form",
        body: "Return to ChatGPT and paste each value in the order shown in the field guide: Client ID, Client Secret, Authorization endpoint, Token endpoint, Scopes, and Token auth method.",
      },
      {
        title: "Authorize and test",
        body: "Save the connector and click Connect. ChatGPT redirects you to LeadSnipper to approve access, then returns. Ask it something like 'list my active campaigns' to confirm the tools are live.",
      },
    ],
    capabilities: MCP_CAPABILITIES,
    troubleshooting: [
      {
        problem: "redirect_uri_mismatch during authorization",
        fix: "The Callback URL registered in LeadSnipper does not exactly match the one ChatGPT is sending. Copy it again — it must match character for character including any trailing path.",
      },
      {
        problem: "invalid_client at the token step",
        fix: "The Client Secret was truncated on paste, or the token auth method is not set to client_secret_post. Recheck both fields.",
      },
      {
        problem: "Connector saves but no tools appear",
        fix: "Developer mode is off, or authorization was never completed. Reopen the connector and click Connect to run the OAuth flow.",
      },
      {
        problem: "ChatGPT says it cannot send a campaign",
        fix: "That is intentional. MCP is read and draft-edit only — sending is never exposed to an AI client.",
      },
    ],
    security: [
      "Revoking the OAuth app in LeadSnipper cuts ChatGPT's access immediately.",
      "MCP access is scoped to this workspace only.",
      "Destructive actions on live campaigns are blocked at the server, not just hidden from the model.",
    ],
  },

  "mcp-claude": {
    summary:
      "Add LeadSnipper to Claude.ai as a custom connector. Unlike ChatGPT, Claude uses a fixed redirect URI, so you start in LeadSnipper and paste into Claude second.",
    worksWith: ["Claude.ai (Pro, Max, Team, Enterprise)"],
    prerequisites: [
      "A Claude plan that supports custom connectors",
      "Workspace owner or admin role in LeadSnipper",
    ],
    steps: [
      {
        title: "Create the OAuth app in LeadSnipper first",
        body: "Claude never shows you a callback URL — Anthropic uses one fixed redirect that LeadSnipper registers automatically. Name the connector in the setup tab and create it.",
      },
      {
        title: "Copy the Client ID and Secret",
        body: "Both are shown once. The Secret cannot be retrieved later; if you lose it, revoke the app and create a new one.",
      },
      {
        title: "Add the connector in Claude",
        body: "In Claude, open Settings → Connectors → Add custom connector. Enter the same name and paste the LeadSnipper MCP server URL.",
      },
      {
        title: "Open Advanced settings",
        body: "Claude hides the OAuth fields behind Advanced settings. Paste the Client ID and Client Secret there. There are only these fields — no callback URL to fill in.",
      },
      {
        title: "Connect and verify",
        body: "Save, then click Connect to run the OAuth handshake. Ask Claude to summarize your campaign analytics to confirm the tools loaded.",
      },
    ],
    capabilities: MCP_CAPABILITIES,
    troubleshooting: [
      {
        problem: "Claude shows 'connector failed to connect'",
        fix: "Usually a bad Client Secret. Revoke the OAuth app in LeadSnipper, create a fresh one, and paste both values again.",
      },
      {
        problem: "Looking for a callback URL field in Claude",
        fix: "There isn't one. Anthropic uses a fixed redirect that LeadSnipper already registered when you created the app.",
      },
      {
        problem: "Connector works in Claude.ai but not Claude Desktop",
        fix: "Claude Desktop reads a local JSON config instead of OAuth. Use the Other MCP clients integration and generate an ls_mcp_ key.",
      },
    ],
    security: [
      "Revoking the OAuth app in LeadSnipper disconnects Claude immediately.",
      "The connector cannot send email or control a running campaign.",
    ],
  },

  "mcp-api-keys": {
    summary:
      "Key-based MCP access for clients that read a local config file rather than running an OAuth flow — Cursor, Claude Desktop, and any custom MCP client.",
    worksWith: ["Cursor", "Claude Desktop", "Custom MCP clients"],
    prerequisites: [
      "An MCP client installed locally",
      "Access to the client's config file on your machine",
    ],
    steps: [
      {
        title: "Generate a key per client",
        body: "Name it after the machine and client, for example 'Cursor — work laptop'. One key per client means you can revoke a lost laptop without disrupting anything else.",
      },
      {
        title: "Copy the key and the generated config",
        body: "The ls_mcp_ key and the ready-made JSON block are shown once. Pick your client's tab in the dialog to get config in the right shape.",
        warning:
          "Closing the dialog discards the key permanently. If that happens, revoke it and generate a new one.",
      },
      {
        title: "Merge the config into your client",
        body: "Paste the JSON into the client's MCP config rather than replacing the file, so your existing servers stay intact.",
        bullets: [
          "Cursor — Settings → MCP, or ~/.cursor/mcp.json",
          "Claude Desktop — claude_desktop_config.json in your app support directory",
        ],
      },
      {
        title: "Restart the client",
        body: "Neither Cursor nor Claude Desktop hot-reloads MCP config. Fully quit and reopen, then check that the LeadSnipper tools are listed.",
      },
    ],
    capabilities: MCP_CAPABILITIES,
    troubleshooting: [
      {
        problem: "Tools do not appear after saving the config",
        fix: "The client was not fully restarted, or the JSON is malformed from a partial merge. Validate the file and relaunch.",
      },
      {
        problem: "Authentication errors on every tool call",
        fix: "The key was revoked or truncated on paste. Compare the key prefix in the active keys list against your config.",
      },
      {
        problem: "Trying to use an ls_mcp_ key with ChatGPT or Claude.ai",
        fix: "Those clients require OAuth. Use the ChatGPT MCP app or Claude connector integration instead.",
      },
    ],
    security: [
      "Keys are stored hashed — the plaintext value exists only in your config file.",
      "Revoke a key the moment a device it lives on is lost or decommissioned.",
      "The last used timestamp in the key list tells you whether a key is still in service.",
    ],
  },

  reoon: {
    summary:
      "Bring your own Reoon Email Verifier key to validate addresses during lead import and before a campaign sends. Results are cached per address and re-checked on the interval you set.",
    worksWith: ["Reoon Email Verifier"],
    prerequisites: [
      "A Reoon account with available verification credits",
      "Workspace owner or admin role in LeadSnipper",
    ],
    steps: [
      {
        title: "Create a Reoon account",
        body: "Sign up at reoon.com if you do not have an account. Reoon includes free credits, which is enough to test the integration end to end.",
      },
      {
        title: "Get your API key",
        body: "In the Reoon dashboard at app.reoon.com, open API or API Keys in the sidebar and generate a key. It is account-wide, so treat it like a password.",
      },
      {
        title: "Paste and connect",
        body: "Add the key in the setup tab. LeadSnipper validates it against Reoon immediately and reads your credit balance, so a bad key fails fast rather than silently at send time.",
      },
      {
        title: "Set the re-verification interval",
        body: "Cached results older than this interval are treated as unverified and sent to Reoon again. Three months is the default and suits most B2B lists; shorten it if you work in a high-churn industry.",
      },
      {
        title: "Watch your credit balance",
        body: "Verification runs at import and at campaign send. If credits run out mid-campaign, verification steps fail and unverified leads are held back rather than sent.",
      },
    ],
    troubleshooting: [
      {
        problem: "Key rejected on save",
        fix: "The key is inactive on Reoon's side or was copied with surrounding whitespace. Regenerate it in the Reoon dashboard and paste again.",
      },
      {
        problem: "Balance shows 'Not available'",
        fix: "Reoon's API did not return a balance on the last check. Use Refresh balance; if it persists, confirm the key still has API permission.",
      },
      {
        problem: "Leads keep getting re-verified",
        fix: "Your re-verification interval is shorter than the age of the cached results. Lengthen the interval to stop burning credits on stable addresses.",
      },
    ],
    security: [
      "The key is encrypted at rest with KMS and used only from our backend.",
      "Disconnecting removes the key from LeadSnipper but keeps cached verification results.",
      "Revoke the key in Reoon's dashboard too if you want to block API access on their side.",
    ],
    docsHref: "https://app.reoon.com/",
    docsLabel: "Open the Reoon dashboard",
  },

  leadhub: {
    summary:
      "Sync enriched leads from a LeadHub workspace, skip duplicate verification when LeadHub already validated the address, and auto-enrich records before a campaign sends.",
    worksWith: ["LeadHub"],
    prerequisites: [
      "A LeadHub workspace you administer",
      "A LeadHub service API key with the lh_ prefix",
      "Network access from LeadSnipper to your LeadHub API base URL",
    ],
    steps: [
      {
        title: "Find your LeadHub workspace ID",
        body: "In LeadHub, open Settings → Workspace and copy the Workspace ID. It is a UUID and identifies which workspace LeadSnipper reads from.",
      },
      {
        title: "Create a service API key",
        body: "In LeadHub, go to Settings → Service API keys and create a key dedicated to LeadSnipper. Using a dedicated key means you can revoke this integration without affecting anything else.",
      },
      {
        title: "Set the API base URL",
        body: "Point LeadSnipper at your LeadHub API host. Use the public HTTPS URL for a hosted deployment; a localhost URL only works if LeadHub runs alongside LeadSnipper.",
        warning:
          "A localhost base URL will fail in production because our servers cannot reach your machine.",
      },
      {
        title: "Connect and confirm the first sync",
        body: "After connecting, the panel shows the workspace, the API host, and the last sync time. Check for a last error before relying on the sync in a live campaign.",
      },
      {
        title: "Use Autopilot in the campaign builder",
        body: "Once connected, the LeadHub Autopilot panel appears in the campaign builder so you can pull enriched leads directly into a campaign.",
      },
    ],
    troubleshooting: [
      {
        problem: "Connection rejected",
        fix: "Most often the workspace ID and the API key belong to different LeadHub workspaces. Confirm both come from the same one.",
      },
      {
        problem: "Last error mentions a timeout or refused connection",
        fix: "The base URL is not reachable from our servers. Check it is a public HTTPS host and not localhost or a private IP.",
      },
      {
        problem: "Leads sync but are still queued for verification",
        fix: "LeadHub only reports verification status for addresses it validated itself. Anything it did not verify still goes through your normal verification step.",
      },
    ],
    security: [
      "The service API key is stored encrypted and used only from our backend.",
      "Disconnecting stops all syncing; leads already imported stay in your workspace.",
    ],
  },
};
