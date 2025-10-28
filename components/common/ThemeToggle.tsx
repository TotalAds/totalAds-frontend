"use client";

import React from "react";

import { useTheme } from "@/context/ThemeContext";
import { IconMoon, IconSun } from "@tabler/icons-react";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className="p-2 rounded-xl w-9 h-9" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl transition-all duration-200 hover:bg-brand-main/10 focus:outline-none focus:ring-2 focus:ring-brand-main"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? (
        <IconSun className="h-5 w-5 text-yellow-400 hover:text-yellow-300" />
      ) : (
        <IconMoon className="h-5 w-5 text-slate-700 hover:text-slate-800" />
      )}
    </button>
  );
};

export default ThemeToggle;
