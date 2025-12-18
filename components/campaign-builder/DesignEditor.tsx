"use client";

import "./DesignEditor.css";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
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
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface DesignEditorProps {
  htmlContent: string;
  onHtmlContentChange: (content: string) => void;
}

export default function DesignEditor({
  htmlContent,
  onHtmlContentChange,
}: DesignEditorProps) {
  const editor = useEditor({
    extensions: [
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
    content: htmlContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onHtmlContentChange(editor.getHTML());
    },
  });

  // Listen for variable insert events from parent and inject into Tiptap at caret
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (!ce?.detail) return;
      editor?.chain().focus().insertContent(ce.detail).run();
    };
    window.addEventListener("totalads:insert-variable", handler);
    return () =>
      window.removeEventListener("totalads:insert-variable", handler);
  }, [editor]);

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

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="bg-brand-main/5 border border-brand-main/10 rounded-lg p-3 space-y-2">
        {/* Row 1: Text Formatting */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded transition ${
              editor.isActive("bold")
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded transition ${
              editor.isActive("italic")
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded transition ${
              editor.isActive("underline")
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </button>

          <div className="w-px bg-brand-main/10" />

          {/* Headings */}
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-2 rounded transition ${
              editor.isActive("heading", { level: 1 })
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-2 rounded transition ${
              editor.isActive("heading", { level: 2 })
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`p-2 rounded transition ${
              editor.isActive("heading", { level: 2 })
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </button>

          <div className="w-px bg-brand-main/10" />

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-2 rounded transition ${
              editor.isActive({ textAlign: "left" })
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-2 rounded transition ${
              editor.isActive({ textAlign: "center" })
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-2 rounded transition ${
              editor.isActive({ textAlign: "right" })
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>

          <div className="w-px bg-brand-main/10" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded transition ${
              editor.isActive("bulletList")
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded transition ${
              editor.isActive("orderedList")
                ? "bg-brand-main text-brand-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </button>

          <div className="w-px bg-brand-main/10" />

          {/* Media */}
          <button
            onClick={addLink}
            className="p-2 rounded bg-brand-main/10 text-text-200 hover:bg-brand-main/20 transition"
            title="Add Link"
          >
            <LinkIcon size={16} />
          </button>

          <div className="w-px bg-brand-main/10" />

          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="p-2 rounded bg-brand-main/10 text-text-200 hover:bg-brand-main/20 transition"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="p-2 rounded bg-brand-main/10 text-text-200 hover:bg-brand-main/20 transition"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-brand-main/5 border border-brand-main/10 rounded-lg p-4 min-h-96 max-h-96 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose prose-invert max-w-none"
        />
      </div>
    </div>
  );
}
