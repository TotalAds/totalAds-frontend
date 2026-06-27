"use client";

import { BookOpen, Code2, Eye, FileText, History, LayoutGrid, Loader2, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BASIC_EMAIL_TEMPLATES,
  READY_TO_USE_CATEGORIES,
  READY_TO_USE_EMAIL_TEMPLATES,
  type BuiltInEmailTemplate,
} from "@/lib/email-templates/catalog";
import emailClient, { Campaign, getCampaigns } from "@/utils/api/emailClient";

import {
  htmlToPlainText,
  isStructuredHtmlEmail,
  resolveTemplateImportMode,
} from "./emailTemplateTextUtils";
import type { BodyEditorMode, TemplateImportPayload, UserEmailTemplateRow } from "./emailTemplateTypes";
import { wrapEmailPreviewDocument } from "./htmlPreviewUtils";

type PickerTab = "previously-used" | "leadsnipper";

type PreviouslyUsedSection = "campaign-emails" | "your-templates";

type LeadSnipperCategory = "All" | "Basic" | (typeof READY_TO_USE_CATEGORIES)[number];

type PreviewState =
  | { kind: "text"; title: string; text: string }
  | { kind: "html"; title: string; html: string }
  | null;

const LEADSNIPPER_CATEGORIES: LeadSnipperCategory[] = [
  "All",
  "Basic",
  ...READY_TO_USE_CATEGORIES.filter((c) => c !== "All"),
];

const CARD_CLASS =
  "flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-md";

function TextPreviewSnippet({ text, maxLines = 5 }: { text: string; maxLines?: number }) {
  return (
    <div
      className={cn(
        "rounded-t-xl border-b border-slate-100 bg-[#f8fafc] px-4 py-3",
        maxLines === 5 ? "min-h-[120px]" : "min-h-[100px]"
      )}
    >
      <p
        className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text || "No preview available"}
      </p>
    </div>
  );
}

