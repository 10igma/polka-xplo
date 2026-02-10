"use client";

import React, { createContext, useContext } from "react";
import type { ThemeConfig } from "./theme";

const ThemeContext = createContext<ThemeConfig | null>(null);

/**
 * Provides the resolved theme to all client components.
 * The theme is resolved server-side and passed down as a prop.
 */
export function ThemeProvider({
  theme,
  children,
}: {
  theme: ThemeConfig;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Access the current theme in any client component */
export function useTheme(): ThemeConfig {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
