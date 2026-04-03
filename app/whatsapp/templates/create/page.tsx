"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { createTemplate } from "@/utils/api/whatsappClient";
import {
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTON";
  content?: string;
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  buttons?: Array<{
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "content" | "preview">("details");
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState<"MARKETING" | "UTILITY" | "AUTH">("UTILITY");
  const [language, setLanguage] = useState("en");
  const [header, setHeader] = useState<TemplateComponent | null>(null);
  const [body, setBody] = useState<TemplateComponent | null>(null);
  const [footer, setFooter] = useState<TemplateComponent | null>(null);
  const [buttons, setButtons] = useState<TemplateComponent["buttons"]>([]);

  const handleAddHeader = () => {
    setHeader({
      type: "HEADER",
      format: "TEXT",
      content: "",
    });
  };

  const handleAddBody = () => {
    setBody({
      type: "BODY",
      content: "",
    });
  };

  const handleAddFooter = () => {
    setFooter({
      type: "FOOTER",
      content: "",
    });
  };

  const handleAddButton = () => {
    if (buttons && buttons.length >= 3) {
      toast.error("Maximum 3 buttons allowed");
      return;
    }
    setButtons([
      ...(buttons || []),
      { type: "QUICK_REPLY", text: "" },
    ]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons && buttons.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!body || !body.content?.trim()) {
      toast.error("Body content is required");
      return;
    }

    // Check variable format {{1}}, {{2}}, etc.
    const bodyText = body.content;
    const variables = bodyText.match(/\{\{\d+\}\}/g) || [];
    const variableNumbers = variables.map((v) => parseInt(v.match(/\d+/)![0]));
    const maxVar = variableNumbers.length > 0 ? Math.max(...variableNumbers) : 0;
    
    // Ensure variables are sequential starting from 1
    for (let i = 1; i <= maxVar; i++) {
      if (!variableNumbers.includes(i)) {
        toast.error(`Variable {{${i}}} is missing. Variables must be sequential starting from {{1}}`);
        return;
      }
    }

    try {
      setLoading(true);

      // Build components array for Meta API
      const components: any[] = [];

      // Add header if present
      if (header && header.content) {
        components.push({
          type: "HEADER",
          format: header.format || "TEXT",
          text: header.format === "TEXT" ? header.content : undefined,
        });
      }

      // Add body (required)
      components.push({
        type: "BODY",
        text: body.content,
      });

      // Add footer if present
      if (footer && footer.content) {
        components.push({
          type: "FOOTER",
          text: footer.content,
        });
      }

      // Add buttons if present
      if (buttons && buttons.length > 0) {
        components.push({
          type: "BUTTONS",
          buttons: buttons.map((btn) => ({
            type: btn.type,
            text: btn.text,
            url: btn.type === "URL" ? btn.url : undefined,
            phone_number: btn.type === "PHONE_NUMBER" ? btn.phoneNumber : undefined,
          })),
        });
      }

      // Create template via Meta API
      const result = await createTemplate({
        name: templateName.trim().toLowerCase().replace(/\s+/g, "_"),
        category: category === "AUTH" ? "AUTHENTICATION" : category,
        language,
        components,
      });

      toast.success(
        result.message ||
          "Template created successfully! It will be reviewed by Meta (usually 24-48 hours)."
      );
      router.push("/whatsapp/templates");
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create template. Please check your Meta API permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    return (
      <div className="bg-[#e5ddd5] p-4 rounded-lg max-w-sm mx-auto">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          {header && header.content && (
            <div className="mb-2 font-semibold text-gray-800">
              {header.format === "TEXT" ? header.content : `[${header.format}]`}
            </div>
          )}
          {body && body.content && (
            <div className="mb-2 text-gray-800 whitespace-pre-wrap">
              {body.content}
            </div>
          )}
          {footer && footer.content && (
            <div className="text-xs text-gray-500 mt-2">{footer.content}</div>
          )}
          {buttons && buttons.length > 0 && (
            <div className="mt-4 space-y-2">
              {buttons.map((btn, idx) => (
                <button
                  key={idx}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded text-sm font-medium"
                >
                  {btn.text || `Button ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-100">
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-100">
                Create Message Template
              </h1>
              <p className="text-text-200 text-sm mt-1">
                Design your WhatsApp message template following Meta's guidelines
              </p>
            </div>
            <Button
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <IconInfoCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-text-100">Important Guidelines</h3>
              <ul className="text-sm text-text-200 space-y-1 list-disc list-inside">
                <li>Templates must be approved by Meta before use</li>
                <li>Use variables like {"{{1}}"}, {"{{2}}"} for dynamic content</li>
                <li>Body text is required; header, footer, and buttons are optional</li>
                <li>Maximum 3 buttons allowed (Quick Reply, URL, or Phone Number)</li>
                <li>Template name must be unique and lowercase with underscores</li>
                <li>After creation, submit through Meta Business Manager for approval</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setStep("details")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              step === "details"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            1. Details
          </button>
          <button
            onClick={() => setStep("content")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              step === "content"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            2. Content
          </button>
          <button
            onClick={() => setStep("preview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              step === "preview"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            3. Preview
          </button>
        </div>

        {/* Step 1: Details */}
        {step === "details" && (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 space-y-6">
            <div>
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., order_confirmation, welcome_message"
                className="mt-1"
              />
              <p className="text-xs text-text-200 mt-1">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 bg-bg-200 border border-bg-300 rounded-lg text-text-100"
              >
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
                <option value="AUTH">Authentication</option>
              </select>
              <p className="text-xs text-text-200 mt-1">
                {category === "MARKETING" &&
                  "Marketing templates have higher costs and stricter approval"}
                {category === "UTILITY" &&
                  "For transactional messages like order updates, shipping notifications"}
                {category === "AUTH" &&
                  "For authentication codes and security messages"}
              </p>
            </div>

            <div>
              <Label htmlFor="language">Language *</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-bg-200 border border-bg-300 rounded-lg text-text-100"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep("content")}
                disabled={!templateName.trim()}
                className="bg-brand-main hover:bg-brand-main/80 text-white"
              >
                Next: Content
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Content */}
        {step === "content" && (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Header (Optional)</Label>
                {!header ? (
                  <Button
                    onClick={handleAddHeader}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                  >
                    <IconPlus className="w-4 h-4 mr-1" />
                    Add Header
                  </Button>
                ) : (
                  <Button
                    onClick={() => setHeader(null)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    <IconX className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              {header && (
                <div className="space-y-2">
                  <select
                    value={header.format}
                    onChange={(e) =>
                      setHeader({ ...header, format: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-bg-200 border border-bg-300 rounded-lg text-text-100"
                  >
                    <option value="TEXT">Text</option>
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                  {header.format === "TEXT" && (
                    <Input
                      value={header.content || ""}
                      onChange={(e) =>
                        setHeader({ ...header, content: e.target.value })
                      }
                      placeholder="Header text (max 60 characters)"
                      maxLength={60}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Body *</Label>
                {!body ? (
                  <Button
                    onClick={handleAddBody}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                  >
                    <IconPlus className="w-4 h-4 mr-1" />
                    Add Body
                  </Button>
                ) : (
                  <Button
                    onClick={() => setBody(null)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    <IconX className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              {body && (
                <div className="space-y-2">
                  <Textarea
                    value={body.content || ""}
                    onChange={(e) =>
                      setBody({ ...body, content: e.target.value })
                    }
                    placeholder="Message body text. Use {{1}}, {{2}}, etc. for variables"
                    rows={6}
                    className="font-mono"
                  />
                  <p className="text-xs text-text-200">
                    Variables must be sequential: {"{{1}}"}, {"{{2}}"}, {"{{3}}"}, etc.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Footer (Optional)</Label>
                {!footer ? (
                  <Button
                    onClick={handleAddFooter}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                  >
                    <IconPlus className="w-4 h-4 mr-1" />
                    Add Footer
                  </Button>
                ) : (
                  <Button
                    onClick={() => setFooter(null)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    <IconX className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              {footer && (
                <Input
                  value={footer.content || ""}
                  onChange={(e) =>
                    setFooter({ ...footer, content: e.target.value })
                  }
                  placeholder="Footer text (max 60 characters)"
                  maxLength={60}
                />
              )}
            </div>

            {/* Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Buttons (Optional, Max 3)</Label>
                <Button
                  onClick={handleAddButton}
                  disabled={buttons && buttons.length >= 3}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                >
                  <IconPlus className="w-4 h-4 mr-1" />
                  Add Button
                </Button>
              </div>
              {buttons && buttons.map((btn, idx) => (
                <div key={idx} className="mb-3 p-4 bg-bg-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-100">
                      Button {idx + 1}
                    </span>
                    <Button
                      onClick={() => handleRemoveButton(idx)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      <IconTrash className="w-3 h-3" />
                    </Button>
                  </div>
                  <select
                    value={btn.type}
                    onChange={(e) => {
                      const newButtons = [...buttons];
                      newButtons[idx] = {
                        ...btn,
                        type: e.target.value as any,
                      };
                      setButtons(newButtons);
                    }}
                    className="w-full px-3 py-2 bg-bg-300 border border-bg-300 rounded-lg text-text-100"
                  >
                    <option value="QUICK_REPLY">Quick Reply</option>
                    <option value="URL">URL</option>
                    <option value="PHONE_NUMBER">Phone Number</option>
                  </select>
                  <Input
                    value={btn.text}
                    onChange={(e) => {
                      const newButtons = [...buttons];
                      newButtons[idx] = { ...btn, text: e.target.value };
                      setButtons(newButtons);
                    }}
                    placeholder="Button text"
                  />
                  {btn.type === "URL" && (
                    <Input
                      value={btn.url || ""}
                      onChange={(e) => {
                        const newButtons = [...buttons];
                        newButtons[idx] = { ...btn, url: e.target.value };
                        setButtons(newButtons);
                      }}
                      placeholder="https://example.com"
                    />
                  )}
                  {btn.type === "PHONE_NUMBER" && (
                    <Input
                      value={btn.phoneNumber || ""}
                      onChange={(e) => {
                        const newButtons = [...buttons];
                        newButtons[idx] = { ...btn, phoneNumber: e.target.value };
                        setButtons(newButtons);
                      }}
                      placeholder="+1234567890"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => setStep("details")}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={!body || !body.content?.trim()}
                className="bg-brand-main hover:bg-brand-main/80 text-white"
              >
                Next: Preview
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-text-100 mb-4">Preview</h2>
              {renderPreview()}
            </div>

            <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <IconInfoCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-text-100 mb-2">
                    Template Submission
                  </h3>
                  <p className="text-sm text-text-200 mb-3">
                    When you click "Create Template", we'll submit it directly to Meta's API.
                    The template will be reviewed by Meta (usually takes 24-48 hours).
                    You can sync templates to check approval status.
                  </p>
                  <p className="text-xs text-text-200">
                    Note: If API permissions are not available, you may need to create templates
                    through Meta Business Manager and sync them here.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => setStep("content")}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-brand-main hover:bg-brand-main/80 text-white"
              >
                {loading ? "Saving..." : "Save Template Design"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

