"use client";

import Link from "next/link";

import { ContactMetrics } from "@/utils/api/emailClient";
import { IconAlertTriangle, IconArrowUpRight } from "@tabler/icons-react";

interface ContactPlanLimitBannerProps {
  metrics: ContactMetrics | null;
  className?: string;
}

/**
 * Surfaces contact quota state (trial / paid) with a clear upgrade path.
 */
export default function ContactPlanLimitBanner({
  metrics,
  className = "",
}: ContactPlanLimitBannerProps) {
  if (!metrics?.contacts?.limit || metrics.contacts.limit <= 0) {
    return null;
  }

  const { total, limit, atLimit, nearLimit } = metrics.contacts;
  const tierName = metrics.tier?.name;
  const subStatus = metrics.subscription?.status;
  const isTrial =
    tierName === "trial" || subStatus === "trial";
  const planLabel = metrics.tier?.displayName || (isTrial ? "Trial" : "plan");

  if (!atLimit && !nearLimit) {
    return null;
  }

  const upgradeHref = "/email/pricing";

  if (atLimit) {
    return (
      <div
        className={`rounded-xl border border-rose-300 bg-rose-50 p-5 flex flex-col sm:flex-row sm:items-start gap-4 shadow-sm ${className}`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
          <IconAlertTriangle className="w-5 h-5 text-rose-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {isTrial
              ? "You've reached your trial contact limit"
              : "You've reached your contact limit"}
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            {isTrial ? (
              <>
                Your trial includes up to{" "}
                <strong>{limit.toLocaleString()} contacts</strong>
                {total > 0 && (
                  <>
                    {" "}
                    and you&apos;re at{" "}
                    <strong>{total.toLocaleString()}</strong>
                  </>
                )}
                . Upgrade to a paid plan to add more contacts and keep your
                campaigns growing.
              </>
            ) : (
              <>
                Your <strong>{planLabel}</strong> plan allows up to{" "}
                <strong>{limit.toLocaleString()} contacts</strong>
                {total > 0 && (
                  <>
                    {" "}
                    ({total.toLocaleString()} used)
                  </>
                )}
                . Upgrade to raise your limit and add more leads.
              </>
            )}
          </p>
          <Link
            href={upgradeHref}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-700 rounded-lg hover:bg-rose-800 transition-colors"
          >
            View plans and upgrade
            <IconArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // near limit (≥90%)
  return (
    <div
      className={`rounded-xl border border-amber-300 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-start gap-4 shadow-sm ${className}`}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
        <IconAlertTriangle className="w-5 h-5 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Almost at your contact limit
        </h3>
        <p className="text-sm text-gray-700 mb-3">
          You&apos;re using{" "}
          <strong>
            {total.toLocaleString()} of {limit.toLocaleString()}
          </strong>{" "}
          contacts on {isTrial ? "your trial" : `your ${planLabel} plan`}.
          {metrics.contacts.remaining != null && metrics.contacts.remaining > 0 && (
            <>
              {" "}
              Only{" "}
              <strong>
                {metrics.contacts.remaining.toLocaleString()} slot
                {metrics.contacts.remaining === 1 ? "" : "s"}
              </strong>{" "}
              left before you need to upgrade.
            </>
          )}
        </p>
        <Link
          href={upgradeHref}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
        >
          Compare plans
          <IconArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
