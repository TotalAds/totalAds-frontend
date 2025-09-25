"use client";

import { trackEvent } from "./track";

export type UtmParams = Partial<{
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  ref: string;
}>;

const STORAGE_KEY = "utm_params";
const FIRST_STORAGE_KEY = "utm_params_first";

const isBrowser = () => typeof window !== "undefined";

export const parseUtmFromSearch = (search?: string): UtmParams => {
  if (!isBrowser()) return {};
  const sp = new URLSearchParams(search ?? window.location.search);
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "ref",
  ];
  const result: UtmParams = {};
  keys.forEach((k) => {
    const v = sp.get(k);
    if (v) (result as any)[k] = v;
  });
  return result;
};

export const getStoredUtm = (): UtmParams => {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
};

export const getFirstTouchUtm = (): UtmParams => {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(FIRST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
};

const setCookie = (name: string, value: string, days = 90) => {
  if (!isBrowser()) return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
};

export const storeUtm = (params: UtmParams) => {
  if (!isBrowser()) return;
  try {
    const existing = getStoredUtm();
    const merged = { ...existing, ...params };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setCookie(STORAGE_KEY, JSON.stringify(merged));

    // First-touch
    const first = getFirstTouchUtm();
    if (!first || Object.keys(first).length === 0) {
      localStorage.setItem(FIRST_STORAGE_KEY, JSON.stringify(merged));
      setCookie(FIRST_STORAGE_KEY, JSON.stringify(merged));
    }
  } catch {
    // no-op
  }
};

export const initUtmTracking = () => {
  if (!isBrowser()) return;
  const fromUrl = parseUtmFromSearch();
  if (Object.keys(fromUrl).length > 0) {
    storeUtm(fromUrl);
    try {
      trackEvent("utm_captured", {
        ...fromUrl,
        utm_capture_url: window.location.href,
      });
    } catch {}
  }
};

export const appendUtmToPath = (href: string, params?: UtmParams): string => {
  try {
    const url = new URL(href, window.location.origin);
    const current = params ?? getStoredUtm();
    Object.entries(current).forEach(([k, v]) => {
      if (!v) return;
      if (!url.searchParams.get(k)) url.searchParams.set(k, v as string);
    });
    // Return relative if the input was relative
    if (href.startsWith("/")) {
      return url.pathname + (url.search ? `?${url.searchParams.toString()}` : "");
    }
    return url.toString();
  } catch {
    return href;
  }
};

export const getUtmForAnalytics = () => {
  const latest = getStoredUtm();
  const first = getFirstTouchUtm();
  return {
    ...Object.fromEntries(
      Object.entries(first).map(([k, v]) => [`first_${k}`, v])
    ),
    ...Object.fromEntries(
      Object.entries(latest).map(([k, v]) => [`latest_${k}`, v])
    ),
  } as Record<string, string>;
};

