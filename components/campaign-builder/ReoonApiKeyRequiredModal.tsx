"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getReoonStatus, saveReoonApiKey } from "@/utils/api/reoonClient";
import Link from "next/link";

interface ReoonApiKeyRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a valid API key is saved so the parent can continue the flow */
  onConfigured?: () => void;
}

export default function ReoonApiKeyRequiredModal({
  open,
  onOpenChange,
  onConfigured,
}: ReoonApiKeyRequiredModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) {
      toast.error("Enter your Reoon API key");
      return;
    }
    try {
      setSaving(true);
      await saveReoonApiKey(trimmed);
      const status = await getReoonStatus();
      if (!status.isConfigured) {
        toast.error("Could not confirm Reoon setup. Try again.");
        return;
      }
      setApiKey("");
      toast.success("Reoon connected. You can send your campaign now.");
      onOpenChange(false);
      onConfigured?.();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save Reoon API key";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-lg backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-text-100 text-xl">
            Add your Reoon API key first
          </DialogTitle>
          <DialogDescription className="text-text-200/80 text-sm text-left">
            Campaign sending uses Reoon to verify recipient emails. Connect your
            Reoon account before creating or queueing a campaign so verification
            does not fail partway through.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label
              htmlFor="reoon-api-key-campaign"
              className="block text-xs font-medium text-text-200 mb-1.5"
            >
              Reoon API key
            </label>
            <input
              id="reoon-api-key-campaign"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your key from Reoon"
              className="w-full rounded-lg border border-brand-main/20 bg-bg-100 px-3 py-2 text-sm text-text-100 placeholder:text-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main/40"
            />
            <p className="mt-2 text-xs text-text-200/70">
              Keys are encrypted and stored per account. You can also add or
              update this under{" "}
              <span className="text-text-100">Settings → Integrations</span>.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Link href="/email/settings?tab=integrations" target="_blank" rel="noopener noreferrer">
            <Button
              type="button"
              variant="ghost"
             
            >
              Open Integrations
            </Button>
            </Link>
            <Button
              type="submit"
              className="bg-brand-main hover:bg-brand-main/80 text-white"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
