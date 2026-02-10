"use client";

import React from "react";
import { SS58Provider } from "@/lib/ss58-context";

/**
 * Client-side providers wrapper.
 * Wraps app in SS58 prefix context for address formatting.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SS58Provider defaultPrefix={42}>{children}</SS58Provider>;
}
