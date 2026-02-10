import express from "express";
import type { PluginRegistry } from "../plugins/registry.js";
import {
  getLatestBlocks,
  getBlockByHeight,
  getBlockByHash,
  getExtrinsicsByBlock,
  getExtrinsicByHash,
  getExtrinsicsBySigner,
  getEventsByBlock,
  getEventsByExtrinsic,
  getAccount,
  getIndexerState,
  searchByHash,
} from "@polka-xplo/db";
import { detectSearchType } from "@polka-xplo/shared";

/**
 * The API server exposes indexed blockchain data to the frontend.
 * It provides REST endpoints for blocks, extrinsics, events, accounts, and search.
 */
export function createApiServer(
  registry: PluginRegistry,
  chainId: string
): express.Express {
  const app = express();

  app.use(express.json());

  // CORS — configurable via CORS_ORIGIN env var (defaults to * for local dev)
  const allowedOrigin = process.env.CORS_ORIGIN ?? "*";
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  // ---- Health Check ----
  app.get("/health", async (_req, res) => {
    try {
      const state = await getIndexerState(chainId);
      res.json({
        status: state?.state === "live" ? "healthy" : "degraded",
        nodeConnected: true,
        syncLag: state ? state.chainTip - state.lastFinalizedBlock : -1,
        dbConnected: true,
        chainTip: state?.chainTip ?? 0,
        indexedTip: state?.lastFinalizedBlock ?? 0,
        timestamp: Date.now(),
      });
    } catch (err) {
      res.status(503).json({
        status: "unhealthy",
        nodeConnected: false,
        dbConnected: false,
        error: String(err),
        timestamp: Date.now(),
      });
    }
  });

  // ---- Blocks ----
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
        page: Math.floor(offset / limit),
        pageSize: limit,
        hasMore: offset + limit < result.total,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch blocks" });
    }
  });

  app.get("/api/blocks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Validate: must be a block number or a 0x-prefixed hash
      if (!/^\d+$/.test(id) && !/^0x[0-9a-fA-F]{64}$/.test(id)) {
        res.status(400).json({ error: "Invalid block identifier — expected a block number or 0x-prefixed hash" });
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
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch block" });
    }
  });

  // ---- Extrinsics ----
  app.get("/api/extrinsics/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      if (!hash || hash.length > 200) {
        res.status(400).json({ error: "Invalid extrinsic hash" });
        return;
      }
      const extrinsic = await getExtrinsicByHash(hash);
      if (!extrinsic) {
        res.status(404).json({ error: "Extrinsic not found" });
        return;
      }

      const events = await getEventsByExtrinsic(extrinsic.id);
      res.json({ extrinsic, events });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch extrinsic" });
    }
  });

  // ---- Accounts ----
  app.get("/api/accounts/:address", async (req, res) => {
    try {
      const { address } = req.params;
      // SS58 addresses are 46-48 alphanumeric chars; also allow 0x-prefixed EVM addresses
      if (!address || address.length > 128) {
        res.status(400).json({ error: "Invalid address format" });
        return;
      }
      const account = await getAccount(address);
      if (!account) {
        res.status(404).json({ error: "Account not found" });
        return;
      }

      const recentExtrinsics = await getExtrinsicsBySigner(
        address,
        20
      );

      res.json({
        account: {
          address: account.address,
          publicKey: account.publicKey,
          identity: account.identity,
          lastActiveBlock: account.lastActiveBlock,
          createdAtBlock: account.createdAtBlock,
        },
        balance: account.balance,
        recentExtrinsics,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  // ---- Search ----
  app.get("/api/search", async (req, res) => {
    try {
      const input = String(req.query.q ?? "").trim();
      if (!input) {
        res.json({ results: [] });
        return;
      }

      const inputType = detectSearchType(input);
      const results = [];

      switch (inputType) {
        case "blockNumber": {
          const height = parseInt(input, 10);
          const block = await getBlockByHeight(height);
          if (block) {
            results.push({
              type: "block",
              id: String(block.height),
              label: `Block #${block.height}`,
              url: `/block/${block.height}`,
            });
          }
          break;
        }

        case "hash": {
          const match = await searchByHash(input);
          if (match) {
            if (match.type === "block") {
              const block = match.data as { height: number };
              results.push({
                type: "block",
                id: String(block.height),
                label: `Block #${block.height}`,
                url: `/block/${block.height}`,
              });
            } else {
              const ext = match.data as { txHash: string; blockHeight: number };
              results.push({
                type: "extrinsic",
                id: ext.txHash,
                label: `Extrinsic in block #${ext.blockHeight}`,
                url: `/extrinsic/${ext.txHash}`,
              });
            }
          }
          break;
        }

        case "address": {
          const account = await getAccount(input);
          if (account) {
            results.push({
              type: "account",
              id: account.address,
              label: `Account ${account.address}`,
              url: `/account/${account.address}`,
            });
          } else {
            // Even if we haven't indexed this account, provide a link
            results.push({
              type: "account",
              id: input,
              label: `Account ${input}`,
              url: `/account/${input}`,
            });
          }
          break;
        }
      }

      res.json({ results });
    } catch (err) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // ---- Extensions ----
  app.get("/api/extensions", (_req, res) => {
    res.json({ extensions: registry.getExtensions() });
  });

  return app;
}
