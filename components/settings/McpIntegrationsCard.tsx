"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
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
import {
  createMcpApiKey,
  listMcpApiKeys,
  revokeMcpApiKey,
  type CreateMcpKeyResponse,
  type McpApiKeyMeta,
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

export default function McpIntegrationsCard() {
  const [keys, setKeys] = useState<McpApiKeyMeta[]>([]);
  const [mcpUrl, setMcpUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [created, setCreated] = useState<CreateMcpKeyResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<McpApiKeyMeta | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [configTab, setConfigTab] = useState<"claude" | "cursor" | "generic">(
    "claude"
  );

  const loadKeys = async () => {
    try {
      setIsLoading(true);
      const data = await listMcpApiKeys();
      setKeys(data.keys || []);
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
      toast.error("Enter a name for this key (e.g. Claude Desktop)");
      return;
    }
    try {
      setCreating(true);
      const result = await createMcpApiKey(name);
      setCreated(result);
      setKeyName("");
      setMcpUrl(result.mcpUrl);
      await loadKeys();
      toast.success("MCP API key created — copy it now");
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
    if (configTab === "claude") {
      return JSON.stringify(created.clientConfigs.claudeDesktop, null, 2);
    }
    if (configTab === "cursor") {
      return JSON.stringify(created.clientConfigs.cursor, null, 2);
    }
    return JSON.stringify(created.clientConfigs.generic, null, 2);
  }, [created, configTab]);

  return (
    <div className="space-y-4 border border-brand-main/20 rounded-xl p-5 bg-bg-100/40">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-main/10 p-2 text-brand-main">
          <IconPlug className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text-100">
            LeadSnipper MCP
          </h3>
          <p className="text-sm text-text-200 mt-1 leading-relaxed">
            Connect Claude, Cursor, ChatGPT, or other AI clients to your
            LeadSnipper workspace. AI can read campaigns, leads, analytics, and
            sending accounts — and edit draft or paused campaigns. AI cannot
            send, pause, or stop a running campaign.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-brand-main/15 bg-bg-200/60 p-3 space-y-2">
        <p className="text-xs font-medium text-text-200 uppercase tracking-wide">
          MCP server URL
        </p>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <code className="flex-1 text-xs sm:text-sm bg-bg-100 border border-brand-main/20 rounded-md px-3 py-2 text-text-100 break-all">
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
            placeholder="Key name (e.g. Claude Desktop)"
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
            No active MCP keys yet. Generate one to connect an AI client.
          </p>
        ) : (
          <ul className="divide-y divide-brand-main/10 rounded-lg border border-brand-main/15 overflow-hidden">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 bg-bg-200/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-100 truncate">
                    {key.name}
                  </p>
                  <p className="text-xs text-text-200 font-mono">
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

      <Dialog
        open={!!created}
        onOpenChange={(open) => {
          if (!open) setCreated(null);
        }}
      >
        <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-lg backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-text-100">
              Copy your MCP API key
            </DialogTitle>
            <DialogDescription className="text-text-200/80 text-left text-sm leading-relaxed">
              This key is shown only once. Paste it into Claude Desktop, Cursor,
              or another MCP client with the server URL below.
            </DialogDescription>
          </DialogHeader>

          {created ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-200 uppercase">
                  API key
                </p>
                <div className="flex gap-2 items-start">
                  <code className="flex-1 text-xs bg-bg-100 border border-brand-main/20 rounded-md px-3 py-2 text-text-100 break-all">
                    {created.key}
                  </code>
                  <CopyButton value={created.key} label="API key" />
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                {(
                  [
                    ["claude", "Claude"],
                    ["cursor", "Cursor"],
                    ["generic", "Generic"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setConfigTab(id)}
                    className={`px-3 py-1.5 rounded-md border transition-colors ${
                      configTab === id
                        ? "bg-brand-main text-white border-brand-main"
                        : "border-brand-main/30 text-text-200 hover:bg-bg-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-text-200 uppercase">
                    Client config
                  </p>
                  <CopyButton value={configJson} label="Config" />
                </div>
                <pre className="text-xs bg-bg-100 border border-brand-main/20 rounded-md px-3 py-2 text-text-100 overflow-x-auto max-h-48">
                  {configJson}
                </pre>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setCreated(null)}
              className="bg-brand-main hover:bg-brand-main/90 text-white"
            >
              Done
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
        <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-text-100">
              Revoke MCP key?
            </DialogTitle>
            <DialogDescription className="text-text-200/80 text-left text-sm leading-relaxed">
              {revokeTarget
                ? `“${revokeTarget.name}” (${revokeTarget.keyPrefix}…) will stop working immediately in all connected AI clients.`
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
