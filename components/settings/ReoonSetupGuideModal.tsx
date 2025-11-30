"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  IconExternalLink,
  IconKey,
  IconCheck,
  IconCopy,
  IconShieldCheck,
} from "@tabler/icons-react";

interface ReoonSetupGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    title: "Create a Reoon Account",
    description:
      "Visit Reoon's website and sign up for an account if you haven't already. They offer free credits to get started.",
    action: {
      label: "Go to Reoon",
      url: "https://reoon.com/",
    },
  },
  {
    title: "Navigate to API Settings",
    description:
      'After logging in, go to your Reoon dashboard. Click on "API" or "API Keys" in the left sidebar or under Settings.',
    action: {
      label: "Open API Dashboard",
      url: "https://app.reoon.com/",
    },
  },
  {
    title: "Generate Your API Key",
    description:
      'Click "Generate New API Key" or copy your existing key. Make sure to keep this key secure and never share it publicly.',
  },
  {
    title: "Add Key to LeadSnipper",
    description:
      "Paste your API key in the input field below in the Integrations section and click Connect. We encrypt your key and never store it in plain text.",
  },
];

export default function ReoonSetupGuideModal({
  open,
  onOpenChange,
}: ReoonSetupGuideModalProps) {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const handleCopyUrl = (url: string, stepIndex: number) => {
    navigator.clipboard.writeText(url);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-text-100 text-xl flex items-center gap-2">
            <IconKey className="w-6 h-6 text-brand-main" />
            How to Get Your Reoon API Key
          </DialogTitle>
          <DialogDescription className="text-text-200/80 text-sm">
            Follow these simple steps to connect your Reoon account to
            LeadSnipper for email verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits Section */}
          <div className="bg-brand-main/5 border border-brand-main/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-text-100 mb-2 flex items-center gap-2">
              <IconShieldCheck className="w-4 h-4 text-brand-main" />
              Why Verify Emails?
            </h4>
            <ul className="text-xs text-text-200/80 space-y-1">
              <li>• Reduce bounce rates and protect your sender reputation</li>
              <li>• Avoid spam traps and invalid email addresses</li>
              <li>• Results are cached - pay once per email, use forever</li>
              <li>• Improve deliverability and campaign performance</li>
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-lg border border-brand-main/10 bg-bg-300/40"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-main/20 text-brand-main flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-text-100 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-text-200/80 mb-3">
                    {step.description}
                  </p>
                  {step.action && (
                    <div className="flex items-center gap-2">
                      <a
                        href={step.action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-main/10 hover:bg-brand-main/20 text-brand-main rounded-lg transition"
                      >
                        {step.action.label}
                        <IconExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleCopyUrl(step.action!.url, index)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-text-200 hover:text-text-100 border border-brand-main/20 rounded-lg transition"
                      >
                        {copiedStep === index ? (
                          <>
                            <IconCheck className="w-3 h-3 text-success" />
                            Copied
                          </>
                        ) : (
                          <>
                            <IconCopy className="w-3 h-3" />
                            Copy URL
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-brand-main/20 flex justify-between items-center">
            <p className="text-xs text-text-200/60">
              Need help? Contact us at{" "}
              <a
                href="mailto:support@leadsnipper.com"
                className="text-brand-main hover:underline"
              >
                support@leadsnipper.com
              </a>
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-brand-main hover:bg-brand-main/90 text-brand-white"
            >
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

