/**
 * Currency helpers for LeadSnipper in-app pricing & checkout.
 * Mirrors landing-page pricing: INR for India, USD for international visitors.
 */

import { detectIsIndiaUserSync, resolveUserRegion } from "./userRegion";

export type DisplayCurrency = "INR" | "USD";
export type PaymentMethod = "razorpay" | "cryptomus";
export type PlanName = "starter" | "growth" | "scale";

export interface PlanPrice {
  inr: number;
  usd: number;
}

/** Marketing/display SoT — keep in sync with landing `lib/currency.ts` PLANS. */
export const PLANS: Record<PlanName, PlanPrice> = {
  starter: { inr: 999, usd: 19 },
  growth: { inr: 2499, usd: 49 },
  scale: { inr: 5999, usd: 119 },
};

export const INR_PER_USD = 50;

export { detectIsIndiaUserSync as detectIsIndiaUser, resolveUserRegion };

export function detectDisplayCurrency(): DisplayCurrency {
  return detectIsIndiaUserSync() ? "INR" : "USD";
}

export function formatInr(inr: number): string {
  return `₹${Math.max(0, Math.round(inr)).toLocaleString("en-IN")}`;
}

export function formatUsd(usd: number): string {
  return `$${Math.max(0, Number(usd.toFixed(2))).toLocaleString("en-US")}`;
}

export function formatInrFromPaise(paise: number): string {
  return formatInr(paise / 100);
}

export function formatUsdFromCents(cents: number): string {
  return `$${(Math.max(0, cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function displayPlanPrice(
  plan: PlanName | string,
  currency: DisplayCurrency
): string {
  const price =
    (PLANS as Record<string, PlanPrice | undefined>)[plan] ?? PLANS.starter;
  return currency === "INR" ? formatInr(price.inr) : formatUsd(price.usd);
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
