"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  AIGeneratedCampaignResponse,
  generateAICampaign,
} from "@/utils/api/emailClient";

interface AICampaignGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (data: AIGeneratedCampaignResponse) => void;
}

const toneOptions = [
  "casual, founder-to-founder",
  "professional",
  "friendly",
  "direct",
];

export default function AICampaignGeneratorModal({
  open,
  onClose,
  onGenerated,
}: AICampaignGeneratorModalProps) {
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [offer, setOffer] = useState("");
  const [extra, setExtra] = useState("");
  const [tone, setTone] = useState(toneOptions[0]);
  const [loading, setLoading] = useState(false);
  /** After generate: show confirmation; parent already has full payload for the panel */
  const [successPhase, setSuccessPhase] = useState(false);

  useEffect(() => {
    if (open) {
      setSuccessPhase(false);
    }
  }, [open]);

  if (!open) return null;

  const handleGenerate = async () => {
    if (!audience.trim() || !goal.trim() || !offer.trim()) {
      toast.error("Please fill audience, goal, and offer");
      return;
    }

    try {
      setLoading(true);
      const data = await generateAICampaign({
        audience: audience.trim(),
        goal: goal.trim(),
        offer: offer.trim(),
        tone: tone.trim(),
        extra: extra.trim() || undefined,
      });
      onGenerated(data);
      setSuccessPhase(true);
      toast.success("Campaign generated — pick variants below");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to generate campaign"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessPhase(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-bg-200 border border-brand-main/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-brand-main/10">
          <h2 className="text-lg font-semibold text-text-100">
            Generate Campaign with AI
          </h2>
          <p className="text-sm text-text-200 mt-1">
            Describe audience, goal, and offer. We will draft campaign name,
            subject lines, and 3 email variations.
          </p>
        </div>

        {successPhase ? (
          <div className="px-6 py-6 space-y-4">
            <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-text-100">
              <p className="font-medium text-success">Generation complete</p>
              <p className="mt-2 text-text-200">
                In the Email Content section below you will see all subject line
                options and all email variations. They stay visible until you click{" "}
                <span className="font-medium text-text-100">Clear AI options</span>.
                Choose a subject line and/or an email variation to load it into the
                editor.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={handleClose}
                className="bg-brand-main hover:bg-brand-main/90 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-200 mb-1.5">
                  Target audience *
                </label>
                <textarea
                  rows={3}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Who is this for?"
                  className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-200 mb-1.5">
                  Goal *
                </label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What do they want?"
                  className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-200 mb-1.5">
                  Offer *
                </label>
                <textarea
                  rows={3}
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder="What do you offer?"
                  className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-200 mb-1.5">
                  Tone (optional)
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                >
                  {toneOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-200 mb-1.5">
                  Additional context
                </label>
                <textarea
                  rows={2}
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Anything else the AI should know?"
                  className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-main/10 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-brand-main hover:bg-brand-main/90 text-white"
              >
                {loading ? "Generating..." : "Generate Campaign"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
