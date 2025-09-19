"use client";

import { useState } from "react";
import { IconTemplate, IconStar, IconUsers, IconTarget } from "@tabler/icons-react";
import { getPopularTemplates, ICP_CATEGORIES, getTemplatesByCategory } from "@/utils/icpTemplates";

export default function ICPTemplatePreview() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const popularTemplates = getPopularTemplates(3);
  const categoryTemplates = getTemplatesByCategory(selectedCategory);

  return (
    <div className="space-y-8">
      {/* Popular Templates Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <IconStar className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Popular Templates</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {popularTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{template.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {template.fields.length} fields
                    </span>
                    <div className="flex items-center gap-1">
                      <IconUsers className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{template.popularity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {ICP_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
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

        {/* Category Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryTemplates.slice(0, 6).map((template) => (
            <div
              key={template.id}
              className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">{template.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
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
                    {template.fields.length} fields • {template.category}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Features */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
            <IconTemplate className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Why Use ICP Templates?</h3>
            <p className="text-sm text-gray-600">Get started faster with proven frameworks</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <IconTarget className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Industry-Specific</h4>
              <p className="text-xs text-gray-600">Tailored for different business types</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconUsers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Proven Fields</h4>
              <p className="text-xs text-gray-600">Based on successful use cases</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <IconStar className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Quick Setup</h4>
              <p className="text-xs text-gray-600">Start scraping in seconds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
