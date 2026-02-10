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
    <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
      <input
        name="q"
        type="text"
        placeholder="Search by block, transaction hash, or address..."
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
      />
    </form>
  );
}
