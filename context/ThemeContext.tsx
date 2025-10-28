"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch (error) {
      console.warn("Failed to initialize theme:", error);
    }
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    try {
      const root = document.documentElement;

      if (newTheme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
        root.style.colorScheme = "light";
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      }

      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.warn("Failed to apply theme:", error);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
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
