"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { wrapEmailPreviewDocument } from "./htmlPreviewUtils";

interface HtmlEditorWithPreviewProps {
  htmlContent: string;
  onHtmlContentChange: (content: string) => void;
}

export default function HtmlEditorWithPreview({
  htmlContent,
  onHtmlContentChange,
}: HtmlEditorWithPreviewProps) {
  const [copied, setCopied] = useState(false);

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

  const previewSrc = wrapEmailPreviewDocument(htmlContent || "<p></p>", true);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-[1_1_50%] flex-col border-b border-border lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap gap-1 border-b border-border bg-bg-300/40 px-2 py-1.5">
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
        <textarea
          id="codeEditor"
          value={htmlContent}
          onChange={(e) => onHtmlContentChange(e.target.value)}
          placeholder="Enter HTML content here..."
          className="min-h-[240px] w-full min-w-0 flex-1 resize-none bg-bg-100 px-3 py-2 font-mono text-sm text-text-100 placeholder:text-text-300 focus:outline-none focus:ring-1 focus:ring-brand-main/30 lg:min-h-[min(100%,480px)]"
          spellCheck={false}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-[1_1_50%] flex-col">
        <div className="border-b border-border bg-bg-300/40 px-3 py-2 text-xs font-medium text-text-200">
          Live preview
        </div>
        <div className="min-h-[240px] flex-1 overflow-hidden rounded-b-lg bg-[#f8fafc] lg:min-h-[min(100%,480px)]">
          <iframe
            title="HTML preview"
            className="h-full min-h-[220px] w-full border-0 bg-[#f8fafc] [scrollbar-width:thin]"
            srcDoc={previewSrc}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
