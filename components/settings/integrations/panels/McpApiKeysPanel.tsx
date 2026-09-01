"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { IconCheck, IconCopy, IconKey, IconTrash } from "@tabler/icons-react";

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
  MCP_ALERT_CLASS,
  MCP_ONE_TIME_NOTICE,
  getMcpSetupSteps,
  type McpSetupStep,
} from "@/components/settings/mcpSetupInstructions";
import { useMcpData } from "@/components/settings/integrations/useMcpData";
import PanelLoading from "@/components/settings/integrations/panels/PanelLoading";
import {
  createMcpApiKey,
  revokeMcpApiKey,
  type CreateMcpKeyResponse,
  type McpApiKeyMeta,
} from "@/utils/api/mcpClient";

/**
 * Only clients that authenticate with an ls_mcp_ key. ChatGPT and Claude.ai are
 * excluded here because they require the OAuth flow in their own integrations.
 */
type KeyClientTab = "cursor" | "claude-desktop" | "generic";

const KEY_BASED_TABS: { id: KeyClientTab; label: string }[] = [
  { id: "cursor", label: "Cursor" },
  { id: "claude-desktop", label: "Claude Desktop" },
  { id: "generic", label: "Other client" },
];

function getKeyClientSteps(
  client: KeyClientTab,
  mcpUrl: string,
  apiKey: string
): McpSetupStep[] {
  if (client === "claude-desktop") {
    return [
      {
        title: "Open your Claude Desktop config",
        body: "Edit claude_desktop_config.json — on macOS it lives in ~/Library/Application Support/Claude, on Windows in %APPDATA%\\Claude.",
      },
      {
        title: "Merge the LeadSnipper server",
        body: "Add the JSON below inside the existing mcpServers object rather than replacing the file, so your other servers keep working.",
      },
      {
        title: "Quit and reopen Claude Desktop",
        body: "Claude Desktop only reads MCP config at launch. Fully quit the app — closing the window is not enough — then reopen and confirm the LeadSnipper tools are listed.",
      },
    ];
  }
  return getMcpSetupSteps(client, mcpUrl, apiKey);
}

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
}: {
  client: KeyClientTab;
  mcpUrl: string;
  apiKey: string;
}) {
  const steps = getKeyClientSteps(client, mcpUrl, apiKey);

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

export default function McpApiKeysPanel() {
  const { keys, mcpUrl, isLoading, refresh } = useMcpData();
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [created, setCreated] = useState<CreateMcpKeyResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<McpApiKeyMeta | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [configTab, setConfigTab] = useState<KeyClientTab>("cursor");

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = keyName.trim();
    if (!name) {
      toast.error("Enter a name for this key (e.g. Cursor or Claude Desktop)");
      return;
    }
    try {
      setCreating(true);
      const result = await createMcpApiKey(name);
      setCreated(result);
      setKeyName("");
      setConfigTab("cursor");
      await refresh();
      toast.success("MCP key created — copy the key and setup steps now");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create MCP key"
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
      await refresh();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to revoke MCP key"
      );
    } finally {
      setRevoking(false);
    }
  };

  const configJson = useMemo(() => {
    if (!created) return "";
    if (configTab === "claude-desktop") {
      return JSON.stringify(created.clientConfigs.claudeDesktop, null, 2);
    }
    if (configTab === "cursor") {
      return JSON.stringify(created.clientConfigs.cursor, null, 2);
    }
    return JSON.stringify(created.clientConfigs.generic, null, 2);
  }, [created, configTab]);

  return (
    <div className="space-y-5">
      <div role="note" className={`${MCP_ALERT_CLASS} text-xs`}>
        {MCP_ONE_TIME_NOTICE}
      </div>

      <div className="rounded-xl border border-brand-main/15 bg-bg-100/40 p-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-text-400">
          MCP server URL
        </p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 rounded-md border border-brand-main/20 bg-bg-100 px-3 py-2 font-mono text-xs text-text-100 break-all sm:text-sm">
            {mcpUrl || (isLoading ? "Loading…" : "Unavailable")}
          </code>
          {mcpUrl ? <CopyButton value={mcpUrl} label="MCP URL" /> : null}
        </div>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-200" />
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key name (e.g. Cursor — work laptop)"
            maxLength={80}
            className="w-full rounded-lg border border-brand-main/30 bg-bg-100 py-2 pl-9 pr-3 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main/40"
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
          <PanelLoading label="Loading keys…" />
        ) : keys.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-main/25 px-4 py-6 text-center text-sm text-text-400">
            No active MCP keys yet. Generate one to get connection instructions for
            your client.
          </p>
        ) : (
          <ul className="divide-y divide-brand-main/10 overflow-hidden rounded-lg border border-brand-main/15">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-3 bg-bg-100/40 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-100">
                    {key.name}
                  </p>
                  <p className="truncate font-mono text-xs text-text-300">
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
                  className="border-red-500/40 text-red-400 shrink-0"
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

      <Dialog open={!!created} onOpenChange={(open) => !open && setCreated(null)}>
        <DialogContent className="bg-bg-200 border border-brand-main/20 w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden backdrop-blur-xl">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-text-100">Connect your MCP client</DialogTitle>
            <DialogDescription className="text-text-200/80 text-left text-sm leading-relaxed">
              {MCP_ONE_TIME_NOTICE} Copy your key and follow the steps for your client
              before closing this dialog.
            </DialogDescription>
          </DialogHeader>

          {created ? (
            <div className="min-w-0 space-y-5">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-200">
                    MCP API key
                  </p>
                  <CopyButton value={created.key} label="MCP API key" />
                </div>
                <code className="block w-full break-all rounded-md border border-brand-main/20 bg-bg-100 px-3 py-2 font-mono text-xs leading-relaxed text-text-100">
                  {created.key}
                </code>
              </div>

              <div className="min-w-0 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-text-200">
                  Setup steps
                </p>

                <div className="inline-flex flex-wrap gap-1 rounded-lg border border-brand-main/20 bg-bg-100 p-1">
                  {KEY_BASED_TABS.map(({ id, label }) => (
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
                />
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-200">
                    {configTab === "claude-desktop"
                      ? "Merge into claude_desktop_config.json"
                      : configTab === "cursor"
                        ? "Merge into mcp.json"
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
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <DialogContent className="bg-bg-200 border border-brand-main/20 w-[calc(100vw-2rem)] max-w-md overflow-hidden backdrop-blur-xl">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-text-100">Revoke MCP key?</DialogTitle>
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
