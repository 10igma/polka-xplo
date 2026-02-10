"use client";

import React, { Suspense } from "react";
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
 *
 * Extension UI components should be placed under:
 *   packages/web/src/extensions/<pallet>/components/
 *
 * They are lazy-loaded and registered in the map below.
 */

type LazyPluginComponent = React.LazyExoticComponent<
  React.ComponentType<{ data: Record<string, unknown> }>
>;

// Extension component registry — maps "Module.Event" to lazy-loaded components.
// Extensions that provide UI components should register them here.
// The components must live inside the web package for Next.js bundling.
const extensionComponents: Record<string, LazyPluginComponent> = {
  // Example: when pallet-staking extension UI is installed into the web package:
  // "Staking.Rewarded": lazy(() => import("../extensions/staking/RewardViewer")),
};

export function EventRenderer({ module, event, data }: EventData) {
  const key = `${module}.${event}`;
  const PluginComponent = extensionComponents[key];

  if (PluginComponent) {
    return (
      <Suspense fallback={<div className="animate-pulse h-20 rounded-lg bg-zinc-800" />}>
        <PluginComponent data={data} />
      </Suspense>
    );
  }

  return <JsonView data={data} />;
}
