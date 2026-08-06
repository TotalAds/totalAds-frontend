"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconCategory,
  IconCheck,
  IconFolderPlus,
  IconPencil,
  IconPlus,
  IconTag,
  IconX,
} from "@tabler/icons-react";

import { LeadRow } from "@/components/leads/LeadsTable";
import { BodyPortal } from "@/components/ui/BodyPortal";
import emailClient, { getEmailServiceErrorMessage } from "@/utils/api/emailClient";

interface OptionItem {
  id: string;
  name: string;
  color?: string;
}

interface SingleLeadOrganizeModalProps {
  isOpen: boolean;
  lead: LeadRow | null;
  onClose: () => void;
  availableCategories: OptionItem[];
  availableTags: OptionItem[];
  availableLists: OptionItem[];
  onSuccess: () => void;
}

export function SingleLeadOrganizeModal({
  isOpen,
  lead,
  onClose,
  availableCategories,
  availableTags,
  availableLists,
  onSuccess,
}: SingleLeadOrganizeModalProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);

  // Inline creation states
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [showListInput, setShowListInput] = useState(false);

  // Local option lists (to support inline dynamically created items)
  const [categoriesList, setCategoriesList] = useState<OptionItem[]>([]);
  const [tagsList, setTagsList] = useState<OptionItem[]>([]);
  const [listsList, setListsList] = useState<OptionItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !lead) return;

    setSelectedCategoryIds(lead.categories?.map((c) => c.id) || []);
    setSelectedTagIds(lead.tags?.map((t) => t.id) || []);
    setSelectedListIds(lead.lists?.map((l) => l.id) || []);

    setCategoriesList(availableCategories);
    setTagsList(availableTags);
    setListsList(availableLists);

    setShowCategoryInput(false);
    setShowTagInput(false);
    setShowListInput(false);
    setNewCategoryName("");
    setNewTagName("");
    setNewListName("");
  }, [isOpen, lead, availableCategories, availableTags, availableLists]);

  if (!isOpen || !lead) return null;

  const toggleSelection = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    id: string
  ) => {
    setList((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setIsCreatingCategory(true);
      const res = await emailClient.post<{ data: { id: string; name: string } }>(
        "/api/lead-categories",
        { name: newCategoryName.trim() }
      );
      if (res.data?.data) {
        const created = {
          id: res.data.data.id,
          name: res.data.data.name,
          color: "#9333ea",
        };
        setCategoriesList((prev) => [...prev, created]);
        setSelectedCategoryIds((prev) => [...prev, created.id]);
        setNewCategoryName("");
        setShowCategoryInput(false);
        toast.success(`Category "${created.name}" created`);
      }
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to create category"));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      setIsCreatingTag(true);
      const res = await emailClient.post<{ data: { id: string; name: string } }>(
        "/api/lead-tags",
        { name: newTagName.trim() }
      );
      if (res.data?.data) {
        const created = {
          id: res.data.data.id,
          name: res.data.data.name,
          color: "#3b82f6",
        };
        setTagsList((prev) => [...prev, created]);
        setSelectedTagIds((prev) => [...prev, created.id]);
        setNewTagName("");
        setShowTagInput(false);
        toast.success(`Tag "${created.name}" created`);
      }
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to create tag"));
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      setIsCreatingList(true);
      const res = await emailClient.post<{ data: { id: string; name: string } }>(
        "/api/lists",
        { name: newListName.trim() }
      );
      if (res.data?.data) {
        const created = {
          id: res.data.data.id,
          name: res.data.data.name,
        };
        setListsList((prev) => [...prev, created]);
        setSelectedListIds((prev) => [...prev, created.id]);
        setNewListName("");
        setShowListInput(false);
        toast.success(`List "${created.name}" created`);
      }
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to create list"));
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await emailClient.put(`/api/leads/${lead.id}`, {
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
        listIds: selectedListIds,
      });

      toast.success("Lead tags, categories & lists updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to update lead"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BodyPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
          {/* Modal Header */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <IconPencil size={20} className="text-brand-main" />
                Edit Categories, Tags & Lists
              </h3>
              <p className="mt-1 text-sm text-slate-500 truncate max-w-md" title={lead.email}>
                {lead.email} {lead.name ? `(${lead.name})` : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <IconX size={20} />
            </button>
          </div>

          <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
            {/* Categories Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                  <IconCategory size={18} />
                  Categories ({selectedCategoryIds.length} assigned)
                </label>
                {!showCategoryInput && (
                  <button
                    type="button"
                    onClick={() => setShowCategoryInput(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800"
                  >
                    <IconPlus size={14} /> New Category
                  </button>
                )}
              </div>

              {showCategoryInput && (
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreateCategory();
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateCategory()}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryInput(false);
                      setNewCategoryName("");
                    }}
                    className="rounded-lg bg-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {categoriesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No categories available</p>
                ) : (
                  categoriesList.map((cat) => {
                    const selected = selectedCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          toggleSelection(selectedCategoryIds, setSelectedCategoryIds, cat.id)
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          selected
                            ? "border-purple-300 bg-purple-100 text-purple-800 shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {selected && <IconCheck size={14} className="text-purple-600" />}
                        {cat.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <IconTag size={18} />
                  Tags ({selectedTagIds.length} assigned)
                </label>
                {!showTagInput && (
                  <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    <IconPlus size={14} /> New Tag
                  </button>
                )}
              </div>

              {showTagInput && (
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreateTag();
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateTag()}
                    disabled={isCreatingTag || !newTagName.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTagInput(false);
                      setNewTagName("");
                    }}
                    className="rounded-lg bg-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {tagsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tags available</p>
                ) : (
                  tagsList.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          toggleSelection(selectedTagIds, setSelectedTagIds, tag.id)
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          selected
                            ? "border-blue-300 bg-blue-100 text-blue-800 shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {selected && <IconCheck size={14} className="text-blue-600" />}
                        {tag.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Lists Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
                  <IconFolderPlus size={18} />
                  Lists ({selectedListIds.length} assigned)
                </label>
                {!showListInput && (
                  <button
                    type="button"
                    onClick={() => setShowListInput(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-800"
                  >
                    <IconPlus size={14} /> New List
                  </button>
                )}
              </div>

              {showListInput && (
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="List name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreateList();
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateList()}
                    disabled={isCreatingList || !newListName.trim()}
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowListInput(false);
                      setNewListName("");
                    }}
                    className="rounded-lg bg-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {listsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No lists available</p>
                ) : (
                  listsList.map((lst) => {
                    const selected = selectedListIds.includes(lst.id);
                    return (
                      <button
                        key={lst.id}
                        type="button"
                        onClick={() =>
                          toggleSelection(selectedListIds, setSelectedListIds, lst.id)
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          selected
                            ? "border-cyan-300 bg-cyan-100 text-cyan-800 shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {selected && <IconCheck size={14} className="text-cyan-600" />}
                        {lst.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSave()}
              className="rounded-xl bg-brand-main px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-main/80 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
