"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { MCP_ALERT_CLASS } from "@/components/settings/mcpSetupInstructions";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import {
  approveMcpOauth,
  previewMcpOauthClient,
} from "@/utils/api/mcpClient";

export default function McpOAuthConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "S256";
  const state = searchParams.get("state") || undefined;
  const scope = searchParams.get("scope") || undefined;

  useEffect(() => {
    const run = async () => {
      if (!tokenStorage.getAccessToken()) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
        return;
      }

      if (!clientId || !redirectUri || !codeChallenge) {
        setError("Missing OAuth parameters. Start connection from ChatGPT plugin setup.");
        setLoading(false);
        return;
      }

      try {
        const preview = await previewMcpOauthClient({ clientId, redirectUri });
        setClientName(preview.clientName);
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        setError(ax.response?.data?.message || "Invalid OAuth request");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [clientId, redirectUri, codeChallenge, router]);

  const handleApprove = async () => {
    try {
      setApproving(true);
      const { redirectUrl } = await approveMcpOauth({
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
        state,
        scope,
      });
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || "Failed to approve connection");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-text-300">
        Loading authorization request…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 space-y-4">
        <div className={MCP_ALERT_CLASS}>{error}</div>
        <Button variant="outline" onClick={() => router.push("/email/settings")}>
          Back to Integrations
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-100">Connect ChatGPT plugin</h1>
        <p className="text-text-300 mt-2 leading-relaxed">
          ChatGPT is requesting access to your LeadSnipper workspace through the{" "}
          <strong className="text-text-100">{clientName}</strong> OAuth app.
        </p>
      </div>

      <div className="rounded-xl border border-brand-main/20 bg-bg-200/60 p-4 text-sm text-text-300 space-y-2">
        <p>
          <span className="text-text-400">Plugin:</span> {clientName}
        </p>
        <p className="break-all">
          <span className="text-text-400">Callback:</span> {redirectUri}
        </p>
      </div>

      <div className={MCP_ALERT_CLASS}>
        LeadSnipper MCP can read campaigns, leads, and analytics, and edit draft or
        paused campaigns. It cannot send email or control live campaigns.
      </div>

      <div className="flex gap-3">
        <Button
          className="bg-brand-main hover:bg-brand-main/90 text-white flex-1"
          disabled={approving}
          onClick={handleApprove}
        >
          {approving ? "Approving…" : "Allow ChatGPT"}
        </Button>
        <Button
          variant="outline"
          className="border-brand-main/40 text-text-100"
          onClick={() => router.push("/email/settings")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
