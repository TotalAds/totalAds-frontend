export const API_VERSION = "2026-08-23";
export const API_BASE_PLACEHOLDER = "https://your-email-service/v1";

export type SchemaField = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
};

export type ApiEndpoint = {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  scope: "read" | "write" | "send";
  title: string;
  description: string;
  queryParams?: SchemaField[];
  requestBody?: {
    description?: string;
    example: object;
    fields: SchemaField[];
  };
  responseData?: {
    description?: string;
    example: object;
    fields: SchemaField[];
  };
  statusCodes?: { code: number; description: string }[];
  notes?: string[];
};

export const RESPONSE_ENVELOPE_FIELDS: SchemaField[] = [
  { name: "success", type: "boolean", required: true, description: "Whether the request succeeded" },
  { name: "data", type: "object | null", description: "Endpoint-specific payload on success" },
  { name: "error", type: "object | null", description: "Present on failure: code, message, details" },
  { name: "meta.requestId", type: "string", required: true, description: "Unique request ID for support" },
  { name: "meta.apiVersion", type: "string", required: true, description: "API version date string" },
  { name: "meta.processingTime", type: "number", description: "Server processing time in ms" },
  { name: "meta.rateLimit", type: "object", description: "remaining, resetTime, limit" },
];

export const RESPONSE_ENVELOPE_EXAMPLE = {
  success: true,
  data: {},
  meta: {
    requestId: "ls_1710000000000_abc123",
    timestamp: "2026-08-23T12:00:00.000Z",
    apiVersion: API_VERSION,
    processingTime: 42,
    rateLimit: { remaining: 499, resetTime: "2026-08-23T13:00:00.000Z", limit: 500 },
  },
};

