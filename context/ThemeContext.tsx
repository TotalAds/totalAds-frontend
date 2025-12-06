"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Single light theme - no dark mode toggle
type Theme = "light";

interface ThemeContextType {
  theme: Theme;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const theme: Theme = "light"; // Always light theme

  // Apply light theme on mount
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    } catch (error) {
      console.warn("Failed to apply theme:", error);
    }
    setMounted(true);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
