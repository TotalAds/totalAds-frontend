"use client";

import { IconFileSpreadsheet, IconMail, IconUpload } from "@tabler/icons-react";

type SmtpBulkModeChoiceProps = {
  onSelectSingle: () => void;
  onSelectBulk: () => void;
  onBack: () => void;
};

function ChoiceCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-brand-main/40 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </button>
  );
}

export function SmtpBulkModeChoice({
  onSelectSingle,
  onSelectBulk,
  onBack,
}: SmtpBulkModeChoiceProps) {
  return (
    <div className="space-y-4 px-6 py-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Select another provider
        </button>
        <h3 className="text-xl font-semibold text-slate-900">Any provider</h3>
        <p className="mt-1 text-sm text-slate-500">
          Connect a single IMAP/SMTP mailbox or import many accounts from CSV.
        </p>
      </div>

      <div className="space-y-3">
        <ChoiceCard
          icon={<IconUpload className="h-6 w-6" />}
          title="Any Provider — Bulk Import from CSV"
          description="Upload a CSV with IMAP/SMTP details and daily limits. We verify each account in the background."
          onClick={onSelectBulk}
        />
        <ChoiceCard
          icon={<IconMail className="h-6 w-6" />}
          title="Any Provider — Single Account"
          description="Walk through identity, IMAP, and SMTP for one mailbox."
          onClick={onSelectSingle}
        />
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <IconFileSpreadsheet className="h-3.5 w-3.5" />
        Recommended for agencies connecting multiple inboxes at once.
      </p>
    </div>
  );
}
