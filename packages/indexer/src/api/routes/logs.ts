import type { Express } from "express";
import { getDigestLogs } from "@polka-xplo/db";

export function register(app: Express): void {
  /**
   * @openapi
   * /api/logs:
   *   get:
   *     tags: [Logs]
   *     summary: List digest logs
   *     description: Returns a paginated list of block digest logs (PreRuntime, Seal, Consensus, etc.).
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 25
   *           minimum: 1
   *           maximum: 100
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: Paginated digest log list
   */
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "25"), 10), 100);
      const offset = parseInt(String(req.query.offset ?? "0"), 10);
      if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
        res.status(400).json({ error: "Invalid limit or offset parameter" });
        return;
      }
      const result = await getDigestLogs(limit, offset);
      res.json({
        data: result.data,
        total: result.total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasMore: offset + limit < result.total,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch digest logs" });
    }
  });
}
