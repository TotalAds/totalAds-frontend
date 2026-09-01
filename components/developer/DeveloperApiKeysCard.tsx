"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconAlertTriangle,
  IconBook,
  IconCheck,
  IconCopy,
  IconKey,
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
  createDeveloperApiKey,
  listDeveloperApiKeys,
  revokeDeveloperApiKey,
  type CreateDeveloperKeyResponse,
  type DeveloperApiKeyMeta,
  type DeveloperApiScope,
} from "@/utils/api/developerApiClient";

const ALL_SCOPES: DeveloperApiScope[] = ["read", "write", "send"];

const SCOPE_LABELS: Record<DeveloperApiScope, string> = {
  read: "List campaigns, leads, analytics, senders",
  write: "Create and update leads, campaigns, lists",
  send: "Send emails and control campaign delivery",
};

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-brand-main/50 text-text-100 bg-bg-300/80 shrink-0 hover:bg-bg-300"
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

export default function DeveloperApiKeysCard({
  embedded = false,
}: {
  /** Render without the outer card chrome and title, for use inside a detail modal. */
  embedded?: boolean;
} = {}) {
  const [keys, setKeys] = useState<DeveloperApiKeyMeta[]>([]);
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiAccessEnabled, setApiAccessEnabled] = useState(false);
  const [tierName, setTierName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [scopes, setScopes] = useState<DeveloperApiScope[]>([...ALL_SCOPES]);
  const [created, setCreated] = useState<CreateDeveloperKeyResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<DeveloperApiKeyMeta | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadKeys = async () => {
    try {
      setIsLoading(true);
      const data = await listDeveloperApiKeys();
      setKeys(data.keys);
      setApiBaseUrl(data.apiBaseUrl);
      setApiAccessEnabled(data.apiAccessEnabled);
      setTierName(data.tierName);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const toggleScope = (scope: DeveloperApiScope) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreate = async () => {
    const trimmed = keyName.trim();
    if (!trimmed) {
      toast.error("Enter a key name");
      return;
    }
    if (scopes.length === 0) {
      toast.error("Select at least one scope");
      return;
    }
    try {
      setCreating(true);
      const result = await createDeveloperApiKey({ name: trimmed, scopes });
      setCreated(result);
      setKeyName("");
      await loadKeys();
      toast.success("API key created");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      setRevoking(true);
      await revokeDeveloperApiKey(revokeTarget.id);
      setRevokeTarget(null);
      await loadKeys();
      toast.success("API key revoked");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Failed to revoke key");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? "flex flex-col gap-6"
          : "backdrop-blur-xl bg-bg-200 border border-brand-main/25 rounded-xl p-6 md:p-8 flex flex-col gap-6 max-w-3xl shadow-lg shadow-black/10"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        {embedded ? null : (
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-main/20 border border-brand-main/35">
              <IconKey className="h-5 w-5 text-brand-main" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-100">Developer REST API</h3>
              <p className="text-sm text-text-300 mt-1 max-w-xl leading-relaxed">
                Programmatic access to send emails, run campaigns, and manage leads. Keys use the{" "}
                <code className="text-brand-main bg-brand-main/10 px-1 rounded text-xs">ls_live_</code>{" "}
                prefix and are scoped to this workspace.
              </p>
            </div>
          </div>
        )}
        <Link href="/email/docs" className={embedded ? "ml-auto" : undefined}>
          <Button
            variant="outline"
            size="sm"
            className="border-brand-main/45 text-text-100 bg-bg-300/60 hover:bg-bg-300"
          >
            <IconBook className="w-4 h-4 mr-1" />
            API docs
          </Button>
        </Link>
      </div>

      {!apiAccessEnabled && !isLoading && (
        <div
          role="alert"
          className="rounded-xl border-2 border-amber-500/70 bg-[#1a1408] px-4 py-4 flex gap-3"
        >
          <IconAlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-100">
              API access requires Scale or Custom
            </p>
            <p className="text-sm text-text-200 mt-1 leading-relaxed">
              Your current plan is{" "}
              <span className="font-medium text-white">{tierName || "none"}</span>. Upgrade to create
              API keys and send programmatically.{" "}
              <Link
                href="/email/pricing"
                className="text-amber-300 underline font-medium hover:text-amber-200"
              >
                View plans →
              </Link>
            </p>
          </div>
        </div>
      )}

      {apiBaseUrl && (
        <div className="rounded-lg border border-brand-main/20 bg-bg-300/50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-text-400 mb-1">Base URL</p>
          <code className="text-sm text-text-100 font-mono break-all">{apiBaseUrl}</code>
        </div>
      )}

      <div className="space-y-4 border-t border-brand-main/20 pt-6">
        <h4 className="text-sm font-semibold text-text-100">Create a new key</h4>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="dev-api-key-name" className="text-sm font-medium text-text-200 block mb-1.5">
              Key name
            </label>
            <input
              id="dev-api-key-name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Production integration"
              disabled={!apiAccessEnabled || creating}
              className="w-full rounded-lg border border-brand-main/30 bg-bg-300/80 px-3 py-2.5 text-text-100 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-brand-main/40 disabled:opacity-50"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!apiAccessEnabled || creating}
            className="bg-brand-main hover:bg-brand-main/90 text-white disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create API key"}
          </Button>
        </div>

        <div>
          <p className="text-xs font-medium text-text-300 mb-2">Scopes</p>
          <div className="flex flex-col gap-2">
            {ALL_SCOPES.map((scope) => (
              <label
                key={scope}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                  scopes.includes(scope)
                    ? "border-brand-main/50 bg-brand-main/15"
                    : "border-brand-main/20 bg-bg-300/40"
                } ${!apiAccessEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={() => toggleScope(scope)}
                  disabled={!apiAccessEnabled}
                  className="mt-0.5 accent-brand-main"
                />
                <span className="text-sm">
                  <span className="font-mono text-brand-main">{scope}</span>
                  <span className="text-text-400 ml-2">— {SCOPE_LABELS[scope]}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {created && (
        <div className="rounded-xl border-2 border-emerald-500/50 bg-[#0a1a12] p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-200">
            Copy your key now — it won&apos;t be shown again
          </p>
          <div className="flex gap-2 items-start rounded-lg bg-black/40 p-3 border border-emerald-500/30">
            <code className="text-xs break-all text-emerald-100 flex-1 font-mono leading-relaxed">
              {created.key}
            </code>
            <CopyButton value={created.key} label="API key" />
          </div>
          <Button variant="ghost" size="sm" className="text-text-400" onClick={() => setCreated(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="space-y-3 border-t border-brand-main/20 pt-6">
        <h4 className="text-sm font-semibold text-text-100">Active keys</h4>
        {isLoading ? (
          <p className="text-sm text-text-400">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-text-400 rounded-lg border border-dashed border-brand-main/25 px-4 py-6 text-center">
            No API keys yet. Create one above to get started.
          </p>
        ) : (
          <ul className="rounded-xl border border-brand-main/25 divide-y divide-brand-main/15 overflow-hidden bg-bg-300/30">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
              >
                <div>
                  <div className="text-text-100 font-medium">{key.name}</div>
                  <div className="text-xs text-text-400 mt-0.5 font-mono">
                    {key.keyPrefix}… · {key.environment} · {key.scopes.join(", ")}
                  </div>
                  {key.lastUsedAt && (
                    <div className="text-xs text-text-500 mt-0.5">
                      Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/40 text-red-300 bg-red-950/20 hover:bg-red-950/40"
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

      <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API key?</DialogTitle>
            <DialogDescription>
              Integrations using <strong>{revokeTarget?.name}</strong> will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={revoking}>
              {revoking ? "Revoking…" : "Revoke key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
