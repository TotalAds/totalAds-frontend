"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  detectDisplayCurrency,
  formatInrFromPaise,
  formatUsdFromCents,
  type DisplayCurrency,
} from "@/lib/currency";
import emailClient, {
  getEmailServiceErrorMessage,
} from "@/utils/api/emailClient";
import { loadRazorpayScript } from "@/utils/social/razorpayCheckout";

type CapacityPack = {
  slug: string;
  kind: "mailbox_pack" | "volume_booster";
  displayName: string;
  description: string | null;
  mailboxIncrement: number;
  monthlySendIncrement: number;
  monthlyPriceInPaise: number;
  monthlyPriceUsdCents: number;
  projectedMailboxes: number;
  projectedSends: number;
  combinedPriceInPaise: number;
  combinedPriceUsdCents: number;
};

type CapacityPurchase = {
  id: number;
  status: string;
  displayName: string;
  kind: "mailbox_pack" | "volume_booster";
  mailboxIncrement: number;
  monthlySendIncrement: number;
  currency: string;
  amount: number;
  purchasedAt: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paymentId: string | null;
};

type CapacityPayload = {
  entitlement: {
    planName: string | null;
    isLifetime: boolean;
    selfServe: "mailbox_pack" | "volume_booster" | "none";
    unlimitedMailboxes: boolean;
    unlimitedSends: boolean;
    baseMaxMailboxes: number;
    baseMonthlyEmailLimit: number;
    maxMailboxes: number;
    monthlyEmailLimit: number;
    addonMailboxIncrement: number;
    addonMonthlySendIncrement: number;
    connectedMailboxCount: number;
    overCapSenders: { id: number; email: string }[];
    activePack: {
      slug: string;
      displayName: string;
      kind: "mailbox_pack" | "volume_booster";
      mailboxIncrement: number;
      monthlySendIncrement: number;
      monthlyPriceInPaise: number;
      monthlyPriceUsdCents: number;
      currency: string;
      cancelAtPeriodEnd: boolean;
      currentPeriodEnd: string | null;
      status: string;
    } | null;
  };
  pendingCheckout: { packName: string } | null;
  scaleComparison: {
    displayName: string;
    monthlyPriceInPaise: number;
    monthlyPriceUsdCents: number;
    monthlyEmailLimit: number;
    maxMailboxes: number;
  } | null;
  packs: CapacityPack[];
  purchases: CapacityPurchase[];
};

function money(
  currency: DisplayCurrency,
  paise: number,
  usdCents: number
): string {
  return currency === "INR"
    ? formatInrFromPaise(paise)
    : formatUsdFromCents(usdCents);
}

function mailboxLabel(unlimited: boolean, count: number): string {
  return unlimited ? "Unlimited" : count.toLocaleString("en-US");
}

function sendLabel(unlimited: boolean, count: number): string {
  return unlimited ? "Unlimited" : count.toLocaleString("en-US");
}

