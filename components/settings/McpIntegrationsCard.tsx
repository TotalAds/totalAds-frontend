"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconKey,
  IconPlug,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ChatgptMcpOAuthSection from "@/components/settings/ChatgptMcpOAuthSection";
import {
  MCP_ALERT_CLASS,
  MCP_CLIENT_TABS,
  MCP_ONE_TIME_NOTICE,
  getChatgptOAuthFieldGuide,
  getChatgptPluginSummary,
  getMcpSetupSteps,
  type McpClientTab,
} from "@/components/settings/mcpSetupInstructions";
import {
  createMcpApiKey,
  listMcpApiKeys,
  revokeMcpApiKey,
  type CreateMcpKeyResponse,
  type McpApiKeyMeta,
  type McpOAuthEndpoints,
  type McpOauthClientMeta,
} from "@/utils/api/mcpClient";

function CopyButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-brand-main/40 text-text-100 shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(label ? `${label} copied` : "Copied");
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Failed to copy");
        }
      }}
    >
      {copied ? (
        <IconCheck className="w-4 h-4 mr-1" />
      ) : (
        <IconCopy className="w-4 h-4 mr-1" />
      )}
      Copy
    </Button>
  );
}

function SetupStepsList({
  client,
  mcpUrl,
  apiKey,
  oauth,
}: {
  client: McpClientTab;
  mcpUrl: string;
  apiKey: string;
  oauth?: McpOAuthEndpoints;
}) {
  const steps = getMcpSetupSteps(client, mcpUrl, apiKey, oauth, undefined);

  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3 text-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-main/20 text-brand-main text-xs font-bold">
            {index + 1}
          </span>
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-text-100">{step.title}</p>
            <p className="text-text-200 leading-relaxed">{step.body}</p>
            {step.bullets?.length ? (
              <ul className="list-disc list-inside space-y-1 text-xs text-text-300 leading-relaxed">
                {step.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {step.warning ? (
              <p className={`${MCP_ALERT_CLASS} text-xs`}>{step.warning}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function McpIntegrationsCard() {
  const [keys, setKeys] = useState<McpApiKeyMeta[]>([]);
  const [oauthClients, setOauthClients] = useState<McpOauthClientMeta[]>([]);
  const [oauth, setOauth] = useState<McpOAuthEndpoints | null>(null);
  const [mcpUrl, setMcpUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [created, setCreated] = useState<CreateMcpKeyResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<McpApiKeyMeta | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [configTab, setConfigTab] = useState<McpClientTab>("chatgpt");

  const loadKeys = async () => {
    try {
      setIsLoading(true);
      const data = await listMcpApiKeys();
      setKeys(data.keys || []);
      setOauthClients(data.oauthClients || []);
      setOauth(data.oauth || null);
      setMcpUrl(data.mcpUrl || "");
    } catch (error: any) {
      console.error("Failed to list MCP keys", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load MCP keys"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = keyName.trim();
    if (!name) {
      toast.error("Enter a name for this key (e.g. ChatGPT or Claude Desktop)");
      return;
    }
    try {
      setCreating(true);
      const result = await createMcpApiKey(name);
      setCreated(result);
      setKeyName("");
      setConfigTab("chatgpt");
      setMcpUrl(result.mcpUrl);
      await loadKeys();
      toast.success("MCP key created — copy the key and setup steps now");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create MCP key"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      setRevoking(true);
      await revokeMcpApiKey(revokeTarget.id);
      setRevokeTarget(null);
      toast.success("MCP API key revoked");
      await loadKeys();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to revoke MCP key"
      );
    } finally {
      setRevoking(false);
    }
  };

  const configJson = useMemo(() => {
    if (!created) return "";
    if (configTab === "chatgpt") {
      return oauth
        ? getChatgptPluginSummary({
            name: "LeadSnipper",
            mcpServerUrl: oauth.mcpUrl,
            authentication: "OAuth",
            clientSetupMethod: "User-Defined OAuth Client",
            oauthClientId: "(create OAuth app below)",
            oauthClientSecret: "(shown once at creation)",
            authorizationEndpoint: oauth.authorizationEndpoint,
            tokenEndpoint: oauth.tokenEndpoint,
            scopes: "openid email offline_access",
            tokenEndpointAuthMethod: "client_secret_post",
          })
        : "";
    }
    if (configTab === "claude") {
      return JSON.stringify(created.clientConfigs.claudeDesktop, null, 2);
    }
    if (configTab === "cursor") {
      return JSON.stringify(created.clientConfigs.cursor, null, 2);
    }
    return JSON.stringify(created.clientConfigs.generic, null, 2);
  }, [created, configTab, oauth]);

  return (
    <div className="space-y-4 border border-brand-main/20 rounded-xl p-5 bg-bg-100/40">
      <div role="note" className={`${MCP_ALERT_CLASS} flex gap-3`}>
        <IconAlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p>{MCP_ONE_TIME_NOTICE}</p>
      </div>

      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-main/10 p-2 text-brand-main">
          <IconPlug className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text-100">
            LeadSnipper MCP
          </h3>
          <p className="text-sm text-text-200 mt-1 leading-relaxed">
            Connect ChatGPT (plugin), Claude Desktop, Cursor, or other MCP clients.
            AI can read campaigns, leads, analytics, and sending accounts — and edit
            draft or paused campaigns. AI cannot send, pause, or stop a running
            campaign.
          </p>
          <p className="text-xs text-text-300 mt-2 leading-relaxed">
            <strong className="text-text-200">ChatGPT</strong> uses{" "}
            <strong className="text-text-200">Plugins</strong> with OAuth — create a ChatGPT
            OAuth app below. <strong className="text-text-200">Cursor</strong> and{" "}
            <strong className="text-text-200">Claude Desktop</strong> use{" "}
            <code className="text-brand-main">ls_mcp_*</code> API keys.
          </p>
        </div>
      </div>

      {oauth ? (
        <ChatgptMcpOAuthSection
          oauthClients={oauthClients}
          oauth={oauth}
          onRefresh={loadKeys}
        />
      ) : null}

      <div className="border-t border-brand-main/15 pt-4">
        <p className="text-sm font-medium text-text-100 mb-3">
          MCP API keys (Cursor & Claude Desktop)
        </p>

      <div className="rounded-lg border border-brand-main/15 bg-bg-200/60 p-3 space-y-2">
        <p className="text-xs font-medium text-text-200 uppercase tracking-wide">
          MCP server URL
        </p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 rounded-md border border-brand-main/20 bg-bg-100 px-3 py-2 font-mono text-xs text-text-100 break-all sm:text-sm">
            {mcpUrl || "Loading…"}
          </code>
          {mcpUrl ? <CopyButton value={mcpUrl} label="MCP URL" /> : null}
        </div>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-200" />
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key name (e.g. Claude Desktop, Cursor)"
            maxLength={80}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-main/30 bg-bg-100 text-text-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-main/40"
          />
        </div>
        <Button
          type="submit"
          disabled={creating || !keyName.trim()}
          className="bg-brand-main hover:bg-brand-main/90 text-white"
        >
          {creating ? "Creating…" : "Generate API key"}
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-sm font-medium text-text-100">Your keys</p>
        {isLoading ? (
          <p className="text-sm text-text-200">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-text-200">
            No active MCP keys yet. Generate one to see connection instructions for
            your AI client.
          </p>
        ) : (
          <ul className="divide-y divide-brand-main/10 rounded-lg border border-brand-main/15 overflow-hidden">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 bg-bg-200/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-100">
                    {key.name}
                  </p>
                  <p className="truncate font-mono text-xs text-text-200">
                    {key.keyPrefix}…
                    {key.lastUsedAt
                      ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}`
                      : " · never used"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-red-500/40 text-red-600 hover:bg-red-50 shrink-0"
                  onClick={() => setRevokeTarget(key)}
                >
                  <IconTrash className="w-4 h-4 mr-1" />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>

      <Dialog
        open={!!created}
        onOpenChange={(open) => {
          if (!open) setCreated(null);
        }}
      >
        <DialogContent className="bg-bg-200 border border-brand-main/20 w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden backdrop-blur-xl">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-text-100">
              Connect your AI client
            </DialogTitle>
            <DialogDescription className="text-text-200/80 text-left text-sm leading-relaxed">
              {MCP_ONE_TIME_NOTICE} Copy your key and follow the steps for your
              client before closing this dialog.
            </DialogDescription>
          </DialogHeader>

          {created ? (
            <div className="min-w-0 space-y-5">
              <div className={`${MCP_ALERT_CLASS} text-xs`}>
                <strong className="text-amber-50">ls_mcp_* keys</strong> are for Cursor and
                Claude Desktop. For ChatGPT, use the{" "}
                <strong className="text-amber-50">ChatGPT plugin (OAuth)</strong> section above.
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-200">
                    MCP API key
                  </p>
                  <CopyButton value={created.key} label="MCP API key" />
                </div>
                <code className="block w-full rounded-md border border-brand-main/20 bg-bg-100 px-3 py-2 font-mono text-xs leading-relaxed text-text-100 break-all">
                  {created.key}
                </code>
              </div>

              <div className="min-w-0 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-200">
                  Setup steps
                </p>

                <div className="inline-flex flex-wrap rounded-lg border border-brand-main/20 bg-bg-100 p-1 gap-1">
                  {MCP_CLIENT_TABS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setConfigTab(id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        configTab === id
                          ? "bg-brand-main text-white"
                          : "text-text-200 hover:text-text-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <SetupStepsList
                  client={configTab}
                  mcpUrl={created.mcpUrl}
                  apiKey={created.key}
                  oauth={oauth ?? undefined}
                />

                {configTab === "chatgpt" && oauth ? (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-200">
                      ChatGPT OAuth field guide
                    </p>
                    <div className="rounded-xl border border-brand-main/20 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-bg-300/80 text-text-300 text-left">
                            <th className="px-3 py-2">Field</th>
                            <th className="px-3 py-2">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getChatgptOAuthFieldGuide(oauth).map((row) => (
                            <tr key={row.field} className="border-t border-brand-main/10">
                              <td className="px-3 py-2 text-text-200">{row.field}</td>
                              <td className="px-3 py-2 text-text-300 break-all">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-text-500">
                      Create a ChatGPT OAuth app in the section above for Client ID and Secret.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-200">
                    {configTab === "chatgpt"
                      ? "Plugin form summary"
                      : configTab === "claude"
                        ? "Claude Desktop config (merge into claude_desktop_config.json)"
                        : configTab === "cursor"
                          ? "Cursor config (merge into mcp.json)"
                          : "Connection details"}
                  </p>
                  <CopyButton value={configJson} label="Config" />
                </div>

                <pre className="max-h-56 w-full overflow-y-auto whitespace-pre-wrap break-all rounded-md border border-brand-main/20 bg-bg-100 px-3 py-2 font-mono text-xs leading-relaxed text-text-100">
                  {configJson}
                </pre>
              </div>
            </div>
          ) : null}

          <DialogFooter className="min-w-0">
            <Button
              type="button"
              onClick={() => setCreated(null)}
              className="bg-brand-main hover:bg-brand-main/90 text-white"
            >
              I&apos;ve copied everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <DialogContent className="bg-bg-200 border border-brand-main/20 w-[calc(100vw-2rem)] max-w-md overflow-hidden backdrop-blur-xl">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-text-100">
              Revoke MCP key?
            </DialogTitle>
            <DialogDescription className="text-text-200/80 text-left text-sm leading-relaxed break-words">
              {revokeTarget
                ? `“${revokeTarget.name}” (${revokeTarget.keyPrefix}…) will stop working immediately. Create a new key if you need fresh setup instructions.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={revoking}
              onClick={() => setRevokeTarget(null)}
              className="border-brand-main/40 text-text-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={revoking}
              onClick={handleRevoke}
              className="bg-red-600 hover:bg-red-600/90 text-white"
            >
              {revoking ? "Revoking…" : "Revoke key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