function HtmlPreviewSnippet({ html }: { html: string }) {
  const previewHeight = 160;
  const srcDoc = wrapEmailPreviewDocument(html, false);
  return (
    <div
      className="relative w-full overflow-hidden rounded-t-xl border-b border-slate-100 bg-[#f8fafc]"
      style={{ height: previewHeight }}
    >
      <iframe
        title="HTML template preview"
        className="pointer-events-none block w-full overflow-hidden border-0 bg-[#f8fafc] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        height={previewHeight}
        width="100%"
        srcDoc={srcDoc}
        scrolling="no"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

export interface EmailTemplatePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: string;
  excludeCampaignId?: string | null;
  onImport: (payload: TemplateImportPayload) => void;
}

export default function EmailTemplatePickerModal({
  open,
  onOpenChange,
  domainId,
  excludeCampaignId,
  onImport,
}: EmailTemplatePickerModalProps) {
  const [tab, setTab] = useState<PickerTab>("previously-used");
  const [prevSection, setPrevSection] = useState<PreviouslyUsedSection>("campaign-emails");
  const [leadCategory, setLeadCategory] = useState<LeadSnipperCategory>("All");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [userTemplates, setUserTemplates] = useState<UserEmailTemplateRow[]>([]);
  const [userTemplatesLoading, setUserTemplatesLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewState>(null);

  useEffect(() => {
    if (!open) return;
    setTab("previously-used");
    setPrevSection("campaign-emails");
    setLeadCategory("All");
    setCampaignSearch("");
    setPreview(null);
  }, [open]);

  useEffect(() => {
    if (!open || !domainId) return;
    let cancelled = false;
    const loadCampaigns = async () => {
      setCampaignsLoading(true);
      try {
        const res = await getCampaigns(domainId, 1, 80);
        if (!cancelled) setCampaigns(res.data || []);
      } catch {
        if (!cancelled) toast.error("Could not load campaign emails");
      } finally {
        if (!cancelled) setCampaignsLoading(false);
      }
    };
    loadCampaigns();
    return () => {
      cancelled = true;
    };
  }, [open, domainId]);

  const loadUserTemplates = useCallback(async () => {
    if (!domainId) return;
    setUserTemplatesLoading(true);
    try {
      const res = await emailClient.get(`/api/domains/${domainId}/email-templates`);
      const rows = res.data?.data as UserEmailTemplateRow[] | undefined;
      setUserTemplates(Array.isArray(rows) ? rows : []);
    } catch {
      toast.error("Could not load your templates");
    } finally {
      setUserTemplatesLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    if (open && domainId) {
      void loadUserTemplates();
    }
  }, [open, domainId, loadUserTemplates]);

  const filteredCampaigns = useMemo(() => {
    const q = campaignSearch.trim().toLowerCase();
    return (campaigns || [])
      .filter((c) => (excludeCampaignId ? String(c.id) !== String(excludeCampaignId) : true))
      .filter((c) => {
        if (!q) return true;
        const name = (c.name || "").toLowerCase();
        const id = String(c.id || "");
        return name.includes(q) || id.includes(q);
      });
  }, [campaigns, campaignSearch, excludeCampaignId]);

  const leadSnipperTemplates = useMemo(() => {
    const basic = BASIC_EMAIL_TEMPLATES.map((t) => ({ ...t, category: "Basic" as const }));
    const ready = READY_TO_USE_EMAIL_TEMPLATES;
    const all = [...basic, ...ready];
    if (leadCategory === "All") return all;
    if (leadCategory === "Basic") return basic;
    return ready.filter((t) => t.category === leadCategory);
  }, [leadCategory]);

  const handleImport = (
    content: string,
    label: string,
    bodyEditor: BodyEditorMode
  ) => {
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("This template has no content to import");
      return;
    }
    if (bodyEditor === "simple" && !htmlToPlainText(trimmed).trim()) {
      toast.error("This template has no text content to import");
      return;
    }
    onImport({ content: trimmed, bodyEditor });
    onOpenChange(false);
    toast.success(
      bodyEditor === "html"
        ? `Imported "${label}" into the HTML editor`
        : `Imported "${label}" into the rich text editor`
    );
  };

  const openFullPreview = (
    title: string,
    content: string,
    bodyEditor: BodyEditorMode
  ) => {
    if (bodyEditor === "html") {
      setPreview({ kind: "html", title, html: content });
      return;
    }
    setPreview({ kind: "text", title, text: htmlToPlainText(content) });
  };

  const tabBtn = (id: PickerTab, icon: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        tab === id
          ? "bg-brand-main text-white shadow-sm"
          : "bg-slate-100 text-text-200 hover:bg-slate-200/80 hover:text-text-100"
      )}
    >
      {icon}
      {label}
    </button>
  );

  const renderImportCard = (
    key: string,
    title: string,
    description: string | undefined,
    content: string,
    meta?: string,
    forcedMode?: BodyEditorMode
  ) => {
    const bodyEditor = forcedMode ?? resolveTemplateImportMode(content);
    const isHtml = bodyEditor === "html";
    const hasContent = isHtml ? content.trim().length > 0 : htmlToPlainText(content).trim().length > 0;

    return (
      <div key={key} className={CARD_CLASS}>
        <div className="relative">
          <button
            type="button"
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-text-200 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-text-100 disabled:opacity-40"
            aria-label="Preview full template"
            disabled={!hasContent}
            onClick={() => openFullPreview(title, content, bodyEditor)}
          >
            <Eye className="h-4 w-4" />
          </button>
          {isHtml ? (
            <HtmlPreviewSnippet html={content} />
          ) : (
            <TextPreviewSnippet text={htmlToPlainText(content)} />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 border-t border-slate-100 bg-white px-4 pb-4 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {meta ? <p className="text-xs text-text-300">{meta}</p> : null}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isHtml
                  ? "bg-violet-50 text-violet-700"
                  : "bg-blue-50 text-blue-700"
              )}
            >
              {isHtml ? <Code2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              {isHtml ? "HTML" : "Rich text"}
            </span>
          </div>
          <p className="text-[15px] font-semibold leading-snug text-text-100">{title}</p>
          {description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-text-200">{description}</p>
          ) : null}
          <div className="mt-auto flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md border-slate-300 bg-white px-4 font-medium text-text-100 hover:bg-slate-50"
              disabled={!hasContent}
              onClick={() => handleImport(content, title, bodyEditor)}
            >
              Import template
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderBuiltInCard = (t: BuiltInEmailTemplate) =>
    renderImportCard(t.id, t.name, t.description, t.htmlContent, t.category || "Basic", "html");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(88vh,820px)] max-h-[820px] w-[98vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="flex-shrink-0 border-b border-border bg-bg-200 px-6 py-4 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight text-text-100">
              Choose a template
            </DialogTitle>
            <p className="mt-1 text-sm text-text-200">
              Rich text templates open in the visual editor. HTML templates open in the HTML editor
              with live preview.
            </p>
          </DialogHeader>

          <div className="flex-shrink-0 border-b border-border bg-white px-6 py-4">
            <div className="flex gap-2">
              {tabBtn("previously-used", <History className="h-4 w-4" />, "Previously used")}
              {tabBtn(
                "leadsnipper",
                <Sparkles className="h-4 w-4" />,
                "LeadSnipper templates"
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            <div className="px-6 py-6">
              {tab === "previously-used" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPrevSection("campaign-emails")}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                        prevSection === "campaign-emails"
                          ? "bg-brand-main/10 text-brand-main"
                          : "bg-slate-100 text-text-200 hover:bg-slate-200/80"
                      )}
                    >
                      Campaign emails
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrevSection("your-templates")}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                        prevSection === "your-templates"
                          ? "bg-brand-main/10 text-brand-main"
                          : "bg-slate-100 text-text-200 hover:bg-slate-200/80"
                      )}
                    >
                      Your saved templates
                    </button>
                  </div>

                  {prevSection === "campaign-emails" && (
                    <div className="space-y-4">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-300" />
                        <Input
                          value={campaignSearch}
                          onChange={(e) => setCampaignSearch(e.target.value)}
                          placeholder="Search by name or ID"
                          className="h-10 border-border bg-bg-200 pl-9"
                        />
                      </div>
                      {campaignsLoading ? (
                        <div className="flex min-h-[200px] items-center justify-center text-text-200">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : filteredCampaigns.length === 0 ? (
                        <p className="py-12 text-center text-sm text-text-200">
                          No campaign emails found for this domain.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          {filteredCampaigns.map((c) => {
                            const seq = c.sequence?.[0];
                            const body = seq?.body ? String(seq.body) : "";
                            return renderImportCard(
                              String(c.id),
                              c.name || `Campaign #${c.id}`,
                              undefined,
                              body,
                              `#${c.id}`
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {prevSection === "your-templates" && (
                    <div>
                      {userTemplatesLoading ? (
                        <div className="flex min-h-[200px] items-center justify-center text-text-200">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : userTemplates.length === 0 ? (
                        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50/80 px-8 py-10 text-center">
                          <LayoutGrid className="mb-3 h-8 w-8 text-text-300" />
                          <p className="text-base font-medium text-text-100">
                            No saved templates yet
                          </p>
                          <p className="mt-2 max-w-sm text-sm text-text-200">
                            Save an email as a template from the editor to reuse it here.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          {userTemplates.map((t) =>
                            renderImportCard(String(t.id), t.name, undefined, t.htmlContent)
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === "leadsnipper" && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-text-200">Category</span>
                    <Select
                      value={leadCategory}
                      onValueChange={(v) => setLeadCategory(v as LeadSnipperCategory)}
                    >
                      <SelectTrigger className="h-9 w-[200px] bg-bg-200">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEADSNIPPER_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-text-300">
                      <BookOpen className="mr-1 inline h-3.5 w-3.5" />
                      {leadSnipperTemplates.length} template
                      {leadSnipperTemplates.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {leadSnipperTemplates.map((t) => renderBuiltInCard(t))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={preview !== null}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[85vh] overflow-hidden p-0",
            preview?.kind === "html" ? "max-w-3xl sm:max-w-3xl" : "max-w-lg sm:max-w-lg"
          )}
        >
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="text-base">{preview?.title || "Template preview"}</DialogTitle>
            <p className="text-xs text-text-300">
              {preview?.kind === "html"
                ? "HTML layout preview — opens in the HTML editor with live preview"
                : "Rich text preview — opens in the visual editor"}
            </p>
          </DialogHeader>
          {preview?.kind === "html" ? (
            <iframe
              title="Full HTML template preview"
              className="h-[min(72vh,720px)] w-full border-0 bg-bg-200 [scrollbar-width:thin]"
              srcDoc={wrapEmailPreviewDocument(preview.html, false)}
              sandbox="allow-same-origin"
            />
          ) : preview?.kind === "text" ? (
            <div className="max-h-[min(60vh,480px)] overflow-y-auto px-6 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-100">
                {preview.text}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
