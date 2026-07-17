"use client";

import { useCallback, useEffect, useState } from "react";

import type { SupportTicket } from "@/app/help/types";
import { supportAPI } from "@/utils/api/supportClient";

const POLL_INTERVAL_MS = 30_000;

export type UseSupportTicketsReturn = {
  tickets: SupportTicket[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useSupportTickets(enabled = true): UseSupportTicketsReturn {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const list = await supportAPI.listTickets();
      setTickets(list);
    } catch (err) {
      const normalized =
        err instanceof Error ? err : new Error("Failed to load tickets");
      setError(normalized);
      throw normalized;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    void refresh();

    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);
    const handleFocus = () => void refresh();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, refresh]);

  return { tickets, loading, error, refresh };
}
