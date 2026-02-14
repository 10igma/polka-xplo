import type { Express } from "express";
import {
  getLatestBlocks,
  getBlockByHeight,
  getBlockByHash,
  getExtrinsicsByBlock,
  getEventsByBlock,
} from "@polka-xplo/db";

export function register(app: Express): void {
  /**
   * @openapi
   * /api/blocks:
   *   get:
   *     tags: [Blocks]
   *     summary: List recent blocks
   *     description: Returns a paginated list of blocks, newest first.
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           minimum: 1
   *           maximum: 100
   *         description: Number of blocks to return (max 100)
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *           minimum: 0
   *         description: Pagination offset
   *     responses:
   *       200:
   *         description: Paginated block list
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/BlockSummary'
   *                 total:
   *                   type: integer
   *                 page:
   *                   type: integer
   *                 pageSize:
   *                   type: integer
   *                 hasMore:
   *                   type: boolean
   *       400:
   *         description: Invalid parameters
   */
  app.get("/api/blocks", async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
      const offset = parseInt(String(req.query.offset ?? "0"), 10);
      if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
        res.status(400).json({ error: "Invalid limit or offset parameter" });
        return;
      }
      const result = await getLatestBlocks(limit, offset);
      res.json({
        data: result.blocks,
        total: result.total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasMore: offset + limit < result.total,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch blocks" });
    }
  });

  /**
   * @openapi
   * /api/blocks/{id}:
   *   get:
   *     tags: [Blocks]
   *     summary: Get block details
   *     description: Returns block header, extrinsics, and events by block height or hash.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Block height (number) or 0x-prefixed block hash
   *     responses:
   *       200:
   *         description: Block detail with extrinsics and events
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 block:
   *                   $ref: '#/components/schemas/BlockSummary'
   *                 extrinsics:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Extrinsic'
   *                 events:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Event'
   *       400:
   *         description: Invalid block identifier
   *       404:
   *         description: Block not found
   */
  app.get("/api/blocks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Validate: must be a block number or a 0x-prefixed hash
      if (!/^\d+$/.test(id) && !/^0x[0-9a-fA-F]{64}$/.test(id)) {
        res.status(400).json({
          error: "Invalid block identifier — expected a block number or 0x-prefixed hash",
        });
        return;
      }
      const block = /^\d+$/.test(id)
        ? await getBlockByHeight(parseInt(id, 10))
        : await getBlockByHash(id);

      if (!block) {
        res.status(404).json({ error: "Block not found" });
        return;
      }

      const [extrinsics, events] = await Promise.all([
        getExtrinsicsByBlock(block.height),
        getEventsByBlock(block.height),
      ]);

      res.json({ block, extrinsics, events });
    } catch {
      res.status(500).json({ error: "Failed to fetch block" });
    }
  });
}
