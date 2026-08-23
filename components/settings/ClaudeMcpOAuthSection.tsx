"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { IconCheck, IconCopy, IconPlugConnected, IconTrash } from "@tabler/icons-react";

import {
  CLAUDE_CONNECTOR_LABEL,
  CLAUDE_MCP_REDIRECT_URI,
  getClaudePreCreateSteps,
  getClaudeSetupFields,
  getMcpSetupSteps,
  MCP_ALERT_CLASS,
  MCP_ONE_TIME_NOTICE,
} from "@/components/settings/mcpSetupInstructions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createMcpOauthClient,
  formatChatgptPluginSetup,
  getOauthClientProvider,
  revokeMcpOauthClient,
  type CreateMcpOauthClientResponse,
  type McpOAuthEndpoints,
  type McpOauthClientMeta,
} from "@/utils/api/mcpClient";

function CopyButton({ value, label }: { value: string; label?: string }) {
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
      {copied ? <IconCheck className="w-4 h-4 mr-1" /> : <IconCopy className="w-4 h-4 mr-1" />}
      Copy
    </Button>
  );
}

type Props = {
  oauthClients: McpOauthClientMeta[];
  oauth: McpOAuthEndpoints;
  onRefresh: () => Promise<void>;
};

export default function ClaudeMcpOAuthSection({
  oauthClients,
  oauth,
  onRefresh,
}: Props) {
  const [appName, setAppName] = useState("LeadSnipper");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreateMcpOauthClientResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<McpOauthClientMeta | null>(null);
  const [revoking, setRevoking] = useState(false);

  const claudeClients = oauthClients.filter(
    (c) => getOauthClientProvider(c) === "claude"
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = appName.trim();
    if (!name) {
      toast.error("App name is required");
      return;
    }
    try {
      setCreating(true);
      const result = await createMcpOauthClient({
        name,
        redirectUri: CLAUDE_MCP_REDIRECT_URI,
      });
      setCreated(result);
      await onRefresh();
      toast.success("Claude OAuth app created — copy Client ID and Secret now");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || "Failed to create OAuth app");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      setRevoking(true);
      await revokeMcpOauthClient(revokeTarget.id);
      setRevokeTarget(null);
      await onRefresh();
      toast.success("Claude OAuth app revoked");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || "Failed to revoke OAuth app");
    } finally {
      setRevoking(false);
    }
  };

  const connector = created?.connector || created?.chatgptPlugin;
  const pluginSummary = connector
    ? formatChatgptPluginSetup(
        { ...connector, provider: "claude" },
        { includeSecret: false }
      )
    : "";
  const postCreateSteps = connector
    ? getMcpSetupSteps("claude", oauth.mcpUrl, "", oauth, {
        ...connector,
        provider: "claude",
      }).slice(2)
    : [];
  const setupFields = getClaudeSetupFields(oauth, {
    ...connector,
    provider: "claude",
    oauthClientSecret: created?.clientSecret,
  });
  const preCreateSteps = getClaudePreCreateSteps();

  return (
    <div className="rounded-xl border border-brand-main/25 bg-bg-200/40 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-main/15 p-2 text-brand-main">
          <IconPlugConnected className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-text-100">{CLAUDE_CONNECTOR_LABEL}</h4>
          <p className="text-sm text-text-300 mt-1 leading-relaxed">
            Connect LeadSnipper to Claude.ai via{" "}
            <strong className="text-text-200">Add custom connector</strong>. Paste{" "}
            <strong className="text-text-200">OAuth Client ID</strong> and{" "}
            <strong className="text-text-200">OAuth Client Secret</strong> under Advanced
            settings — not your <code className="text-brand-main">ls_mcp_*</code> API key.
          </p>
        </div>
      </div>

      <div className={`${MCP_ALERT_CLASS} text-xs`}>{MCP_ONE_TIME_NOTICE}</div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-text-400">
          Before you connect — in Claude
        </p>
        <ol className="space-y-3">
          {preCreateSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-main/20 text-brand-main text-xs font-bold">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-text-100">{step.title}</p>
                <p className="text-text-300 leading-relaxed">{step.body}</p>
                {step.warning ? (
                  <p className={`${MCP_ALERT_CLASS} text-xs mt-2`}>{step.warning}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-brand-main/15 pt-4 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-text-400">
          Step {preCreateSteps.length + 1} — in LeadSnipper
        </p>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-300 block mb-1">
              Connector name
            </label>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="LeadSnipper"
              className="w-full rounded-lg border border-brand-main/30 bg-bg-100 px-3 py-2 text-sm text-text-100"
            />
            <p className="text-xs text-text-500 mt-1">
              Use the same name in Claude’s “Name” field.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-text-300 block mb-1">
              Claude callback URL (fixed)
            </label>
            <code className="block w-full rounded-lg border border-brand-main/30 bg-bg-100 px-3 py-2 text-xs text-text-300 font-mono break-all">
              {CLAUDE_MCP_REDIRECT_URI}
            </code>
            <p className="text-xs text-text-500 mt-1">
              Registered automatically — Claude always uses this redirect URI.
            </p>
          </div>
          <Button
            type="submit"
            disabled={creating || !appName.trim()}
            className="bg-brand-main hover:bg-brand-main/90 text-white"
          >
            {creating ? "Creating…" : "Create Claude OAuth app"}
          </Button>
        </form>
      </div>

      {claudeClients.length > 0 ? (
        <ul className="divide-y divide-brand-main/10 rounded-lg border border-brand-main/15 overflow-hidden">
          {claudeClients.map((client) => (
            <li
              key={client.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 bg-bg-100/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-100 truncate">{client.name}</p>
                <p className="text-xs font-mono text-text-400 truncate">{client.clientId}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-500/40 text-red-400 shrink-0"
                onClick={() => setRevokeTarget(client)}
              >
                <IconTrash className="w-4 h-4 mr-1" />
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={!!created} onOpenChange={(open) => !open && setCreated(null)}>
        <DialogContent className="bg-bg-200 border border-brand-main/20 w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-100">Configure Claude custom connector</DialogTitle>
            <DialogDescription className="text-text-300 text-left">
              Copy these into Claude → Add custom connector. Client Secret is shown once —
              store it securely.
            </DialogDescription>
          </DialogHeader>

          {created && connector ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs uppercase text-text-400">OAuth Client ID</p>
                  <CopyButton value={connector.oauthClientId} label="Client ID" />
                </div>
                <code className="block p-2 rounded bg-bg-100 text-xs break-all text-text-100">
                  {connector.oauthClientId}
                </code>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs uppercase text-text-400">OAuth Client Secret (once)</p>
                  <CopyButton value={created.clientSecret} label="Client Secret" />
                </div>
                <code className="block p-2 rounded bg-bg-100 text-xs break-all text-text-100">
                  {created.clientSecret}
                </code>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-text-400">
                  Claude form — fill in this order
                </p>
                <div className="rounded-xl border border-brand-main/20 overflow-hidden divide-y divide-brand-main/10">
                  {setupFields.map((row) => (
                    <div
                      key={`${row.section}-${row.field}`}
                      className="px-3 py-2.5 bg-bg-100/40 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-text-500">
                            {row.order}. {row.section}
                          </p>
                          <p className="text-sm font-medium text-text-100">{row.field}</p>
                        </div>
                        {row.copyable ? (
                          <CopyButton value={row.value} label={row.field} />
                        ) : null}
                      </div>
                      <code className="block text-xs text-text-300 break-all">{row.value}</code>
                      {row.hint ? (
                        <p className="text-xs text-text-500">{row.hint}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <ol className="space-y-3">
                {postCreateSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-main/20 text-brand-main text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-text-100">{step.title}</p>
                      <p className="text-text-300 leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex justify-between items-center">
                <p className="text-xs uppercase text-text-400">Setup checklist (no secret)</p>
                <CopyButton value={pluginSummary} label="Setup checklist" />
              </div>
              <pre className="max-h-48 overflow-y-auto p-3 rounded bg-bg-100 text-xs text-text-100 whitespace-pre-wrap">
                {pluginSummary}
              </pre>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setCreated(null)} className="bg-brand-main text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke Claude OAuth app?</DialogTitle>
            <DialogDescription>
              {revokeTarget?.name} will stop working in Claude immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white"
              disabled={revoking}
              onClick={handleRevoke}
            >
              {revoking ? "Revoking…" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
