import type { Express } from "express";
import { getEventsList, getEventModules } from "@polka-xplo/db";

export function register(app: Express): void {
  /**
   * @openapi
   * /api/events/modules:
   *   get:
   *     tags: [Events]
   *     summary: List distinct event modules and their event types
   *     description: Returns all unique module names and their event types found in indexed data. Useful for building dynamic filter UIs.
   *     responses:
   *       200:
   *         description: List of modules with their event types
   */
  app.get("/api/events/modules", async (_req, res) => {
    try {
      const modules = await getEventModules();
      res.json({ modules });
    } catch {
      res.status(500).json({ error: "Failed to fetch event modules" });
    }
  });

  /**
   * @openapi
   * /api/events:
   *   get:
   *     tags: [Events]
   *     summary: List events
   *     description: Returns a paginated list of events, most recent first. Optionally filter by module.
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 25
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *       - in: query
   *         name: module
   *         schema:
   *           type: string
   *         description: Filter by pallet module name (e.g. Balances, System)
   *       - in: query
   *         name: event
   *         schema:
   *           type: string
   *         description: Filter by event name within a module (e.g. Transfer, Deposit)
   *     responses:
   *       200:
   *         description: Paginated event list
   */
  app.get("/api/events", async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 25, 1), 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const module = req.query.module as string | undefined;
      const eventParam = req.query.event as string | undefined;
      const eventNames = eventParam ? eventParam.split(",").map((e) => e.trim()).filter(Boolean) : undefined;
      const result = await getEventsList(limit, offset, module || undefined, eventNames);
      const page = Math.floor(offset / limit) + 1;
      res.json({
        data: result.data,
        total: result.total,
        page,
        pageSize: limit,
        hasMore: offset + limit < result.total,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
}
