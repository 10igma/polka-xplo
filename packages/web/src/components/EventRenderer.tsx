"use client";

import React, { Suspense, lazy } from "react";
import { JsonView } from "./JsonView";

interface EventData {
  module: string;
  event: string;
  data: Record<string, unknown>;
}

/**
 * Dynamic event renderer that checks the extensions registry
 * for a specialized component, falling back to the generic JsonView.
 *
 * This implements the spec's Frontend Extension Architecture:
 * plugins provide rich viewers, the core provides a JSON fallback.
 */

// Extension component registry — maps "Module.Event" to lazy-loaded components
const extensionComponents: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<{ data: Record<string, unknown> }>>
> = {
  "Staking.Rewarded": lazy(
    () => import("../../../extensions/pallet-staking/ui/components/RewardViewer")
  ),
};

export function EventRenderer({ module, event, data }: EventData) {
  const key = `${module}.${event}`;
  const PluginComponent = extensionComponents[key];

  if (PluginComponent) {
    return (
      <Suspense
        fallback={
          <div className="animate-pulse h-20 rounded-lg bg-zinc-800" />
        }
      >
        <PluginComponent data={data} />
      </Suspense>
    );
  }

  return <JsonView data={data} />;
}
