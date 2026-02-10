"use client";

import React, { useState, type ReactNode } from "react";

interface BlockDetailTabsProps {
  extrinsicCount: number;
  eventCount: number;
  logCount: number;
  extrinsicsContent: ReactNode;
  eventsContent: ReactNode;
  logsContent: ReactNode;
}

type TabId = "extrinsics" | "events" | "logs";

/**
 * Tabbed view for block detail — switches between Extrinsics, Events, and Logs.
 * Mirrors the tab UX of statescan.io block pages.
 */
export function BlockDetailTabs({
  extrinsicCount,
  eventCount,
  logCount,
  extrinsicsContent,
  eventsContent,
  logsContent,
}: BlockDetailTabsProps) {
  const [active, setActive] = useState<TabId>("extrinsics");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-zinc-800">
        <TabButton
          label="Extrinsics"
          count={extrinsicCount}
          isActive={active === "extrinsics"}
          onClick={() => setActive("extrinsics")}
        />
        <TabButton
          label="Events"
          count={eventCount}
          isActive={active === "events"}
          onClick={() => setActive("events")}
        />
        <TabButton
          label="Logs"
          count={logCount}
          isActive={active === "logs"}
          onClick={() => setActive("logs")}
        />
      </div>

      {/* Tab content */}
      {active === "extrinsics" && extrinsicsContent}
      {active === "events" && eventsContent}
      {active === "logs" && logsContent}
    </div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
        isActive
          ? "text-zinc-100 border-[var(--color-accent)]"
          : "text-zinc-500 border-transparent hover:text-zinc-300"
      }`}
    >
      {label}
      <span
        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${
          isActive ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800 text-zinc-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
