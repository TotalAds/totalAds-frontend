"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  EspMatchingCard,
  type EspMatchingValue,
} from "@/components/campaigns/EspMatchingCard";
import {
  getEmailServiceErrorMessage,
  getWorkspaceEspSettings,
  saveWorkspaceEspSettings,
} from "@/utils/api/emailClient";

const EMPTY: EspMatchingValue = {
  inheritWorkspaceDefault: false,
  mode: "off",
  unknownRecipientPolicy: "any_eligible",
  rules: [],
};

export default function EspWorkspaceSection() {
  const [value, setValue] = useState<EspMatchingValue>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getWorkspaceEspSettings()
      .then((settings) => {
        if (!settings) return;
        setValue({
          inheritWorkspaceDefault: false,
          mode: settings.mode ?? "off",
          unknownRecipientPolicy: settings.unknownRecipientPolicy ?? "any_eligible",
          rules: (settings.rules ?? []).map((rule: EspMatchingValue["rules"][number]) => ({
            senderFamily: rule.senderFamily,
            recipientFamily: rule.recipientFamily,
            action: rule.action,
            enabled: rule.enabled !== false,
            label: rule.label ?? "",
          })),
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-3">
      <EspMatchingCard value={value} onChange={setValue} showInherit={false} />
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          void saveWorkspaceEspSettings({
            mode: value.mode,
            unknownRecipientPolicy: value.unknownRecipientPolicy,
            rules: value.rules,
          })
            .then(() => toast.success("ESP matching default saved"))
            .catch((error: unknown) =>
              toast.error(getEmailServiceErrorMessage(error, "Could not save ESP matching"))
            )
            .finally(() => setSaving(false));
        }}
        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save workspace default"}
      </button>
    </div>
  );
}
