/**
 * Detect whether the visitor is in India for pricing / payment routing.
 *
 * Priority:
 * 1. Cached result (session)
 * 2. IP country from our API (CDN geo headers)
 * 3. Browser timezone / IST offset / locale
 * 4. India-first default when still ambiguous (product primary market)
 */

export type RegionSource =
  | "ip"
  | "timezone"
  | "offset"
  | "locale"
  | "cache"
  | "default";

export interface UserRegion {
  isIndia: boolean;
  source: RegionSource;
  countryCode?: string;
}

const CACHE_KEY = "leadsnipper_user_region_v2";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const INDIAN_TIMEZONES = new Set(["Asia/Kolkata", "Asia/Calcutta"]);

const INDIAN_LANGUAGE_PREFIXES = [
  "hi",
  "bn",
  "te",
  "mr",
  "ta",
  "gu",
  "kn",
  "ml",
  "pa",
  "or",
  "as",
  "ur",
];

function readCache(): UserRegion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; region: UserRegion };
    if (Date.now() - parsed.at > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return { ...parsed.region, source: "cache" };
  } catch {
    return null;
  }
}

function writeCache(region: UserRegion): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), region })
    );
  } catch {
    /* ignore quota errors */
  }
}

function localeRegionIsIndia(lang: string): boolean {
  const normalized = lang.trim().replace("_", "-");
  const upper = normalized.toUpperCase();
  if (upper.endsWith("-IN")) return true;

  const base = upper.split("-")[0];
  if (INDIAN_LANGUAGE_PREFIXES.includes(base.toLowerCase())) return true;

  try {
    const locale = new Intl.Locale(normalized);
    return locale.region === "IN";
  } catch {
    return false;
  }
}

/** Fast synchronous check — may be wrong if OS timezone ≠ location. */
export function detectIndiaFromBrowser(): UserRegion | null {
  if (typeof window === "undefined") return null;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  if (INDIAN_TIMEZONES.has(tz) || /kolkata|calcutta/i.test(tz)) {
    return { isIndia: true, source: "timezone", countryCode: "IN" };
  }

  // IST = UTC+5:30
  const offsetMinutes = -new Date().getTimezoneOffset();
  if (offsetMinutes === 330) {
    return { isIndia: true, source: "offset", countryCode: "IN" };
  }

  const languages = navigator.languages?.length
    ? [...navigator.languages]
    : [navigator.language];

  for (const lang of languages) {
    if (lang && localeRegionIsIndia(lang)) {
      return { isIndia: true, source: "locale", countryCode: "IN" };
    }
  }

  return null;
}

function regionFromCountryCode(code: string | null | undefined): UserRegion | null {
  if (!code || code.length !== 2) return null;
  const cc = code.toUpperCase();
  if (cc === "XX" || cc === "T1") return null;
  return {
    isIndia: cc === "IN",
    source: "ip",
    countryCode: cc,
  };
}

async function fetchRegionFromIp(
  endpoint: string
): Promise<UserRegion | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      countryCode?: string | null;
      isIndia?: boolean | null;
    };
    if (typeof data.isIndia === "boolean") {
      return {
        isIndia: data.isIndia,
        source: "ip",
        countryCode: data.countryCode ?? (data.isIndia ? "IN" : undefined),
      };
    }
    return regionFromCountryCode(data.countryCode);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface ResolveUserRegionOptions {
  /** Defaults to email-service public region endpoint */
  ipLookupUrl?: string;
}

/**
 * Resolves visitor region. Prefer this over sync detection on pricing pages.
 */
export async function resolveUserRegion(
  options: ResolveUserRegionOptions = {}
): Promise<UserRegion> {
  const cached = readCache();
  if (cached) return cached;

  const emailBase =
    process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || "http://localhost:3001";
  const ipUrl =
    options.ipLookupUrl ?? `${emailBase}/api/public/region`;

  const fromIp = await fetchRegionFromIp(ipUrl);
  if (fromIp) {
    writeCache(fromIp);
    return fromIp;
  }

  const fromBrowser = detectIndiaFromBrowser();
  if (fromBrowser) {
    writeCache(fromBrowser);
    return fromBrowser;
  }

  const fallback: UserRegion = { isIndia: true, source: "default" };
  writeCache(fallback);
  return fallback;
}

/** Sync helper — browser signals only. */
export function detectIsIndiaUserSync(): boolean {
  const browser = detectIndiaFromBrowser();
  if (browser) return browser.isIndia;
  const cached = readCache();
  if (cached) return cached.isIndia;
  return true;
}
