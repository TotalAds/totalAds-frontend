"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { createContact } from "@/utils/api/whatsappClient";

export default function CreateContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    name: "",
    tags: "",
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phoneNumber) {
      toast.error("Phone number is required");
      return;
    }

    // Validate phone number format (E.164)
    if (!formData.phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      toast.error(
        "Invalid phone number format. Please use E.164 format (e.g., +1234567890)"
      );
      return;
    }

    try {
      setLoading(true);
      await createContact({
        phoneNumber: formData.phoneNumber,
        name: formData.name || undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : undefined,
        category: formData.category || undefined,
      });
      toast.success("Contact created successfully!");
      router.push("/whatsapp/contacts");
    } catch (error: any) {
      console.error("Error creating contact:", error);
      toast.error(
        error.response?.data?.message || "Failed to create contact"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/whatsapp/contacts")}
            className="text-brand-main hover:text-brand-secondary mb-4 text-sm"
          >
            ← Back to Contacts
          </button>
          <h1 className="text-3xl font-bold text-text-100">
            Add WhatsApp Contact
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Add a new contact to your WhatsApp list
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-200 mb-2">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="+1234567890 (E.164 format)"
                required
                className="w-full px-4 py-2 bg-bg-200 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
              />
              <p className="text-xs text-text-200 mt-1">
                Use E.164 format: +[country code][number]
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-200 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Contact name (optional)"
                className="w-full px-4 py-2 bg-bg-200 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-200 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="tag1, tag2, tag3 (comma-separated)"
                className="w-full px-4 py-2 bg-bg-200 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-200 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Category (optional)"
                className="w-full px-4 py-2 bg-bg-200 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={() => router.push("/whatsapp/contacts")}
                className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 px-6 py-2 rounded-lg transition"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
              >
                {loading ? "Creating..." : "Create Contact"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