export default function CapacityExpansionSection() {
  const [payload, setPayload] = useState<CapacityPayload | null>(null);
  const [currency, setCurrency] = useState<DisplayCurrency>("USD");
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<{
    invoiceNumber: string;
    paymentId: string;
    amount: number;
    currency: string;
    packName: string;
    description: string;
    mailboxIncrement: number;
    monthlySendIncrement: number;
    paymentMethod: string;
    paidAt: string | null;
    emailed: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    setCurrency(detectDisplayCurrency());
    const response = await emailClient.get("/api/payment/capacity");
    const data = response.data?.data ?? response.data;
    setPayload(data);
  }, []);

  useEffect(() => {
    load()
      .catch((error: unknown) => {
        toast.error(
          getEmailServiceErrorMessage(error, "Failed to load mailbox expansion")
        );
      })
      .finally(() => setLoading(false));
  }, [load]);

  const shareInvoice = async (paymentId: string) => {
    const response = await emailClient.post("/api/payment/capacity/invoice", {
      paymentId,
    });
    const data = response.data?.data ?? response.data;
    if (!data?.invoice) return null;
    setInvoice({ ...data.invoice, emailed: Boolean(data.emailed) });
    return data.invoice;
  };

  const startCheckout = async (
    pack: CapacityPack,
    paymentMethod: "razorpay" | "cryptomus"
  ) => {
    setBusySlug(`${pack.slug}:${paymentMethod}`);
    try {
      const response = await emailClient.post("/api/payment/capacity/checkout", {
        packSlug: pack.slug,
        currency: paymentMethod === "cryptomus" ? "USD" : currency,
        paymentMethod,
      });
      const checkout = response.data?.data ?? response.data;
      if (checkout?.provider === "cryptomus" && checkout?.paymentUrl) {
        window.location.href = checkout.paymentUrl;
        return;
      }
      if (!checkout?.subscriptionId || !checkout?.keyId) {
        if (checkout?.shortUrl) {
          window.location.href = checkout.shortUrl;
          return;
        }
        throw new Error("Checkout did not return a payment session.");
      }
      await loadRazorpayScript();
      const Razorpay = (
        window as Window & {
          Razorpay?: new (opts: object) => { open: () => void };
        }
      ).Razorpay;
      if (!Razorpay) {
        if (checkout.shortUrl) {
          window.location.href = checkout.shortUrl;
          return;
        }
        throw new Error("Payment gateway failed to load.");
      }
      const instance = new Razorpay({
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        name: "LeadSnipper",
        description: `${checkout.displayName}. Cancelling returns the account to its base limits and keeps connected mailboxes.`,
        handler: async (response: {
          razorpay_payment_id?: string;
          razorpay_subscription_id?: string;
          razorpay_signature?: string;
        }) => {
          try {
            await emailClient.post("/api/payment/capacity/confirm", {
              subscriptionId:
                response?.razorpay_subscription_id || checkout.subscriptionId,
              razorpayPaymentId: response?.razorpay_payment_id,
              razorpaySignature: response?.razorpay_signature,
            });
            if (response?.razorpay_payment_id) {
              try {
                await shareInvoice(response.razorpay_payment_id);
              } catch (invoiceError: unknown) {
                toast.error(
                  getEmailServiceErrorMessage(
                    invoiceError,
                    "The allowance is active. The LeadSnipper invoice could not be sent yet."
                  )
                );
              }
            }
            toast.success(
              pack.kind === "volume_booster"
                ? "Extra sending allowance is active. Your LeadSnipper invoice is on its way."
                : "Extra mailboxes and sending allowance are active. Your LeadSnipper invoice is on its way."
            );
            window.dispatchEvent(new Event("leadsnipper:subscription-updated"));
            await load();
          } catch (error: unknown) {
            toast.error(
              getEmailServiceErrorMessage(
                error,
                "Payment was received, but the allowance has not been applied yet. Refresh billing."
              )
            );
          }
        },
      });
      instance.open();
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Checkout failed"));
    } finally {
      setBusySlug(null);
    }
  };

  const cancelPack = async (purchaseId: number) => {
    setBusySlug(`cancel:${purchaseId}`);
    try {
      await emailClient.post("/api/payment/capacity/cancel", {
        capacitySubscriptionId: purchaseId,
      });
      toast.success(
        "That add-on stays active until the end of its paid period. Other purchases stay in place."
      );
      await load();
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Could not cancel"));
    } finally {
      setBusySlug(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-6 text-sm text-text-200">
        Loading mailbox expansion…
      </div>
    );
  }

  if (!payload) return null;

  const { entitlement, packs, scaleComparison, purchases = [] } = payload;
  const activePurchases = purchases.filter(
    (purchase) =>
      purchase.status === "active" ||
      purchase.status === "past_due" ||
      (purchase.status === "cancelled" && purchase.cancelAtPeriodEnd)
  );
  return (
    <section className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-200">
            {entitlement.isLifetime ? "Lifetime license" : "Current plan"}
          </p>
          <h2 className="text-2xl font-bold text-text-100">
            {entitlement.planName || "LeadSnipper"}
          </h2>
        </div>
        {entitlement.isLifetime && (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-400">
            Permanent
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-bg-200/60 px-4 py-3">
          <p className="text-xs text-text-200">Mailbox capacity</p>
          <p className="text-2xl font-semibold text-text-100">
            {mailboxLabel(entitlement.unlimitedMailboxes, entitlement.maxMailboxes)}
          </p>
          <p className="text-xs text-text-200">
            {entitlement.connectedMailboxCount.toLocaleString("en-US")} connected
            {!entitlement.unlimitedMailboxes &&
              entitlement.addonMailboxIncrement > 0 &&
              ` · base ${entitlement.baseMaxMailboxes.toLocaleString("en-US")} + ${entitlement.addonMailboxIncrement.toLocaleString("en-US")}`}
          </p>
        </div>
        <div className="rounded-lg bg-bg-200/60 px-4 py-3">
          <p className="text-xs text-text-200">Monthly sending allowance</p>
          <p className="text-2xl font-semibold text-text-100">
            {sendLabel(entitlement.unlimitedSends, entitlement.monthlyEmailLimit)}
          </p>
          <p className="text-xs text-text-200">
            {entitlement.unlimitedSends
              ? "No account send cap"
              : `Base ${entitlement.baseMonthlyEmailLimit.toLocaleString("en-US")}${
                  entitlement.addonMonthlySendIncrement > 0
                    ? ` + ${entitlement.addonMonthlySendIncrement.toLocaleString("en-US")} add-on`
                    : ""
                }`}
          </p>
        </div>
      </div>

      {entitlement.overCapSenders.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-text-100">
          <p className="font-medium">
            {entitlement.overCapSenders.length} mailbox
            {entitlement.overCapSenders.length === 1 ? "" : "es"} above the
            current cap
          </p>
          <p className="mt-1 text-text-200">
            These stay connected. They are skipped for new campaign assignment
            until you disconnect down to the cap or add capacity again.
          </p>
          <ul className="mt-2 space-y-1 text-text-200">
            {entitlement.overCapSenders.slice(0, 8).map((sender) => (
              <li key={sender.id}>{sender.email}</li>
            ))}
          </ul>
        </div>
      )}

      {activePurchases.length > 0 && (
        <div className="mt-4 space-y-3">
          {activePurchases.map((purchase) => {
            const renewal = purchase.currentPeriodEnd
              ? format(new Date(purchase.currentPeriodEnd), "MMM dd, yyyy")
              : null;
            const bought = format(
              new Date(purchase.purchasedAt),
              "MMM dd, yyyy · h:mm a"
            );
            return (
              <div
                key={purchase.id}
                className="rounded-lg border border-brand-main/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-100">
                      {purchase.displayName}
                    </p>
                    <p className="mt-1 text-sm text-text-200">
                      {purchase.kind === "volume_booster"
                        ? `${purchase.monthlySendIncrement.toLocaleString("en-US")} extra sends/month`
                        : `${purchase.mailboxIncrement.toLocaleString("en-US")} extra inboxes + ${purchase.monthlySendIncrement.toLocaleString("en-US")} sends/month`}
                    </p>
                    <p className="mt-1 text-sm text-text-100">
                      {money(
                        purchase.currency.toUpperCase() === "INR" ? "INR" : "USD",
                        purchase.currency.toUpperCase() === "INR"
                          ? purchase.amount
                          : 0,
                        purchase.currency.toUpperCase() === "USD"
                          ? purchase.amount
                          : 0
                      )}
                      /mo
                      {renewal ? ` · renews ${renewal}` : ""}
                      {purchase.cancelAtPeriodEnd ? " · cancels at period end" : ""}
                    </p>
                    <p className="mt-1 text-xs text-text-200">
                      Purchased {bought}
                    </p>
                  </div>
                  {!purchase.cancelAtPeriodEnd &&
                    (purchase.status === "active" ||
                      purchase.status === "past_due") && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busySlug != null}
                        onClick={() => void cancelPack(purchase.id)}
                      >
                        Cancel at period end
                      </Button>
                    )}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-text-200">
            Purchases stack. Buying the same add-on again adds another block
            of sends or mailboxes. Cancelling one leaves the others active.
            Connected mailboxes stay when an add-on ends.
          </p>
        </div>
      )}

      {scaleComparison && (
        <div className="mt-4 rounded-lg border border-brand-main/15 p-4 text-sm">
          <p className="font-medium text-text-100">
            Compare with {scaleComparison.displayName}
          </p>
          <p className="mt-1 text-text-200">
            {money(
              currency,
              scaleComparison.monthlyPriceInPaise,
              scaleComparison.monthlyPriceUsdCents
            )}
            /mo includes{" "}
            {scaleComparison.maxMailboxes === 0
              ? "unlimited mailboxes"
              : `${scaleComparison.maxMailboxes.toLocaleString("en-US")} mailboxes`}{" "}
            and {scaleComparison.monthlyEmailLimit.toLocaleString("en-US")}{" "}
            sends. If that is the better fit, upgrade the base plan. Add-ons
            stay available and stack on the plan you keep.
          </p>
        </div>
      )}

      {packs.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {packs.map((pack) => {
            const price = money(
              currency,
              pack.monthlyPriceInPaise,
              pack.monthlyPriceUsdCents
            );
            const combined = money(
              currency,
              pack.combinedPriceInPaise,
              pack.combinedPriceUsdCents
            );
            return (
              <div
                key={pack.slug}
                className="flex flex-col rounded-lg border border-brand-main/10 p-4"
              >
                <p className="font-semibold text-text-100">{pack.displayName}</p>
                <p className="mt-1 text-sm text-text-200">
                  {pack.kind === "volume_booster"
                    ? `+${pack.monthlySendIncrement.toLocaleString("en-US")} campaign sends/month`
                    : `+${pack.mailboxIncrement.toLocaleString("en-US")} inboxes and +${pack.monthlySendIncrement.toLocaleString("en-US")} sends/month`}
                </p>
                <p className="mt-3 text-xl font-semibold text-text-100">
                  {price}
                  <span className="text-sm font-normal text-text-200">/mo</span>
                </p>
                <p className="mt-1 text-xs text-text-200">
                  New total:{" "}
                  {entitlement.unlimitedMailboxes
                    ? "unlimited mailboxes"
                    : `${pack.projectedMailboxes.toLocaleString("en-US")} mailboxes`}
                  ,{" "}
                  {entitlement.unlimitedSends
                    ? "unlimited sends"
                    : `${pack.projectedSends.toLocaleString("en-US")} sends`}
                  . Price with this add-on {combined}/mo. Tax is shown at checkout.
                  You can buy this again later. Each purchase is billed until
                  you cancel that one.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    type="button"
                    disabled={busySlug != null}
                    onClick={() => void startCheckout(pack, "razorpay")}
                  >
                    {busySlug === `${pack.slug}:razorpay`
                      ? "Opening checkout…"
                      : currency === "INR"
                        ? "Pay with Razorpay"
                        : "Pay with card"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busySlug != null}
                    onClick={() => void startCheckout(pack, "cryptomus")}
                  >
                    {busySlug === `${pack.slug}:cryptomus`
                      ? "Opening crypto checkout…"
                      : `Pay ${formatUsdFromCents(pack.monthlyPriceUsdCents)} with crypto`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {purchases.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-text-100">Purchase history</p>
          <ul className="mt-2 divide-y divide-brand-main/10 rounded-lg border border-brand-main/10">
            {purchases.map((purchase) => (
              <li
                key={purchase.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-text-100">{purchase.displayName}</p>
                  <p className="text-text-200">
                    {purchase.kind === "volume_booster"
                      ? `+${purchase.monthlySendIncrement.toLocaleString("en-US")} sends/month`
                      : `+${purchase.mailboxIncrement.toLocaleString("en-US")} mailboxes, +${purchase.monthlySendIncrement.toLocaleString("en-US")} sends/month`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-text-100">
                    {format(new Date(purchase.purchasedAt), "MMM dd, yyyy · h:mm a")}
                  </p>
                  <p className="text-xs capitalize text-text-200">{purchase.status.replace("_", " ")}</p>
                  {purchase.paymentId && (
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-brand-main"
                      onClick={() => {
                        if (!purchase.paymentId) return;
                        void shareInvoice(purchase.paymentId).catch((error: unknown) => {
                          toast.error(
                            getEmailServiceErrorMessage(
                              error,
                              "Could not open the LeadSnipper invoice"
                            )
                          );
                        });
                      }}
                    >
                      View LeadSnipper invoice
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {invoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-brand-main/20 bg-bg-200 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-wide text-text-200">LeadSnipper invoice</p>
            <h3 className="mt-1 text-xl font-bold text-text-100">{invoice.invoiceNumber}</h3>
            <p className="mt-1 text-sm text-text-200">{invoice.packName}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-200">Amount</dt>
                <dd className="font-medium text-text-100">
                  {money(
                    invoice.currency.toUpperCase() === "INR" ? "INR" : "USD",
                    invoice.currency.toUpperCase() === "INR" ? invoice.amount : 0,
                    invoice.currency.toUpperCase() === "USD" ? invoice.amount : 0
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-200">Added</dt>
                <dd className="text-right font-medium text-text-100">
                  {[
                    invoice.mailboxIncrement > 0
                      ? `+${invoice.mailboxIncrement.toLocaleString("en-US")} mailboxes`
                      : null,
                    invoice.monthlySendIncrement > 0
                      ? `+${invoice.monthlySendIncrement.toLocaleString("en-US")} sends/month`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" and ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-200">Paid with</dt>
                <dd className="font-medium text-text-100">{invoice.paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-200">Payment</dt>
                <dd className="font-medium text-text-100">{invoice.paymentId}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-text-200">
              {invoice.emailed
                ? "A copy of this LeadSnipper invoice is queued to your email."
                : "This LeadSnipper invoice was already sent to your email."}
            </p>
            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => setInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
