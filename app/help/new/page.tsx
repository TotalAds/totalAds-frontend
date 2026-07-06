"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";
import {
  IconArrowLeft,
  IconLoader2,
  IconPaperclip,
  IconX,
} from "@tabler/icons-react";

import type {
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from "../types";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "../types";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function NewTicketPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading: authLoading } = state;

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("general");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please provide a subject and description.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post<{ ticket: SupportTicket }>(
        "/support/tickets",
        {
          subject: subject.trim(),
          category,
          priority,
          description: description.trim(),
        }
      );
      const ticket = res.data.ticket;
      toast.success("Ticket created successfully.");
      router.push(`/help/${ticket.id}`);
    } catch (err) {
      console.error("Failed to create ticket:", err);
      toast.error("Could not create your ticket. Please try again.");
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <IconLoader2 className="h-10 w-10 animate-spin text-brand-main" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.push("/help")}
          className="inline-flex items-center text-sm text-text-200 hover:text-text-100 mb-6 transition-colors"
        >
          <IconArrowLeft className="h-4 w-4 mr-1.5" />
          Back to tickets
        </button>

        <div className="bg-bg-100 rounded-2xl border border-bg-200 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-text-100 mb-1">
            Create a support ticket
          </h1>
          <p className="text-text-200 text-sm mb-6">
            Tell us what you need help with and we&apos;ll get back to you as soon as
            possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as TicketCategory)}
                  disabled={submitting}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as TicketPriority)
                  }
                  disabled={submitting}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your issue in detail..."
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div>
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
                  disabled={submitting}
                  className="border-bg-300 text-text-200 hover:bg-bg-200 hover:text-text-100"
                >
                  <IconPaperclip className="h-4 w-4 mr-2" />
                  Attach files
                </Button>
              </div>

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

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/help")}
                disabled={submitting}
                className="border-bg-300 text-text-200 hover:bg-bg-200 hover:text-text-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-brand-main hover:bg-brand-main/90 text-white"
              >
                {submitting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create ticket"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
