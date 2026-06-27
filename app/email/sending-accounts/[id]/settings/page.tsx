"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { LargeDailyEmailCapModal } from "@/components/email/LargeDailyEmailCapModal";
import { SenderPacingSettingsForm } from "@/components/email/SenderPacingSettingsForm";
import { Button } from "@/components/ui/button";
import { formatSenderFromPreview } from "@/lib/senderDisplayName";
import {
  isAboveRecommendedDailyEmailCap,
  SENDER_PACING_DEFAULTS,
  SenderPacingFormValues,
} from "@/lib/senderPacing";
import {
  getSendingAccount,
  SendingAccount,
  updateSendingAccount,
} from "@/utils/api/emailClient";
import { IconArrowLeft, IconSettings } from "@tabler/icons-react";

export default function SendingAccountSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const senderId = params.id as string;

  const [account, setAccount] = useState<SendingAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [pacing, setPacing] = useState<SenderPacingFormValues>({ ...SENDER_PACING_DEFAULTS });
  const [largeCapModalOpen, setLargeCapModalOpen] = useState(false);

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSendingAccount(senderId);
      setAccount(data);
      setDisplayName(data.displayName?.trim() || "");
      setPacing({
        campaignDailyLimit:
          data.campaignDailyLimit ?? SENDER_PACING_DEFAULTS.campaignDailyLimit,
        minWaitMinutes: data.minWaitMinutes ?? SENDER_PACING_DEFAULTS.minWaitMinutes,
        slowRampEnabled: data.slowRampEnabled ?? SENDER_PACING_DEFAULTS.slowRampEnabled,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load sender";
      toast.error(msg);
      router.push("/email/sending-accounts");
    } finally {
      setLoading(false);
    }
  }, [senderId, router]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const persistSettings = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast.error("Enter a sender name");
      return;
    }
    setSaving(true);
    try {
      await updateSendingAccount(senderId, {
        displayName: trimmedName,
        campaignDailyLimit: pacing.campaignDailyLimit,
        minWaitMinutes: pacing.minWaitMinutes,
        slowRampEnabled: pacing.slowRampEnabled,
      });
      toast.success("Settings saved");
      await loadAccount();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to save settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (isAboveRecommendedDailyEmailCap(pacing.campaignDailyLimit)) {
      setLargeCapModalOpen(true);
      return;
    }
    void persistSettings();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-main border-t-transparent" />
      </div>
    );
  }

  if (!account) return null;

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href="/email/sending-accounts"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-main hover:underline"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Sending Accounts
        </Link>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] sm:p-7">
          <div className="mb-6 flex items-start gap-3 border-b border-slate-200 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-main/10">
              <IconSettings className="h-5 w-5 text-brand-main" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-100">Inbox settings</h1>
              <p className="mt-0.5 text-sm text-text-200">{account.email}</p>
              <p className="mt-1 font-mono text-xs text-text-300">
                {formatSenderFromPreview(account.email, displayName || account.displayName)}
              </p>
            </div>
          </div>

          <div className="mb-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-100">
                Name in inbox
              </label>
              <p className="mb-2 text-xs text-text-200">
                What people see next to your email (for example, &quot;Alex from Acme&quot;).
              </p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                placeholder="e.g. Alex from Acme"
                className="w-full rounded-lg border border-brand-main/20 bg-brand-main/5 px-3 py-2 text-sm text-text-100"
              />
            </div>
          </div>

          <SenderPacingSettingsForm values={pacing} onChange={setPacing} mode="sender-defaults" />

          <div className="mt-8 flex gap-2 border-t border-slate-200 pt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/email/sending-accounts")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <LargeDailyEmailCapModal
        open={largeCapModalOpen}
        onOpenChange={setLargeCapModalOpen}
        dailyCap={pacing.campaignDailyLimit}
        onConfirm={() => void persistSettings()}
      />
    </>
  );
}
