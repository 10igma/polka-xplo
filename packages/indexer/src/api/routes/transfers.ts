import type { Express } from "express";
import { getTransfersList } from "@polka-xplo/db";

export function register(app: Express): void {
  /**
   * @openapi
   * /api/transfers:
   *   get:
   *     tags: [Transfers]
   *     summary: Latest transfers
   *     description: Returns the most recent balance transfer events.
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *           minimum: 1
   *           maximum: 50
   *         description: Number of transfers to return (max 50)
   *     responses:
   *       200:
   *         description: Transfer list
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   extrinsicId:
   *                     type: string
   *                   blockHeight:
   *                     type: integer
   *                   timestamp:
   *                     type: integer
   *                     nullable: true
   *                   amount:
   *                     type: string
   *                   from:
   *                     type: string
   *                   to:
   *                     type: string
   */
  app.get("/api/transfers", async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 25, 1), 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const result = await getTransfersList(limit, offset);
      const page = Math.floor(offset / limit) + 1;
      res.json({
        data: result.data,
        total: result.total,
        page,
        pageSize: limit,
        hasMore: offset + limit < result.total,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch transfers" });
    }
  });
}
