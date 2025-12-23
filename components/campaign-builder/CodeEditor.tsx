"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface CodeEditorProps {
  htmlContent: string;
  onHtmlContentChange: (content: string) => void;
}

export default function CodeEditor({
  htmlContent,
  onHtmlContentChange,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    try {
      // Simple HTML formatting
      let formatted = htmlContent
        .replace(/></g, ">\n<")
        .replace(/\n\s*\n/g, "\n");

      // Add indentation
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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to minify HTML");
    }
  };

  return (
    <div className="p-3">
      {/* Compact Toolbar */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={handleFormat}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition"
          title="Format HTML"
        >
          Format
        </button>
        <button
          onClick={handleMinify}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition"
          title="Minify HTML"
        >
          Minify
        </button>
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition flex items-center gap-1"
          title="Copy HTML"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Code Editor - Gmail style */}
      <textarea
        id="codeEditor"
        value={htmlContent}
        onChange={(e) => onHtmlContentChange(e.target.value)}
        placeholder="Enter HTML content here..."
        className="w-full px-2 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none font-mono text-sm min-h-[350px] resize-none"
        spellCheck="false"
        style={{ border: 'none' }}
      />
    </div>
  );
}
