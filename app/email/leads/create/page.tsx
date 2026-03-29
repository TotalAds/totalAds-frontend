"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import CreatableSelect from "@/components/common/CreatableSelect";
import emailClient, {
  createLeadCategory,
  createLeadTag,
  createList,
  EmailList,
  getLeadCategories,
  getLeadTags,
  getLists,
  LeadCategory,
  LeadTag,
} from "@/utils/api/emailClient";
import { IconArrowLeft } from "@tabler/icons-react";

export default function CreateLeadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<LeadCategory[]>(
    []
  );
  const [selectedTags, setSelectedTags] = useState<LeadTag[]>([]);
  const [selectedLists, setSelectedLists] = useState<EmailList[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    company: "",
    role: "",
  });

  useEffect(() => {
    loadCategoriesTagsAndLists();
  }, []);

  const loadCategoriesTagsAndLists = async () => {
    setLoadingOptions(true);
    try {
      const [catsData, tagsData, listsData] = await Promise.all([
        getLeadCategories(),
        getLeadTags(),
        getLists(1, 100),
      ]);
      setCategories(catsData);
      setTags(tagsData);
      setLists(listsData.data.lists || []);
    } catch (error) {
      console.error("Failed to load categories, tags, and lists:", error);
      toast.error("Failed to load options");
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error("Email is required");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        ...formData,
        categories: selectedCategories.map((c) => c.id),
        tags: selectedTags.map((t) => t.id),
        listIds: selectedLists.map((l) => l.id),
      };
      await emailClient.post("/api/leads", payload);

      toast.success("Lead created successfully");
      router.push("/email/leads");
    } catch (error: any) {
      console.error("Failed to create lead:", error);
      if (error?.status === 409) {
        toast.error("Lead with this email already exists");
        return;
      }
      toast.error(error.response?.data?.message || "Failed to create lead");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-brand-main/10 rounded-lg transition-colors"
          >
            <IconArrowLeft size={24} className="text-text-100" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-text-100">Create Lead</h1>
            <p className="text-text-200">Add a new lead to your email list</p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-brand-main/10 backdrop-blur-md border border-brand-main/20 rounded-xl p-8 space-y-6"
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-text-100 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              className="w-full px-4 py-3 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-100 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-semibold text-text-100 mb-2">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Acme Inc"
              className="w-full px-4 py-3 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-text-100 mb-2">
              Role
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="CEO"
              className="w-full px-4 py-3 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Categories */}
          <div>
            <CreatableSelect
              options={categories}
              value={selectedCategories}
              onChange={setSelectedCategories}
              onCreateNew={async (name: string) => {
                try {
                  const newCategory = await createLeadCategory(name);
                  // Refresh all categories to get the latest data
                  await loadCategoriesTagsAndLists();
                  toast.success(`Category "${name}" created`);
                  return newCategory;
                } catch (error: any) {
                  toast.error(
                    error.response?.data?.message || "Failed to create category"
                  );
                  throw error;
                }
              }}
              placeholder="Select or create categories..."
              label="Categories"
              isMulti={true}
              isLoading={loadingOptions}
            />
          </div>

          {/* Tags */}
          <div>
            <CreatableSelect
              options={tags}
              value={selectedTags}
              onChange={setSelectedTags}
              onCreateNew={async (name: string) => {
                try {
                  const newTag = await createLeadTag(name);
                  // Refresh all tags to get the latest data
                  await loadCategoriesTagsAndLists();
                  toast.success(`Tag "${name}" created`);
                  return newTag;
                } catch (error: any) {
                  toast.error(
                    error.response?.data?.message || "Failed to create tag"
                  );
                  throw error;
                }
              }}
              placeholder="Select or create tags..."
              label="Tags"
              isMulti={true}
              isLoading={loadingOptions}
            />
          </div>

          {/* Lists */}
          <div className="bg-brand-main/5 border border-brand-main/10 rounded-lg p-4">
            <div className="mb-3">
              <CreatableSelect
                options={lists}
                value={selectedLists}
                onChange={(selected) =>
                  setSelectedLists(selected as EmailList[])
                }
                onCreateNew={async (name: string) => {
                  try {
                    const newList = await createList({ name });
                    // Refresh all lists to get the latest data
                    await loadCategoriesTagsAndLists();
                    toast.success(`List "${name}" created successfully`);
                    return newList;
                  } catch (error: any) {
                    toast.error(
                      error.response?.data?.message || "Failed to create list"
                    );
                    throw error;
                  }
                }}
                placeholder="Select or create lists..."
                label="Lists (Optional)"
                isMulti={true}
                isLoading={loadingOptions}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-100">
                Why use lists?
              </p>
              <ul className="text-xs text-text-200/70 space-y-1 list-disc list-inside">
                <li>
                  Organize contacts into groups (e.g., "VIP Customers",
                  "Newsletter Subscribers")
                </li>
                <li>Quickly select entire lists when creating campaigns</li>
                <li>Better segmentation for targeted email marketing</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-brand-main/10 hover:bg-brand-main/20 text-text-100 font-semibold rounded-xl transition-all duration-200 border border-brand-main/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-brand-main hover:bg-brand-main/80 text-text-100 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
