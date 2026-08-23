"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { IconCheck, IconCopy, IconPlugConnected, IconTrash } from "@tabler/icons-react";

import {
  getChatgptOAuthFieldGuide,
  getChatgptPluginSummary,
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

export default function ChatgptMcpOAuthSection({
  oauthClients,
  oauth,
  onRefresh,
}: Props) {
  const [appName, setAppName] = useState("LeadSnipper ChatGPT");
  const [redirectUri, setRedirectUri] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreateMcpOauthClientResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<McpOauthClientMeta | null>(null);
  const [revoking, setRevoking] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = appName.trim();
    const uri = redirectUri.trim();
    if (!name || !uri) {
      toast.error("App name and ChatGPT Callback URL are required");
      return;
    }
    try {
      setCreating(true);
      const result = await createMcpOauthClient({ name, redirectUri: uri });
      setCreated(result);
      setRedirectUri("");
      await onRefresh();
      toast.success("OAuth app created — copy Client ID and Secret now");
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
      toast.success("OAuth app revoked");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || "Failed to revoke OAuth app");
    } finally {
      setRevoking(false);
    }
  };

  const pluginSummary = created
    ? getChatgptPluginSummary(created.chatgptPlugin)
    : "";
  const steps = getMcpSetupSteps("chatgpt", oauth.mcpUrl, "", oauth, created?.chatgptPlugin);
  const fieldGuide = getChatgptOAuthFieldGuide(oauth, created?.chatgptPlugin);

  return (
    <div className="rounded-xl border border-brand-main/25 bg-bg-200/40 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-main/15 p-2 text-brand-main">
          <IconPlugConnected className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-text-100">ChatGPT plugin (OAuth)</h4>
          <p className="text-sm text-text-300 mt-1 leading-relaxed">
            Create an OAuth app for ChatGPT&apos;s New Plugin form. Use{" "}
            <strong className="text-text-200">OAuth → User-Defined OAuth Client</strong> with
            the Client ID, Secret, and endpoints below — not your ls_mcp_* API key.
          </p>
        </div>
      </div>

      <div className={`${MCP_ALERT_CLASS} text-xs`}>{MCP_ONE_TIME_NOTICE}</div>

      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div className="rounded-lg border border-brand-main/15 bg-bg-100/60 p-3">
          <p className="text-text-400 uppercase tracking-wide mb-1">Authorization endpoint</p>
          <code className="text-text-100 break-all">{oauth.authorizationEndpoint}</code>
        </div>
        <div className="rounded-lg border border-brand-main/15 bg-bg-100/60 p-3">
          <p className="text-text-400 uppercase tracking-wide mb-1">Token endpoint</p>
          <code className="text-text-100 break-all">{oauth.tokenEndpoint}</code>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-text-300 block mb-1">App name</label>
          <input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="LeadSnipper ChatGPT"
            className="w-full rounded-lg border border-brand-main/30 bg-bg-100 px-3 py-2 text-sm text-text-100"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-300 block mb-1">
            ChatGPT Callback URL (required)
          </label>
          <input
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            placeholder="https://chatgpt.com/connector/oauth/…"
            className="w-full rounded-lg border border-brand-main/30 bg-bg-100 px-3 py-2 text-sm text-text-100 font-mono"
          />
          <p className="text-xs text-text-500 mt-1">
            Copy from ChatGPT → New Plugin → Advanced OAuth → Callback URL (read-only field with
            Copy button).
          </p>
        </div>
        <Button
          type="submit"
          disabled={creating || !redirectUri.trim()}
          className="bg-brand-main hover:bg-brand-main/90 text-white"
        >
          {creating ? "Creating…" : "Create ChatGPT OAuth app"}
        </Button>
      </form>

      {oauthClients.length > 0 ? (
        <ul className="divide-y divide-brand-main/10 rounded-lg border border-brand-main/15 overflow-hidden">
          {oauthClients.map((client) => (
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
            <DialogTitle className="text-text-100">ChatGPT plugin setup</DialogTitle>
            <DialogDescription className="text-text-300 text-left">
              Copy these values into ChatGPT → New Plugin. Client Secret is shown once.
            </DialogDescription>
          </DialogHeader>

          {created ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs uppercase text-text-400">OAuth Client ID</p>
                  <CopyButton value={created.chatgptPlugin.oauthClientId} label="Client ID" />
                </div>
                <code className="block p-2 rounded bg-bg-100 text-xs break-all text-text-100">
                  {created.chatgptPlugin.oauthClientId}
                </code>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs uppercase text-text-400">OAuth Client Secret</p>
                  <CopyButton value={created.clientSecret} label="Client Secret" />
                </div>
                <code className="block p-2 rounded bg-bg-100 text-xs break-all text-text-100">
                  {created.clientSecret}
                </code>
              </div>

              <ol className="space-y-3">
                {steps.map((step, i) => (
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

              <div className="rounded-xl border border-brand-main/20 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bg-300/80 text-text-300 text-left">
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldGuide.map((row) => (
                      <tr key={row.field} className="border-t border-brand-main/10 align-top">
                        <td className="px-3 py-2 text-text-200 whitespace-nowrap">{row.field}</td>
                        <td className="px-3 py-2 text-text-300 break-all">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs uppercase text-text-400">Full plugin form</p>
                <CopyButton value={pluginSummary} label="Plugin setup" />
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
            <DialogTitle>Revoke ChatGPT OAuth app?</DialogTitle>
            <DialogDescription>
              {revokeTarget?.name} will stop working in ChatGPT immediately.
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
