"use client";

import "./DesignEditor.css";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Braces,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";

import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, mergeAttributes, Node, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface DesignEditorProps {
  htmlContent: string;
  onHtmlContentChange: (content: string) => void;
  onTokenClick?: (
    type: "merge" | "spintax",
    token: string,
    occurrenceIndex: number
  ) => void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeHtml(value: string): string {
  if (typeof document === "undefined") return value;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function normalizeMergeToken(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "{{field}}";
  return trimmed.startsWith("{{") ? trimmed : `{{${trimmed}}}`;
}

function getMergeTokenLabel(token: string): string {
  const inner = normalizeMergeToken(token)
    .replace(/^\{\{\s*/, "")
    .replace(/\s*\}\}$/, "");
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
  if (variants.length === 0) return "Spin";
  if (variants.length <= 3) return variants.join(" · ");
  return `${variants.slice(0, 3).join(" · ")} +${variants.length - 3}`;
}

function emailSyntaxToEditorHtml(html: string): string {
  if (!html) return "";
  const tokenRegex = /(\{\{\s*[^{}]+?\s*\}\}|\{[^{}]*\|[^{}]*\})/g;
  return html
    .split(/(<[^>]+>)/g)
    .map((chunk) => {
      if (!chunk || chunk.startsWith("<")) return chunk;
      return chunk.replace(tokenRegex, (match) => {
        const token = String(match);
        const isMerge = token.startsWith("{{");
        const label = isMerge ? getMergeTokenLabel(token) : getSpintaxLabel(token);
        const type = isMerge ? "merge" : "spintax";
        return `<span data-email-token="${type}" data-token="${escapeHtml(token)}" data-label="${escapeHtml(label)}"></span>`;
      });
    })
    .join("");
}

function editorHtmlToEmailSyntax(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") return html;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  wrapper
    .querySelectorAll<HTMLElement>("[data-email-token][data-token]")
    .forEach((node) => {
      node.replaceWith(document.createTextNode(decodeHtml(node.dataset.token || "")));
    });
  return wrapper.innerHTML;
}

const MergeVariableNode = Node.create({
  name: "mergeVariable",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      token: {
        default: "{{field}}",
      },
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-email-token='merge']",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const token = element.getAttribute("data-token") || "{{field}}";
          return {
            token,
            label: element.getAttribute("data-label") || getMergeTokenLabel(token),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const token = String(HTMLAttributes.token || "{{field}}");
    const label = String(HTMLAttributes.label || getMergeTokenLabel(token));
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-email-token": "merge",
        "data-token": token,
        "data-label": label,
        class: "email-token-chip email-token-chip--merge",
        contenteditable: "false",
      }),
      label,
    ];
  },
});

const SpintaxNode = Node.create({
  name: "spintax",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      token: {
        default: "{Hi|Hello|Hey}",
      },
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-email-token='spintax']",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const token = element.getAttribute("data-token") || "{Hi|Hello|Hey}";
          return {
            token,
            label: element.getAttribute("data-label") || getSpintaxLabel(token),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const token = String(HTMLAttributes.token || "{Hi|Hello|Hey}");
    const label = String(HTMLAttributes.label || getSpintaxLabel(token));
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-email-token": "spintax",
        "data-token": token,
        "data-label": label,
        class: "email-token-chip email-token-chip--spintax",
        contenteditable: "false",
      }),
      label,
    ];
  },
});

