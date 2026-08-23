"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  IconArrowRight,
  IconBrandOpenai,
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconShieldCheck,
} from "@tabler/icons-react";

import LeadSnipperBrandLockup from "@/components/common/LeadSnipperBrandLockup";
import GetLogo from "@/components/common/getLogo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHATGPT_MCP_APP_LABEL, CLAUDE_CONNECTOR_LABEL } from "@/components/settings/mcpSetupInstructions";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import { approveMcpOauth, previewMcpOauthClient } from "@/utils/api/mcpClient";

const ALLOWED_SCOPES = [
  "Read campaigns, leads, and analytics",
  "View sending accounts and domains",
  "Edit draft or paused campaigns",
];

const DENIED_SCOPES = [
  "Send email or launch campaigns",
  "Pause, stop, or control live campaigns",
  "Access your password or billing details",
];

function ChatGptMark() {
  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#10a37f] shadow-sm"
      aria-hidden
    >
      <IconBrandOpenai className="size-7 text-white" stroke={1.5} />
    </div>
  );
}

function ClaudeMark() {
  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#D97757] shadow-sm text-white text-lg font-semibold"
      aria-hidden
    >
      C
    </div>
  );
}

function ConnectionHeader({
  appName,
  clientLabel,
}: {
  appName: string;
  clientLabel: string;
}) {
  const isClaude = clientLabel === "Claude";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {isClaude ? <ClaudeMark /> : <ChatGptMark />}
        <div className="flex size-8 items-center justify-center rounded-full bg-brand-main/10 text-brand-main">
          <IconArrowRight className="size-4" stroke={2.5} />
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6] shadow-sm">
          <GetLogo width="22" height="22" color="#FFFFFF" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-text-400">
          {isClaude ? CLAUDE_CONNECTOR_LABEL : CHATGPT_MCP_APP_LABEL}
        </p>
        <p className="mt-1 text-sm text-text-300">
          <span className="font-medium text-text-100">{appName}</span> wants to connect
        </p>
      </div>
    </div>
  );
}

function ScopeList({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "allow" | "deny";
}) {
  const Icon = variant === "allow" ? IconCircleCheck : IconCircleX;
  const iconClass = variant === "allow" ? "text-emerald-500" : "text-text-400";

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-400">
        {title}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-text-200">
            <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} stroke={1.75} />
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-100 to-brand-main/[0.04] px-4 py-12">
      <Card className="w-full max-w-md border-brand-main/15 bg-bg-200/80 shadow-lg backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-3 py-14">
          <IconLoader2 className="size-8 animate-spin text-brand-main" />
          <p className="text-sm text-text-300">Loading authorization request…</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function McpOAuthConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "S256";
  const state = searchParams.get("state") || undefined;
  const scope = searchParams.get("scope") || undefined;
  const isClaude =
    redirectUri.includes("claude.ai") || redirectUri.includes("claude.com");
  const clientLabel = isClaude ? "Claude" : "ChatGPT";

  useEffect(() => {
    const run = async () => {
      if (!tokenStorage.getAccessToken()) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
        return;
      }

      if (!clientId || !redirectUri || !codeChallenge) {
        setError(
          `Missing OAuth parameters. Start the connection from ${clientLabel}.`
        );
        setLoading(false);
        return;
      }

      try {
        const preview = await previewMcpOauthClient({ clientId, redirectUri });
        setClientName(preview.clientName);
        setWorkspaceName(preview.workspaceName);
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

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-100 to-brand-main/[0.04] px-4 py-12">
        <Card className="w-full max-w-md border-red-500/20 bg-bg-200/90 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <IconCircleX className="size-6" />
            </div>
            <CardTitle className="text-xl text-text-100">Connection failed</CardTitle>
            <CardDescription className="text-text-300">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-6">
            <Button
              variant="outline"
              className="border-brand-main/30 text-text-100"
              onClick={() => router.push("/email/settings?tab=integrations")}
            >
              Back to Integrations
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-100 via-bg-100 to-brand-main/[0.06] px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex justify-center">
          <LeadSnipperBrandLockup size={40} />
        </div>

        <Card className="overflow-hidden border-brand-main/20 bg-bg-200/90 shadow-xl backdrop-blur-sm">
          <CardHeader className="border-b border-brand-main/10 bg-bg-100/50 pb-6 pt-8">
            <ConnectionHeader appName={clientName} clientLabel={clientLabel} />
            <CardTitle className="pt-4 text-center text-xl font-semibold text-text-100">
              Allow {clientLabel} to access LeadSnipper?
            </CardTitle>
            <CardDescription className="text-center text-text-300 leading-relaxed">
              If you allow this, {clientLabel} can use LeadSnipper tools on your behalf in{" "}
              <strong className="text-text-100">{workspaceName || "your workspace"}</strong>.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5 pt-6">
            <div className="rounded-xl border border-brand-main/15 bg-bg-100/60 p-4">
              <div className="mb-4 flex items-center gap-2 text-brand-main">
                <IconShieldCheck className="size-4" stroke={2} />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Permissions
                </span>
              </div>
              <div className="flex flex-col gap-5">
                <ScopeList title="This app can" items={ALLOWED_SCOPES} variant="allow" />
                <div className="h-px bg-brand-main/10" />
                <ScopeList title="This app cannot" items={DENIED_SCOPES} variant="deny" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-xs text-text-400 transition-colors hover:text-text-300"
            >
              <span>Technical details</span>
              <IconChevronDown
                className={`size-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
              />
            </button>
            {showDetails ? (
              <div className="rounded-lg border border-brand-main/10 bg-bg-100/40 px-3 py-2.5 text-xs text-text-400">
                <p>
                  <span className="font-medium text-text-300">Workspace:</span>{" "}
                  {workspaceName}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-text-300">App:</span> {clientName}
                </p>
                <p className="mt-1 break-all">
                  <span className="font-medium text-text-300">Callback:</span> {redirectUri}
                </p>
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-brand-main/10 bg-bg-100/30 pb-8 pt-6">
            <Button
              className="h-11 w-full bg-brand-main text-base font-medium text-white hover:bg-brand-main/90"
              disabled={approving}
              onClick={handleApprove}
            >
              {approving ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Allow access"
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-text-300 hover:text-text-100"
              disabled={approving}
              onClick={() => router.push("/email/settings?tab=integrations")}
            >
              Cancel
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-text-500">
              You can revoke this connection anytime in Settings → Integrations.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
