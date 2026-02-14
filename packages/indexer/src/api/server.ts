import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { PluginRegistry } from "../plugins/registry.js";
import type { RpcPool } from "../rpc-pool.js";
import type { IngestionPipeline } from "../ingestion/pipeline.js";
import type { ApiContext } from "./types.js";
import { createAdminMiddleware, createRateLimiter, createCorsMiddleware } from "./middleware.js";
import { register as registerHealth } from "./routes/health.js";
import { register as registerRuntime } from "./routes/runtime.js";
import { register as registerBlocks } from "./routes/blocks.js";
import { register as registerExtrinsics } from "./routes/extrinsics.js";
import { register as registerAccounts } from "./routes/accounts.js";
import { register as registerStats } from "./routes/stats.js";
import { register as registerTransfers } from "./routes/transfers.js";
import { register as registerLogs } from "./routes/logs.js";
import { register as registerEvents } from "./routes/events.js";
import { register as registerSearch } from "./routes/search.js";
import { register as registerExtensions } from "./routes/extensions.js";
import { register as registerAdmin } from "./routes/admin.js";
import { register as registerAssets } from "./routes/assets.js";
import { register as registerGovernance } from "./routes/governance.js";
import { register as registerXcm } from "./routes/xcm.js";

/**
 * The API server exposes indexed blockchain data to the frontend.
 * It provides REST endpoints for blocks, extrinsics, events, accounts, and search.
 */
export function createApiServer(
  registry: PluginRegistry,
  chainId: string,
  rpcPool?: RpcPool,
  pipelineHolder?: { current: IngestionPipeline | null },
): express.Express {
  const app = express();
  app.use(express.json());

  const ctx: ApiContext = { registry, chainId, rpcPool, pipelineHolder };

  // ---- Middleware ----
  app.use("/api/", createRateLimiter());
  app.use("/api/admin/", createAdminMiddleware());
  app.use(createCorsMiddleware());

  // ---- Swagger / OpenAPI ----
  const routesDir = path.dirname(fileURLToPath(import.meta.url));
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Polka-Xplo Indexer API",
        version: "0.1.0",
        description:
          "REST API for querying indexed Polkadot/Substrate blockchain data — blocks, extrinsics, events, accounts, and search.",
        license: { name: "AGPL-3.0", url: "https://www.gnu.org/licenses/agpl-3.0.html" },
      },
      servers: [
        { url: "/", description: "Direct (indexer port)" },
        { url: "/indexer-api", description: "Via Next.js proxy" },
      ],
      components: {
        securitySchemes: {
          AdminApiKey: {
            type: "apiKey",
            in: "header",
            name: "X-Admin-Key",
            description: "Admin API key for destructive/maintenance endpoints",
          },
        },
      },
    },
    apis: [
      path.join(routesDir, "routes", "*.ts"),
      path.join(routesDir, "routes", "*.js"),
      fileURLToPath(import.meta.url), // this file for component schemas
    ],
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      customCss: ".swagger-ui .topbar { display: none }",
      swaggerOptions: { url: "api-docs.json" },
    }),
  );
  app.get("/api-docs.json", (req, res) => {
    const fwdPrefix = req.headers["x-forwarded-prefix"] as string | undefined;
    const referer = (req.headers.referer ?? req.headers.origin) as string | undefined;
    const viaProxy = fwdPrefix === "/indexer-api" || (referer?.includes("/indexer-api/") ?? false);

    const dynamicSpec = {
      ...swaggerSpec,
      servers: [viaProxy
        ? { url: "/indexer-api", description: "API via proxy" }
        : { url: "/", description: "API" }],
    };
    res.json(dynamicSpec);
  });

  // ---- Routes ----
  registerHealth(app, ctx);
  registerRuntime(app, ctx);
  registerBlocks(app);
  registerExtrinsics(app);
  registerAccounts(app, ctx);
  registerStats(app, ctx);
  registerTransfers(app);
  registerLogs(app);
  registerEvents(app);
  registerSearch(app);
  registerExtensions(app, ctx);
  registerAdmin(app, ctx);
  registerAssets(app);
  registerGovernance(app);
  registerXcm(app);

  /**
   * @openapi
   * components:
   *   schemas:
   *     BlockSummary:
   *       type: object
   *       properties:
   *         height:
   *           type: integer
   *           description: Block number
   *         hash:
   *           type: string
   *           description: 0x-prefixed block hash
   *         parentHash:
   *           type: string
   *         stateRoot:
   *           type: string
   *         extrinsicsRoot:
   *           type: string
   *         timestamp:
   *           type: integer
   *           nullable: true
   *           description: Unix timestamp (ms)
   *         validatorId:
   *           type: string
   *           nullable: true
   *         status:
   *           type: string
   *           enum: [best, finalized]
   *         specVersion:
   *           type: integer
   *         eventCount:
   *           type: integer
   *         extrinsicCount:
   *           type: integer
   *     Extrinsic:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: "blockHeight-index"
   *         blockHeight:
   *           type: integer
   *         txHash:
   *           type: string
   *           nullable: true
   *         index:
   *           type: integer
   *         signer:
   *           type: string
   *           nullable: true
   *         module:
   *           type: string
   *         call:
   *           type: string
   *         args:
   *           type: object
   *           description: Decoded call arguments (JSONB)
   *         success:
   *           type: boolean
   *         fee:
   *           type: string
   *           nullable: true
   *         tip:
   *           type: string
   *           nullable: true
   *     Event:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *         blockHeight:
   *           type: integer
   *         extrinsicId:
   *           type: string
   *           nullable: true
   *         index:
   *           type: integer
   *         module:
   *           type: string
   *         event:
   *           type: string
   *         data:
   *           type: object
   *           description: Decoded event data (JSONB)
   *     Account:
   *       type: object
   *       properties:
   *         address:
   *           type: string
   *         publicKey:
   *           type: string
   *           nullable: true
   *         identity:
   *           type: object
   *           nullable: true
   *         lastActiveBlock:
   *           type: integer
   *         createdAtBlock:
   *           type: integer
   *     AccountBalance:
   *       type: object
   *       properties:
   *         free:
   *           type: string
   *         reserved:
   *           type: string
   *         frozen:
   *           type: string
   *         flags:
   *           type: string
   *           nullable: true
   *         updatedAtBlock:
   *           type: integer
   */

  return app;
}
