"use client";

import React from "react";
import { PrefixSelector } from "./PrefixSelector";

/**
 * Client-side header navigation with prefix selector.
 */
export function HeaderNav({ apiDocsUrl }: { apiDocsUrl: string }) {
  return (
    <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
      <a href="/" className="hover:text-zinc-100 transition-colors">
        Blocks
      </a>
      <a href="/accounts" className="hover:text-zinc-100 transition-colors">
        Accounts
      </a>
      <a
        href="/chain-state/System/Account"
        className="hover:text-zinc-100 transition-colors"
      >
        Chain State
      </a>
      <a
        href={apiDocsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-zinc-100 transition-colors"
      >
        API
      </a>
      <PrefixSelector />
    </nav>
  );
}
