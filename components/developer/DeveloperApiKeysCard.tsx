"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
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

export default function DeveloperApiKeysCard() {
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
    <div className="rounded-2xl border border-brand-main/20 bg-bg-200/60 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-text-100 font-semibold text-lg">
            <IconKey className="w-5 h-5 text-brand-main" />
            Developer REST API
          </div>
          <p className="text-sm text-text-300 mt-1 max-w-2xl">
            Create API keys for programmatic email sending and campaign automation.
            Keys use the <code className="text-brand-main">ls_live_</code> prefix.
          </p>
        </div>
        <Link href="/email/docs">
          <Button variant="outline" size="sm" className="border-brand-main/40">
            <IconBook className="w-4 h-4 mr-1" />
            API docs
          </Button>
        </Link>
      </div>

      {!apiAccessEnabled && !isLoading && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          API access requires a Scale or Custom plan (current: {tierName || "none"}).{" "}
          <Link href="/email/pricing" className="underline font-medium">
            Upgrade in Billing
          </Link>
        </div>
      )}

      {apiBaseUrl && (
        <div className="text-sm text-text-300">
          Base URL: <code className="text-text-100">{apiBaseUrl}</code>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label className="text-sm text-text-300 block mb-1">Key name</label>
          <input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Production integration"
            disabled={!apiAccessEnabled || creating}
            className="w-full rounded-lg border border-brand-main/20 bg-bg-100 px-3 py-2 text-text-100"
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={!apiAccessEnabled || creating}
          className="bg-brand-main hover:bg-brand-main/90"
        >
          {creating ? "Creating…" : "Create API key"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_SCOPES.map((scope) => (
          <button
            key={scope}
            type="button"
            onClick={() => toggleScope(scope)}
            disabled={!apiAccessEnabled}
            className={`px-3 py-1 rounded-full text-xs border ${
              scopes.includes(scope)
                ? "border-brand-main bg-brand-main/20 text-text-100"
                : "border-brand-main/20 text-text-400"
            }`}
          >
            {scope}
          </button>
        ))}
      </div>

      {created && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
          <p className="text-sm font-medium text-emerald-100">
            Copy your key now — it won&apos;t be shown again.
          </p>
          <div className="flex gap-2 items-center">
            <code className="text-xs break-all text-text-100 flex-1">{created.key}</code>
            <CopyButton value={created.key} label="API key" />
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCreated(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-text-200">Active keys</h4>
        {isLoading ? (
          <p className="text-sm text-text-400">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-text-400">No API keys yet.</p>
        ) : (
          <ul className="divide-y divide-brand-main/10 rounded-xl border border-brand-main/15">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <div className="text-text-100 font-medium">{key.name}</div>
                  <div className="text-xs text-text-400">
                    {key.keyPrefix}… · {key.environment} · {key.scopes.join(", ")}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-300"
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
              Integrations using {revokeTarget?.name} will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? "Revoking…" : "Revoke key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
