"use client";

import { useCallback, useEffect, useState } from "react";

import apiClient from "@/utils/api/apiClient";

import type { SupportMessage, SupportTicket } from "@/app/help/types";

const POLL_INTERVAL_MS = 30_000;

export type UseSupportTicketReturn = {
  ticket: SupportTicket | null;
  messages: SupportMessage[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useSupportTicket(
  ticketId: string | undefined,
  enabled = true
): UseSupportTicketReturn {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !ticketId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<{
        ticket: SupportTicket;
        messages: SupportMessage[];
      }>(`/support/tickets/${ticketId}`);

      setTicket(res.data.ticket);
      setMessages(
        [...(res.data.messages ?? [])].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
    } catch (err) {
      const normalized =
        err instanceof Error ? err : new Error("Failed to load ticket");
      setError(normalized);
      throw normalized;
    } finally {
      setLoading(false);
    }
  }, [enabled, ticketId]);

  useEffect(() => {
    if (!enabled || !ticketId) return;

    void refresh();

    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);
    const handleFocus = () => void refresh();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, ticketId, refresh]);

  return { ticket, messages, loading, error, refresh };
}
