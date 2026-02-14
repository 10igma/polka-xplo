import type { Express } from "express";
import type { ApiContext } from "../types.js";
import { getChainStats, query } from "@polka-xplo/db";
import { getExistentialDeposit } from "../../runtime-parser.js";
import { getSystemProperties, getParachainId } from "../../chain-state.js";

export function register(app: Express, ctx: ApiContext): void {
  /**
   * @openapi
   * /api/stats:
   *   get:
   *     tags: [Stats]
   *     summary: Chain statistics
   *     description: Returns aggregate chain statistics for the homepage.
   *     responses:
   *       200:
   *         description: Chain stats
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 latestBlock:
   *                   type: integer
   *                 finalizedBlock:
   *                   type: integer
   *                 signedExtrinsics:
   *                   type: integer
   *                 transfers:
   *                   type: integer
   *                 totalAccounts:
   *                   type: integer
   *                 existentialDeposit:
   *                   type: string
   *                   description: Existential deposit in planck (from runtime metadata)
   *                 tokenDecimals:
   *                   type: integer
   *                   description: Token decimals (from system_properties)
   *                 paraId:
   *                   type: integer
   *                   nullable: true
   *                   description: Parachain ID (from ParachainInfo pallet, null for relay chains)
   */
  app.get("/api/stats", async (_req, res) => {
    try {
      const [stats, chainProps] = await Promise.all([
        getChainStats(),
        ctx.rpcPool
          ? Promise.all([
              getExistentialDeposit(ctx.rpcPool),
              getSystemProperties(ctx.rpcPool),
              getParachainId(ctx.rpcPool),
            ]).then(([ed, props, paraId]) => ({
              existentialDeposit: ed,
              tokenDecimals: props.tokenDecimals,
              paraId,
            }))
          : Promise.resolve({ existentialDeposit: "0", tokenDecimals: 10, paraId: null }),
      ]);
      res.json({ ...stats, ...chainProps });
    } catch {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  /**
   * @openapi
   * /api/stats/activity:
   *   get:
   *     tags: [Stats]
   *     summary: Chain activity over time
   *     description: >
   *       Returns extrinsic counts, event counts, transfer counts, and block counts
   *       aggregated by time period (hour, day, week, month).
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [hour, day, week, month]
   *           default: day
   *         description: Aggregation period
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 30
   *           minimum: 1
   *           maximum: 365
   *         description: Number of time buckets to return
   *     responses:
   *       200:
   *         description: Time-series activity data
   */
  app.get("/api/stats/activity", async (req, res) => {
    try {
      const period = String(req.query.period || "day");
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 30, 1), 365);

      // Map period to PostgreSQL date_trunc interval
      const truncMap: Record<string, string> = {
        hour: "hour",
        day: "day",
        week: "week",
        month: "month",
      };
      const trunc = truncMap[period];
      if (!trunc) {
        res.status(400).json({ error: "Invalid period. Use: hour, day, week, month" });
        return;
      }

      const result = await query(
        `SELECT
           date_trunc($1, to_timestamp(timestamp / 1000)) AS bucket,
           SUM(extrinsic_count)::int AS extrinsics,
           SUM(event_count)::int AS events,
           COUNT(*)::int AS blocks
         FROM blocks
         WHERE timestamp IS NOT NULL
         GROUP BY 1
         ORDER BY 1 DESC
         LIMIT $2`,
        [trunc, limit],
      );

      // Also count transfers (Balances.Transfer events) per bucket
      const transferResult = await query(
        `SELECT
           date_trunc($1, to_timestamp(b.timestamp / 1000)) AS bucket,
           COUNT(*)::int AS transfers
         FROM events e
         JOIN blocks b ON b.height = e.block_height
         WHERE b.timestamp IS NOT NULL
           AND e.module = 'Balances' AND e.event IN ('Transfer', 'transfer')
         GROUP BY 1
         ORDER BY 1 DESC
         LIMIT $2`,
        [trunc, limit],
      );

      // Merge transfer counts into the main result
      const transferMap = new Map<string, number>();
      for (const row of transferResult.rows) {
        transferMap.set(String(row.bucket), Number(row.transfers));
      }

      const data = result.rows
        .map((row: Record<string, unknown>) => ({
          timestamp: new Date(String(row.bucket)).getTime(),
          label: String(row.bucket),
          extrinsics: Number(row.extrinsics),
          events: Number(row.events),
          blocks: Number(row.blocks),
          transfers: transferMap.get(String(row.bucket)) ?? 0,
        }))
        .reverse(); // chronological order

      res.json({ period, count: data.length, data });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
}
