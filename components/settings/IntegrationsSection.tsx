"use client";

import { useMemo, useState } from "react";
import { IconLock, IconPlug } from "@tabler/icons-react";

import { useWorkspace } from "@/context/WorkspaceContext";
import IntegrationCard from "@/components/settings/integrations/IntegrationCard";
import IntegrationDetailModal from "@/components/settings/integrations/IntegrationDetailModal";
import {
  CATEGORY_DESCRIPTIONS,
  INTEGRATION_CATEGORY_ORDER,
  INTEGRATIONS,
} from "@/components/settings/integrations/integrationsRegistry";
import { useIntegrationStatuses } from "@/components/settings/integrations/useIntegrationStatuses";
import type {
  IntegrationDefinition,
  IntegrationId,
} from "@/components/settings/integrations/types";

const IntegrationsSection = () => {
  const { canManageBilling } = useWorkspace();
  const { statuses, refresh } = useIntegrationStatuses(canManageBilling);
  const [openId, setOpenId] = useState<IntegrationId | null>(null);

  const visible = useMemo(
    () =>
      INTEGRATIONS.filter(
        (integration) => canManageBilling || !integration.requiresBillingRole
      ),
    [canManageBilling]
  );

  const grouped = useMemo(() => {
    return INTEGRATION_CATEGORY_ORDER.map((category) => ({
      category,
      items: visible.filter((integration) => integration.category === category),
    })).filter((group) => group.items.length > 0);
  }, [visible]);

  const openIntegration: IntegrationDefinition | null =
    visible.find((integration) => integration.id === openId) ?? null;

  const connectedCount = visible.filter(
    (integration) => statuses[integration.id].state === "connected"
  ).length;

  const handleClose = () => {
    setOpenId(null);
    // Connecting or revoking inside the modal changes the tile badges.
    void refresh();
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-text-100">Integrations</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-main/25 bg-brand-main/10 px-2.5 py-1 text-xs font-medium text-text-200">
            <IconPlug className="h-3.5 w-3.5 text-brand-main" />
            {connectedCount} of {visible.length} connected
          </span>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-text-300">
          Connect AI clients over MCP, drive LeadSnipper from your own code, and wire
          up third-party services for verification and lead sync. Open any
          integration for its setup panel and a full step-by-step guide.
        </p>
      </header>

      {grouped.map(({ category, items }) => (
        <section key={category} className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-200">
              {category}
            </h3>
            <p className="max-w-2xl text-xs leading-relaxed text-text-400">
              {CATEGORY_DESCRIPTIONS[category]}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                status={statuses[integration.id]}
                onOpen={() => setOpenId(integration.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {!canManageBilling && (
        <p className="flex items-start gap-2.5 rounded-xl border border-brand-main/15 bg-bg-100/40 px-4 py-3 text-xs leading-relaxed text-text-400">
          <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-400" />
          Reoon and LeadHub are managed by workspace owners and admins. Ask an admin
          if you need one of them connected.
        </p>
      )}

      <IntegrationDetailModal
        integration={openIntegration}
        status={openIntegration ? statuses[openIntegration.id] : { state: "loading" }}
        onClose={handleClose}
      />
    </div>
  );
};

export default IntegrationsSection;