export const API_ENDPOINTS: { group: string; description: string; items: ApiEndpoint[] }[] = [
  {
    group: "Account",
    description: "Verify authentication, sending eligibility, credits, and rate-limit state.",
    items: [
      {
        id: "get-me",
        method: "GET",
        path: "/me",
        scope: "read",
        title: "Get authenticated context",
        description:
          "Returns the user and workspace tied to your API key, plus key metadata and capability flags.",
        responseData: {
          description: "Nested inside the standard success envelope under data.",
          example: {
            user: { id: "1", email: "you@company.com", firstName: "Jane", lastName: "Doe" },
            workspace: { id: "10", name: "Acme Workspace" },
            apiKey: {
              id: "5",
              name: "Production",
              environment: "live",
              scopes: ["read", "write", "send"],
            },
            capabilities: { canRead: true, canWrite: true, canSend: true },
          },
          fields: [
            { name: "user", type: "object", required: true, description: "Authenticated LeadSnipper user" },
            { name: "workspace", type: "object", required: true, description: "Workspace bound to the API key" },
            { name: "apiKey", type: "object", required: true, description: "Key id, name, environment, scopes" },
            { name: "capabilities", type: "object", required: true, description: "canRead, canWrite, canSend booleans" },
          ],
        },
        statusCodes: [{ code: 200, description: "Context returned" }, { code: 401, description: "Invalid API key" }],
      },
      {
        id: "get-eligibility",
        method: "GET",
        path: "/account/eligibility",
        scope: "read",
        title: "Check send eligibility",
        description:
          "Call before sending to confirm the account has a verified domain, sender, or connected inbox.",
        responseData: {
          example: {
            eligible: true,
            verifiedDomainCount: 1,
            verifiedSenderCount: 2,
            connectedInboxCount: 1,
            sesSenderCount: 1,
          },
          fields: [
            { name: "eligible", type: "boolean", required: true, description: "True if account can send campaigns" },
            { name: "verifiedDomainCount", type: "number", description: "SES domains verified" },
            { name: "verifiedSenderCount", type: "number", description: "Verified senders available" },
            { name: "connectedInboxCount", type: "number", description: "OAuth/SMTP inboxes connected" },
            { name: "ineligibleReason", type: "string", description: "Human-readable reason when eligible is false" },
          ],
        },
      },
      {
        id: "get-usage",
        method: "GET",
        path: "/account/usage",
        scope: "read",
        title: "Credits and quota usage",
        description: "Returns credit balance and deliverability quota card for the billing account.",
        responseData: {
          example: {
            credits: {
              userId: "1",
              currentBalance: 9500,
              totalEarned: 10000,
              totalUsed: 500,
            },
            quota: { dailySent: 120, dailyLimit: 500, monthlySent: 4200 },
          },
          fields: [
            { name: "credits.currentBalance", type: "number", description: "Remaining send credits" },
            { name: "credits.totalUsed", type: "number", description: "Lifetime credits consumed" },
            { name: "quota", type: "object", description: "Daily/monthly send counters and limits" },
          ],
        },
      },
      {
        id: "get-rate-limit",
        method: "GET",
        path: "/account/rate-limit",
        scope: "read",
        title: "Current rate limit",
        description: "Returns the active rate-limit bucket for this API key and subscription tier.",
        responseData: {
          example: {
            rateLimit: { remaining: 499, resetTime: "2026-08-23T13:00:00.000Z", limit: 500 },
            tier: "scale",
          },
          fields: [
            { name: "rateLimit.remaining", type: "number", description: "Requests left in the window" },
            { name: "rateLimit.limit", type: "number", description: "Max requests per window" },
            { name: "tier", type: "string", description: "Subscription tier name" },
          ],
        },
      },
    ],
  },
  {
    group: "Emails",
    description: "Send individual transactional emails without creating a full campaign in the UI.",
    items: [
      {
        id: "post-emails-send",
        method: "POST",
        path: "/emails/send",
        scope: "send",
        title: "Send a single email",
        description:
          "Queues one email immediately using a verified sender. Creates or reuses a lead for the recipient. Supports idempotency.",
        requestBody: {
          description: "JSON body. Pass Idempotency-Key header to prevent duplicate sends within 24h.",
          example: {
            from: { senderId: "123" },
            to: { email: "jane@acme.com", name: "Jane" },
            subject: "Hello",
            html: "<p>Hi Jane</p>",
            text: "Hi Jane",
            trackOpens: true,
            trackLinks: true,
            domainId: "0",
          },
          fields: [
            { name: "from.senderId", type: "string", required: true, description: "Sending account ID from GET /senders" },
            { name: "to.email", type: "string", required: true, description: "Recipient email address" },
            { name: "to.name", type: "string", description: "Recipient display name" },
            { name: "subject", type: "string", required: true, description: "Email subject line" },
            { name: "html", type: "string", required: true, description: "HTML body content" },
            { name: "text", type: "string", description: "Plain-text fallback" },
            { name: "trackOpens", type: "boolean", description: "Enable open tracking (default true)" },
            { name: "trackLinks", type: "boolean", description: "Enable click tracking (default true)" },
            { name: "domainId", type: "string", description: 'SES domain ID or "0" for inbox campaigns' },
          ],
        },
        responseData: {
          example: {
            messageId: "98765",
            campaignId: "456",
            leadId: "789",
            status: "sending",
          },
          fields: [
            { name: "messageId", type: "string | null", description: "Queue message ID when available" },
            { name: "campaignId", type: "string", description: "Internal one-shot campaign created for this send" },
            { name: "leadId", type: "string", description: "Lead record for the recipient" },
            { name: "status", type: "string", description: "sending | queued" },
          ],
        },
        statusCodes: [
          { code: 202, description: "Email accepted and queued" },
          { code: 402, description: "Insufficient credits or plan limit" },
          { code: 422, description: "Validation error (invalid sender, missing fields)" },
        ],
        notes: ["Requires send scope", "Respects sender daily limits and deliverability caps"],
      },
    ],
  },
  {
    group: "Campaigns",
    description: "Create multi-step sequences, manage recipients, and control delivery.",
    items: [
      {
        id: "get-campaigns",
        method: "GET",
        path: "/campaigns",
        scope: "read",
        title: "List campaigns",
        description: "Paginated list of campaigns in the workspace.",
        queryParams: [
          { name: "page", type: "number", description: "Page number (default 1)" },
          { name: "limit", type: "number", description: "Results per page (default 20)" },
          { name: "status", type: "string", description: "draft | sending | paused | completed | cancelled" },
          { name: "domainId", type: "string", description: "Filter by domain ID" },
        ],
        responseData: {
          example: {
            campaigns: [{ id: "1", name: "Outreach Q1", status: "draft", totalLeads: 50 }],
            pagination: { page: 1, limit: 20, total: 1 },
          },
          fields: [
            { name: "campaigns", type: "array", description: "Campaign summary objects" },
            { name: "campaigns[].id", type: "string", description: "Campaign ID" },
            { name: "campaigns[].status", type: "string", description: "Current campaign status" },
            { name: "pagination", type: "object", description: "page, limit, total" },
          ],
        },
      },
      {
        id: "post-campaigns",
        method: "POST",
        path: "/campaigns",
        scope: "write",
        title: "Create draft campaign",
        description: "Creates a campaign in draft status. Add leads and call send separately.",
        requestBody: {
          example: {
            name: "API Draft Campaign",
            domainId: "0",
            description: "Created via API",
            sequence: [
              { subject: "Hi {{name}}", body: "<p>First email</p>", delayMinutes: 0 },
              { subject: "Following up", body: "<p>Second touch</p>", delayMinutes: 2880 },
            ],
          },
          fields: [
            { name: "name", type: "string", required: true, description: "Campaign name" },
            { name: "domainId", type: "string", description: 'Domain ID or "0" for inbox' },
            { name: "description", type: "string", description: "Optional description" },
            { name: "sequence", type: "array", description: "Email steps with subject, body, delayMinutes" },
          ],
        },
        responseData: {
          example: { id: "456", name: "API Draft Campaign", status: "draft", sequence: [] },
          fields: [
            { name: "id", type: "string", required: true, description: "New campaign ID" },
            { name: "status", type: "string", description: "Always draft on create" },
            { name: "sequence", type: "array", description: "Configured sequence steps" },
          ],
        },
        statusCodes: [{ code: 201, description: "Campaign created" }],
      },
      {
        id: "post-campaigns-send-atomic",
        method: "POST",
        path: "/campaigns/send",
        scope: "send",
        title: "Atomic create and send",
        description:
          "Best for integrations: creates leads from recipients, builds the campaign, and launches in one request.",
        requestBody: {
          example: {
            name: "API Campaign Aug 23",
            domainId: "0",
            senderConfig: { senderIds: ["42"] },
            sequence: [{ subject: "Hi {{name}}", body: "<p>Hello</p>", delayMinutes: 0 }],
            recipients: [{ email: "a@b.com", name: "A" }],
            requireLeadVerification: false,
            openTrackingEnabled: true,
          },
          fields: [
            { name: "name", type: "string", required: true, description: "Campaign name" },
            { name: "domainId", type: "string", description: 'Domain or "0"' },
            { name: "senderConfig.senderIds", type: "string[]", required: true, description: "Sender IDs for rotation" },
            { name: "sequence", type: "array", required: true, description: "At least one step" },
            { name: "recipients", type: "array", required: true, description: "Inline { email, name? } objects" },
            { name: "requireLeadVerification", type: "boolean", description: "Run Reoon before send" },
          ],
        },
        responseData: {
          example: { campaign: { id: "456", status: "sending" }, queued: 1 },
          fields: [
            { name: "campaign", type: "object", description: "Created campaign with status" },
            { name: "queued", type: "number", description: "Emails queued for delivery" },
          ],
        },
        statusCodes: [{ code: 202, description: "Campaign created and sending" }],
      },
      {
        id: "get-campaign",
        method: "GET",
        path: "/campaigns/:campaignId",
        scope: "read",
        title: "Get campaign",
        description: "Full campaign details including sequence, schedule, senders, and status.",
        responseData: {
          example: {
            id: "456",
            name: "Outreach",
            status: "sending",
            sequence: [],
            leadIds: ["1", "2"],
            totalLeads: 2,
          },
          fields: [
            { name: "id", type: "string", required: true, description: "Campaign ID" },
            { name: "sequence", type: "array", description: "Full sequence configuration" },
            { name: "senderConfig", type: "object", description: "Sender rotation settings" },
            { name: "leadIds", type: "string[]", description: "Attached lead IDs" },
          ],
        },
      },
      {
        id: "patch-campaign",
        method: "PATCH",
        path: "/campaigns/:campaignId",
        scope: "write",
        title: "Update campaign",
        description: "Update draft or paused campaigns only.",
        requestBody: {
          example: { name: "Renamed campaign", sequence: [{ subject: "Updated", body: "<p>New copy</p>" }] },
          fields: [
            { name: "name", type: "string", description: "Campaign name" },
            { name: "sequence", type: "array", description: "Replace sequence steps" },
            { name: "senderConfig", type: "object", description: "Update sender rotation" },
          ],
        },
        responseData: {
          example: { id: "456", name: "Renamed campaign", status: "draft" },
          fields: [{ name: "id", type: "string", description: "Updated campaign" }],
        },
      },
      {
        id: "post-campaign-leads",
        method: "POST",
        path: "/campaigns/:campaignId/leads",
        scope: "write",
        title: "Add leads to campaign",
        description: "Add existing lead IDs or inline recipients (creates leads automatically).",
        requestBody: {
          example: {
            leadIds: ["101", "102"],
            recipients: [{ email: "new@example.com", name: "New Lead" }],
          },
          fields: [
            { name: "leadIds", type: "string[]", description: "Existing lead IDs to attach" },
            { name: "recipients", type: "array", description: "Inline recipients to create and attach" },
          ],
        },
        responseData: {
          example: { added: 3, totalLeads: 53 },
          fields: [
            { name: "added", type: "number", description: "Leads added in this request" },
            { name: "totalLeads", type: "number", description: "Total leads on campaign after add" },
          ],
        },
      },
      {
        id: "post-campaign-send",
        method: "POST",
        path: "/campaigns/:campaignId/send",
        scope: "send",
        title: "Launch campaign",
        description: "Starts sending to all attached leads. Campaign must be draft or restarted after lead changes.",
        requestBody: {
          example: {
            senderIds: ["42"],
            requireLeadVerification: false,
            dailySendTime: "09:00",
          },
          fields: [
            { name: "senderIds", type: "string[]", description: "Senders to use (required if not set on campaign)" },
            { name: "requireLeadVerification", type: "boolean", description: "Verify with Reoon before send" },
            { name: "dailySendTime", type: "string", description: "HH:MM UTC daily send window" },
          ],
        },
        responseData: {
          example: { status: "sending", queued: 50 },
          fields: [
            { name: "status", type: "string", description: "Campaign status after launch" },
            { name: "queued", type: "number", description: "Emails queued" },
          ],
        },
        statusCodes: [{ code: 202, description: "Campaign launch accepted" }],
      },
      {
        id: "post-campaign-pause",
        method: "POST",
        path: "/campaigns/:campaignId/pause",
        scope: "send",
        title: "Pause campaign",
        description: "Pauses an active sending campaign. Can be edited and restarted.",
        responseData: {
          example: { id: "456", status: "paused" },
          fields: [{ name: "status", type: "string", description: "paused" }],
        },
      },
      {
        id: "get-campaign-analytics",
        method: "GET",
        path: "/campaigns/:campaignId/analytics",
        scope: "read",
        title: "Campaign analytics",
        description: "Summary metrics: sent, opened, clicked, bounced, complained, unsubscribed.",
        responseData: {
          example: {
            sent: 100,
            delivered: 98,
            opened: 45,
            clicked: 12,
            bounced: 2,
            openRate: 0.45,
            clickRate: 0.12,
          },
          fields: [
            { name: "sent", type: "number", description: "Total emails sent" },
            { name: "opened", type: "number", description: "Unique opens" },
            { name: "clicked", type: "number", description: "Unique clicks" },
            { name: "bounced", type: "number", description: "Bounce count" },
            { name: "openRate", type: "number", description: "Open rate 0–1" },
          ],
        },
      },
    ],
  },
  {
    group: "Leads",
    description: "Manage contacts in your workspace CRM.",
    items: [
      {
        id: "get-leads",
        method: "GET",
        path: "/leads",
        scope: "read",
        title: "List leads",
        description: "Search and filter leads with pagination.",
        queryParams: [
          { name: "page", type: "number", description: "Page number" },
          { name: "limit", type: "number", description: "Results per page" },
          { name: "search", type: "string", description: "Search name or email" },
          { name: "email", type: "string", description: "Exact email filter" },
          { name: "status", type: "string", description: "Lead status filter" },
        ],
        responseData: {
          example: {
            leads: [{ id: "1", email: "jane@acme.com", name: "Jane", status: "active" }],
            pagination: { page: 1, limit: 20, total: 1 },
          },
          fields: [
            { name: "leads", type: "array", description: "Lead objects" },
            { name: "leads[].id", type: "string", description: "Lead ID" },
            { name: "leads[].email", type: "string", description: "Email address" },
            { name: "pagination", type: "object", description: "Pagination metadata" },
          ],
        },
      },
      {
        id: "post-leads",
        method: "POST",
        path: "/leads",
        scope: "write",
        title: "Create lead",
        description: "Creates a single lead. Returns 409 if email already exists in workspace.",
        requestBody: {
          example: { email: "jane@acme.com", name: "Jane Doe", company: "Acme", tags: ["api"] },
          fields: [
            { name: "email", type: "string", required: true, description: "Unique email per workspace" },
            { name: "name", type: "string", description: "Full name" },
            { name: "company", type: "string", description: "Company name" },
            { name: "tags", type: "string[]", description: "Tag names to assign" },
            { name: "listIds", type: "string[]", description: "List IDs to add contact to" },
          ],
        },
        responseData: {
          example: { id: "789", email: "jane@acme.com", name: "Jane Doe", status: "active" },
          fields: [
            { name: "id", type: "string", required: true, description: "New lead ID" },
            { name: "email", type: "string", required: true, description: "Normalized email" },
          ],
        },
        statusCodes: [{ code: 201, description: "Lead created" }, { code: 409, description: "Duplicate email" }],
      },
      {
        id: "post-leads-bulk",
        method: "POST",
        path: "/leads/bulk",
        scope: "write",
        title: "Bulk create leads",
        description: "Create up to 1000 leads per request. Existing emails are skipped and reported.",
        requestBody: {
          example: {
            leads: [
              { email: "a@example.com", name: "A" },
              { email: "b@example.com", name: "B" },
            ],
          },
          fields: [
            { name: "leads", type: "array", required: true, description: "Array of { email, name?, company? }" },
          ],
        },
        responseData: {
          example: {
            results: [
              { email: "a@example.com", leadId: "1", created: true },
              { email: "b@example.com", leadId: "2", created: false },
            ],
          },
          fields: [
            { name: "results", type: "array", description: "Per-email outcome with leadId and created flag" },
          ],
        },
      },
      {
        id: "post-leads-verify",
        method: "POST",
        path: "/leads/verify",
        scope: "write",
        title: "Bulk verify leads (Reoon)",
        description: "Requires Reoon API key configured in Settings. Verifies leads by ID.",
        requestBody: {
          example: { leadIds: ["1", "2", "3"] },
          fields: [{ name: "leadIds", type: "string[]", required: true, description: "Lead IDs to verify" }],
        },
        responseData: {
          example: { verified: 3, safe: 2, unsafe: 1, results: [] },
          fields: [
            { name: "verified", type: "number", description: "Leads processed" },
            { name: "safe", type: "number", description: "Safe to send count" },
          ],
        },
      },
    ],
  },
  {
    group: "Senders & domains",
    description: "Read-only access to verified sending infrastructure.",
    items: [
      {
        id: "get-senders",
        method: "GET",
        path: "/senders",
        scope: "read",
        title: "List sending accounts",
        description: "All connected senders (SES, Gmail, Outlook, SMTP). Secrets are never returned.",
        responseData: {
          example: [
            { id: "42", email: "you@yourdomain.com", displayName: "Jane", provider: "ses", verified: true },
          ],
          fields: [
            { name: "[].id", type: "string", description: "Use as from.senderId when sending" },
            { name: "[].email", type: "string", description: "Sender email address" },
            { name: "[].provider", type: "string", description: "ses | gmail | outlook | smtp" },
            { name: "[].verified", type: "boolean", description: "Ready to send" },
          ],
        },
      },
      {
        id: "get-domains",
        method: "GET",
        path: "/domains",
        scope: "read",
        title: "List domains",
        description: "SES sending domains and DNS verification status.",
        queryParams: [
          { name: "page", type: "number", description: "Page number" },
          { name: "limit", type: "number", description: "Results per page" },
        ],
        responseData: {
          example: {
            domains: [{ id: "5", domain: "mail.yourdomain.com", verificationStatus: "verified" }],
          },
          fields: [
            { name: "domains[].id", type: "string", description: "Domain ID for campaigns" },
            { name: "domains[].verificationStatus", type: "string", description: "pending | verified | failed" },
          ],
        },
      },
    ],
  },
  {
    group: "Webhooks",
    description: "Subscribe to delivery events or ingest leads into continuous campaigns.",
    items: [
      {
        id: "get-webhooks",
        method: "GET",
        path: "/webhooks",
        scope: "read",
        title: "List webhook subscriptions",
        description: "Returns active outbound webhook endpoints for this workspace.",
        responseData: {
          example: {
            webhooks: [{ id: "1", url: "https://app.com/hook", events: ["email.delivered"], enabled: true }],
            supportedEvents: ["email.sent", "email.delivered", "email.bounced"],
          },
          fields: [
            { name: "webhooks", type: "array", description: "Registered subscriptions" },
            { name: "supportedEvents", type: "string[]", description: "All event types you can subscribe to" },
          ],
        },
      },
      {
        id: "post-webhooks",
        method: "POST",
        path: "/webhooks",
        scope: "write",
        title: "Create webhook subscription",
        description: "Registers an HTTPS endpoint. The signing secret is returned once on create.",
        requestBody: {
          example: {
            url: "https://your-app.com/webhooks/leadsnipper",
            events: ["email.delivered", "email.bounced"],
            description: "Production delivery events",
          },
          fields: [
            { name: "url", type: "string", required: true, description: "HTTPS endpoint URL" },
            { name: "events", type: "string[]", required: true, description: "email.sent, email.delivered, etc." },
            { name: "description", type: "string", description: "Optional label" },
          ],
        },
        responseData: {
          example: {
            id: "1",
            url: "https://your-app.com/webhooks/leadsnipper",
            events: ["email.delivered"],
            secret: "abc123...",
          },
          fields: [
            { name: "secret", type: "string", description: "HMAC signing secret — copy immediately" },
          ],
        },
        statusCodes: [{ code: 201, description: "Subscription created" }],
      },
    ],
  },
];

