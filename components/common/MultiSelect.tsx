"use client";

import { useEffect, useRef, useState } from "react";

import { IconChevronDown, IconSearch, IconX } from "@tabler/icons-react";

import styles from "./MultiSelect.module.css";

export interface MultiSelectOption {
  id: string;
  name: string;
  color?: string;
  count?: number;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  theme?: "dark" | "light"; // "dark" for brand colors, "light" for white/purple
}

export default function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = "Select options...",
  label,
  disabled = false,
  searchable = true,
  theme = "dark",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme-specific classes
  const isDark = theme === "dark";
  const inputBg = isDark ? "bg-brand-main/10" : "bg-white/5";
  const inputBorder = isDark ? "border-brand-main/20" : "border-white/15";
  const inputText = isDark ? "text-text-100" : "text-white";
  const inputPlaceholder = isDark
    ? "placeholder-text-200"
    : "placeholder-gray-500";
  const dropdownBg = isDark ? "bg-bg-200" : "bg-white/10";
  const dropdownBorder = isDark ? "border-brand-main/20" : "border-white/15";
  const hoverBg = isDark ? "hover:bg-brand-main/10" : "hover:bg-white/5";
  const chipBg = isDark ? "bg-brand-main/20" : "bg-purple-500/30";
  const chipText = isDark ? "text-text-100" : "text-white";
  const focusRing = isDark ? "focus:ring-brand-main" : "focus:ring-purple-500";
  const checkboxClass = isDark
    ? "w-4 h-4 rounded border-brand-main/30 text-brand-main focus:ring-brand-main"
    : "w-4 h-4 rounded border-purple-400 text-purple-500 focus:ring-purple-500";

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggleOption = (optionId: string) => {
    const newSelected = selectedIds.includes(optionId)
      ? selectedIds.filter((id) => id !== optionId)
      : [...selectedIds, optionId];
    onChange(newSelected);
  };

  const handleRemoveChip = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleToggleOption(optionId);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className={`${styles.container}`}>
      {label && (
        <label className="block text-sm font-medium text-text-200 mb-2">
          {label}
        </label>
      )}

      {/* Main Input */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg ${inputText} focus:outline-none focus:ring-2 ${focusRing} text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
      >
        <div className="flex flex-wrap gap-2 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <div
                key={opt.id}
                className={`flex items-center gap-1 px-2 py-1 ${chipBg} rounded text-xs ${chipText}`}
              >
                <span>{opt.name}</span>
                <button
                  onClick={(e) => handleRemoveChip(opt.id, e)}
                  className={
                    isDark ? "hover:text-text-200" : "hover:text-gray-200"
                  }
                >
                  <IconX size={14} />
                </button>
              </div>
            ))
          ) : (
            <span className={isDark ? "text-text-200" : "text-gray-400"}>
              {placeholder}
            </span>
          )}
        </div>
        <IconChevronDown
          size={18}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`${styles.dropdown} ${dropdownBg} border ${dropdownBorder} rounded-lg shadow-2xl`}
        >
          {searchable && (
            <div
              className={`p-2 border-b ${
                isDark ? "border-brand-main/10" : "border-white/10"
              }`}
            >
              <div className="relative">
                <IconSearch
                  size={16}
                  className={isDark ? "text-text-200" : "text-gray-400"}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 ${inputBg} border ${inputBorder} rounded ${inputText} ${inputPlaceholder} focus:outline-none focus:ring-1 ${focusRing} text-sm`}
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div
                className={`p-3 text-center ${
                  isDark ? "text-text-200" : "text-gray-400"
                } text-sm`}
              >
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 px-4 py-2 ${hoverBg} cursor-pointer transition`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(opt.id)}
                    onChange={() => handleToggleOption(opt.id)}
                    className={checkboxClass}
                  />
                  <div className="flex-1 flex items-center gap-2">
                    {opt.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    <span
                      className={`${
                        isDark ? "text-text-100" : "text-white"
                      } text-sm`}
                    >
                      {opt.name}
                    </span>
                  </div>
                  {opt.count !== undefined && (
                    <span
                      className={`${
                        isDark ? "text-text-200" : "text-gray-400"
                      } text-xs`}
                    >
                      ({opt.count})
                    </span>
                  )}
                </label>
              ))
            )}
          </div>

          {selectedIds.length > 0 && (
            <div
              className={`p-2 border-t ${
                isDark ? "border-brand-main/10" : "border-white/10"
              }`}
            >
              <button
                onClick={handleClearAll}
                className={`w-full px-3 py-1 text-xs ${
                  isDark
                    ? "text-text-200 hover:text-text-100 hover:bg-brand-main/10"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                } rounded transition`}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
