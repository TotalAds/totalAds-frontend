"use client";

import apiClient, { extractApiData } from "@/utils/api/apiClient";

import type {
  SupportMessage,
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from "@/app/help/types";
import {
  uploadFileToPresignedPost,
  type PresignedUploadResponse,
  type UploadedSupportAttachment,
  MAX_SUPPORT_FILE_BYTES,
} from "@/utils/support/uploadAttachment";

export type CreateSupportTicketInput = {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
};

export type CreateSupportTicketResponse = {
  ticket: SupportTicket;
  initialMessage: SupportMessage;
};

export type SupportTicketDetailResponse = {
  ticket: SupportTicket;
  messages: SupportMessage[];
};

export type SupportTicketListResponse = {
  tickets: SupportTicket[];
  limit: number;
  offset: number;
};

export type SupportMessageAttachmentInput = UploadedSupportAttachment;

async function requestPresignedUpload(
  ticketId: string,
  file: File
): Promise<PresignedUploadResponse> {
  const response = await apiClient.post(`/support/tickets/${ticketId}/attachments`, {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  });
  return extractApiData<PresignedUploadResponse>(response);
}

export const supportAPI = {
  listTickets: async (): Promise<SupportTicket[]> => {
    const response = await apiClient.get("/support/tickets");
    const data = extractApiData<SupportTicketListResponse>(response);
    return Array.isArray(data.tickets) ? data.tickets : [];
  },

  getTicket: async (ticketId: string): Promise<SupportTicketDetailResponse> => {
    const response = await apiClient.get(`/support/tickets/${ticketId}`);
    const data = extractApiData<SupportTicketDetailResponse>(response);
    return {
      ticket: data.ticket,
      messages: Array.isArray(data.messages) ? data.messages : [],
    };
  },

  createTicket: async (
    input: CreateSupportTicketInput
  ): Promise<CreateSupportTicketResponse> => {
    const response = await apiClient.post("/support/tickets", input);
    return extractApiData<CreateSupportTicketResponse>(response);
  },

  uploadFiles: async (
    ticketId: string,
    files: File[]
  ): Promise<UploadedSupportAttachment[]> => {
    const uploaded: UploadedSupportAttachment[] = [];

    for (const file of files) {
      if (file.size > MAX_SUPPORT_FILE_BYTES) {
        throw new Error(`${file.name} exceeds the 10 MB limit.`);
      }

      const presign = await requestPresignedUpload(ticketId, file);
      await uploadFileToPresignedPost(
        presign.presigned.url,
        presign.presigned.fields,
        file
      );

      uploaded.push({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        s3Key: presign.s3Key,
      });
    }

    return uploaded;
  },

  attachToMessage: async (
    ticketId: string,
    messageId: string,
    attachments: SupportMessageAttachmentInput[]
  ): Promise<void> => {
    if (attachments.length === 0) return;
    await apiClient.post(
      `/support/tickets/${ticketId}/messages/${messageId}/attachments`,
      { attachments }
    );
  },

  addMessage: async (
    ticketId: string,
    body: string,
    attachments?: SupportMessageAttachmentInput[]
  ): Promise<{ message: SupportMessage }> => {
    const response = await apiClient.post(`/support/tickets/${ticketId}/messages`, {
      body,
      attachments,
    });
    return extractApiData<{ message: SupportMessage }>(response);
  },
};
