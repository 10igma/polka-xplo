"use client";

import { useRouter } from "next/navigation";
import { detectSearchType } from "@polka-xplo/shared";
import { type FormEvent } from "react";

export function SearchBar() {
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    if (!q) return;

    const searchType = detectSearchType(q);

    switch (searchType) {
      case "blockNumber":
        router.push(`/block/${q}`);
        break;
      case "hash":
        router.push(`/block/${q}`);
        break;
      case "address":
        router.push(`/account/${q}`);
        break;
      default:
        router.push(`/search?q=${encodeURIComponent(q)}`);
        break;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
      <div className="relative flex items-center">
        <input
          name="q"
          type="text"
          placeholder="Search by Block / Extrinsic / Account / Hash..."
          className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/80 pl-3 pr-9 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    </form>
  );
}
