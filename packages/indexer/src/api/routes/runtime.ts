import type { Express } from "express";
import type { ApiContext } from "../types.js";
import { getSpecVersions, getBlockHashForSpecVersion } from "@polka-xplo/db";
import { getRuntimeSummary } from "../../runtime-parser.js";

export function register(app: Express, ctx: ApiContext): void {
  /**
   * @openapi
   * /api/runtime:
   *   get:
   *     tags: [Runtime]
   *     summary: List spec versions
   *     description: Returns all indexed runtime spec versions with their block ranges.
   *     responses:
   *       200:
   *         description: List of spec versions
   */
  app.get("/api/runtime", async (_req, res) => {
    try {
      const versions = await getSpecVersions();
      res.json({ versions });
    } catch {
      res.status(500).json({ error: "Failed to fetch spec versions" });
    }
  });

  /**
   * @openapi
   * /api/runtime/{specVersion}:
   *   get:
   *     tags: [Runtime]
   *     summary: Get runtime modules for a spec version
   *     description: Returns pallet summaries (calls, events, storage, constants, errors) for a given spec version.
   *     parameters:
   *       - in: path
   *         name: specVersion
   *         required: true
   *         schema:
   *           type: integer
   *         description: The spec version number
   *     responses:
   *       200:
   *         description: Runtime module summaries
   *       404:
   *         description: Spec version not found
   */
  app.get("/api/runtime/:specVersion", async (req, res) => {
    try {
      const specVersion = parseInt(req.params.specVersion, 10);
      if (isNaN(specVersion)) {
        res.status(400).json({ error: "Invalid spec version" });
        return;
      }

      const blockHash = await getBlockHashForSpecVersion(specVersion);
      if (!blockHash) {
        res.status(404).json({ error: `Spec version ${specVersion} not found in indexed blocks` });
        return;
      }

      if (!ctx.rpcPool) {
        res.status(503).json({ error: "RPC pool not available" });
        return;
      }

      const summary = await getRuntimeSummary(ctx.rpcPool, blockHash, specVersion);
      res.json(summary);
    } catch (err) {
      console.error("[API] Failed to fetch runtime metadata:", err);
      res.status(500).json({ error: "Failed to fetch runtime metadata" });
    }
  });
}
