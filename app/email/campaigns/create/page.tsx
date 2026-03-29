"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import emailClient from "@/utils/api/emailClient";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [domainId, setDomainId] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    fromName: "",
    fromEmail: "",
    htmlContent: "",
    textContent: "",
    description: "",
    tags: "",
  });

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

    if (
      !formData.name ||
      !formData.subject ||
      !formData.fromEmail ||
      !formData.htmlContent
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const tags = formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        sequence: [
          {
            subject: formData.subject,
            body: formData.htmlContent,
            delayMinutes: 0,
          },
        ],
        tags,
      };

      const response = await emailClient.post(
        `/api/domains/${domainId}/campaigns`,
        payload
      );
      if (response.data.success) {
        toast.success("Campaign created successfully");
        router.push("/campaigns");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-text-100 mb-8">Create Campaign</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
            <label className="block text-text-100 font-semibold mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Q4 Product Launch"
              className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Email Subject */}
          <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
            <label className="block text-text-100 font-semibold mb-2">
              Email Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g., Introducing Our New Product"
              className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* From Name & Email */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
              <label className="block text-text-100 font-semibold mb-2">
                From Name *
              </label>
              <input
                type="text"
                name="fromName"
                value={formData.fromName}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
              <label className="block text-text-100 font-semibold mb-2">
                From Email *
              </label>
              <input
                type="email"
                name="fromEmail"
                value={formData.fromEmail}
                onChange={handleChange}
                placeholder="e.g., noreply@example.com"
                className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* HTML Content */}
          <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
            <label className="block text-text-100 font-semibold mb-2">
              Email Content (HTML) *
            </label>
            <textarea
              name="htmlContent"
              value={formData.htmlContent}
              onChange={handleChange}
              placeholder="Enter HTML content. Use {{firstName}}, {{lastName}}, {{email}}, {{company}}, {{jobTitle}} for personalization"
              rows={10}
              className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-purple-500 font-mono text-sm"
            />
          </div>

          {/* Text Content */}
          <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
            <label className="block text-text-100 font-semibold mb-2">
              Email Content (Text)
            </label>
            <textarea
              name="textContent"
              value={formData.textContent}
              onChange={handleChange}
              placeholder="Plain text version of email"
              rows={6}
              className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
            <label className="block text-text-100 font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Campaign description"
              rows={3}
              className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Tags */}
          <div className="bg-brand-main/10 backdrop-blur-xl rounded-lg border border-brand-main/20 p-6">
            <label className="block text-text-100 font-semibold mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., product, launch, q4"
              className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-text-100 font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Creating..." : "Create Campaign"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-brand-main/10 hover:bg-brand-main/20 text-text-100 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
