'use client';

import { IconChevronDown, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

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
  placeholder = 'Select or create...',
  label,
  isMulti = true,
  isLoading = false,
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setInputValue('');
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
      setInputValue('');
    } catch (error) {
      console.error('Error creating new option:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.some((v) => v.id === opt.id)
  );

  const canCreate =
    inputValue.trim() &&
    !options.some((opt) => opt.name.toLowerCase() === inputValue.toLowerCase());

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Selected values display */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-10 px-3 py-2 bg-white/5 border border-white/20 rounded-lg cursor-pointer flex flex-wrap gap-2 items-center hover:bg-white/10 transition-colors"
        >
          {value.length > 0 ? (
            value.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-sm text-white"
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
                  className="hover:text-red-400 transition-colors"
                >
                  <IconX size={14} />
                </button>
              </div>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
          <IconChevronDown
            size={18}
            className={`ml-auto text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/20 rounded-lg shadow-lg z-50">
            {/* Search input */}
            <div className="p-2 border-b border-white/10">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search or create..."
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-2 text-white"
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
                <div className="px-3 py-2 text-gray-400 text-sm">
                  No options found
                </div>
              )}
            </div>

            {/* Create new option */}
            {canCreate && onCreateNew && (
              <div className="border-t border-white/10 p-2">
                <button
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : `Create "${inputValue}"`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

