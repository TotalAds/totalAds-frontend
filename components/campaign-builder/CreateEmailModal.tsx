"use client";

import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Dices,
  Eye,
  FileText,
  LayoutGrid,
  Loader2,
  Mail,
  Plus,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import DesignEditor from "./DesignEditor";
import HtmlEditorWithPreview from "./HtmlEditorWithPreview";
import {
  PREVIEW_SAMPLE_LEADS,
  buildCompositeLeadForPreview,
  mergeVariableLists,
  resolveMergeTagsAndSpintax,
  wrapEmailPreviewDocument,
} from "./htmlPreviewUtils";
import { type SpintaxPackId } from "./spintaxUtils";

export type BodyEditorMode = "simple" | "html";

export interface UserEmailTemplateRow {
  id: number;
  name: string;
  htmlContent: string;
}

type SidebarTab =
  | "campaign-emails"
  | "your-templates"
  | "basic-templates"
  | "ready-to-use";

type RightPanel = "browse" | "simple" | "html";

/** Full email preview in the dialog — entire template, scrollable. */
function wrapPreviewDocFull(html: string) {
  return wrapEmailPreviewDocument(html, false);
}

/**
 * Card thumbnail: fixed iframe height + overflow hidden on document — no scrollbars.
 */
function wrapPreviewDocThumb(html: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>
    html{height:100%;margin:0;overflow:hidden!important;-ms-overflow-style:none;scrollbar-width:none;}
    html::-webkit-scrollbar{display:none;width:0;height:0;}
    body{margin:0!important;padding:0!important;height:100%!important;max-height:100%!important;
      overflow:hidden!important;overflow-x:hidden!important;overflow-y:hidden!important;
      -ms-overflow-style:none;scrollbar-width:none;}
    body::-webkit-scrollbar{display:none;width:0;height:0;}
    table{max-width:100%!important;}
    img{max-width:100%!important;height:auto!important;}
    *{box-sizing:border-box;}
  </style></head><body>${html}</body></html>`;
}

function formatPreviewRecipientLine(lead: Record<string, string>): string {
  const email = lead.email || "preview@example.com";
  const name =
    lead.name?.trim() ||
    [lead.firstName || lead.first_name, lead.lastName || lead.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Sample recipient";
  return `${name} <${email}>`;
}

function isStructuredHtmlEmail(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  // Plain TipTap paragraphs and line-breaks should still open in the visual editor.
  const withoutSimpleRichText = trimmed
    .replace(/<\/?p(?:\s[^>]*)?>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .trim();

  return /<\/?(table|tbody|thead|tfoot|tr|td|th|div|section|article|img|a|ul|ol|li|h[1-6]|blockquote|center|mj-[a-z-]+)(\s|>|\/)/i.test(
    withoutSimpleRichText
  );
}

function textToSimpleEditorHtml(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "<p></p>";
  if (/<\/?p(?:\s[^>]*)?>|<br\s*\/?>/i.test(trimmed)) return content;
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/** Split user-selected text into spintax option rows (modal prefill). */
function splitCapturedTextIntoSpintaxOptions(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  if (t.includes("|")) {
    return t.split("|").map((s) => s.trim()).filter(Boolean);
  }
  const byLine = t.split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  const byComma = t.split(",").map((s) => s.trim()).filter(Boolean);
  if (byComma.length > 1) return byComma;
  return [t];
}

const TEMPLATE_CARD_GRID =
  "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

const TEMPLATE_TAB_SCROLL_INNER = "px-6 py-6 sm:px-8";

function TemplateTabScaffold({
  title,
  description,
  toolbar,
  children,
}: {
  title: string;
  description: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-shrink-0 space-y-2 border-b border-slate-100 px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
        <h2 className="text-lg font-bold tracking-tight text-text-100 sm:text-xl">{title}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-text-200">{description}</p>
        {toolbar ? <div className="pt-2">{toolbar}</div> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        <div className={cn(TEMPLATE_TAB_SCROLL_INNER, "min-h-0")}>{children}</div>
      </div>
    </div>
  );
}

const TEMPLATE_CARD_CLASS =
  "group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-md";

function TemplatePreviewFrame({ html }: { html: string }) {
  const previewHeight = 160;
  return (
    <div
      className="relative w-full overflow-hidden rounded-t-xl bg-[#f8fafc]"
      style={{ height: previewHeight }}
    >
      <iframe
        title="Email thumbnail preview"
        className="pointer-events-none block w-full overflow-hidden border-0 bg-[#f8fafc] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        height={previewHeight}
        width="100%"
        srcDoc={wrapPreviewDocThumb(html)}
        scrolling="no"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

const HTML_STARTER = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
  <tr><td style="padding:24px;">
    <p style="margin:0 0 12px;font-size:16px;color:#0f172a;">Hi {{firstName}},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">Edit this HTML to build your email.</p>
  </td></tr>
</table>`;

export interface CreateEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: string;
  excludeCampaignId?: string | null;
  initialTab?: SidebarTab;
  /** Merge tags from CSV columns + built-ins are merged automatically */
  availableVariables: string[];
  seedSubject: string;
  seedPreviewText?: string;
  seedUseSpintax: boolean;
  seedSpintaxPackId: SpintaxPackId;
  seedStrictGrammarMode: boolean;
  /** Current campaign body when opening the modal */
  seedHtml: string;
  seedBodyEditor: BodyEditorMode;
  /** True when opening from &quot;Edit email&quot; on the builder — jump into the composer */
  openDirectlyToEditor: boolean;
  onApply: (payload: {
    subject: string;
    previewText: string;
    htmlContent: string;
    bodyEditor: BodyEditorMode;
    useSpintax: boolean;
    spintaxPackId: SpintaxPackId;
    strictGrammarMode: boolean;
  }) => void;
}

