"use client";

import Link from "next/link";

import { useWorkspace } from "@/context/WorkspaceContext";
import { WorkspaceRole } from "@/utils/api/workspaceClient";
import { IconLock } from "@tabler/icons-react";

export type WorkspaceRoleBannerVariant =
  | "dashboard"
  | "team-settings"
  | "viewer-action"
  | "editor-settings";

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

interface WorkspaceRoleBannerProps {
  variant: WorkspaceRoleBannerVariant;
  className?: string;
}

export default function WorkspaceRoleBanner({
  variant,
  className = "",
}: WorkspaceRoleBannerProps) {
  const { role, activeWorkspace } = useWorkspace();

  if (!role || !activeWorkspace) return null;

  if (variant === "dashboard") {
    if (role === "admin") return null;
    return (
      <div
        className={`flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm ${className}`}
      >
        <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <div>
          <p className="font-medium text-slate-900">
            {ROLE_LABELS[role]} access · {activeWorkspace.name}
          </p>
          {role === "viewer" ? (
            <p className="mt-1 text-slate-600">
              You can view workspace data, but you cannot create campaigns, add
              leads, send emails, or change settings. Contact a workspace admin if
              you need edit access.
            </p>
          ) : (
            <p className="mt-1 text-slate-600">
              You can manage campaigns and leads, but Team &amp; Workspaces,
              billing, and workspace settings are admin-only. Contact a workspace
              admin if you need those permissions.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "team-settings" && role !== "admin") {
    return (
      <div
        className={`rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950 ${className}`}
      >
        <p className="font-semibold">
          {ROLE_LABELS[role]} role — admin access required
        </p>
        <p className="mt-2">
          Team members, workspaces, billing, and workspace activity are managed
          by admins for <strong>{activeWorkspace.name}</strong>. Contact your
          workspace admin if you need changes.
        </p>
        <Link
          href="/email/dashboard"
          className="mt-3 inline-block font-semibold text-amber-900 underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (variant === "viewer-action" && role === "viewer") {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 ${className}`}
      >
        <p className="font-semibold text-slate-900">View-only access</p>
        <p className="mt-2">
          Viewers cannot create or edit in <strong>{activeWorkspace.name}</strong>.
          You can browse existing data, but creating campaigns, adding leads, and
          sending emails are disabled. Ask a workspace admin to upgrade your role
          to Editor if you need to make changes.
        </p>
      </div>
    );
  }

  if (variant === "editor-settings" && role === "editor") {
    return (
      <div
        className={`rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-950 ${className}`}
      >
        <p className="font-semibold">Editor access</p>
        <p className="mt-2">
          Billing, team management, and workspace settings are limited to admins
          for <strong>{activeWorkspace.name}</strong>.
        </p>
      </div>
    );
  }

  return null;
}
