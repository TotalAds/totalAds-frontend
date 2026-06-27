"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { buildInviteAuthQuery } from "@/utils/auth/productIntent";
import {
  acceptWorkspaceInvite,
  getWorkspaceInvitePreview,
  WorkspaceInvitePreview,
} from "@/utils/api/workspaceClient";
import { setActiveWorkspaceId } from "@/utils/workspace/storage";

function getApiErrorMessage(err: unknown, fallback: string) {
  const ax = err as {
    response?: { data?: { message?: string; payload?: { message?: string } } };
  };
  return (
    ax.response?.data?.message ||
    ax.response?.data?.payload?.message ||
    fallback
  );
}

export default function WorkspaceInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state, logoutUser } = useAuthContext();
  const token = searchParams.get("token");

  const [preview, setPreview] = useState<WorkspaceInvitePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [emailMismatch, setEmailMismatch] = useState(false);
  const acceptStarted = useRef(false);

  const authQuery = useMemo(
    () => (token ? buildInviteAuthQuery(token, preview?.email) : null),
    [token, preview?.email]
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const data = await getWorkspaceInvitePreview(token);
        if (!cancelled) setPreview(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(
            getApiErrorMessage(err, "This invite is invalid or has expired")
          );
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const completeJoin = useCallback(
    async (workspaceId: number) => {
      setActiveWorkspaceId(workspaceId);
      setDone(true);
      toast.success("You've joined the workspace");
      setTimeout(() => {
        window.location.href = "/email/dashboard";
      }, 800);
    },
    []
  );

  const handleAccept = useCallback(async () => {
    if (!token || !state.user || accepting || done) return;

    if (
      preview &&
      state.user.email.toLowerCase() !== preview.email.toLowerCase()
    ) {
      setEmailMismatch(true);
      return;
    }

    setAccepting(true);
    try {
      const result = await acceptWorkspaceInvite(token);
      if (result?.workspaceId) {
        await completeJoin(result.workspaceId);
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to accept invite"));
    } finally {
      setAccepting(false);
    }
  }, [token, state.user, accepting, done, preview, completeJoin]);

  useEffect(() => {
    if (
      !token ||
      state.isLoading ||
      !state.isAuthenticated ||
      !state.user ||
      done ||
      emailMismatch ||
      acceptStarted.current
    ) {
      return;
    }

    if (
      preview &&
      state.user.email.toLowerCase() !== preview.email.toLowerCase()
    ) {
      setEmailMismatch(true);
      return;
    }

    acceptStarted.current = true;
    void handleAccept();
  }, [
    token,
    state.isLoading,
    state.isAuthenticated,
    state.user,
    preview,
    done,
    emailMismatch,
    handleAccept,
  ]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md border-slate-200">
          <CardHeader>
            <CardTitle>Invalid invite</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            This invite link is missing a token.
          </CardContent>
        </Card>
      </div>
    );
  }

  const loginHref = authQuery ? `/login?${authQuery.toString()}` : "/login";
  const signupHref = authQuery
    ? `/signup?${authQuery.toString()}`
    : "/signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="text-slate-900">Workspace invitation</CardTitle>
          {preview && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                You&apos;ve been invited to join{" "}
                <span className="font-semibold text-slate-900">
                  {preview.workspaceName}
                </span>{" "}
                as{" "}
                <Badge variant="outline" className="capitalize">
                  {preview.role}
                </Badge>
              </p>
              <p className="mt-2 text-slate-500">
                Invitation sent to{" "}
                <span className="font-medium text-slate-700">{preview.email}</span>
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {previewLoading && (
            <p className="text-sm text-slate-500">Loading invitation…</p>
          )}

          {!previewLoading && previewError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {previewError}
              {state.isAuthenticated && (
                <div className="mt-3">
                  <Button size="sm" onClick={() => router.push("/email/dashboard")}>
                    Go to dashboard
                  </Button>
                </div>
              )}
            </div>
          )}

          {emailMismatch && preview && state.user && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p>
                You&apos;re signed in as <strong>{state.user.email}</strong>, but
                this invite was sent to <strong>{preview.email}</strong>.
              </p>
              <p className="mt-2">
                Sign in with the invited email address to join this workspace.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await logoutUser();
                    router.push(loginHref);
                  }}
                >
                  Sign in with another account
                </Button>
              </div>
            </div>
          )}

          {done && (
            <p className="text-sm text-slate-600">
              Redirecting to your workspace…
            </p>
          )}

          {!state.isLoading && !state.isAuthenticated && preview && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Sign in if you already have a LeadSnipper account, or create one
                to join this workspace automatically.
              </p>
              <Button className="w-full" asChild>
                <Link href={loginHref}>Sign in to accept</Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href={signupHref}>Create account & join</Link>
              </Button>
            </div>
          )}

          {!done &&
            state.isAuthenticated &&
            preview &&
            !emailMismatch &&
            (accepting || state.isLoading) && (
              <p className="text-sm text-slate-500">Joining workspace…</p>
            )}

          {!done &&
            state.isAuthenticated &&
            preview &&
            !emailMismatch &&
            !accepting && (
              <Button className="w-full" onClick={() => void handleAccept()}>
                Accept invitation
              </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
