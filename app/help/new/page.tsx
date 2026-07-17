"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { PendingAttachmentList } from "@/components/help/TicketAttachments";
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
import { supportAPI } from "@/utils/api/supportClient";
import {
  MAX_SUPPORT_FILE_BYTES,
  SUPPORT_FILE_ACCEPT,
} from "@/utils/support/uploadAttachment";
import {
  IconArrowLeft,
  IconLoader2,
  IconPaperclip,
} from "@tabler/icons-react";

import type {
  TicketCategory,
  TicketPriority,
} from "../types";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "../types";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please provide a subject and description.");
      return;
    }

    setSubmitting(true);
    try {
      const { ticket, initialMessage } = await supportAPI.createTicket({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      });

      if (files.length > 0) {
        const uploaded = await supportAPI.uploadFiles(ticket.id, files);
        await supportAPI.attachToMessage(
          ticket.id,
          initialMessage.id,
          uploaded
        );
      }

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
                  accept={SUPPORT_FILE_ACCEPT}
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
                  Attach images or files
                </Button>
                <p className="mt-1.5 text-xs text-text-300">
                  PNG, JPG, GIF, WebP, PDF, TXT, CSV, Word, Excel · max 10 MB each
                </p>
              </div>

              <PendingAttachmentList
                files={files}
                onRemove={removeFile}
                disabled={submitting}
              />
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
