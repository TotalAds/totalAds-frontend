"use client";

import { useCallback, useEffect, useState } from "react";
import { getEmailProvider, type SesProvider } from "@/utils/api/apiClient";
import { getSesCredentialsStatus } from "@/utils/api/emailClient";

export function useEmailProvider(): {
  sesProvider: SesProvider | null;
  sesConnected: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [sesProvider, setSesProvider] = useState<SesProvider | null>(null);
  const [sesConnected, setSesConnected] = useState(true);
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
        } catch {
          setSesConnected(false);
        }
      } else {
        setSesConnected(true);
      }
    } catch {
      setSesProvider(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { sesProvider, sesConnected, loading, refetch };
}
