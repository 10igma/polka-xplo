"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSS58, SS58_PRESETS } from "@/lib/ss58-context";

/**
 * Dropdown selector for SS58 address prefix.
 * Shows in the header; allows users to switch the display format for all addresses.
 */
export function PrefixSelector() {
  const { prefix, setPrefix } = useSS58();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel =
    SS58_PRESETS.find((p) => p.prefix === prefix)?.label ?? `Custom (${prefix})`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 rounded-md px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
        </svg>
        <span className="hidden sm:inline">SS58:</span>
        <span className="text-zinc-200 font-medium">{prefix}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 py-1 text-sm">
          {SS58_PRESETS.map((p) => (
            <button
              key={p.prefix}
              onClick={() => {
                setPrefix(p.prefix);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 hover:bg-zinc-800 transition-colors flex items-center justify-between ${
                prefix === p.prefix
                  ? "text-accent"
                  : "text-zinc-300"
              }`}
            >
              <span>{p.label}</span>
              {prefix === p.prefix && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
          <div className="border-t border-zinc-700 mt-1 pt-1 px-3 pb-2">
            <label className="text-[11px] text-zinc-500 block mb-1">
              Custom prefix
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                max="16383"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. 1328"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 w-20 focus:outline-none focus:border-accent"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && custom) {
                    const n = parseInt(custom, 10);
                    if (!isNaN(n) && n >= 0 && n <= 16383) {
                      setPrefix(n);
                      setOpen(false);
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const n = parseInt(custom, 10);
                  if (!isNaN(n) && n >= 0 && n <= 16383) {
                    setPrefix(n);
                    setOpen(false);
                  }
                }}
                className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-200"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
