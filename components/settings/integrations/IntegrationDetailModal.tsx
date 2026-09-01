"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IntegrationGuide from "./IntegrationGuide";
import IntegrationStatusBadge from "./IntegrationStatusBadge";
import type { IntegrationDefinition, IntegrationStatus } from "./types";

type DetailTab = "setup" | "guide";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "guide", label: "Integration guide" },
];

export default function IntegrationDetailModal({
  integration,
  status,
  onClose,
}: {
  integration: IntegrationDefinition | null;
  status: IntegrationStatus;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("setup");
  const integrationId = integration?.id;

  // Start each integration on the setup tab rather than inheriting the last one.
  useEffect(() => {
    if (integrationId) setTab("setup");
  }, [integrationId]);

  if (!integration) return null;

  const { icon: Icon, name, tagline, guide } = integration;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-bg-200 border border-brand-main/20 w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] gap-0 overflow-hidden p-0 backdrop-blur-xl">
        <DialogHeader className="space-y-4 border-b border-brand-main/15 px-6 pb-5 pt-6 text-left">
          <div className="flex items-start gap-3 pr-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-main/25 bg-brand-main/10 text-brand-main">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <DialogTitle className="text-lg font-semibold text-text-100">
                  {name}
                </DialogTitle>
                <IntegrationStatusBadge status={status} />
              </div>
              <DialogDescription className="mt-1 text-left text-sm leading-relaxed text-text-300">
                {tagline}
              </DialogDescription>
            </div>
          </div>

          <div
            role="tablist"
            aria-label={`${name} sections`}
            className="inline-flex gap-1 rounded-lg border border-brand-main/20 bg-bg-100 p-1"
          >
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-main ${
                  tab === id
                    ? "bg-brand-main text-white"
                    : "text-text-300 hover:text-text-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-11rem)] overflow-y-auto px-6 py-6">
          {/* Both stay mounted so switching tabs does not discard typed input. */}
          <div hidden={tab !== "setup"}>{integration.panel()}</div>
          <div hidden={tab !== "guide"}>
            <IntegrationGuide guide={guide} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
