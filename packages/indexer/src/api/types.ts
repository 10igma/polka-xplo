import type { PluginRegistry } from "../plugins/registry.js";
import type { RpcPool } from "../rpc-pool.js";
import type { IngestionPipeline } from "../ingestion/pipeline.js";

/**
 * Shared context passed to all route modules.
 */
export interface ApiContext {
  registry: PluginRegistry;
  chainId: string;
  rpcPool?: RpcPool;
  pipelineHolder?: { current: IngestionPipeline | null };
}
