"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  PendingAttachmentList,
  TicketAttachments,
} from "@/components/help/TicketAttachments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/context/AuthContext";
import { useSupportTicket } from "@/hooks/useSupportTicket";
import { supportAPI } from "@/utils/api/supportClient";
import {
  SUPPORT_FILE_ACCEPT,
  MAX_SUPPORT_FILE_BYTES,
} from "@/utils/support/uploadAttachment";
import {
  IconArrowLeft,
  IconClock,
  IconHash,
  IconLoader2,
  IconMessage,
  IconPaperclip,
  IconSend,
  IconTicket,
} from "@tabler/icons-react";

import type {
  SupportMessage,
  TicketPriority,
  TicketStatus,
} from "../types";
import {
  formatTicketStatus,
  getCategoryLabel,
  getPriorityLabel,
} from "../types";

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  normal: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

function shortTicketId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function MessageBubble({
  message,
  isUserMessage,
}: {
  message: SupportMessage;
  isUserMessage: boolean;
}) {
  const hasBody = message.body.trim().length > 0;

  return (
    <div className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUserMessage
            ? "bg-brand-main text-white rounded-br-md"
            : "bg-bg-100 border border-bg-200 text-text-100 rounded-bl-md"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-xs mb-2 ${
            isUserMessage ? "text-white/80" : "text-text-300"
          }`}
        >
          <span className="font-medium">
            {isUserMessage ? "You" : message.authorName || "Support"}
          </span>
          <span>·</span>
          <span>{formatDateTime(message.createdAt)}</span>
        </div>

        {hasBody && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.body}
          </p>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <TicketAttachments
            attachments={message.attachments}
            tone={isUserMessage ? "dark" : "light"}
          />
        )}
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { state } = useAuthContext();
  const { isAuthenticated, isLoading: authLoading } = state;

  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    ticket,
    messages,
    loading,
    error: ticketError,
    refresh: fetchDetail,
  } = useSupportTicket(id, isAuthenticated && !authLoading);

  const { initialMessage, threadMessages } = useMemo(() => {
    if (messages.length === 0) {
      return { initialMessage: null, threadMessages: [] as SupportMessage[] };
    }
    const [first, ...rest] = messages;
    return { initialMessage: first, threadMessages: rest };
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (ticketError) {
      toast.error("Could not load this ticket.");
    }
  }, [ticketError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selected = Array.from(e.target.files);
    const tooLarge = selected.find((f) => f.size > MAX_SUPPORT_FILE_BYTES);
    if (tooLarge) {
      toast.error(`${tooLarge.name} exceeds the 10 MB limit.`);
      e.target.value = "";
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const trimmed = reply.trim();
    if (!trimmed && files.length === 0) {
      toast.error("Enter a reply or attach at least one file.");
      return;
    }

    setSubmitting(true);
    try {
      let attachments;
      if (files.length > 0) {
        attachments = await supportAPI.uploadFiles(id, files);
      }

      await supportAPI.addMessage(id, trimmed, attachments);

      setReply("");
      setFiles([]);
      await fetchDetail();
      toast.success("Reply sent.");
    } catch (err) {
      console.error("Failed to send reply:", err);
      toast.error(
        err instanceof Error ? err.message : "Could not send your reply."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="h-10 w-10 animate-spin text-brand-main mx-auto mb-3" />
          <p className="text-text-200">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-text-100 mb-2">
            Ticket not found
          </h2>
          <p className="text-text-200 text-sm mb-5">
            We couldn&apos;t find the ticket you&apos;re looking for.
          </p>
          <Link href="/help">
            <Button className="bg-brand-main hover:bg-brand-main/90 text-white">
              Back to tickets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";

  return (
    <div className="min-h-screen bg-bg-100 pb-12">
      <div className="border-b border-bg-200 bg-bg-100/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/help"
            className="inline-flex items-center text-sm text-text-200 hover:text-text-100 transition-colors"
          >
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            All tickets
          </Link>
          <div className="flex items-center gap-2 text-xs text-text-300">
            <IconHash className="h-3.5 w-3.5" />
            {shortTicketId(ticket.id)}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-bg-200 bg-bg-100 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 min-w-0">
              <div className="inline-flex items-center gap-2 text-brand-main">
                <IconTicket className="h-5 w-5" />
                <span className="text-sm font-medium">Support ticket</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-100 leading-tight">
                {ticket.subject}
              </h1>
              <p className="text-sm text-text-200 flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                Opened {formatDate(ticket.createdAt)}
                {ticket.updatedAt !== ticket.createdAt && (
                  <> · Updated {formatDate(ticket.updatedAt)}</>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Badge variant="outline" className={priorityStyles[ticket.priority]}>
                {getPriorityLabel(ticket.priority)}
              </Badge>
              <Badge variant="outline" className={statusStyles[ticket.status]}>
                {formatTicketStatus(ticket.status)}
              </Badge>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Sidebar meta */}
          <aside className="rounded-2xl border border-bg-200 bg-bg-100 p-5 space-y-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-text-100 uppercase tracking-wide">
              Details
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-300 mb-0.5">Category</dt>
                <dd className="font-medium text-text-100">
                  {getCategoryLabel(ticket.category)}
                </dd>
              </div>
              <div>
                <dt className="text-text-300 mb-0.5">Priority</dt>
                <dd className="font-medium text-text-100">
                  {getPriorityLabel(ticket.priority)}
                </dd>
              </div>
              <div>
                <dt className="text-text-300 mb-0.5">Status</dt>
                <dd className="font-medium text-text-100">
                  {formatTicketStatus(ticket.status)}
                </dd>
              </div>
              <div>
                <dt className="text-text-300 mb-0.5">Created</dt>
                <dd className="text-text-100">{formatDateTime(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-text-300 mb-0.5">Last updated</dt>
                <dd className="text-text-100">{formatDateTime(ticket.updatedAt)}</dd>
              </div>
            </dl>
          </aside>

          <div className="space-y-6 min-w-0">
            {/* Description (initial message) */}
            <section className="rounded-2xl border border-bg-200 bg-bg-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-text-100 mb-4">
                Description
              </h2>
              {initialMessage ? (
                <div className="space-y-3">
                  {initialMessage.body.trim() ? (
                    <p className="text-sm text-text-100 whitespace-pre-wrap leading-relaxed">
                      {initialMessage.body}
                    </p>
                  ) : (
                    <p className="text-sm text-text-300 italic">
                      No description text provided.
                    </p>
                  )}
                  {initialMessage.attachments &&
                    initialMessage.attachments.length > 0 && (
                      <TicketAttachments attachments={initialMessage.attachments} />
                    )}
                  <p className="text-xs text-text-300 pt-2 border-t border-bg-200">
                    Submitted {formatDateTime(initialMessage.createdAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-300">No description available.</p>
              )}
            </section>

            {/* Thread */}
            <section className="rounded-2xl border border-bg-200 bg-bg-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <IconMessage className="h-5 w-5 text-text-200" />
                <h2 className="text-lg font-semibold text-text-100">
                  Conversation
                </h2>
                {threadMessages.length > 0 && (
                  <span className="text-xs text-text-300 bg-bg-200 px-2 py-0.5 rounded-full">
                    {threadMessages.length}{" "}
                    {threadMessages.length === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>

              {threadMessages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-bg-300 bg-bg-200/40 px-4 py-8 text-center">
                  <p className="text-sm text-text-200">
                    No replies yet. Our team typically responds within one business
                    day.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {threadMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isUserMessage={!message.authorIsAdmin}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </section>

            {/* Reply */}
            <section className="rounded-2xl border border-bg-200 bg-bg-100 p-6 shadow-sm">
              <form onSubmit={handleReplySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="reply" className="text-text-100">
                    Your reply
                  </Label>
                  <Textarea
                    id="reply"
                    placeholder={
                      isClosed
                        ? "This ticket is closed."
                        : "Add more details or answer a question from support..."
                    }
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    disabled={submitting || isClosed}
                    className="mt-2 resize-none"
                  />
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={SUPPORT_FILE_ACCEPT}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting || isClosed}
                    className="border-bg-300 text-text-200 hover:bg-bg-200 hover:text-text-100"
                  >
                    <IconPaperclip className="h-4 w-4 mr-2" />
                    Attach images or files
                  </Button>
                  <p className="mt-1.5 text-xs text-text-300">
                    PNG, JPG, GIF, WebP, PDF, TXT, CSV, Word, Excel · max 10 MB each
                  </p>
                  <PendingAttachmentList
                    files={files}
                    onRemove={removeFile}
                    disabled={submitting}
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  {isClosed ? (
                    <p className="text-xs text-text-300">
                      This ticket is closed. Replies are disabled, but you can
                      still review the full history above.
                    </p>
                  ) : (
                    <p className="text-xs text-text-300">
                      Replies are saved to this ticket and emailed to our support
                      team.
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      isClosed ||
                      (!reply.trim() && files.length === 0)
                    }
                    className="bg-brand-main hover:bg-brand-main/90 text-white sm:ml-auto"
                  >
                    {submitting ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <IconSend className="h-4 w-4 mr-2" />
                        Send reply
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
