export type TicketStatus = "open" | "pending" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicket = {
  id: string;
  subject: string;
  category: string;
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

export const TICKET_CATEGORIES = [
  "General",
  "Billing",
  "Technical",
  "Feature Request",
] as const;

export const TICKET_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];
