"use client";

import { Loader2, Rocket, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { createCampaign, getEmailServiceErrorMessage } from "@/utils/api/emailClient";
import { INBOX_CAMPAIGN_DOMAIN_ID } from "@/lib/campaignDomain";
import { useEmailProvider } from "@/hooks/useEmailProvider";

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (campaignId: string, domainId: string) => void;
}

export function CreateCampaignModal({ open, onClose, onCreated }: CreateCampaignModalProps) {
  const { usesSesDomains } = useEmailProvider();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    setCreating(true);
    try {
      const domainId = INBOX_CAMPAIGN_DOMAIN_ID;
      const campaign = await createCampaign(domainId, {
        name: name.trim(),
        description: description.trim() || undefined,
        status: "draft",
      });

      toast.success("Campaign created! Configure your sequence below.");
      onCreated(campaign.id, (campaign as any).domainId || domainId);
      // Reset state
      setName("");
      setDescription("");
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to create campaign"));
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
          {/* Gradient header strip */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
                  <Rocket className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">New Campaign</h2>
                  <p className="text-sm text-slate-500">Give your campaign a name to get started</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Campaign name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !creating && void handleCreate()}
                  placeholder="e.g. Q3 Outreach — SaaS Founders"
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this campaign about? Who is the target audience?"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Info callout */}
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your campaign will start in <strong>Draft</strong> mode. You can add leads, write
                  your email sequence, configure scheduling and options, then launch when ready.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={onClose}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={creating || !name.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
