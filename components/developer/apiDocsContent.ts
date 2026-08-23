export const API_BASE_PLACEHOLDER = "https://your-email-service/v1";

export const API_ENDPOINTS = [
  {
    group: "Account",
    items: [
      { method: "GET", path: "/me", scope: "read", description: "Authenticated user, workspace, and key metadata" },
      { method: "GET", path: "/account/eligibility", scope: "read", description: "Whether the account can send email" },
      { method: "GET", path: "/account/usage", scope: "read", description: "Credits balance and send quota" },
      { method: "GET", path: "/account/rate-limit", scope: "read", description: "Current rate limit state" },
    ],
  },
  {
    group: "Emails",
    items: [
      { method: "POST", path: "/emails/send", scope: "send", description: "Send one email immediately" },
    ],
  },
  {
    group: "Campaigns",
    items: [
      { method: "GET", path: "/campaigns", scope: "read", description: "List campaigns" },
      { method: "POST", path: "/campaigns", scope: "write", description: "Create draft campaign" },
      { method: "POST", path: "/campaigns/send", scope: "send", description: "Atomic create + send" },
      { method: "POST", path: "/campaigns/:id/send", scope: "send", description: "Launch existing campaign" },
      { method: "POST", path: "/campaigns/:id/pause", scope: "send", description: "Pause campaign" },
      { method: "POST", path: "/campaigns/:id/stop", scope: "send", description: "Cancel campaign" },
      { method: "GET", path: "/campaigns/:id/analytics", scope: "read", description: "Campaign metrics" },
    ],
  },
  {
    group: "Leads",
    items: [
      { method: "GET", path: "/leads", scope: "read", description: "List and filter leads" },
      { method: "POST", path: "/leads", scope: "write", description: "Create lead" },
      { method: "POST", path: "/leads/bulk", scope: "write", description: "Bulk create up to 1000 leads" },
      { method: "POST", path: "/leads/verify", scope: "write", description: "Bulk Reoon verify by lead IDs" },
    ],
  },
  {
    group: "Webhooks",
    items: [
      { method: "GET", path: "/webhooks", scope: "read", description: "List outbound webhook subscriptions" },
      { method: "POST", path: "/webhooks", scope: "write", description: "Register HTTPS webhook endpoint" },
      { method: "DELETE", path: "/webhooks/:id", scope: "write", description: "Disable webhook subscription" },
    ],
  },
];

export const ERROR_CODES = [
  { code: "AUTHENTICATION_FAILED", status: 401, description: "Missing or invalid API key" },
  { code: "FORBIDDEN", status: 403, description: "Insufficient scope or workspace mismatch" },
  { code: "PAYMENT_REQUIRED", status: 402, description: "Plan does not include API access or subscription expired" },
  { code: "RATE_LIMIT_EXCEEDED", status: 429, description: "Too many requests — retry after reset" },
  { code: "VALIDATION_ERROR", status: 422, description: "Invalid request body or parameters" },
];

export function buildCurl(method: string, path: string, body?: object) {
  const base = API_BASE_PLACEHOLDER;
  const lines = [
    `curl -X ${method} "${base}${path}" \\`,
    `  -H "Authorization: Bearer ls_live_YOUR_KEY" \\`,
    `  -H "Content-Type: application/json"`,
  ];
  if (body) {
    lines.push(`  -d '${JSON.stringify(body, null, 2)}'`);
  }
  return lines.join("\n");
}
