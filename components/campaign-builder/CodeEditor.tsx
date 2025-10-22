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
    <div className="space-y-1.5">
      {/* Toolbar - Compact */}
      <div className="flex gap-1.5">
        <button
          onClick={handleFormat}
          className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded transition"
          title="Format HTML"
        >
          ✨ Format
        </button>
        <button
          onClick={handleMinify}
          className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded transition"
          title="Minify HTML"
        >
          📦 Minify
        </button>
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded transition flex items-center gap-1"
          title="Copy HTML"
        >
          {copied ? (
            <>
              <Check size={12} /> Copied
            </>
          ) : (
            <>
              <Copy size={12} /> Copy
            </>
          )}
        </button>
      </div>

      {/* Code Editor */}
      <textarea
        id="codeEditor"
        value={htmlContent}
        onChange={(e) => onHtmlContentChange(e.target.value)}
        placeholder="Enter HTML content here..."
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs min-h-80 max-h-80 overflow-y-auto"
        spellCheck="false"
      />

      {/* Info */}
      <p className="text-xs text-gray-400">
        💡 Use {"{"}
        {"{"}variable{"}"}
        {"}"} for personalization
      </p>
    </div>
  );
}
