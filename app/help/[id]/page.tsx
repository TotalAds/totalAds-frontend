"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/context/AuthContext";
import { useSupportTicket } from "@/hooks/useSupportTicket";
import apiClient from "@/utils/api/apiClient";
import {
  IconArrowLeft,
  IconFile,
  IconLoader2,
  IconPaperclip,
  IconSend,
  IconX,
} from "@tabler/icons-react";

import type {
  SupportAttachment,
  SupportMessage,
  TicketPriority,
  TicketStatus,
} from "../types";

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

const senderStyles: Record<SupportMessage["sender"], string> = {
  user: "bg-bg-200 text-text-100 rounded-br-none",
  admin: "bg-brand-main text-white rounded-bl-none",
  system: "bg-bg-200/50 text-text-200 italic",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function attachmentUrl(key: string): string {
  const base = apiClient.defaults.baseURL ?? "";
  return `${base}/support/attachments/${encodeURIComponent(key)}`;
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (ticketError) {
      console.error("Failed to load ticket detail:", ticketError);
      toast.error("Could not load this ticket.");
    }
  }, [ticketError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (): Promise<SupportAttachment[]> => {
    if (!id || files.length === 0) return [];

    const uploaded: SupportAttachment[] = [];
    for (const file of files) {
      try {
        const presignRes = await apiClient.post<{
          presignedUrl: string;
          key: string;
        }>(`/support/tickets/${id}/attachments`, {
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        });

        await axios.put(presignRes.data.presignedUrl, file, {
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        uploaded.push({
          key: presignRes.data.key,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        });
      } catch (err) {
        console.error(`Failed to upload attachment ${file.name}:`, err);
        toast.error(`Could not attach ${file.name}; sending without it.`);
      }
    }
    return uploaded;
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!reply.trim() && files.length === 0) {
      toast.error("Please enter a reply or attach a file.");
      return;
    }

    setSubmitting(true);
    try {
      const attachments = await uploadAttachments();

      await apiClient.post<{ message: SupportMessage }>(
        `/support/tickets/${id}/messages`,
        {
          content: reply.trim(),
          attachments,
        }
      );

      setReply("");
      setFiles([]);
      await fetchDetail();
      toast.success("Reply sent.");
    } catch (err) {
      console.error("Failed to send reply:", err);
      toast.error("Could not send your reply. Please try again.");
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

  return (
    <div className="min-h-screen bg-bg-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/help"
          className="inline-flex items-center text-sm text-text-200 hover:text-text-100 mb-6 transition-colors"
        >
          <IconArrowLeft className="h-4 w-4 mr-1.5" />
          Back to tickets
        </Link>

        {/* Status banner */}
        <div className="bg-bg-100 rounded-2xl border border-bg-200 p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-text-100 mb-1">
                {ticket.subject}
              </h1>
              <p className="text-sm text-text-200">
                {ticket.category} · Created {formatDate(ticket.createdAt)}
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
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-text-300 text-sm">
              No messages yet. Start the conversation below.
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 ${
                    senderStyles[message.sender]
                  }`}
                >
                  <div className="text-xs opacity-80 mb-1.5">
                    {message.sender === "user"
                      ? "You"
                      : message.sender === "admin"
                      ? "Support"
                      : "System"}{" "}
                    · {formatDateTime(message.createdAt)}
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  {message.attachments && message.attachments.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {message.attachments.map((attachment) => (
                        <li key={attachment.key}>
                          <a
                            href={attachmentUrl(attachment.key)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs underline-offset-2 hover:underline opacity-90"
                          >
                            <IconFile className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[180px]">
                              {attachment.filename}
                            </span>
                            <span>
                              ({formatFileSize(attachment.size)})
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply form */}
        <form
          onSubmit={handleReplySubmit}
          className="bg-bg-100 rounded-2xl border border-bg-200 p-5"
        >
          <div className="space-y-3">
            <Label htmlFor="reply">Reply</Label>
            <Textarea
              id="reply"
              placeholder="Write your reply..."
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={submitting || ticket.status === "closed"}
            />
          </div>

          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting || ticket.status === "closed"}
              className="border-bg-300 text-text-200 hover:bg-bg-200 hover:text-text-100"
            >
              <IconPaperclip className="h-4 w-4 mr-2" />
              Attach files
            </Button>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-bg-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-text-100 truncate pr-3">
                      {file.name}{" "}
                      <span className="text-text-300">
                        ({formatFileSize(file.size)})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={submitting}
                      className="text-text-300 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="submit"
              disabled={
                submitting || ticket.status === "closed" || (!reply.trim() && files.length === 0)
              }
              className="bg-brand-main hover:bg-brand-main/90 text-white"
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

          {ticket.status === "closed" && (
            <p className="mt-3 text-xs text-text-300 text-center">
              This ticket is closed. You can still view the history, but new
              replies are disabled.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
