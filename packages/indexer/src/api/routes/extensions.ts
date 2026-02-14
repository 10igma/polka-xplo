import type { Express } from "express";
import type { ApiContext } from "../types.js";

export function register(app: Express, ctx: ApiContext): void {
  /**
   * @openapi
   * /api/extensions:
   *   get:
   *     tags: [Extensions]
   *     summary: List registered extensions
   *     description: Returns all registered pallet extension manifests.
   *     responses:
   *       200:
   *         description: Extension manifest list
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 extensions:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       version:
   *                         type: string
   *                       palletId:
   *                         type: string
   *                       supportedEvents:
   *                         type: array
   *                         items:
   *                           type: string
   *                       supportedCalls:
   *                         type: array
   *                         items:
   *                           type: string
   */
  app.get("/api/extensions", (_req, res) => {
    res.json({ extensions: ctx.registry.getExtensions() });
  });
}