export const ERROR_CODES = [
  { code: "AUTHENTICATION_FAILED", status: 401, description: "Missing or invalid API key" },
  { code: "FORBIDDEN", status: 403, description: "Insufficient scope or workspace mismatch" },
  { code: "PAYMENT_REQUIRED", status: 402, description: "Plan does not include API access or subscription expired" },
  { code: "RATE_LIMIT_EXCEEDED", status: 429, description: "Too many requests — retry after reset" },
  { code: "VALIDATION_ERROR", status: 422, description: "Invalid request body or parameters" },
  { code: "NOT_FOUND", status: 404, description: "Resource not found" },
  { code: "CONFLICT", status: 409, description: "Duplicate resource (e.g. lead email exists)" },
];

export const SCOPES = [
  { name: "read", description: "GET endpoints — account, leads, campaigns, analytics, senders" },
  { name: "write", description: "Create, update, delete leads, campaigns, lists, webhooks" },
  { name: "send", description: "Send emails, launch/pause/stop campaigns" },
];

export const RATE_LIMITS = [
  { tier: "Starter", hourly: 100, sendPerMin: 10 },
  { tier: "Growth", hourly: 500, sendPerMin: 30 },
  { tier: "Scale", hourly: 2000, sendPerMin: 100 },
  { tier: "Custom", hourly: 5000, sendPerMin: 200 },
];

export function buildCurl(method: string, path: string, body?: object) {
  const base = API_BASE_PLACEHOLDER;
  const resolvedPath = path.replace(/:campaignId|:id|:leadId|:listId|:senderId|:domainId|:messageId|:subscriptionId/g, "123");
  const lines = [
    `curl -X ${method} "${base}${resolvedPath}" \\`,
    `  -H "Authorization: Bearer ls_live_YOUR_KEY" \\`,
    `  -H "Content-Type: application/json"`,
  ];
  if (body) {
    lines.push(`  -d '${JSON.stringify(body, null, 2)}'`);
  }
  return lines.join("\n");
}

export function getEndpointSampleBody(endpoint: ApiEndpoint): object | undefined {
  return endpoint.requestBody?.example;
}
