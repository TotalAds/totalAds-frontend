export type TicketStatus = "open" | "pending" | "closed";

export type TicketCategory = "general" | "billing" | "technical" | "other";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportTicket = {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupportAttachment = {
  key: string;
  filename: string;
  contentType: string;
  size: number;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  content: string;
  sender: "user" | "admin" | "system";
  createdAt: string;
  attachments?: SupportAttachment[];
};

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "other", label: "Other" },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
