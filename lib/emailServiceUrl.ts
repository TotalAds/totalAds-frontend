/** Email service origin from NEXT_PUBLIC_EMAIL_SERVICE_URL (no trailing slash). */
export function getEmailServiceUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";
  return raw.replace(/\/+$/, "");
}

/** Public Developer REST API base URL (`{EMAIL_SERVICE_URL}/v1`). */
export function getDeveloperApiV1BaseUrl(): string {
  return `${getEmailServiceUrl()}/v1`;
}
