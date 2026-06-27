"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatSenderFromPreview,
  isValidSenderDisplayName,
  normalizeSenderDisplayName,
} from "@/lib/senderDisplayName";
import { SendingAccount, updateSendingAccount } from "@/utils/api/emailClient";

interface EditSendingAccountNameDialogProps {
  account: SendingAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EditSendingAccountNameDialog({
  account,
  open,
  onOpenChange,
  onSaved,
}: EditSendingAccountNameDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && account) {
      setDisplayName(account.displayName?.trim() || "");
    }
  }, [open, account]);

  const handleSave = async () => {
    if (!account) return;
    const normalized = normalizeSenderDisplayName(displayName);
    if (!isValidSenderDisplayName(normalized)) {
      toast.error("Enter a sender name (1–100 characters)");
      return;
    }
    setSaving(true);
    try {
      await updateSendingAccount(account.id, { displayName: normalized });
      toast.success("Sender name updated");
      onSaved?.();
      onOpenChange(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update sender name";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-slate-200 bg-white text-slate-900 sm:rounded-2xl">
        <DialogHeader className="text-left">
          <DialogTitle>Edit sender name</DialogTitle>
          <DialogDescription className="text-slate-500">
            This is the name recipients see in their inbox From field.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Sender name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sarah from Acme"
              maxLength={100}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Recipients will see
            </p>
            <p className="font-mono text-sm text-slate-800">
              {formatSenderFromPreview(
                account.email,
                isValidSenderDisplayName(displayName) ? displayName : account.displayName
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : "Save name"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
