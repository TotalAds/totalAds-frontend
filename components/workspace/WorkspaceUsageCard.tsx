"use client";

import Link from "next/link";

import { useWorkspace } from "@/context/WorkspaceContext";
import { IconAlertTriangle, IconArrowUpRight } from "@tabler/icons-react";

function UsageMeter({
  label,
  used,
  max,
  atLimit,
}: {
  label: string;
  used: number;
  max: number;
  atLimit: boolean;
}) {
  const unlimited = max === 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span
          className={`font-semibold tabular-nums ${
            atLimit ? "text-amber-700" : "text-slate-900"
          }`}
        >
          {used} / {unlimited ? "∞" : max}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              atLimit
                ? "bg-amber-500"
                : pct >= 80
                  ? "bg-amber-400"
                  : "bg-brand-main"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function WorkspaceUsageCard() {
  const { activeWorkspace, billingAccount, canManageMembers } = useWorkspace();

  if (!canManageMembers || !activeWorkspace) return null;

  const seatsMax = activeWorkspace.maxSeats;
  const wsMax = billingAccount?.maxWorkspaces ?? 1;
  const seatsAtLimit = seatsMax > 0 && activeWorkspace.seatsUsed >= seatsMax;
  const wsAtLimit =
    billingAccount &&
    billingAccount.maxWorkspaces > 0 &&
    billingAccount.workspacesUsed >= billingAccount.maxWorkspaces;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Plan usage</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Tier:{" "}
            <span className="font-medium capitalize text-slate-800">
              {billingAccount?.tierName ?? "trial"}
            </span>
          </p>
        </div>
        <Link
          href="/email/pricing"
          className="inline-flex items-center gap-1 rounded-lg border border-brand-main/30 bg-brand-main/5 px-3 py-1.5 text-xs font-semibold text-brand-main transition-colors hover:bg-brand-main/10"
        >
          Upgrade plan
          <IconArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <UsageMeter
          label="Team seats (this workspace)"
          used={activeWorkspace.seatsUsed}
          max={seatsMax}
          atLimit={!!seatsAtLimit}
        />
        {billingAccount && (
          <UsageMeter
            label="Workspaces (account)"
            used={billingAccount.workspacesUsed}
            max={wsMax}
            atLimit={!!wsAtLimit}
          />
        )}
      </div>

      {(seatsAtLimit || wsAtLimit) && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            {seatsAtLimit && wsAtLimit
              ? "You've reached both seat and workspace limits on your current plan."
              : seatsAtLimit
                ? "You've used all team seats for this workspace. Upgrade to invite more members."
                : "You've reached the workspace limit on your plan. Upgrade to add more workspaces."}
          </p>
        </div>
      )}
    </div>
  );
}
