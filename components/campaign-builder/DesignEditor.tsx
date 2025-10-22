"use client";

import "./DesignEditor.css";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
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
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
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
      Link.configure({
        openOnClick: false,
      }),
      Image,
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
    content: htmlContent || "<p>Start typing...</p>",
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
    return <div className="text-gray-400">Loading editor...</div>;
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

  const addImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
        {/* Row 1: Text Formatting */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded transition ${
              editor.isActive("bold")
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded transition ${
              editor.isActive("italic")
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded transition ${
              editor.isActive("underline")
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </button>

          <div className="w-px bg-white/10" />

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-2 rounded transition ${
              editor.isActive({ textAlign: "left" })
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-2 rounded transition ${
              editor.isActive({ textAlign: "center" })
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-2 rounded transition ${
              editor.isActive({ textAlign: "right" })
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>

          <div className="w-px bg-white/10" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded transition ${
              editor.isActive("bulletList")
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded transition ${
              editor.isActive("orderedList")
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </button>

          <div className="w-px bg-white/10" />

          {/* Media */}
          <button
            onClick={addLink}
            className="p-2 rounded bg-white/10 text-gray-300 hover:bg-white/20 transition"
            title="Add Link"
          >
            <LinkIcon size={16} />
          </button>
          <button
            onClick={addImage}
            className="p-2 rounded bg-white/10 text-gray-300 hover:bg-white/20 transition"
            title="Add Image"
          >
            <ImageIcon size={16} />
          </button>

          <div className="w-px bg-white/10" />

          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="p-2 rounded bg-white/10 text-gray-300 hover:bg-white/20 transition"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="p-2 rounded bg-white/10 text-gray-300 hover:bg-white/20 transition"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 min-h-96 max-h-96 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose prose-invert max-w-none"
        />
      </div>
    </div>
  );
}
