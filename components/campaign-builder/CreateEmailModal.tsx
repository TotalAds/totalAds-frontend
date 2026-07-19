"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Dices,
  Eye,
  FileText,
  LayoutTemplate,
  Plus,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
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
import emailClient from "@/utils/api/emailClient";

import DesignEditor from "./DesignEditor";
import EmailTemplatePickerModal from "./EmailTemplatePickerModal";
import {
  isStructuredHtmlEmail,
  textToSimpleEditorHtml,
} from "./emailTemplateTextUtils";
import type { BodyEditorMode } from "./emailTemplateTypes";
import HtmlEditorWithPreview from "./HtmlEditorWithPreview";
import {
  PREVIEW_SAMPLE_LEADS,
  buildCompositeLeadForPreview,
  mergeVariableLists,
  resolveMergeTagsAndSpintax,
  wrapEmailPreviewDocument,
} from "./htmlPreviewUtils";
import { type SpintaxPackId } from "./spintaxUtils";

export type { UserEmailTemplateRow } from "./emailTemplateTypes";
export type { BodyEditorMode } from "./emailTemplateTypes";

/** Temporarily hide template picker, save-as-template, and create-from-scratch controls. */
const SHOW_EMAIL_TEMPLATE_CONTROLS = false;

type RightPanel = "simple" | "html";

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
  /** Merge tags from CSV columns + built-ins are merged automatically */
  availableVariables: string[];
  /** Optional sample values for Personalize / token hover tooltips. */
  tokenSampleValues?: Record<string, string>;
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
  availableVariables,
  tokenSampleValues,
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
  const [rightPanel, setRightPanel] = useState<RightPanel>("simple");
  const [draftHtml, setDraftHtml] = useState("");
  const [draftBodyEditor, setDraftBodyEditor] = useState<BodyEditorMode>("simple");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftPreviewText, setDraftPreviewText] = useState("");
  const [draftUseSpintax, setDraftUseSpintax] = useState(false);
  const [draftSpintaxPackId, setDraftSpintaxPackId] = useState<SpintaxPackId>("general");
  const [draftStrictGrammarMode, setDraftStrictGrammarMode] = useState(false);

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
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

  const mergeTags = useMemo(() => {
    const raw = mergeVariableLists(availableVariables);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of raw) {
      const inner = item.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").trim();
      if (!inner) continue;
      const tag = `{{${inner}}}`;
      if (seen.has(tag)) continue;
      seen.add(tag);
      out.push(tag);
    }
    return out;
  }, [availableVariables]);

  const groupedMergeTags = useMemo(() => {
    const contactKeys = new Set([
      "first_name",
      "firstname",
      "last_name",
      "lastname",
      "title",
      "email",
      "name",
      "phone",
      "website",
      "role",
      "linkedin_url",
      "location",
      "person_summary",
    ]);
    const companyKeys = new Set([
      "company",
      "company_domain",
      "company_website",
      "company_description",
      "company_city",
      "company_country",
      "company_services",
      "industry",
      "company_size",
      "company_summary",
      "growth_stage",
      "ideal_buyer_persona",
    ]);
    const scoreKeys = new Set([
      "intent_score",
      "icp_score",
      "confidence",
      "priority",
      "enrichment_status",
      "pipeline_stage",
    ]);
    const strip = (v: string) =>
      v.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").trim();
    const contact: string[] = [];
    const company: string[] = [];
    const scores: string[] = [];
    const outreach: string[] = [];
    for (const tag of mergeTags) {
      const key = strip(tag);
      const nk = key.toLowerCase().replace(/[\s-]+/g, "_");
      if (contactKeys.has(nk) || contactKeys.has(key)) contact.push(tag);
      else if (companyKeys.has(nk) || companyKeys.has(key)) company.push(tag);
      else if (scoreKeys.has(nk) || scoreKeys.has(key)) scores.push(tag);
      else if (mergeTags.length > 8) outreach.push(tag);
      else contact.push(tag);
    }
    if (
      outreach.length === 0 &&
      company.length === 0 &&
      scores.length === 0
    ) {
      return [{ label: "Fields", tags: mergeTags }];
    }
    return [
      { label: "Contact", tags: contact },
      { label: "Company", tags: company },
      { label: "Scores", tags: scores },
      { label: "Outreach", tags: outreach },
    ].filter((g) => g.tags.length > 0);
  }, [mergeTags]);

  const filteredVariableGroups = useMemo(() => {
    const q = variableSearch.toLowerCase().trim();
    if (!q) return groupedMergeTags;
    return groupedMergeTags
      .map((g) => ({
        ...g,
        tags: g.tags.filter((variable) => variable.toLowerCase().includes(q)),
      }))
      .filter((g) => g.tags.length > 0);
  }, [groupedMergeTags, variableSearch]);

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

  useEffect(() => {
    if (!open) return;
    clearPendingInsertSelection();
    setDraftSubject(seedSubject || "");
    setDraftPreviewText(seedPreviewText || "");
    setDraftUseSpintax(seedUseSpintax);
    setDraftSpintaxPackId(seedSpintaxPackId || "general");
    setDraftStrictGrammarMode(seedStrictGrammarMode);

    const hasSeed = seedHtml.trim().length > 0;
    if (hasSeed || openDirectlyToEditor) {
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
      setDraftHtml("<p></p>");
      setDraftBodyEditor("simple");
      setRightPanel("simple");
    }
    setVariableSearch("");
    setShowVariablePanel(false);
  }, [
    open,
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

  const normalizeVariableToken = (variable: string) =>
    variable.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").trim();

  const toMergeTag = (variable: string) => {
    const inner = normalizeVariableToken(variable);
    if (!inner) return "";
    return `{{${inner}}}`;
  };

  const insertVariable = (variable: string) => {
    const token = toMergeTag(variable);
    if (!token) return;

    if (draftBodyEditor === "simple" || rightPanel === "simple") {
      const replaceSel = pendingReplaceSelectionRef.current;
      pendingReplaceSelectionRef.current = false;
      pendingHtmlSelectionRangeRef.current = null;
      pendingComposerSelectionRef.current = "";
      const detail =
        replaceSel && token.trim().length > 0
          ? { variable: token, replaceSelection: true as const }
          : token;
      window.dispatchEvent(
        new CustomEvent("totalads:insert-variable", { detail })
      );
      toast.success(`Added ${token}`, { duration: 1500 });
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
      toast.success(`Added ${token}`, { duration: 1500 });
      return;
    }
    pendingReplaceSelectionRef.current = false;
    pendingComposerSelectionRef.current = "";
    setDraftHtml((draftHtml || "") + token);
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
    switchEditorMode("simple");
  };

  const startHtmlEditor = () => {
    switchEditorMode("html", { useStarterWhenEmpty: true });
  };

  const switchEditorMode = (
    mode: BodyEditorMode,
    options?: { useStarterWhenEmpty?: boolean }
  ) => {
    if (mode === draftBodyEditor && rightPanel === mode) return;

    if (mode === "simple") {
      setDraftHtml(textToSimpleEditorHtml(draftHtml));
      setDraftBodyEditor("simple");
      setRightPanel("simple");
      return;
    }

    const trimmed = draftHtml.trim();
    if (
      options?.useStarterWhenEmpty &&
      (!trimmed || trimmed === "<p></p>")
    ) {
      setDraftHtml(HTML_STARTER);
    }
    setDraftBodyEditor("html");
    setRightPanel("html");
  };

  const handleImportTemplate = (payload: {
    content: string;
    bodyEditor: BodyEditorMode;
  }) => {
    const { content, bodyEditor } = payload;
    if (bodyEditor === "html") {
      setDraftHtml(content.trim() || HTML_STARTER);
      setDraftBodyEditor("html");
      setRightPanel("html");
      return;
    }
    setDraftHtml(textToSimpleEditorHtml(content));
    setDraftBodyEditor("simple");
    setRightPanel("simple");
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
    } catch {
      toast.error("Could not save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const editorModeToggle = (
    <div
      className="inline-flex h-8 shrink-0 items-center rounded-md border border-slate-200/80 bg-white p-0.5"
      role="tablist"
      aria-label="Editor mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={rightPanel === "simple"}
        title="Rich text editor"
        onClick={() => switchEditorMode("simple")}
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium transition-colors",
          rightPanel === "simple"
            ? "bg-brand-main text-white"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        <FileText className="h-3 w-3" />
        Text
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={rightPanel === "html"}
        title="HTML editor with live preview"
        onClick={() => switchEditorMode("html", { useStarterWhenEmpty: true })}
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium transition-colors",
          rightPanel === "html"
            ? "bg-brand-main text-white"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        <Code2 className="h-3 w-3" />
        HTML
      </button>
    </div>
  );

  const editorTopBar = (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Create from scratch
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px] p-1" sideOffset={6}>
          <DropdownMenuItem
            className="flex cursor-pointer flex-col items-start gap-0.5 py-3"
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 border-brand-main/30 bg-white text-brand-main hover:bg-brand-main/5"
        onClick={() => setTemplatePickerOpen(true)}
      >
        <LayoutTemplate className="h-3.5 w-3.5" />
        Use template
      </Button>
    </div>
  );

  const composerSetupBar = (
    <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/60 px-4 py-2">
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
        <div className="relative flex flex-wrap items-end justify-end gap-1.5" ref={variablePanelRef}>
          {editorModeToggle}
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
            <div className="absolute right-0 top-full z-50 mt-1 flex max-h-[22rem] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
              <div className="shrink-0 border-b border-border px-2.5 py-2">
                <p className="mb-0.5 text-[11px] font-semibold text-text-100">
                  Personalization fields
                </p>
                <p className="mb-1.5 text-[9px] leading-snug text-text-300">
                  Hover a field to preview its value from a campaign lead. Click to insert.
                </p>
                <div className="relative">
                  <Search
                    size={12}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-text-300"
                  />
                  <input
                    type="text"
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full rounded-md border border-border bg-bg-100 py-1 pl-7 pr-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-main"
                    autoFocus
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                {filteredVariableGroups.length > 0 ? (
                  <div className="space-y-2">
                    {filteredVariableGroups.map((group) => (
                      <div key={group.label}>
                        <p className="px-1 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {group.label}
                        </p>
                        <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
                          {group.tags.map((variable) => {
                            const field = variable
                              .replace(/^\{\{\s*/, "")
                              .replace(/\s*\}\}$/, "")
                              .split("|")[0]
                              .trim();
                            const sample =
                              tokenSampleValues?.[field] ||
                              tokenSampleValues?.[field.toLowerCase()] ||
                              (tokenSampleValues
                                ? Object.entries(tokenSampleValues).find(
                                    ([k]) =>
                                      k.toLowerCase().replace(/[\s_-]+/g, "") ===
                                      field.toLowerCase().replace(/[\s_-]+/g, "")
                                  )?.[1]
                                : undefined);
                            const tip = sample
                              ? `${field} → ${sample}`
                              : `${field} → No value for this lead`;
                            const label = field.replace(/[_-]+/g, " ");
                            return (
                              <button
                                key={variable}
                                type="button"
                                title={tip}
                                onClick={() => {
                                  insertVariable(variable);
                                  setShowVariablePanel(false);
                                  setVariableSearch("");
                                }}
                                className="group rounded-md border border-transparent px-1.5 py-1 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
                              >
                                <span className="block truncate text-[10px] font-semibold leading-tight text-blue-700">
                                  {label}
                                </span>
                                {sample ? (
                                  <span className="mt-0.5 block max-h-0 overflow-hidden truncate text-[8px] leading-tight text-slate-500 opacity-0 transition-all group-hover:max-h-8 group-hover:opacity-100">
                                    {sample}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-[11px] text-text-300">
                    No variables
                  </div>
                )}
              </div>
              <div className="shrink-0 border-t border-border bg-bg-100/80 px-2.5 py-1 text-[9px] text-text-300">
                Use Fallback for safe greetings like “First name · there”.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const composerFooter = (
    <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-bg-200 px-2.5 py-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {SHOW_EMAIL_TEMPLATE_CONTROLS ? (
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
        ) : null}
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
              {openDirectlyToEditor && seedHtml.trim() ? "Edit email" : "Create email"}
            </DialogTitle>
          </DialogHeader>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
            {SHOW_EMAIL_TEMPLATE_CONTROLS ? editorTopBar : null}
            {rightPanel === "simple" ? (
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
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <HtmlEditorWithPreview
                      htmlContent={draftHtml}
                      onHtmlContentChange={setDraftHtml}
                      onTokenClick={handleEditorTokenClick}
                      tokenSampleValues={tokenSampleValues}
                    />
                  </div>
                </div>
                {composerFooter}
              </div>
            )}
          </section>
        </DialogContent>
      </Dialog>

      {SHOW_EMAIL_TEMPLATE_CONTROLS ? (
        <EmailTemplatePickerModal
          open={templatePickerOpen}
          onOpenChange={setTemplatePickerOpen}
          domainId={domainId}
          excludeCampaignId={excludeCampaignId}
          onImport={handleImportTemplate}
        />
      ) : null}

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
              <p className="text-[11px] text-slate-500">
                Pick a merge field — same chips as Personalize.
              </p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div className="flex flex-wrap gap-1.5">
                  {mergeTags.map((variable) => {
                    const selected = fallbackVariable === variable;
                    const label = variable
                      .replace(/^\{\{\s*/, "")
                      .replace(/\s*\}\}$/, "")
                      .replace(/[_-]+/g, " ");
                    return (
                      <button
                        key={variable}
                        type="button"
                        id={
                          selected ? "fallback-variable" : undefined
                        }
                        onClick={() => setFallbackVariable(variable)}
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                          selected
                            ? "border-blue-400 bg-blue-600 text-white shadow-sm"
                            : "border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
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
