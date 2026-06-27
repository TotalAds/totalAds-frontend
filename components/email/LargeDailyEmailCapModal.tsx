"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAX_DAILY_EMAIL_CAP } from "@/lib/senderPacing";

interface LargeDailyEmailCapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyCap: number;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function LargeDailyEmailCapModal({
  open,
  onOpenChange,
  dailyCap,
  onConfirm,
  onCancel,
}: LargeDailyEmailCapModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (open) {
      setAcknowledged(false);
    }
  }, [open, dailyCap]);

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!acknowledged) return;
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-slate-200 bg-white text-center sm:rounded-2xl [&>button]:hidden">
        <DialogHeader className="items-center space-y-3 text-center">
          <DialogTitle className="text-2xl font-semibold text-slate-800">
            <span aria-hidden className="mr-1">
              😮
            </span>
            Large daily limit
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 text-sm leading-relaxed text-slate-600">
              <p>
                You set this inbox to send more than{" "}
                <strong className="text-slate-800">{MAX_DAILY_EMAIL_CAP} emails per day</strong>{" "}
                (currently <strong className="text-slate-800">{dailyCap.toLocaleString()}</strong>
                ).
              </p>
              <p>
                Sending too many emails from one inbox can hurt your sender reputation and may get
                your account blocked by your email provider.
              </p>
              <p className="text-[#e34856]">
                Check with your email provider before using a high daily cap, or they may suspend
                your account.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <label className="mx-auto flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#e34856] focus:ring-[#e34856]"
          />
          I understand what I&apos;m doing
        </label>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!acknowledged}
            className="min-w-[120px] rounded-lg bg-[#e34856] text-white hover:bg-[#d63d4b] disabled:opacity-50"
          >
            Continue
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            className="min-w-[120px] rounded-lg bg-[#4a4a4a] text-white hover:bg-[#3a3a3a]"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
