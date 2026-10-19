"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  getCampaignById,
  getEmailServiceErrorMessage,
  patchCampaign,
} from "@/utils/api/emailClient";

export const DEFAULT_UNSUBSCRIBE_LINK_TEXT = "Unsubscribe";
const MAX_UNSUBSCRIBE_LINK_TEXT = 80;

export function sanitizeUnsubscribeLinkText(raw: string | null | undefined): string {
  const trimmed = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_UNSUBSCRIBE_LINK_TEXT);
  if (!trimmed || /[<>]/.test(trimmed)) return DEFAULT_UNSUBSCRIBE_LINK_TEXT;
  return trimmed;
}

export function campaignComplianceFooterPreviewHtml(label: string): string {
  const safe = sanitizeUnsubscribeLinkText(label)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<div style="margin-top:20px;font-size:11px;color:#9ca3af;text-align:left;font-family:system-ui,sans-serif;"><p style="margin:0;"><a href="#unsubscribe" style="color:#9ca3af;text-decoration:none;">${safe}</a> • Your company address</p></div>`;
}

export function bodyAlreadyHasComplianceFooter(html: string): boolean {
  return (
    /{{\s*unsubscribe_link\s*}}/i.test(html) &&
    /{{\s*physical_address\s*}}/i.test(html)
  );
}

interface UnsubscribeLinkEditorProps {
  domainId: string;
  campaignId?: string | null;
  onTextChange?: (text: string) => void;
  onAcknowledged?: () => void;
}

export function UnsubscribeLinkEditor({
  domainId,
  campaignId,
  onTextChange,
  onAcknowledged,
}: UnsubscribeLinkEditorProps) {
  const [linkText, setLinkText] = useState(DEFAULT_UNSUBSCRIBE_LINK_TEXT);
  const [savedText, setSavedText] = useState(DEFAULT_UNSUBSCRIBE_LINK_TEXT);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(Boolean(campaignId));
  const [savingText, setSavingText] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getCampaignById(domainId, campaignId)
      .then((campaign) => {
        if (cancelled) return;
        const text = sanitizeUnsubscribeLinkText(
          campaign.unsubscribeLinkText || DEFAULT_UNSUBSCRIBE_LINK_TEXT,
        );
        setLinkText(text);
        setSavedText(text);
        onTextChange?.(text);
        setAcknowledged(Boolean(campaign.unsubscribeFooterAcknowledgedAt));
      })
      .catch(() => {
        if (!cancelled) {
          setLinkText(DEFAULT_UNSUBSCRIBE_LINK_TEXT);
          setSavedText(DEFAULT_UNSUBSCRIBE_LINK_TEXT);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId, domainId, onTextChange]);

  const persistText = useCallback(async () => {
    if (!campaignId) return false;
    const next = linkText.replace(/\s+/g, " ").trim();
    if (!next || next.length > MAX_UNSUBSCRIBE_LINK_TEXT || /[<>]/.test(next)) {
      toast.error("Use 1–80 characters, without < or >.");
      setLinkText(savedText);
      return false;
    }
    if (next === savedText) return true;
    setSavingText(true);
    try {
      await patchCampaign(domainId, campaignId, { unsubscribeLinkText: next });
      setLinkText(next);
      setSavedText(next);
      return true;
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to save unsubscribe link text"));
      setLinkText(savedText);
      return false;
    } finally {
      setSavingText(false);
    }
  }, [campaignId, domainId, linkText, savedText]);

  const handleAcknowledge = async () => {
    if (!campaignId || acknowledged) return;
    const next = linkText.replace(/\s+/g, " ").trim();
    if (!next || next.length > MAX_UNSUBSCRIBE_LINK_TEXT || /[<>]/.test(next)) {
      toast.error("Use 1–80 characters, without < or >.");
      return;
    }
    setAcknowledging(true);
    try {
      await patchCampaign(domainId, campaignId, {
        unsubscribeLinkText: next,
        unsubscribeFooterAcknowledged: true,
      });
      setLinkText(next);
      setSavedText(next);
      setAcknowledged(true);
      onAcknowledged?.();
      toast.success("Unsubscribe link confirmed");
    } catch (error: unknown) {
      toast.error(
        getEmailServiceErrorMessage(error, "Failed to confirm the unsubscribe link"),
      );
    } finally {
      setAcknowledging(false);
    }
  };

  const previewLabel = sanitizeUnsubscribeLinkText(linkText);

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <button
        type="button"
        className="flex h-8 w-full items-center justify-between gap-2 px-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Unsubscribe link</span>
          <span className="text-slate-500"> · {previewLabel}</span>
          {acknowledged ? (
            <span className="text-emerald-700"> · Confirmed</span>
          ) : (
            <span className="text-amber-700"> · Needs confirmation</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
          <p className="w-full text-[11px] leading-snug text-slate-600">
            Every email includes this link so recipients can opt out. It cannot be removed.
            You can change the words.
          </p>
          <Input
            value={linkText}
            maxLength={MAX_UNSUBSCRIBE_LINK_TEXT}
            disabled={!campaignId || loading || acknowledging}
            onChange={(event) => {
              setLinkText(event.target.value);
              onTextChange?.(event.target.value);
            }}
            onBlur={() => {
              void persistText();
            }}
            aria-label="Unsubscribe link text"
            className="h-8 max-w-xs bg-white text-sm"
          />
          <span className="text-[10px] text-slate-400">
            {linkText.trim().length}/{MAX_UNSUBSCRIBE_LINK_TEXT}
          </span>
          {savingText ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
          {acknowledged ? (
            <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              Confirmed
            </p>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-8 bg-slate-900 text-white hover:bg-slate-800"
              disabled={!campaignId || loading || acknowledging}
              onClick={() => void handleAcknowledge()}
            >
              {acknowledging ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              I understand — this link stays on every email
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
