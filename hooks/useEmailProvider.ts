"use client";

import { useCallback, useEffect, useState } from "react";
import { getEmailProvider, type SesProvider } from "@/utils/api/apiClient";
import { getSesCredentialsStatus } from "@/utils/api/emailClient";

export function useEmailProvider(): {
  sesProvider: SesProvider | null;
  sesConnected: boolean;
  /** BYO only: credentials saved and "Test connection" succeeded */
  sesVerified: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [sesProvider, setSesProvider] = useState<SesProvider | null>(null);
  const [sesConnected, setSesConnected] = useState(true);
  const [sesVerified, setSesVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const status = await getEmailProvider();
      const prov = (status.sesProvider as SesProvider) || null;
      setSesProvider(prov);

      if (prov === "custom") {
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
    } catch {
      setSesProvider(null);
      setSesVerified(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { sesProvider, sesConnected, sesVerified, loading, refetch };
}
