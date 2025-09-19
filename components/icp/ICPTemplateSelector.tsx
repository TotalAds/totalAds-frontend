"use client";

import { useState } from "react";

import {
  getPopularTemplates,
  getTemplatesByCategory,
  ICP_CATEGORIES,
  ICP_TEMPLATES,
  ICPTemplate,
  searchTemplates,
} from "@/utils/icpTemplates";
import {
  IconCheck,
  IconFilter,
  IconSearch,
  IconStar,
  IconTemplate,
  IconX,
} from "@tabler/icons-react";

interface ICPTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ICPTemplate) => void;
}

export default function ICPTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
}: ICPTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPopular, setShowPopular] = useState(true);

  if (!isOpen) return null;

  const getFilteredTemplates = () => {
    if (searchQuery.trim()) {
      return searchTemplates(searchQuery);
    }
    if (showPopular && selectedCategory === "All") {
      return getPopularTemplates(8);
    }
    return getTemplatesByCategory(selectedCategory);
  };

  const filteredTemplates = getFilteredTemplates();

  const handleTemplateSelect = (template: ICPTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <IconTemplate className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  ICP Templates
                </h2>
                <p className="text-gray-600">
                  Choose a template to get started quickly
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
            >
              <IconX className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <IconFilter className="w-4 h-4 text-gray-500" />
            {ICP_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setShowPopular(category === "All");
                  setSearchQuery("");
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Popular Toggle */}
          {selectedCategory === "All" && !searchQuery && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPopular(!showPopular)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showPopular
                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <IconStar className="w-4 h-4" />
                Popular Templates
              </button>
            </div>
          )}
        </div>

        {/* Templates Grid */}
        <div className="p-6  flex-1 glass-scrollbar">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconTemplate className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No templates found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-4 border border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                          {template.name}
                        </h3>
                        {template.popularity >= 80 && (
                          <IconStar className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {template.fields.length} fields
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredTemplates.length} template
              {filteredTemplates.length !== 1 ? "s" : ""} available
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
