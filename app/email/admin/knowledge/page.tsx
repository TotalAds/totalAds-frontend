"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import {
  AIKnowledgeEntry,
  AIKnowledgeType,
  createAIKnowledgeEntry,
  deleteAIKnowledgeEntry,
  listAIKnowledgeEntries,
  updateAIKnowledgeEntry,
} from "@/utils/api/emailClient";

const TYPES: { value: AIKnowledgeType; label: string }[] = [
  { value: "framework", label: "Framework" },
  { value: "email", label: "Winning email" },
  { value: "guideline", label: "Guideline" },
  { value: "sequence", label: "Sequence" },
];

function parseTags(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export default function AIKnowledgeBasePage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AIKnowledgeEntry[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | AIKnowledgeType>("");
  const [forbidden, setForbidden] = useState(false);

  const [editing, setEditing] = useState<AIKnowledgeEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<AIKnowledgeType>("framework");
  const [formTags, setFormTags] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      setForbidden(false);
      const data = await listAIKnowledgeEntries({
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        limit: 200,
      });
      setItems(data);
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setForbidden(true);
        setItems([]);
      } else {
        toast.error(e?.response?.data?.message || "Failed to load knowledge");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state.isLoading) return;
    if (!state.isAuthenticated) {
      router.push("/login");
      return;
    }
    if (state.user && state.user.userType !== "admin") {
      router.replace("/email/dashboard");
      return;
    }
    if (state.user?.userType === "admin") {
      fetchList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isLoading, state.isAuthenticated, state.user?.userType, router]);

  const openCreate = () => {
    setEditing(null);
    setFormTitle("");
    setFormType("framework");
    setFormTags("");
    setFormContent("");
    setFormOpen(true);
  };

  const openEdit = (row: AIKnowledgeEntry) => {
    setEditing(row);
    setFormTitle(row.title);
    setFormType(row.type);
    setFormTags(row.tags?.join(", ") || "");
    setFormContent(row.content);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      setSaving(true);
      const tags = parseTags(formTags);
      if (editing) {
        await updateAIKnowledgeEntry(editing.id, {
          title: formTitle.trim(),
          type: formType,
          content: formContent.trim(),
          tags,
        });
        toast.success("Updated");
      } else {
        await createAIKnowledgeEntry({
          title: formTitle.trim(),
          type: formType,
          content: formContent.trim(),
          tags,
        });
        toast.success("Created");
      }
      setFormOpen(false);
      await fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AIKnowledgeEntry) => {
    if (!confirm(`Delete "${row.title}"?`)) return;
    try {
      await deleteAIKnowledgeEntry(row.id);
      toast.success("Deleted");
      await fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center text-text-200">
        Loading…
      </div>
    );
  }

  if (
    state.isAuthenticated &&
    state.user &&
    state.user.userType !== "admin"
  ) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center text-text-200 text-sm">
        Redirecting…
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-bg-100 p-6 max-w-3xl mx-auto">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-text-100">
          <h1 className="text-xl font-semibold mb-2">Admin only</h1>
          <p className="text-sm text-text-200 mb-4">
            AI Knowledge Base is restricted to administrator accounts.
          </p>
          <Link
            href="/email/dashboard"
            className="text-brand-main hover:underline text-sm font-medium"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-100">AI Knowledge Base</h1>
          <p className="text-sm text-text-200 mt-1 max-w-2xl">
            Store frameworks (AIDA, PAS), winning cold emails, spam/tone rules, and
            follow-up strategies. Retrieval uses token overlap (no embeddings) and
            augments campaign generation automatically.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-200"
                size={16}
              />
              <input
                type="search"
                placeholder="Search title, content, tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchList()}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-brand-main/20 bg-brand-main/5 text-text-100"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "" | AIKnowledgeType)
              }
              className="px-3 py-2 text-sm rounded-lg border border-brand-main/20 bg-brand-main/5 text-text-100 max-w-[200px]"
            >
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => fetchList()} disabled={loading}>
              Apply
            </Button>
          </div>
          <Button onClick={openCreate} className="bg-brand-main text-white">
            <Plus size={16} className="mr-1.5" />
            Add entry
          </Button>
        </div>

        <div className="rounded-xl border border-brand-main/20 bg-brand-main/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-200 text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-text-200 text-sm">
              No entries yet. Add frameworks and example emails to improve AI output.
            </div>
          ) : (
            <div className="divide-y divide-brand-main/15">
              {items.map((row) => (
                <div
                  key={row.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-start gap-3 hover:bg-brand-main/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase text-brand-main">
                        {row.type}
                      </span>
                      <h2 className="text-sm font-semibold text-text-100 truncate">
                        {row.title}
                      </h2>
                    </div>
                    {row.tags?.length ? (
                      <p className="text-xs text-text-200 mb-2">
                        {row.tags.join(" · ")}
                      </p>
                    ) : null}
                    <p className="text-xs text-text-200 line-clamp-3 whitespace-pre-wrap">
                      {row.content}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(row)}
                      className="border-brand-main/30"
                    >
                      <Pencil size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(row)}
                      className="border-error/40 text-error hover:bg-error/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-bg-200 border border-brand-main/20 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-brand-main/10">
              <h2 className="text-lg font-semibold text-text-100">
                {editing ? "Edit entry" : "New entry"}
              </h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-200 mb-1">
                  Title *
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-brand-main/20 bg-brand-main/5 text-text-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-200 mb-1">
                  Type *
                </label>
                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as AIKnowledgeType)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-brand-main/20 bg-brand-main/5 text-text-100"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-200 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="saas, cold-email, b2b"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-brand-main/20 bg-brand-main/5 text-text-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-200 mb-1">
                  Content * (structured patterns work best)
                </label>
                <textarea
                  rows={12}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={`[Framework: PAS]\nProblem: …\nAgitation: …\nSolution: …\n\nExample:\n"…"`}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-brand-main/20 bg-brand-main/5 text-text-100 font-mono"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-brand-main/10 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-main text-white"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
