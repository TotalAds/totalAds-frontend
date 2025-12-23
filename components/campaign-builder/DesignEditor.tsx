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
      <div className="min-h-[350px] p-3">
        <EditorContent
          editor={editor}
          className="prose max-w-none text-gray-900"
        />
      </div>
    </div>
  );
}
