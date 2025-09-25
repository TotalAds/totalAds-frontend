"use client";

import posthog from "posthog-js";

// Generic safe guard
const safeCapture = (name: string, props?: Record<string, any>) => {
  try {
    if (typeof window === "undefined") return;
    if (!(posthog as any)?.capture) return;
    const base = { app: "frontend" };
    (posthog as any).capture(name, { ...base, ...(props || {}) });
  } catch (_) {
    // no-op
  }
};

export const trackEvent = (name: string, props?: Record<string, any>) => {
  safeCapture(name, props);
};

export const identifyUser = (user: {
  id?: string;
  email?: string;
  name?: string;
}) => {
  try {
    if (typeof window === "undefined") return;
    const distinctId = user.id || user.email || undefined;
    if (!distinctId) return;
    // Lazily import to avoid circular deps at module init
    const { getUtmForAnalytics } = require("./utm");
    const utmProps =
      typeof getUtmForAnalytics === "function" ? getUtmForAnalytics() : {};
    posthog.identify(distinctId, {
      email: user.email,
      name: user.name,
      app: "frontend",
      ...utmProps,
    });
  } catch (_) {
    // no-op
  }
};

export const resetIdentity = () => {
  try {
    if (typeof window === "undefined") return;
    posthog.reset();
  } catch (_) {
    // no-op
  }
};
