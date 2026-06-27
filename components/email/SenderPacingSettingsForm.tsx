"use client";

import { IconInfoCircle } from "@tabler/icons-react";

import type { SenderPacingFormValues } from "@/lib/senderPacing";
import {
  isCriticalDailyEmailCap,
  MAX_DAILY_EMAIL_CAP,
  SENDER_PACING_DEFAULTS,
} from "@/lib/senderPacing";

export type { SenderPacingFormValues };

interface SenderPacingSettingsFormProps {
  values: SenderPacingFormValues;
  onChange: (values: SenderPacingFormValues) => void;
  /** sender-defaults = inbox settings; campaign = per-campaign */
  mode?: "sender-defaults" | "campaign";
  disabled?: boolean;
}

export function SenderPacingSettingsForm({
  values,
  onChange,
  mode = "sender-defaults",
  disabled = false,
}: SenderPacingSettingsFormProps) {
  const isCampaign = mode === "campaign";
  const defaultCap = SENDER_PACING_DEFAULTS.campaignDailyLimit;
  const showCriticalCapWarning = isCriticalDailyEmailCap(
    values.campaignDailyLimit,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-brand-main/10 bg-brand-main/5 p-3 text-xs leading-relaxed text-text-200">
        {isCampaign ? (
          <p>
            These settings apply to <strong className="text-text-100">this campaign only</strong>.
            The daily cap below is optional — leave it matching inbox settings to share the full
            inbox pool across campaigns.
          </p>
        ) : (
          <p>
            Total emails this inbox may send per day <strong className="text-text-100">across all
            campaigns combined</strong>. Campaigns without their own cap share this pool.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-100">Daily email cap</h3>
        <p className="mb-2 mt-1 text-xs leading-relaxed text-text-200">
          {isCampaign
            ? "Max emails this campaign may send per day from the inbox pool. Resets at midnight UTC."
            : `Total emails per day for this inbox (all campaigns combined). New inboxes start at ${defaultCap}. We recommend up to ${MAX_DAILY_EMAIL_CAP} per day.`}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={values.campaignDailyLimit}
            onChange={(e) =>
              onChange({
                ...values,
                campaignDailyLimit: Math.max(
                  1,
                  parseInt(e.target.value, 10) || 1,
                ),
              })
            }
            disabled={disabled}
            className={`w-24 rounded-lg border px-3 py-2 text-sm text-text-100 disabled:opacity-50 ${
              showCriticalCapWarning
                ? "border-red-400 bg-red-50 focus:ring-red-400"
                : "border-brand-main/20 bg-brand-main/5 focus:ring-brand-main"
            }`}
          />
          <span className="text-sm text-text-200">emails per day</span>
        </div>
        {showCriticalCapWarning && (
          <p className="mt-1.5 text-xs font-medium text-red-600">
            Critical level — please decrease.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-100">
          Gap between campaigns
        </h3>
        <p className="mb-2 mt-1 text-xs leading-relaxed text-text-200">
          If this inbox runs more than one campaign at once, wait this long
          after another campaign sends before this one sends again. Helps your
          mail look natural.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={1440}
            value={values.minWaitMinutes}
            onChange={(e) =>
              onChange({
                ...values,
                minWaitMinutes: Math.max(0, parseInt(e.target.value, 10) || 0),
              })
            }
            disabled={disabled}
            className="w-24 rounded-lg border border-brand-main/20 bg-brand-main/5 px-3 py-2 text-sm text-text-100 disabled:opacity-50"
          />
          <span className="text-sm text-text-200">minutes</span>
        </div>
        <p className="mt-1 text-[11px] text-text-300">
          Use 0 for no extra wait.
        </p>
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-text-100">
            Increase volume slowly
          </h3>
          <IconInfoCircle className="h-4 w-4 text-text-300" aria-hidden />
        </div>
        <p className="mb-3 text-xs leading-relaxed text-text-200">
          {values.slowRampEnabled ? (
            isCampaign ? (
              <>
                Slow ramp is controlled in inbox settings. When on, the inbox starts around{" "}
                <strong className="text-text-100">{defaultCap}/day</strong> and can grow ~20% after
                reaching 80% of the current cap (up to{" "}
                <strong className="text-text-100">{MAX_DAILY_EMAIL_CAP}/day</strong>).
              </>
            ) : (
              <>
                Starts around <strong className="text-text-100">{defaultCap}/day</strong>. After you
                reach <strong className="text-text-100">80%</strong> of the current cap in a day,
                tomorrow&apos;s limit grows by about{" "}
                <strong className="text-text-100">20%</strong>, up to{" "}
                <strong className="text-text-100">{MAX_DAILY_EMAIL_CAP}/day</strong> (or your cap if
                lower).
              </>
            )
          ) : (
            <>
              Off: send up to your full daily cap ({values.campaignDailyLimit}/day) right away. Only
              turn off if this inbox and list are already well warmed.
            </>
          )}
        </p>
        {!isCampaign && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={values.slowRampEnabled}
                onChange={(e) =>
                  onChange({ ...values, slowRampEnabled: e.target.checked })
                }
                disabled={disabled}
                className="h-4 w-4 rounded border-brand-main/20 text-brand-main focus:ring-brand-main disabled:opacity-50"
              />
              <span className="text-sm text-text-200">
                Increase volume slowly (~20% after 80% usage)
              </span>
            </label>
            <span className="rounded-full bg-brand-main px-2.5 py-0.5 text-xs font-medium text-white">
              Recommended
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
