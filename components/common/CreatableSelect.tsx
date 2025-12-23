"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { IconChevronDown, IconX } from "@tabler/icons-react";

interface Option {
  id: string;
  name: string;
  color?: string;
}

interface CreatableSelectProps {
  options: Option[];
  value: Option[];
  onChange: (selected: Option[]) => void;
  onCreateNew?: (name: string) => Promise<Option>;
  placeholder?: string;
  label?: string;
  isMulti?: boolean;
  isLoading?: boolean;
}

export default function CreatableSelect({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = "Select or create...",
  label,
  isMulti = true,
  isLoading = false,
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    isAbove: false,
    maxHeight: 200,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position when opening or scrolling
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        // Maximum dropdown height (matching max-h-[200px])
        const maxDropdownHeight = 200;
        const gap = 6; // Gap between trigger and dropdown
        const minSpaceRequired = 280; // Minimum space needed to show dropdown properly

        // Calculate available space
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Determine if we should position above
        // Position above if:
        // 1. Not enough space below (less than minimum required)
        // 2. More space available above than below
        const shouldPositionAbove =
          spaceBelow < minSpaceRequired &&
          spaceAbove > spaceBelow &&
          spaceAbove >= minSpaceRequired;

        let top: number = 0;
        let bottom: number = 0;
        let isAbove = false;

        let maxHeight = maxDropdownHeight;

        if (shouldPositionAbove) {
          // Position above the trigger using bottom property (fixed positioning)
          // This ensures the dropdown's bottom edge aligns with trigger's top edge
          const padding = 8;

          // Calculate bottom position: distance from viewport bottom to trigger top + gap
          // bottom (in fixed positioning) = viewportHeight - triggerTop + gap
          const triggerTopInViewport = rect.top;
          const calculatedBottom = viewportHeight - triggerTopInViewport + gap;

          // Ensure it doesn't go above viewport (with padding)
          // Maximum bottom = viewportHeight - padding (minimum 8px from top)
          const maxBottom = viewportHeight - padding;
          bottom = Math.min(maxBottom, calculatedBottom);

          // Calculate available space above for maxHeight
          // Available height = bottom - padding (distance from viewport top to dropdown top)
          const availableSpaceAbove = bottom - padding;
          maxHeight = Math.max(
            100,
            Math.min(availableSpaceAbove, maxDropdownHeight)
          );

          isAbove = true;
        } else {
          // Position below the trigger (default)
          // Position dropdown so its top edge aligns with trigger's bottom edge (plus gap)
          top = rect.bottom + scrollY + gap;

          // Use available space below or max height
          const availableSpaceBelow = spaceBelow - gap - 8; // 8px padding from viewport bottom
          maxHeight = Math.min(availableSpaceBelow, maxDropdownHeight);

          isAbove = false;
        }

        setDropdownPosition({
          top,
          bottom,
          left: rect.left + scrollX,
          width: rect.width,
          isAbove,
          maxHeight: Math.max(250, maxHeight), // Ensure minimum height of 100px
        });
      }
    };

    updatePosition();

    if (isOpen) {
      // Update position on scroll and resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      // Also update after a short delay to account for any layout changes
      const timeoutId = setTimeout(updatePosition, 100);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both the container and the portal dropdown
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(target as Element).closest("[data-creatable-select-dropdown]")
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid closing immediately when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    if (isMulti) {
      const isSelected = value.some((v) => v.id === option.id);
      if (isSelected) {
        onChange(value.filter((v) => v.id !== option.id));
      } else {
        onChange([...value, option]);
      }
    } else {
      onChange([option]);
      setIsOpen(false);
    }
    setInputValue("");
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  const handleCreateNew = async () => {
    if (!inputValue.trim() || !onCreateNew) return;

    setIsCreating(true);
    try {
      const newOption = await onCreateNew(inputValue.trim());
      handleSelect(newOption);
      setInputValue("");
    } catch (error) {
      console.error("Error creating new option:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredOptions = options.filter(
    (opt) =>
      opt.name?.toLowerCase()?.includes(inputValue.toLowerCase()) &&
      !value.some((v) => v.id === opt.id)
  );

  const canCreate =
    inputValue.trim() &&
    !options.some(
      (opt) => opt.name?.toLowerCase() === inputValue.toLowerCase()
    );

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-text-200 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Selected values display */}
        <div
          ref={triggerRef}
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          className={`min-h-10 px-3 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg flex flex-wrap gap-2 items-center transition-colors ${
            isLoading
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer hover:bg-brand-main/10"
          }`}
        >
          {value.length > 0 ? (
            value.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1 px-2 py-1 bg-brand-main/10 rounded text-sm text-text-100"
              >
                {item.color && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span>{item.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  className="hover:text-brand-main transition-colors"
                >
                  <IconX size={14} />
                </button>
              </div>
            ))
          ) : (
            <span className="text-text-200/60">
              {isLoading ? "Loading..." : placeholder}
            </span>
          )}
          <IconChevronDown
            size={18}
            className={`ml-auto text-text-200/60 transition-transform ${
              isOpen ? "rotate-180" : ""
            } ${isLoading ? "opacity-50" : ""}`}
          />
        </div>

        {/* Dropdown menu - rendered via portal to escape modal overflow */}
        {isOpen &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              data-creatable-select-dropdown
              className="fixed bg-bg-100 border border-brand-main/20 rounded-lg shadow-lg z-[9999] backdrop-blur-xl overflow-y-auto overflow-x-hidden"
              style={{
                ...(dropdownPosition.isAbove
                  ? { bottom: `${dropdownPosition.bottom}px` }
                  : { top: `${dropdownPosition.top}px` }),
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                maxHeight: `${dropdownPosition.maxHeight}px`,
              }}
            >
              {/* Search input */}
              <div className="p-2 border-b border-brand-main/20">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search or create..."
                  className="w-full px-3 py-2 bg-brand-main/5 border border-brand-main/20 rounded text-text-100 placeholder-text-200/60 focus:outline-none focus:ring-2 focus:ring-brand-main"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {/* Options list */}
              <div
                className="overflow-y-auto"
                style={{
                  maxHeight: `${Math.max(
                    0,
                    dropdownPosition.maxHeight - 120
                  )}px`, // Account for search input (~60px) and create button (~60px)
                }}
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option)}
                      className="w-full text-left px-3 py-2 hover:bg-brand-main/10 transition-colors flex items-center gap-2 text-text-100"
                    >
                      {option.color && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      <span>{option.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-text-200/60 text-sm">
                    No options found
                  </div>
                )}
              </div>

              {/* Create new option */}
              {canCreate && onCreateNew && (
                <div className="border-t border-brand-main/20 p-2">
                  <button
                    onClick={handleCreateNew}
                    disabled={isCreating}
                    className="w-full px-3 py-2 bg-brand-main/20 hover:bg-brand-main/30 text-brand-main rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {isCreating ? "Creating..." : `Create "${inputValue}"`}
                  </button>
                </div>
              )}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
