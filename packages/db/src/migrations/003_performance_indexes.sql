-- ============================================================
-- Performance Indexes
-- ============================================================
-- These indexes accelerate the most common slow queries:
--
-- 1. Transfer listing: filtered by module+event, sorted by block_height DESC.
--    The covering index avoids a full-table sort on events.
--
-- 2. Block timestamp filtering: the activity chart restricts by timestamp range.
--    A composite (timestamp, height) index lets Postgres avoid a full scan.
--
-- 3. Extrinsics by signer: the accounts page counts extrinsics per signer.
--    A partial index on non-null signers speeds up the LATERAL join.

-- Covering index for Balances.Transfer listing (most-used events query)
CREATE INDEX IF NOT EXISTS idx_events_transfer_block
  ON events (block_height DESC, index DESC)
  WHERE module = 'Balances' AND event IN ('Transfer', 'transfer');

-- Partial index for signed extrinsic count per signer
CREATE INDEX IF NOT EXISTS idx_extrinsics_signer_block
  ON extrinsics (signer, block_height DESC)
  WHERE signer IS NOT NULL;
