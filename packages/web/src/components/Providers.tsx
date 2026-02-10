"use client";

import React from "react";
import { SS58Provider } from "@/lib/ss58-context";
import { ThemeProvider } from "@/lib/theme-context";
import type { ThemeConfig } from "@/lib/theme";

/**
 * Client-side providers wrapper.
 * Wraps app in theme + SS58 prefix contexts.
 */
export function Providers({
  theme,
  children,
}: {
  theme: ThemeConfig;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <SS58Provider defaultPrefix={theme.addressPrefix}>
        {children}
      </SS58Provider>
    </ThemeProvider>
  );
}
