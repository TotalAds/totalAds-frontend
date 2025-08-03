"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CreateICPProfileRequest } from "@/utils/api";
import {
  IconAlertCircle,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { ICPField, ICPProfileFormProps } from "./types";

export default function ICPProfileForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  existingProfiles = [],
  formError = null,
}: ICPProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
  });

  const [fields, setFields] = useState<ICPField[]>(
    initialData?.fields || [{ name: "", description: "" }]
  );

  const [errors, setErrors] = useState<{
    name?: string;
    fields?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { name?: string; fields?: string } = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Profile name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    } else {
      // Check for duplicate names
      const existingNames = existingProfiles.map((profile) => profile.name);
      if (
        existingNames.includes(formData.name) &&
        formData.name !== initialData?.name
      ) {
        newErrors.name = "A profile with this name already exists";
      }
    }

    // Validate fields
    const validFields = fields.filter(
      (field) => field.name.trim() && field.description.trim()
    );
    if (validFields.length === 0) {
      newErrors.fields =
        "At least one field with name and description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Filter out empty fields
    const validFields = fields.filter(
      (field) => field.name.trim() && field.description.trim()
    );

    const submitData: CreateICPProfileRequest = {
      name: formData.name,
      description: formData.description,
      fields: validFields,
    };

    await onSubmit(submitData);
  };

  const addField = () => {
    setFields([...fields, { name: "", description: "" }]);
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, key: keyof ICPField, value: string) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setFields(updatedFields);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <IconPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {initialData ? "Edit ICP Profile" : "Create ICP Profile"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Define what data you want to extract from companies
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg h-10 w-10 p-0"
          >
            <IconX className="w-5 h-5" />
          </Button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Error Display */}
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <IconAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-semibold text-sm">Error</h4>
                  <p className="text-red-700 text-sm mt-1">{formError}</p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label
                  htmlFor="name"
                  className="text-gray-900 font-bold text-base flex items-center space-x-2"
                >
                  <span>Profile Name</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={cn(
                    "bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg h-14 px-4 text-base",
                    errors.name && "border-red-400 bg-red-50"
                  )}
                  placeholder="e.g., SaaS Startups 50-200 employees"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label
                  htmlFor="description"
                  className="text-gray-900 font-bold text-base"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 text-base resize-none"
                  placeholder="Describe your ideal customer profile..."
                />
              </div>
            </div>

            {/* Data Fields */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Data Fields
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Define what information you want to extract from companies
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addField}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 flex items-center space-x-2"
                >
                  <IconPlus className="w-4 h-4" />
                  <span>Add Field</span>
                </Button>
              </div>

              {errors.fields && (
                <p className="text-red-500 text-sm">{errors.fields}</p>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        Field {index + 1}
                      </h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <IconTrash className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold text-sm">
                          Field Name
                        </Label>
                        <Input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            updateField(index, "name", e.target.value)
                          }
                          className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg h-12"
                          placeholder="e.g., Company Size, Industry, Revenue"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold text-sm">
                          Description
                        </Label>
                        <Input
                          type="text"
                          value={field.description}
                          onChange={(e) =>
                            updateField(index, "description", e.target.value)
                          }
                          className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg h-12"
                          placeholder="What to look for in this field"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
            >
              {isLoading
                ? "Creating..."
                : initialData
                ? "Update Profile"
                : "Create Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