export default function CreateEmailModal({
  open,
  onOpenChange,
  domainId,
  excludeCampaignId,
  initialTab = "basic-templates",
  availableVariables,
  seedSubject,
  seedPreviewText,
  seedUseSpintax,
  seedSpintaxPackId,
  seedStrictGrammarMode,
  seedHtml,
  seedBodyEditor,
  openDirectlyToEditor,
  onApply,
}: CreateEmailModalProps) {
  const [tab, setTab] = useState<SidebarTab>(initialTab);
  const [rightPanel, setRightPanel] = useState<RightPanel>("browse");
  const [draftHtml, setDraftHtml] = useState("");
  const [draftBodyEditor, setDraftBodyEditor] = useState<BodyEditorMode>("simple");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftPreviewText, setDraftPreviewText] = useState("");
  const [draftUseSpintax, setDraftUseSpintax] = useState(false);
  const [draftSpintaxPackId, setDraftSpintaxPackId] = useState<SpintaxPackId>("general");
  const [draftStrictGrammarMode, setDraftStrictGrammarMode] = useState(false);

  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [userTemplates, setUserTemplates] = useState<UserEmailTemplateRow[]>([]);
  const [userTemplatesLoading, setUserTemplatesLoading] = useState(false);
  const [readyCategory, setReadyCategory] = useState<string>("All");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [inboxPreviewOpen, setInboxPreviewOpen] = useState(false);
  const [inboxPreviewLeadIndex, setInboxPreviewLeadIndex] = useState(0);

  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [fallbackModalOpen, setFallbackModalOpen] = useState(false);
  const [fallbackVariable, setFallbackVariable] = useState("{{firstName}}");
  const [fallbackText, setFallbackText] = useState("");
  const [editingFallbackToken, setEditingFallbackToken] = useState<{
    token: string;
    occurrenceIndex: number;
  } | null>(null);
  const [spintaxModalOpen, setSpintaxModalOpen] = useState(false);
  const [manualSpintaxOptions, setManualSpintaxOptions] = useState<string[]>([
    "Hi",
    "Hello",
    "Hey",
  ]);
  const [editingSpintaxToken, setEditingSpintaxToken] = useState<{
    token: string;
    occurrenceIndex: number;
  } | null>(null);

  const [variableSearch, setVariableSearch] = useState("");
  const [showVariablePanel, setShowVariablePanel] = useState(false);
  const variablePanelRef = useRef<HTMLDivElement>(null);
  /** Snapshot from editor/HTML textarea when toolbar opens (selection is lost on focus otherwise). */
  const pendingComposerSelectionRef = useRef("");
  const pendingReplaceSelectionRef = useRef(false);
  const pendingHtmlSelectionRangeRef = useRef<{ start: number; end: number } | null>(
    null
  );

  const clearPendingInsertSelection = useCallback(() => {
    pendingComposerSelectionRef.current = "";
    pendingReplaceSelectionRef.current = false;
    pendingHtmlSelectionRangeRef.current = null;
  }, []);

  const captureComposerSelection = useCallback(() => {
    pendingHtmlSelectionRangeRef.current = null;
    const ta = document.getElementById("codeEditor") as HTMLTextAreaElement | null;
    if (ta && ta.selectionEnd > ta.selectionStart) {
      pendingComposerSelectionRef.current = ta.value.slice(
        ta.selectionStart,
        ta.selectionEnd
      );
      pendingReplaceSelectionRef.current = true;
      pendingHtmlSelectionRangeRef.current = {
        start: ta.selectionStart,
        end: ta.selectionEnd,
      };
      return;
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.toString().length > 0) {
      const node = sel.anchorNode;
      const el =
        node?.nodeType === Node.TEXT_NODE
          ? (node.parentElement as Element | null)
          : (node as Element | null);
      if (el?.closest?.(".ProseMirror")) {
        pendingComposerSelectionRef.current = sel.toString();
        pendingReplaceSelectionRef.current = true;
        return;
      }
    }
    pendingComposerSelectionRef.current = "";
    pendingReplaceSelectionRef.current = false;
  }, []);

  const mergeTags = useMemo(
    () => mergeVariableLists(availableVariables),
    [availableVariables]
  );

  const shiftInboxPreviewLead = useCallback((delta: number) => {
    const n = PREVIEW_SAMPLE_LEADS.length;
    setInboxPreviewLeadIndex((i) => (i + delta + n * 10) % n);
  }, []);

  const inboxPreviewLead = useMemo(
    () => buildCompositeLeadForPreview(inboxPreviewLeadIndex, mergeTags),
    [inboxPreviewLeadIndex, mergeTags]
  );

  const inboxPreviewResolved = useMemo(
    () => ({
      subject: resolveMergeTagsAndSpintax(
        draftSubject,
        inboxPreviewLead,
        inboxPreviewLeadIndex
      ),
      previewText: resolveMergeTagsAndSpintax(
        draftPreviewText,
        inboxPreviewLead,
        inboxPreviewLeadIndex
      ),
      html: resolveMergeTagsAndSpintax(draftHtml || "", inboxPreviewLead, inboxPreviewLeadIndex),
    }),
    [draftSubject, draftPreviewText, draftHtml, inboxPreviewLead, inboxPreviewLeadIndex]
  );

  const filteredVariables = mergeTags.filter((variable) =>
    variable.toLowerCase().includes(variableSearch.toLowerCase())
  );
  useEffect(() => {
    if (!open) return;
    clearPendingInsertSelection();
    setTab(initialTab);
    setDraftSubject(seedSubject || "");
    setDraftPreviewText(seedPreviewText || "");
    setDraftUseSpintax(seedUseSpintax);
    setDraftSpintaxPackId(seedSpintaxPackId || "general");
    setDraftStrictGrammarMode(seedStrictGrammarMode);
    if (openDirectlyToEditor) {
      const html =
        seedHtml.trim().length > 0
          ? seedHtml
          : seedBodyEditor === "html"
            ? ""
            : "<p></p>";
      const shouldUseHtmlEditor =
        seedBodyEditor === "html" && isStructuredHtmlEmail(html);
      setDraftHtml(html);
      setDraftBodyEditor(shouldUseHtmlEditor ? "html" : "simple");
      setRightPanel(shouldUseHtmlEditor ? "html" : "simple");
    } else {
      setRightPanel("browse");
      setDraftHtml(seedHtml);
      setDraftBodyEditor(seedBodyEditor);
    }
    setVariableSearch("");
    setShowVariablePanel(false);
  }, [
    open,
    initialTab,
    openDirectlyToEditor,
    seedHtml,
    seedBodyEditor,
    seedSubject,
    seedPreviewText,
    seedUseSpintax,
    seedSpintaxPackId,
    seedStrictGrammarMode,
    clearPendingInsertSelection,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        variablePanelRef.current &&
        !variablePanelRef.current.contains(event.target as Node)
      ) {
        setShowVariablePanel(false);
        clearPendingInsertSelection();
      }
    };
    if (showVariablePanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showVariablePanel, clearPendingInsertSelection]);

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
    if (open && tab === "your-templates" && domainId) {
      void loadUserTemplates();
    }
  }, [open, tab, domainId, loadUserTemplates]);

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

  const readyFiltered = useMemo(() => {
    if (readyCategory === "All") return READY_TO_USE_EMAIL_TEMPLATES;
    return READY_TO_USE_EMAIL_TEMPLATES.filter((t) => t.category === readyCategory);
  }, [readyCategory]);

  const insertVariable = (variable: string) => {
    if (draftBodyEditor === "simple" || rightPanel === "simple") {
      const replaceSel = pendingReplaceSelectionRef.current;
      pendingReplaceSelectionRef.current = false;
      pendingHtmlSelectionRangeRef.current = null;
      pendingComposerSelectionRef.current = "";
      const detail =
        replaceSel && variable.trim().length > 0
          ? { variable, replaceSelection: true as const }
          : variable;
      window.dispatchEvent(
        new CustomEvent("totalads:insert-variable", { detail })
      );
      toast.success(`Added ${variable}`, { duration: 1500 });
      return;
    }
    const textarea = document.getElementById("codeEditor") as HTMLTextAreaElement | null;
    if (textarea) {
      let start = textarea.selectionStart || 0;
      let end = textarea.selectionEnd || 0;
      const snap = pendingHtmlSelectionRangeRef.current;
      if (snap && pendingReplaceSelectionRef.current) {
        start = snap.start;
        end = snap.end;
      }
      pendingHtmlSelectionRangeRef.current = null;
      pendingReplaceSelectionRef.current = false;
      pendingComposerSelectionRef.current = "";
      const newContent =
        draftHtml.substring(0, start) + variable + draftHtml.substring(end);
      setDraftHtml(newContent);
      setTimeout(() => {
        const pos = start + variable.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      }, 0);
      toast.success(`Added ${variable}`, { duration: 1500 });
      return;
    }
    pendingReplaceSelectionRef.current = false;
    pendingComposerSelectionRef.current = "";
    setDraftHtml((draftHtml || "") + variable);
  };

  const insertSpintax = (token: string) => {
    if (draftBodyEditor === "simple" || rightPanel === "simple") {
      const replaceSel = pendingReplaceSelectionRef.current;
      pendingReplaceSelectionRef.current = false;
      pendingHtmlSelectionRangeRef.current = null;
      pendingComposerSelectionRef.current = "";
      const detail =
        replaceSel && token.trim().length > 0
          ? { token, replaceSelection: true as const }
          : token;
      window.dispatchEvent(
        new CustomEvent("totalads:insert-spintax", { detail })
      );
      toast.success("Added spintax", { duration: 1500 });
      return;
    }
    const textarea = document.getElementById("codeEditor") as HTMLTextAreaElement | null;
    if (textarea) {
      let start = textarea.selectionStart || 0;
      let end = textarea.selectionEnd || 0;
      const snap = pendingHtmlSelectionRangeRef.current;
      if (snap && pendingReplaceSelectionRef.current) {
        start = snap.start;
        end = snap.end;
      }
      pendingHtmlSelectionRangeRef.current = null;
      pendingReplaceSelectionRef.current = false;
      pendingComposerSelectionRef.current = "";
      const newContent =
        draftHtml.substring(0, start) + token + draftHtml.substring(end);
      setDraftHtml(newContent);
      setTimeout(() => {
        const pos = start + token.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      }, 0);
      toast.success("Added spintax", { duration: 1500 });
      return;
    }
    pendingReplaceSelectionRef.current = false;
    pendingComposerSelectionRef.current = "";
    setDraftHtml((draftHtml || "") + token);
  };

  const replaceTokenOccurrence = (
    source: string,
    oldToken: string,
    newToken: string,
    occurrenceIndex: number
  ) => {
    let seen = 0;
    return source.replace(oldToken, (match) => {
      if (seen === occurrenceIndex) {
        seen += 1;
        return newToken;
      }
      seen += 1;
      return match;
    });
  };

  const normalizeVariableToken = (variable: string) =>
    variable.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").trim();

  const openFallbackModal = (token?: string, occurrenceIndex: number = 0) => {
    if (token) {
      clearPendingInsertSelection();
      const inner = token.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
      const [field, fallback] = inner.split("|").map((part) => part.trim());
      const fieldToken = `{{${field || normalizeVariableToken(mergeTags[0] || "firstName")}}}`;
      setFallbackVariable(fieldToken);
      setFallbackText(fallback || "there");
      setEditingFallbackToken({ token, occurrenceIndex });
    } else {
      const captured = pendingComposerSelectionRef.current.trim();
      pendingComposerSelectionRef.current = "";
      setFallbackVariable(mergeTags[0] || "{{firstName}}");
      setFallbackText(captured);
      setEditingFallbackToken(null);
    }
    setFallbackModalOpen(true);
  };

  const openSpintaxModal = (token?: string, occurrenceIndex: number = 0) => {
    if (token) {
      clearPendingInsertSelection();
      const options = token
        .replace(/^\{\s*/, "")
        .replace(/\s*\}$/, "")
        .split("|")
        .map((option) => option.trim())
        .filter(Boolean);
      setManualSpintaxOptions(options.length >= 2 ? options : ["Hi", "Hello"]);
      setEditingSpintaxToken({ token, occurrenceIndex });
    } else {
      const captured = pendingComposerSelectionRef.current;
      pendingComposerSelectionRef.current = "";
      const parts = splitCapturedTextIntoSpintaxOptions(captured);
      if (parts.length >= 2) {
        setManualSpintaxOptions(parts);
      } else if (parts.length === 1) {
        setManualSpintaxOptions([parts[0], ""]);
      } else {
        setManualSpintaxOptions(["Hi", "Hello", "Hey"]);
      }
      setEditingSpintaxToken(null);
    }
    setSpintaxModalOpen(true);
  };

  const handleEditorTokenClick = (
    type: "merge" | "spintax",
    token: string,
    occurrenceIndex: number
  ) => {
    if (type === "merge") {
      openFallbackModal(token, occurrenceIndex);
      return;
    }
    openSpintaxModal(token, occurrenceIndex);
  };

  const handleInsertFallback = () => {
    const variable = normalizeVariableToken(fallbackVariable);
    const fallback = fallbackText.trim();
    if (!variable) {
      toast.error("Select a personalization field");
      return;
    }
    const newToken = fallback ? `{{${variable} | ${fallback}}}` : `{{${variable}}}`;
    if (editingFallbackToken) {
      setDraftHtml((current) =>
        replaceTokenOccurrence(
          current,
          editingFallbackToken.token,
          newToken,
          editingFallbackToken.occurrenceIndex
        )
      );
    } else {
      insertVariable(newToken);
    }
    setEditingFallbackToken(null);
    setFallbackModalOpen(false);
  };

  const handleRemoveFallbackToken = () => {
    if (!editingFallbackToken) return;
    setDraftHtml((current) =>
      replaceTokenOccurrence(
        current,
        editingFallbackToken.token,
        "",
        editingFallbackToken.occurrenceIndex
      )
    );
    setEditingFallbackToken(null);
    setFallbackModalOpen(false);
  };

  const handleInsertManualSpintax = () => {
    const options = manualSpintaxOptions
      .map((option) => option.trim())
      .filter(Boolean);
    if (options.length < 2) {
      toast.error("Add at least two spin options");
      return;
    }
    const newToken = `{${Array.from(new Set(options)).join("|")}}`;
    if (editingSpintaxToken) {
      setDraftHtml((current) =>
        replaceTokenOccurrence(
          current,
          editingSpintaxToken.token,
          newToken,
          editingSpintaxToken.occurrenceIndex
        )
      );
    } else {
      insertSpintax(newToken);
    }
    setEditingSpintaxToken(null);
    setSpintaxModalOpen(false);
  };

  const handleRemoveSpintaxToken = () => {
    if (!editingSpintaxToken) return;
    setDraftHtml((current) =>
      replaceTokenOccurrence(
        current,
        editingSpintaxToken.token,
        "",
        editingSpintaxToken.occurrenceIndex
      )
    );
    setEditingSpintaxToken(null);
    setSpintaxModalOpen(false);
  };

  const startSimpleEditor = () => {
    setDraftHtml(textToSimpleEditorHtml(draftHtml));
    setDraftBodyEditor("simple");
    setRightPanel("simple");
    toast.success("Rich text editor");
  };

  const startHtmlEditor = () => {
    setDraftHtml(HTML_STARTER);
    setDraftBodyEditor("html");
    setRightPanel("html");
    toast.success("HTML editor with preview");
  };

  const applyBuiltIn = (t: BuiltInEmailTemplate) => {
    setDraftHtml(t.htmlContent);
    setDraftBodyEditor("html");
    setRightPanel("html");
    toast.success("Template loaded — edit on the right, then apply to campaign.");
  };

  const applyFromCampaign = (c: Campaign) => {
    const seq = c.sequence?.[0];
    const body = seq?.body;
    if (!body || !String(body).trim()) {
      toast.error("This campaign has no email body to reuse");
      return;
    }
    setDraftHtml(String(body));
    setDraftBodyEditor("html");
    setRightPanel("html");
    toast.success("Loaded — edit on the right, then apply to campaign.");
  };

  const applyUserTemplate = (t: UserEmailTemplateRow) => {
    setDraftHtml(t.htmlContent);
    setDraftBodyEditor("html");
    setRightPanel("html");
    toast.success("Template loaded — edit on the right, then apply to campaign.");
  };

  const handleApplyToCampaign = () => {
    if (!draftHtml.trim()) {
      toast.error("Add email content first");
      return;
    }
    onApply({
      subject: draftSubject.trim(),
      previewText: draftPreviewText.trim(),
      htmlContent: draftHtml,
      bodyEditor: draftBodyEditor,
      useSpintax: draftUseSpintax,
      spintaxPackId: draftSpintaxPackId,
      strictGrammarMode: draftStrictGrammarMode,
    });
    onOpenChange(false);
    toast.success("Email saved to campaign");
  };

  const handleSaveTemplate = async () => {
    const name = saveTemplateName.trim();
    if (!name) {
      toast.error("Enter a template name");
      return;
    }
    if (!draftHtml.trim()) {
      toast.error("Add email content before saving");
      return;
    }
    setSavingTemplate(true);
    try {
      await emailClient.post(`/api/domains/${domainId}/email-templates`, {
        name,
        htmlContent: draftHtml,
      });
      toast.success("Template saved");
      setSaveTemplateOpen(false);
      setSaveTemplateName("");
      void loadUserTemplates();
    } catch {
      toast.error("Could not save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const sidebarBtn = (id: SidebarTab, icon: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg py-2.5 pl-3 pr-3 text-left text-sm font-medium transition-colors",
        "border-l-[3px]",
        tab === id
          ? "border-l-brand-main bg-brand-main/10 text-text-100"
          : "border-l-transparent text-text-200 hover:bg-slate-200/60 hover:text-text-100"
      )}
    >
      <span
        className={cn(
          "flex-shrink-0",
          tab === id ? "text-brand-main" : "text-text-200"
        )}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );

  const renderTemplateCard = (t: BuiltInEmailTemplate, key: string) => (
    <div key={key} className={TEMPLATE_CARD_CLASS}>
      <div className="relative">
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-text-200 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-text-100"
          aria-label="Preview full template"
          onClick={() => setPreviewHtml(t.htmlContent)}
        >
          <Eye className="h-4 w-4" />
        </button>
        <TemplatePreviewFrame html={t.htmlContent} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-slate-100 bg-white px-4 pb-4 pt-3">
        <p className="text-[15px] font-semibold leading-snug text-text-100">{t.name}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-text-200">{t.description}</p>
        <div className="mt-auto flex justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-md border-slate-300 bg-white px-4 font-medium text-text-100 hover:bg-slate-50"
            onClick={() => applyBuiltIn(t)}
          >
            Use template
          </Button>
        </div>
      </div>
    </div>
  );

  const browseContent = (
    <>
      {tab === "campaign-emails" && (
        <TemplateTabScaffold
          title="All campaign emails"
          description="Create a new email starting from a past campaign."
          toolbar={
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-300" />
              <Input
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="Search by name or ID"
                className="h-10 border-border bg-bg-200 pl-9"
              />
            </div>
          }
        >
          {campaignsLoading ? (
            <div className="flex min-h-[280px] items-center justify-center text-text-200">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <p className="py-16 text-center text-sm text-text-200">
              No campaigns found for this domain.
            </p>
          ) : (
            <div className={TEMPLATE_CARD_GRID}>
              {filteredCampaigns.map((c) => {
                const seq = c.sequence?.[0];
                const body = seq?.body ? String(seq.body) : "";
                return (
                  <div key={c.id} className={TEMPLATE_CARD_CLASS}>
                    <div className="relative">
                      <button
                        type="button"
                        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-text-200 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-text-100 disabled:opacity-40"
                        aria-label="Preview full template"
                        disabled={!body.trim()}
                        onClick={() => body && setPreviewHtml(body)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {body ? (
                        <TemplatePreviewFrame html={body} />
                      ) : (
                        <div className="flex h-40 items-center justify-center rounded-t-xl bg-bg-300/40 text-xs text-text-300">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 border-t border-slate-100 bg-white px-4 pb-4 pt-3">
                      <p className="text-xs text-text-300">#{c.id}</p>
                      <p className="text-[15px] font-semibold leading-snug text-text-100">
                        {c.name}
                      </p>
                      <div className="mt-auto flex justify-end pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-md border-slate-300 bg-white px-4 font-medium text-text-100 hover:bg-slate-50"
                          disabled={!body.trim()}
                          onClick={() => applyFromCampaign(c)}
                        >
                          Use template
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TemplateTabScaffold>
      )}

      {tab === "your-templates" && (
        <TemplateTabScaffold
          title="All saved templates"
          description="Start building your email using a previously saved template."
        >
          {userTemplatesLoading ? (
            <div className="flex min-h-[280px] items-center justify-center text-text-200">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : userTemplates.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center py-8 text-center">
              <div className="max-w-md rounded-2xl border border-dashed border-border bg-slate-50/80 px-8 py-10 text-text-200">
                <p className="text-base font-medium text-text-100">
                  You don&apos;t have saved templates yet
                </p>
                <p className="mt-2 text-sm text-text-200">
                  Use &quot;Save as template&quot; in the composer to see it here.
                </p>
              </div>
            </div>
          ) : (
            <div className={TEMPLATE_CARD_GRID}>
              {userTemplates.map((t) => (
                <div key={t.id} className={TEMPLATE_CARD_CLASS}>
                  <div className="relative">
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-text-200 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-text-100"
                      aria-label="Preview full template"
                      onClick={() => setPreviewHtml(t.htmlContent)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <TemplatePreviewFrame html={t.htmlContent} />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 border-t border-slate-100 bg-white px-4 pb-4 pt-3">
                    <p className="text-[15px] font-semibold leading-snug text-text-100">
                      {t.name}
                    </p>
                    <div className="mt-auto flex justify-end pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-md border-slate-300 bg-white px-4 font-medium text-text-100 hover:bg-slate-50"
                        onClick={() => applyUserTemplate(t)}
                      >
                        Use template
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TemplateTabScaffold>
      )}

      {tab === "basic-templates" && (
        <TemplateTabScaffold
          title="All basic templates"
          description="Start with a structured layout and customize it for your brand."
        >
          <div className={TEMPLATE_CARD_GRID}>
            {BASIC_EMAIL_TEMPLATES.map((t) => renderTemplateCard(t, t.id))}
          </div>
        </TemplateTabScaffold>
      )}

      {tab === "ready-to-use" && (
        <TemplateTabScaffold
          title="All ready-to-use templates"
          description="Professionally designed starters — personalize copy and images."
          toolbar={
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-text-200">Category</span>
              <Select value={readyCategory} onValueChange={setReadyCategory}>
                <SelectTrigger className="h-9 w-[200px] bg-bg-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {READY_TO_USE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        >
          <div className={TEMPLATE_CARD_GRID}>
            {readyFiltered.map((t) => renderTemplateCard(t, t.id))}
          </div>
        </TemplateTabScaffold>
      )}
    </>
  );

  const composerSetupBar = (
    <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/60 px-4 py-3">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="space-y-1">
          <Label htmlFor="modal-email-subject" className="text-[11px] font-medium text-text-300">
            Subject
          </Label>
          <Input
            id="modal-email-subject"
            value={draftSubject}
            onChange={(e) => setDraftSubject(e.target.value)}
            placeholder="Add subject line"
            className="h-9 bg-bg-100 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="modal-email-preview" className="text-[11px] font-medium text-text-300">
            Preview text
          </Label>
          <Input
            id="modal-email-preview"
            value={draftPreviewText}
            onChange={(e) => setDraftPreviewText(e.target.value)}
            placeholder="Inbox preview (optional)"
            maxLength={100}
            className="h-9 bg-bg-100 text-sm"
          />
        </div>
        <div className="relative flex flex-wrap items-end justify-end gap-2" ref={variablePanelRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
            onPointerDownCapture={captureComposerSelection}
            onClick={() => setShowVariablePanel(!showVariablePanel)}
          >
            <Plus className="h-3.5 w-3.5" />
            Personalize
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
            onPointerDownCapture={captureComposerSelection}
            onClick={() => openFallbackModal()}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Fallback
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
            onPointerDownCapture={captureComposerSelection}
            onClick={() => openSpintaxModal()}
          >
            <Dices className="h-3.5 w-3.5" />
            Spintax
          </Button>
          {showVariablePanel && (
            <div className="absolute right-0 top-full z-50 mt-1 flex max-h-80 w-80 flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-border p-2">
                <p className="mb-1 text-[11px] font-semibold text-text-100">
                  Add personalization chips
                </p>
                <p className="mb-2 text-[10px] leading-relaxed text-text-300">
                  These render as chips in the editor and save as merge tags.
                </p>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-text-300"
                  />
                  <input
                    type="text"
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    placeholder="Search variables..."
                    className="w-full rounded-md border border-border bg-bg-100 py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-main"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-64 flex-1 overflow-y-auto p-1">
                {filteredVariables.length > 0 ? (
                  <div className="space-y-0.5">
                    {filteredVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => {
                          insertVariable(variable);
                          setShowVariablePanel(false);
                          setVariableSearch("");
                        }}
                        className="w-full rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-brand-main/10"
                      >
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                          {variable.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").replace(/[_-]+/g, " ")}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-text-300">No variables</div>
                )}
              </div>
              <div className="border-t border-border bg-bg-100/80 px-2 py-1.5 text-[10px] text-text-300">
                Use Fallback for safe greetings like “First name · there”.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const composerFooter = (
    <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-bg-200 px-2.5 py-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1 text-text-200"
        onClick={() => setRightPanel("browse")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to templates
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setSaveTemplateOpen(true)}
        >
          <Save className="h-3.5 w-3.5" />
          Save as template
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => {
            setInboxPreviewLeadIndex(0);
            setInboxPreviewOpen(true);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Button>
        <Button type="button" size="sm" className="bg-brand-main px-4" onClick={handleApplyToCampaign}>
          Apply to campaign
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[92vh] max-h-[940px] w-[98vw] max-w-[1320px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1320px]">
          <DialogHeader className="flex-shrink-0 border-b border-border bg-bg-200 px-6 py-2 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight text-text-100">
              {rightPanel === "browse" ? "Create an email" : "Edit email"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            <aside className="flex w-[206px] flex-shrink-0 flex-col gap-3 overflow-y-auto border-r border-slate-200/90 bg-slate-50 p-2.5 sm:w-[228px] sm:gap-4 sm:p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    className="h-11 w-full "
                  >
                    Create from scratch
                    <ChevronDown className="h-4 w-4 opacity-80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px] p-1" sideOffset={6}>
                  <DropdownMenuItem
                    className="flex cursor-pointer flex-col items-start gap-0.5 py-3 hover:bg-primary-100"
                    onClick={startSimpleEditor}
                  >
                    <span className="flex items-center gap-2 font-semibold text-text-100">
                      <FileText className="h-4 w-4" />
                      Build email in editor
                    </span>
                    <span className="text-xs text-text-200">
                      Rich text with formatting and merge variables.
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex cursor-pointer flex-col items-start gap-0.5 py-3"
                    onClick={startHtmlEditor}
                  >
                    <span className="flex items-center gap-2 font-semibold text-text-100">
                      <Code2 className="h-4 w-4" />
                      As HTML editor
                    </span>
                    <span className="text-xs text-text-200">
                      Full HTML with live preview side by side.
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="space-y-0.5">
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-300">
                  Your emails
                </p>
                {sidebarBtn("campaign-emails", <Mail className="h-4 w-4" />, "Campaign emails")}
              </div>

              <div className="space-y-0.5">
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-300">
                  Templates
                </p>
                {sidebarBtn("your-templates", <LayoutGrid className="h-4 w-4" />, "Your templates")}
                {sidebarBtn("basic-templates", <LayoutGrid className="h-4 w-4" />, "Basic templates")}
                {sidebarBtn("ready-to-use", <BookOpen className="h-4 w-4" />, "Ready-to-use")}
              </div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
              {rightPanel === "browse" ? (
                browseContent
              ) : rightPanel === "simple" ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {composerSetupBar}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-bg-200">
                      <DesignEditor
                        htmlContent={draftHtml}
                        onHtmlContentChange={setDraftHtml}
                        onTokenClick={handleEditorTokenClick}
                      />
                    </div>
                  </div>
                  {composerFooter}
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {composerSetupBar}
                    <div className="min-h-0 flex-1 overflow-hidden">
                      <HtmlEditorWithPreview
                        htmlContent={draftHtml}
                        onHtmlContentChange={setDraftHtml}
                        onTokenClick={handleEditorTokenClick}
                      />
                    </div>
                  </div>
                  {composerFooter}
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewHtml !== null} onOpenChange={(o) => !o && setPreviewHtml(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewHtml ? (
            <iframe
              title="Full preview"
              className="h-[min(72vh,720px)] w-full rounded-b-md border-0 bg-bg-200 [scrollbar-width:thin]"
              srcDoc={wrapPreviewDocFull(previewHtml)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={inboxPreviewOpen} onOpenChange={setInboxPreviewOpen}>
        <DialogContent className="flex max-h-[min(88vh,640px)] w-[min(100vw-1.25rem,28rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogTitle className="sr-only">Email preview with sample recipient</DialogTitle>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3 pt-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                From
              </Label>
              <Input
                readOnly
                tabIndex={-1}
                className="h-9 cursor-default border-slate-200 bg-slate-50 text-xs text-slate-600"
                value="Your verified sender (LeadSnipper)"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                To (sample)
              </Label>
              <div className="flex gap-1.5">
                <Select
                  value={String(inboxPreviewLeadIndex)}
                  onValueChange={(v) => setInboxPreviewLeadIndex(Number(v))}
                >
                  <SelectTrigger className="h-9 min-w-0 flex-1 text-xs">
                    <SelectValue placeholder="Recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREVIEW_SAMPLE_LEADS.map((sample, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {sample.name ||
                          `${sample.firstName || sample.first_name} ${sample.lastName || sample.last_name}`.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex shrink-0 rounded-md border border-slate-200">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-none rounded-l-md"
                    aria-label="Previous sample recipient"
                    onClick={() => shiftInboxPreviewLead(-1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-none rounded-r-md border-l border-slate-200"
                    aria-label="Next sample recipient"
                    onClick={() => shiftInboxPreviewLead(1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="text-xs leading-snug text-slate-800">
                  <span className="text-slate-400">To </span>
                  <span className="font-medium text-slate-900">
                    {formatPreviewRecipientLine(inboxPreviewLead)}
                  </span>
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900">
                  <span className="mr-1.5 text-xs font-normal text-slate-400">Subject </span>
                  {inboxPreviewResolved.subject.trim() || "(no subject)"}
                </p>
                {inboxPreviewResolved.previewText.trim() ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    <span className="text-slate-400">Preheader </span>
                    {inboxPreviewResolved.previewText}
                  </p>
                ) : null}
              </div>
              <div className="bg-slate-50 p-1.5">
                <iframe
                  title="Resolved email body preview"
                  className="h-[min(38vh,320px)] w-full min-h-[160px] rounded-md bg-white [scrollbar-width:thin]"
                  sandbox="allow-same-origin"
                  srcDoc={wrapEmailPreviewDocument(
                    inboxPreviewResolved.html.trim()
                      ? inboxPreviewResolved.html
                      : '<p style="margin:0;padding:16px;font-size:13px;line-height:1.5;color:#94a3b8;font-family:system-ui,sans-serif;">No body content yet.</p>',
                    false
                  )}
                />
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-500">
              Reply &quot;Stop&quot; to opt out.
            </p>
          </div>

          <DialogFooter className="border-t border-slate-100 px-4 py-2 sm:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setInboxPreviewOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="tpl-name-modal">Template name</Label>
            <Input
              id="tpl-name-modal"
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              placeholder="e.g. Monthly newsletter"
              className="bg-bg-100"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveTemplate} disabled={savingTemplate}>
              {savingTemplate ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={fallbackModalOpen}
        onOpenChange={(nextOpen) => {
          setFallbackModalOpen(nextOpen);
          if (!nextOpen) {
            setEditingFallbackToken(null);
            pendingReplaceSelectionRef.current = false;
            pendingHtmlSelectionRangeRef.current = null;
          }
        }}
      >
        <DialogContent className="max-w-xl border-slate-200 bg-white p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Sparkles className="h-6 w-6 text-blue-600" />
              {editingFallbackToken ? "Edit Fallback Text" : "Add Fallback Text"}
            </DialogTitle>
            <DialogDescription className="text-left text-base leading-relaxed text-slate-600">
              Choose what should appear if a recipient is missing this field.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="fallback-variable">Personalization field</Label>
              <select
                id="fallback-variable"
                value={fallbackVariable}
                onChange={(e) => setFallbackVariable(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {mergeTags.map((variable) => (
                  <option key={variable} value={variable}>
                    {variable.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").replace(/[_-]+/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallback-text">Fallback text</Label>
              <Input
                id="fallback-text"
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                placeholder="Optional, e.g. there"
                className="h-11 border-slate-200 bg-white text-base"
              />
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Preview:{" "}
              <span className="inline-flex rounded-full border border-blue-200 bg-white px-2 py-1 font-semibold text-blue-700">
                {fallbackVariable.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").replace(/[_-]+/g, " ")} · {fallbackText || "fallback"}
              </span>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setFallbackModalOpen(false)}>
              Cancel
            </Button>
            {editingFallbackToken ? (
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleRemoveFallbackToken}
              >
                Remove
              </Button>
            ) : null}
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleInsertFallback}>
              {editingFallbackToken ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={spintaxModalOpen}
        onOpenChange={(nextOpen) => {
          setSpintaxModalOpen(nextOpen);
          if (!nextOpen) {
            setEditingSpintaxToken(null);
            pendingReplaceSelectionRef.current = false;
            pendingHtmlSelectionRangeRef.current = null;
          }
        }}
      >
        <DialogContent className="max-w-xl border-slate-200 bg-white p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Dices className="h-6 w-6 text-violet-600" />
              {editingSpintaxToken ? "Edit Spintax" : "Add Spintax"}
            </DialogTitle>
            <DialogDescription className="text-left text-base leading-relaxed text-slate-600">
              Add alternate phrases. The editor shows one chip, and campaign sending keeps the spintax syntax.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-6 py-5">
            {manualSpintaxOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) =>
                    setManualSpintaxOptions((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? e.target.value : item
                      )
                    )
                  }
                  placeholder={`Option ${index + 1}`}
                  className="h-11 border-slate-200 bg-white text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-10 px-0 text-slate-400 hover:text-slate-700"
                  onClick={() =>
                    setManualSpintaxOptions((items) =>
                      items.length > 2 ? items.filter((_, itemIndex) => itemIndex !== index) : items
                    )
                  }
                  aria-label="Remove spintax option"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="px-0 font-semibold text-slate-800 hover:bg-transparent hover:text-violet-700"
              onClick={() => setManualSpintaxOptions((items) => [...items, ""])}
            >
              + Add Spin
            </Button>
            <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900">
              Preview:{" "}
              <span className="inline-flex rounded-full border border-violet-200 bg-white px-2 py-1 font-semibold text-violet-700">
                spin {manualSpintaxOptions.filter(Boolean).join(" · ") || "Option A · Option B"}
              </span>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setSpintaxModalOpen(false)}>
              Cancel
            </Button>
            {editingSpintaxToken ? (
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleRemoveSpintaxToken}
              >
                Remove
              </Button>
            ) : null}
            <Button type="button" className="bg-violet-600 text-white hover:bg-violet-700" onClick={handleInsertManualSpintax}>
              {editingSpintaxToken ? "Update" : "Insert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