export default function DesignEditor({
  htmlContent,
  onHtmlContentChange,
  onTokenClick,
}: DesignEditorProps) {
  const editor = useEditor({
    extensions: [
      MergeVariableNode,
      SpintaxNode,
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: emailSyntaxToEditorHtml(htmlContent),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onHtmlContentChange(editorHtmlToEmailSyntax(editor.getHTML()));
    },
  });

  // Listen for variable insert events from parent and inject into Tiptap at caret
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<
        string | { variable: string; replaceSelection?: boolean }
      >;
      const d = ce.detail;
      if (d == null || d === "") return;
      const replace =
        typeof d === "object" && Boolean((d as { replaceSelection?: boolean }).replaceSelection);
      const raw = typeof d === "string" ? d : (d as { variable: string }).variable;
      const token = normalizeMergeToken(raw);
      const content = {
        type: "mergeVariable",
        attrs: { token, label: getMergeTokenLabel(token) },
      };
      const chain = editor?.chain().focus();
      if (!chain) return;
      if (replace) {
        chain.deleteSelection().insertContent(content).run();
      } else {
        chain.insertContent(content).run();
      }
    };
    window.addEventListener("totalads:insert-variable", handler);
    return () =>
      window.removeEventListener("totalads:insert-variable", handler);
  }, [editor]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<
        string | { token: string; replaceSelection?: boolean }
      >;
      const d = ce.detail;
      if (d == null || d === "") return;
      const replace =
        typeof d === "object" && Boolean((d as { replaceSelection?: boolean }).replaceSelection);
      const raw = typeof d === "string" ? d.trim() : (d as { token: string }).token.trim();
      const token = raw.startsWith("{") ? raw : `{${raw}}`;
      const content = {
        type: "spintax",
        attrs: { token, label: getSpintaxLabel(token) },
      };
      const chain = editor?.chain().focus();
      if (!chain) return;
      if (replace) {
        chain.deleteSelection().insertContent(content).run();
      } else {
        chain.insertContent(content).run();
      }
    };
    window.addEventListener("totalads:insert-spintax", handler);
    return () =>
      window.removeEventListener("totalads:insert-spintax", handler);
  }, [editor]);

  // Keep TipTap in sync when htmlContent changes from the parent (e.g. AI generation).
  // useEditor only uses `content` on first mount; without this, external updates never appear.
  useEffect(() => {
    if (!editor) return;
    const next = htmlContent || "";
    const current = editorHtmlToEmailSyntax(editor.getHTML());
    if (next === current) return;
    editor.commands.setContent(emailSyntaxToEditorHtml(next), { emitUpdate: false });
  }, [editor, htmlContent]);

  if (!editor) {
    return <div className="text-text-200">Loading editor...</div>;
  }

  const addLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  const handleTokenClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const tokenElement = target?.closest<HTMLElement>(
      "[data-email-token][data-token]"
    );
    if (!tokenElement) return;

    const type = tokenElement.dataset.emailToken;
    const token = tokenElement.dataset.token;
    if ((type !== "merge" && type !== "spintax") || !token) return;

    event.preventDefault();
    event.stopPropagation();

    const allMatchingTokens = Array.from(
      tokenElement
        .closest(".ProseMirror")
        ?.querySelectorAll<HTMLElement>("[data-email-token][data-token]") || []
    ).filter(
      (node) =>
        node.dataset.emailToken === type && node.dataset.token === token
    );
    const occurrenceIndex = Math.max(
      allMatchingTokens.findIndex((node) => node === tokenElement),
      0
    );
    onTokenClick?.(type, token, occurrenceIndex);
  };

  return (
    <div className="p-3">
      {/* Compact Gmail-style Toolbar */}
      <div className="flex items-center gap-1 pb-2 border-b border-gray-200 mb-2 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("bold")
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("italic")
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("underline")
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Underline"
          >
            <UnderlineIcon size={14} />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-0.5" />

          {/* Headings */}
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-1.5 rounded transition ${
              editor.isActive("heading", { level: 1 })
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Heading 1"
          >
            <Heading1 size={14} />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-1.5 rounded transition ${
              editor.isActive("heading", { level: 2 })
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Heading 2"
          >
            <Heading2 size={14} />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`p-1.5 rounded transition ${
              editor.isActive("heading", { level: 3 })
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Heading 3"
          >
            <Heading3 size={14} />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-0.5" />

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1.5 rounded transition ${
              editor.isActive({ textAlign: "left" })
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1.5 rounded transition ${
              editor.isActive({ textAlign: "center" })
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1.5 rounded transition ${
              editor.isActive({ textAlign: "right" })
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-0.5" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("bulletList")
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Bullet List"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("orderedList")
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Ordered List"
          >
            <ListOrdered size={14} />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-0.5" />

          {/* Media */}
          <button
            onClick={addLink}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition"
            title="Add Link"
          >
            <LinkIcon size={14} />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-0.5" />

          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition"
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition"
            title="Redo"
          >
            <Redo2 size={14} />
          </button>
        </div>

      {/* Editor - Gmail style */}
      <div
        className="min-h-[350px] rounded-xl border border-slate-200 bg-white p-3 shadow-inner"
        onClick={handleTokenClick}
      >
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <Braces className="h-3.5 w-3.5 text-blue-500" />
          Personalization and spintax render as chips while saved syntax stays campaign-ready.
        </div>
        <EditorContent
          editor={editor}
          className="prose max-w-none text-gray-900"
        />
      </div>
    </div>
  );
}
