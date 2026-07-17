"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getEmailProvider,
  type EmailProviderStatus,
  type PrimarySendingMethod,
  type SesProvider,
} from "@/utils/api/apiClient";
import { getSesCredentialsStatus, listSendingAccounts } from "@/utils/api/emailClient";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  isConnectedInboxSendingUser,
  isManagedSendingUser,
  usesByoSesCredentials,
  usesSesDomains,
  type UserSendingContext,
} from "@/lib/pricingTierSes";

export function useEmailProvider(): {
  sesProvider: SesProvider | null;
  primarySendingMethod: PrimarySendingMethod | null;
  sesServiceEnabled: boolean;
  sesServiceMode: "managed_ses" | "byo_ses" | null;
  customPlanLimits: EmailProviderStatus["customPlanLimits"];
  sesConnected: boolean;
  sesVerified: boolean;
  isManagedSes: boolean;
  isByoSes: boolean;
  usesSesDomains: boolean;
  isConnectedInboxUser: boolean;
  hasConnectedSendingAccount: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [sesProvider, setSesProvider] = useState<SesProvider | null>(null);
  const [primarySendingMethod, setPrimarySendingMethod] =
    useState<PrimarySendingMethod | null>(null);
  const [sesServiceEnabled, setSesServiceEnabled] = useState(false);
  const [sesServiceMode, setSesServiceMode] = useState<"managed_ses" | "byo_ses" | null>(null);
  const [customPlanLimits, setCustomPlanLimits] = useState<EmailProviderStatus["customPlanLimits"]>(null);
  const [sesConnected, setSesConnected] = useState(true);
  const [sesVerified, setSesVerified] = useState(false);
  const [hasConnectedSendingAccount, setHasConnectedSendingAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const workspaceKey = activeWorkspace?.id ?? null;

  const sendingCtx: UserSendingContext = useMemo(
    () => ({
      sesProvider,
      primarySendingMethod,
      sesServiceEnabled,
      sesServiceMode,
    }),
    [sesProvider, primarySendingMethod, sesServiceEnabled, sesServiceMode]
  );

  const isManagedSes = isManagedSendingUser(sendingCtx);
  const isByoSes = usesByoSesCredentials(sendingCtx);
  const showSesDomains = usesSesDomains(sendingCtx);
  const isConnectedInboxUser = isConnectedInboxSendingUser(sendingCtx);

  const refetch = useCallback(async () => {
    try {
      const status = await getEmailProvider();
      const prov = (status.sesProvider as SesProvider) || null;
      const method = status.primarySendingMethod ?? null;
      setSesProvider(prov);
      setPrimarySendingMethod(method);
      setSesServiceEnabled(!!status.sesServiceEnabled);
      setSesServiceMode(status.sesServiceMode ?? null);
      setCustomPlanLimits(status.customPlanLimits ?? null);

      const ctx = {
        sesProvider: prov,
        primarySendingMethod: method,
        sesServiceEnabled: !!status.sesServiceEnabled,
        sesServiceMode: status.sesServiceMode ?? null,
      };

      if (usesByoSesCredentials(ctx)) {
        try {
          const creds = await getSesCredentialsStatus();
          setSesConnected(creds.connected);
          setSesVerified(!!creds.isVerified);
        } catch {
          setSesConnected(false);
          setSesVerified(false);
        }
      } else {
        setSesConnected(true);
        setSesVerified(true);
      }

      if (
        method === "gmail" ||
        method === "outlook" ||
        method === "zoho" ||
        method === "smtp"
      ) {
        try {
          const accounts = await listSendingAccounts();
          const hasAccount = accounts.some(
            (a) =>
              a.provider === method ||
              (method === "gmail" && a.provider === "gmail") ||
              (method === "outlook" && a.provider === "outlook") ||
              (method === "zoho" && a.provider === "zoho") ||
              (method === "smtp" && a.provider === "smtp")
          );
          setHasConnectedSendingAccount(hasAccount);
        } catch {
          setHasConnectedSendingAccount(false);
        }
      } else {
        setHasConnectedSendingAccount(true);
      }
    } catch {
      setSesProvider(null);
      setPrimarySendingMethod(null);
      setSesVerified(false);
      setHasConnectedSendingAccount(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (workspaceLoading) return;
    void refetch();
  }, [refetch, workspaceLoading, workspaceKey]);

  return {
    sesProvider,
    primarySendingMethod,
    sesServiceEnabled,
    sesServiceMode,
    customPlanLimits,
    sesConnected,
    sesVerified,
    isManagedSes,
    isByoSes,
    usesSesDomains: showSesDomains,
    isConnectedInboxUser,
    hasConnectedSendingAccount,
    loading,
    refetch,
  };
}

/** @deprecated Alias for useEmailProvider */
export const useSendingSetup = useEmailProvider;
