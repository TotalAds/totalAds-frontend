"use client";

import Link from "next/link";

import { useWorkspace } from "@/context/WorkspaceContext";
import { IconAlertTriangle, IconArrowUpRight } from "@tabler/icons-react";

export default function WorkspaceLimitBanner() {
  const { activeWorkspace, billingAccount, canManageBilling, isLoading } =
    useWorkspace();

  if (isLoading || !canManageBilling || !activeWorkspace) return null;

  const seatLimit =
    activeWorkspace.maxSeats > 0 &&
    activeWorkspace.seatsUsed >= activeWorkspace.maxSeats;
  const seatNear =
    activeWorkspace.maxSeats > 0 &&
    activeWorkspace.seatsUsed >= activeWorkspace.maxSeats - 1 &&
    !seatLimit;

  const wsLimit =
    billingAccount &&
    billingAccount.maxWorkspaces > 0 &&
    billingAccount.workspacesUsed >= billingAccount.maxWorkspaces;
  const wsNear =
    billingAccount &&
    billingAccount.maxWorkspaces > 0 &&
    billingAccount.workspacesUsed >= billingAccount.maxWorkspaces - 1 &&
    !wsLimit;

  if (!seatLimit && !seatNear && !wsLimit && !wsNear) return null;

  const isAtLimit = seatLimit || wsLimit;
  const message = seatLimit
    ? `This workspace has reached its seat limit (${activeWorkspace.seatsUsed}/${activeWorkspace.maxSeats}).`
    : wsLimit
      ? `Your plan has reached its workspace limit (${billingAccount?.workspacesUsed}/${billingAccount?.maxWorkspaces}).`
      : seatNear
        ? `This workspace is almost at its seat limit (${activeWorkspace.seatsUsed}/${activeWorkspace.maxSeats}).`
        : `Your plan is almost at its workspace limit (${billingAccount?.workspacesUsed}/${billingAccount?.maxWorkspaces}).`;

  return (
    <div
      className={`mx-4 mt-4 mb-0 flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${
        isAtLimit
          ? "border-amber-400 bg-amber-50"
          : "border-amber-200 bg-amber-50/90"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isAtLimit ? "bg-amber-100" : "bg-amber-100/80"
        }`}
      >
        <IconAlertTriangle
          className={`h-5 w-5 ${isAtLimit ? "text-amber-700" : "text-amber-600"}`}
        />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-amber-950">
          {isAtLimit ? "Plan limit reached" : "Approaching plan limit"}
        </p>
        <p className="mt-0.5 text-amber-900/90">{message}</p>
      </div>
      <Link
        href="/email/pricing"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Upgrade
        <IconArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
