"use client";

import { Check, Copy, Dices, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  PersonalizationHoverTrigger,
  lookupSampleValue,
  useAnchoredCoveragePopover,
} from "./PersonalizationCoveragePopover";
import {
  getCoverageStatus,
  lookupTokenCoverage,
  wrapEmailPreviewDocument,
  type PersonalizationTokenCoverage,
} from "./htmlPreviewUtils";

interface HtmlEditorWithPreviewProps {
  htmlContent: string;
  onHtmlContentChange: (content: string) => void;
  onTokenClick?: (
    type: "merge" | "spintax",
    token: string,
    occurrenceIndex: number
  ) => void;
  /** Optional {{token}} → sample value map for hover tooltips on highlighted tokens. */
  tokenSampleValues?: Record<string, string>;
  /** Campaign-lead coverage for merge tags (red/amber warning in preview). */
  tokenCoverage?: Record<string, PersonalizationTokenCoverage>;
}

function getMergeTokenLabel(token: string): string {
  const inner = token.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
  const [field, fallback] = inner.split("|").map((part) => part.trim());
  const label = field
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return fallback ? `${label} · ${fallback}` : label || "Personalization";
}

function getSpintaxLabel(token: string): string {
  const variants = token
    .replace(/^\{\s*/, "")
    .replace(/\s*\}$/, "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (variants.length <= 3) return variants.join(" · ");
  return `${variants.slice(0, 3).join(" · ")} +${variants.length - 3}`;
}

function extractEmailTokens(html: string) {
  const tokenRegex = /(\{\{\s*[^{}]+?\s*\}\}|\{[^{}]*\|[^{}]*\})/g;
  const matches: Array<{
    type: "merge" | "spintax";
    token: string;
    label: string;
    occurrenceIndex: number;
  }> = [];
  const seen = new Map<string, number>();

  html.split(/(<[^>]+>)/g).forEach((chunk) => {
    if (!chunk || chunk.startsWith("<")) return;
    Array.from(chunk.matchAll(tokenRegex)).forEach((match) => {
      const token = match[0];
      const type = token.startsWith("{{") ? "merge" : "spintax";
      const key = `${type}:${token}`;
      const occurrenceIndex = seen.get(key) || 0;
      seen.set(key, occurrenceIndex + 1);
      matches.push({
        type,
        token,
        occurrenceIndex,
        label: type === "merge" ? getMergeTokenLabel(token) : getSpintaxLabel(token),
      });
    });
  });

  return matches;
}

export default function HtmlEditorWithPreview({
  htmlContent,
  onHtmlContentChange,
  onTokenClick,
  tokenSampleValues,
  tokenCoverage,
}: HtmlEditorWithPreviewProps) {
  const [copied, setCopied] = useState(false);
  const tokens = useMemo(() => extractEmailTokens(htmlContent), [htmlContent]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { showAt, hide, portal } = useAnchoredCoveragePopover();
  const coverageRef = useRef(tokenCoverage);
  const samplesRef = useRef(tokenSampleValues);
  coverageRef.current = tokenCoverage;
  samplesRef.current = tokenSampleValues;

  const hasCoverageData = Boolean(
    tokenCoverage && Object.keys(tokenCoverage).length > 0
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    try {
      let formatted = htmlContent
        .replace(/></g, ">\n<")
        .replace(/\n\s*\n/g, "\n");
      let indent = 0;
      formatted = formatted
        .split("\n")
        .map((line) => {
          if (line.match(/^<\/\w/)) indent--;
          const result = "  ".repeat(Math.max(0, indent)) + line;
          if (
            line.match(/^<\w[^>]*[^/]>$/) &&
            !line.match(/^<(br|hr|img|input)/)
          ) {
            indent++;
          }
          return result;
        })
        .join("\n");
      onHtmlContentChange(formatted);
      toast.success("HTML formatted");
    } catch {
      toast.error("Failed to format HTML");
    }
  };

  const handleMinify = () => {
    try {
      const minified = htmlContent
        .replace(/\n/g, "")
        .replace(/\s+/g, " ")
        .trim();
      onHtmlContentChange(minified);
      toast.success("HTML minified");
    } catch {
      toast.error("Failed to minify HTML");
    }
  };

  const previewSrc = wrapEmailPreviewDocument(
    htmlContent || "<p></p>",
    true,
    tokenSampleValues,
    tokenCoverage
  );

  // Bridge iframe merge-tag hover → parent formatted popover (positioned above chip).
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let doc: Document | null = null;
    let detach: (() => void) | null = null;

    const attach = () => {
      try {
        doc = iframe.contentDocument;
      } catch {
        doc = null;
      }
      if (!doc) return;

      const iframeRect = () => iframe.getBoundingClientRect();

      const onOver = (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        const chip = target?.closest<HTMLElement>("[data-merge-field]");
        if (!chip || !doc?.body.contains(chip)) return;
        const field = chip.getAttribute("data-merge-field") || "";
        if (!field) return;
        const map = coverageRef.current;
        const hasData = Boolean(map && Object.keys(map).length > 0);
        const r = chip.getBoundingClientRect();
        const frame = iframeRect();
        showAt(
          {
            top: frame.top + r.top,
            left: frame.left + r.left,
            width: r.width,
            height: r.height,
            bottom: frame.top + r.bottom,
            right: frame.left + r.right,
          },
          {
            field,
            sample:
              chip.getAttribute("data-sample") ||
              lookupSampleValue(samplesRef.current, field),
            coverage: hasData ? lookupTokenCoverage(map, field) : null,
            hasCoverageData: hasData,
          }
        );
      };

      const onOut = (event: MouseEvent) => {
        const related = event.relatedTarget as Node | null;
        const chip = (event.target as HTMLElement | null)?.closest(
          "[data-merge-field]"
        );
        if (chip && related && chip.contains(related)) return;
        hide();
      };

      doc.addEventListener("mouseover", onOver);
      doc.addEventListener("mouseout", onOut);
      detach = () => {
        doc?.removeEventListener("mouseover", onOver);
        doc?.removeEventListener("mouseout", onOut);
      };
    };

    const onLoad = () => {
      detach?.();
      attach();
    };

    iframe.addEventListener("load", onLoad);
    // srcDoc may already be ready
    attach();

    return () => {
      iframe.removeEventListener("load", onLoad);
      detach?.();
      hide();
    };
  }, [previewSrc, showAt, hide]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-[1_1_50%] flex-col border-b border-border lg:border-b-0 lg:border-r">
        <div className="flex flex-shrink-0 flex-wrap gap-1 border-b border-border bg-bg-300/40 px-2 py-1.5">
          <button
            type="button"
            onClick={handleFormat}
            className="rounded px-2 py-1 text-xs text-text-200 transition hover:bg-bg-300"
          >
            Format
          </button>
          <button
            type="button"
            onClick={handleMinify}
            className="rounded px-2 py-1 text-xs text-text-200 transition hover:bg-bg-300"
          >
            Minify
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-200 transition hover:bg-bg-300"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {tokens.length > 0 ? (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border bg-white px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Editable tokens
            </span>
            {tokens.map((token, index) => {
              const mergeField =
                token.type === "merge"
                  ? token.token
                      .replace(/^\{\{\s*/, "")
                      .replace(/\s*\}\}$/, "")
                      .split("|")[0]
                      .trim()
                  : "";
              const sample =
                token.type === "merge"
                  ? lookupSampleValue(tokenSampleValues, mergeField)
                  : undefined;
              const coverage =
                token.type === "merge"
                  ? lookupTokenCoverage(tokenCoverage, mergeField)
                  : null;
              const status =
                token.type === "merge" && hasCoverageData
                  ? getCoverageStatus(coverage)
                  : "ok";

              const button = (
                <button
                  type="button"
                  onClick={() =>
                    onTokenClick?.(token.type, token.token, token.occurrenceIndex)
                  }
                  className={
                    token.type === "merge"
                      ? status === "missing"
                        ? "inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        : status === "warning"
                          ? "inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                          : "inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      : "inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                  }
                >
                  {token.type === "merge" ? (
                    <Sparkles className="h-3 w-3" />
                  ) : (
                    <Dices className="h-3 w-3" />
                  )}
                  {token.type === "spintax" ? "spin " : ""}
                  {token.label}
                </button>
              );

              if (token.type !== "merge") {
                return (
                  <span
                    key={`${token.type}-${token.token}-${token.occurrenceIndex}-${index}`}
                  >
                    {button}
                  </span>
                );
              }

              return (
                <PersonalizationHoverTrigger
                  key={`${token.type}-${token.token}-${token.occurrenceIndex}-${index}`}
                  field={mergeField}
                  sample={sample}
                  coverage={coverage}
                  hasCoverageData={hasCoverageData}
                >
                  {button}
                </PersonalizationHoverTrigger>
              );
            })}
          </div>
        ) : null}
        <textarea
          id="codeEditor"
          value={htmlContent}
          onChange={(e) => onHtmlContentChange(e.target.value)}
          placeholder="Enter HTML content here..."
          className="min-h-[240px] w-full min-w-0 flex-1 resize-none overflow-auto bg-bg-100 px-3 py-2 font-mono text-sm text-text-100 placeholder:text-text-300 focus:outline-none focus:ring-1 focus:ring-brand-main/30 lg:min-h-0"
          spellCheck={false}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-[1_1_50%] flex-col">
        <div className="flex-shrink-0 border-b border-border bg-bg-300/40 px-3 py-2 text-xs font-medium text-text-200">
          Live preview
        </div>
        <div className="min-h-[240px] flex-1 overflow-hidden rounded-b-lg bg-[#f8fafc] lg:min-h-0">
          <iframe
            ref={iframeRef}
            title="HTML preview"
            className="h-full w-full border-0 bg-[#f8fafc] [scrollbar-width:thin]"
            srcDoc={previewSrc}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
      {portal}
    </div>
  );
}
