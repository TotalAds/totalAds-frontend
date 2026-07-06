/**
 * Currency helpers for LeadSnipper in-app pricing & checkout.
 * Mirrors landing-page pricing: INR for India, USD for international visitors.
 */

export type DisplayCurrency = "INR" | "USD";
export type PaymentMethod = "razorpay" | "cryptomus";

export const INR_PER_USD = 50;

export function detectIsIndiaUser(): boolean {
  if (typeof window === "undefined") return true;

  const languages = navigator.languages ?? [navigator.language];
  const isIndiaLanguage = languages.some((lang) =>
    lang.toUpperCase().endsWith("-IN")
  );
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const isIndiaTimeZone = timeZone.includes("Asia/Kolkata");

  return isIndiaLanguage || isIndiaTimeZone;
}

export function detectDisplayCurrency(): DisplayCurrency {
  return detectIsIndiaUser() ? "INR" : "USD";
}

export function formatInrFromPaise(paise: number): string {
  return `₹${Math.max(0, Math.round(paise / 100)).toLocaleString("en-IN")}`;
}

export function formatUsdFromCents(cents: number): string {
  return `$${(Math.max(0, cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function inrPaiseToUsdCents(paise: number): number {
  return Math.max(1, Math.round(paise / INR_PER_USD));
}

export function formatTierPrice(
  monthlyPriceInPaise: number,
  monthlyPriceUsdCents: number | null | undefined,
  currency: DisplayCurrency,
  multiplier = 1
): string {
  if (currency === "INR") {
    return formatInrFromPaise(monthlyPriceInPaise * multiplier);
  }

  const usdCents =
    monthlyPriceUsdCents && monthlyPriceUsdCents > 0
      ? monthlyPriceUsdCents * multiplier
      : inrPaiseToUsdCents(monthlyPriceInPaise * multiplier);

  return formatUsdFromCents(usdCents);
}

export function tierPriceMinorUnits(
  monthlyPriceInPaise: number,
  monthlyPriceUsdCents: number | null | undefined,
  currency: DisplayCurrency,
  multiplier = 1
): number {
  if (currency === "INR") {
    return monthlyPriceInPaise * multiplier;
  }

  if (monthlyPriceUsdCents && monthlyPriceUsdCents > 0) {
    return monthlyPriceUsdCents * multiplier;
  }

  return inrPaiseToUsdCents(monthlyPriceInPaise * multiplier);
}

export function availablePaymentMethods(isIndia: boolean): PaymentMethod[] {
  if (isIndia) {
    return ["razorpay", "cryptomus"];
  }
  return ["cryptomus"];
}

export function defaultPaymentMethod(isIndia: boolean): PaymentMethod {
  return isIndia ? "razorpay" : "cryptomus";
}
