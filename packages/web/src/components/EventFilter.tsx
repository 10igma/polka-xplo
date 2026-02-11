"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import type { EventModuleInfo } from "@/lib/api";

/**
 * Dynamic event filter with cascading module → event dropdowns.
 * Uses actual indexed data to populate options.
 */
export function EventFilter({ modules }: { modules: EventModuleInfo[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentModule = searchParams.get("module") ?? "";
  const currentEvent = searchParams.get("event") ?? "";

  const [moduleOpen, setModuleOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const moduleRef = useRef<HTMLDivElement>(null);
  const eventRef = useRef<HTMLDivElement>(null);

  // Available events for the selected module
  const selectedModuleInfo = modules.find((m) => m.module === currentModule);
  const availableEvents = selectedModuleInfo?.events ?? [];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moduleRef.current && !moduleRef.current.contains(e.target as Node)) {
        setModuleOpen(false);
      }
      if (eventRef.current && !eventRef.current.contains(e.target as Node)) {
        setEventOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = useCallback(
    (module: string, event: string) => {
      const params = new URLSearchParams();
      if (module) params.set("module", module);
      if (event) params.set("event", event);
      router.push(`/events${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [router],
  );

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Module dropdown */}
      <div ref={moduleRef} className="relative">
        <button
          onClick={() => {
            setModuleOpen(!moduleOpen);
            setEventOpen(false);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            currentModule
              ? "bg-accent/10 text-accent border-accent/30"
              : "bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:text-zinc-200"
          }`}
        >
          <span>{currentModule || "All Modules"}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${moduleOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {moduleOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 max-h-80 overflow-y-auto rounded-lg border border-zinc-700/50 bg-zinc-900 shadow-xl shadow-black/40 py-1 z-50">
            <button
              onClick={() => {
                navigate("", "");
                setModuleOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                !currentModule
                  ? "text-accent bg-accent/10"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
              }`}
            >
              All Modules
            </button>
            {modules.map((m) => (
              <button
                key={m.module}
                onClick={() => {
                  navigate(m.module, "");
                  setModuleOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentModule === m.module
                    ? "text-accent bg-accent/10"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                }`}
              >
                <span>{m.module}</span>
                <span className="ml-2 text-xs text-zinc-600">({m.events.length})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Event type dropdown — only shown when a module is selected */}
      {currentModule && availableEvents.length > 0 && (
        <div ref={eventRef} className="relative">
          <button
            onClick={() => {
              setEventOpen(!eventOpen);
              setModuleOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              currentEvent
                ? "bg-accent/10 text-accent border-accent/30"
                : "bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:text-zinc-200"
            }`}
          >
            <span>{currentEvent || "All Events"}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${eventOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {eventOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 max-h-80 overflow-y-auto rounded-lg border border-zinc-700/50 bg-zinc-900 shadow-xl shadow-black/40 py-1 z-50">
              <button
                onClick={() => {
                  navigate(currentModule, "");
                  setEventOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  !currentEvent
                    ? "text-accent bg-accent/10"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                }`}
              >
                All Events
              </button>
              {availableEvents.map((evt) => (
                <button
                  key={evt}
                  onClick={() => {
                    navigate(currentModule, evt);
                    setEventOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    currentEvent === evt
                      ? "text-accent bg-accent/10"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                  }`}
                >
                  {evt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clear all filters */}
      {(currentModule || currentEvent) && (
        <button
          onClick={() => navigate("", "")}
          className="px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
