"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import {
  IconClock,
  IconLoader2,
  IconPlus,
  IconTicket,
} from "@tabler/icons-react";

import type { TicketPriority, TicketStatus } from "./types";

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  medium: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HelpPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading: authLoading } = state;

  const {
    tickets,
    loading,
    error: ticketsError,
  } = useSupportTickets(isAuthenticated && !authLoading);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (ticketsError) {
      console.error("Failed to load support tickets:", ticketsError);
      toast.error("Could not load your support tickets.");
    }
  }, [ticketsError]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="h-10 w-10 animate-spin text-brand-main mx-auto mb-3" />
          <p className="text-text-200">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-100">Support tickets</h1>
            <p className="text-text-200 text-sm mt-1">
              View and manage your help requests.
            </p>
          </div>
          <Link href="/help/new">
            <Button className="bg-brand-main hover:bg-brand-main/90 text-white">
              <IconPlus className="h-4 w-4 mr-2" />
              New ticket
            </Button>
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-bg-100 rounded-2xl border border-bg-200 p-10 text-center">
            <div className="w-14 h-14 bg-bg-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconTicket className="h-7 w-7 text-text-200" />
            </div>
            <h2 className="text-lg font-semibold text-text-100 mb-1">
              No tickets yet
            </h2>
            <p className="text-text-200 text-sm mb-5">
              Need help? Create your first support ticket and we&apos;ll get back to
              you shortly.
            </p>
            <Link href="/help/new">
              <Button className="bg-brand-main hover:bg-brand-main/90 text-white">
                <IconPlus className="h-4 w-4 mr-2" />
                Create a ticket
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/help/${ticket.id}`}
                className="block bg-bg-100 rounded-xl border border-bg-200 p-5 hover:border-brand-main/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-100 truncate pr-2">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm text-text-200 mt-0.5">
                      {ticket.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={priorityStyles[ticket.priority]}
                    >
                      {ticket.priority.charAt(0).toUpperCase() +
                        ticket.priority.slice(1)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={statusStyles[ticket.status]}
                    >
                      {ticket.status.charAt(0).toUpperCase() +
                        ticket.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center text-xs text-text-300">
                  <IconClock className="h-3.5 w-3.5 mr-1.5" />
                  Created {formatDate(ticket.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
