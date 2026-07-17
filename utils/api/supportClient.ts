"use client";

import apiClient, { extractApiData } from "@/utils/api/apiClient";

import type {
  SupportMessage,
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from "@/app/help/types";

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

  addMessage: async (
    ticketId: string,
    body: string
  ): Promise<{ message: SupportMessage }> => {
    const response = await apiClient.post(`/support/tickets/${ticketId}/messages`, {
      body,
    });
    return extractApiData<{ message: SupportMessage }>(response);
  },
};
