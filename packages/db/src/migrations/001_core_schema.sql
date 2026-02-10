-- ============================================================
-- Core Schema for Polkadot Explorer
-- ============================================================

-- Blocks table: the chain skeleton
CREATE TABLE IF NOT EXISTS blocks (
  height        BIGINT PRIMARY KEY,
  hash          VARCHAR(66) NOT NULL UNIQUE,
  parent_hash   VARCHAR(66) NOT NULL,
  state_root    VARCHAR(66) NOT NULL,
  extrinsics_root VARCHAR(66) NOT NULL,
  timestamp     BIGINT,
  validator_id  VARCHAR(66),
  status        VARCHAR(16) NOT NULL DEFAULT 'best',
  spec_version  INTEGER NOT NULL DEFAULT 0,
  event_count   INTEGER NOT NULL DEFAULT 0,
  extrinsic_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
CREATE INDEX IF NOT EXISTS idx_blocks_status ON blocks(status);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);

-- Extrinsics table: user interactions
CREATE TABLE IF NOT EXISTS extrinsics (
  id            VARCHAR(128) PRIMARY KEY,  -- blockHeight-index
  block_height  BIGINT NOT NULL REFERENCES blocks(height) ON DELETE CASCADE,
  tx_hash       VARCHAR(66),
  index         INTEGER NOT NULL,
  signer        VARCHAR(66),
  module        VARCHAR(64) NOT NULL,
  call          VARCHAR(64) NOT NULL,
  args          JSONB NOT NULL DEFAULT '{}',
  success       BOOLEAN NOT NULL DEFAULT true,
  fee           VARCHAR(40),
  tip           VARCHAR(40),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extrinsics_block ON extrinsics(block_height);
CREATE INDEX IF NOT EXISTS idx_extrinsics_tx_hash ON extrinsics(tx_hash);
CREATE INDEX IF NOT EXISTS idx_extrinsics_signer ON extrinsics(signer);
CREATE INDEX IF NOT EXISTS idx_extrinsics_module_call ON extrinsics(module, call);
CREATE INDEX IF NOT EXISTS idx_extrinsics_args ON extrinsics USING GIN(args);

-- Events table: outcome logs
CREATE TABLE IF NOT EXISTS events (
  id            VARCHAR(128) PRIMARY KEY,  -- blockHeight-index
  block_height  BIGINT NOT NULL,
  extrinsic_id  VARCHAR(128) REFERENCES extrinsics(id) ON DELETE SET NULL,
  index         INTEGER NOT NULL,
  module        VARCHAR(64) NOT NULL,
  event         VARCHAR(64) NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}',
  phase_type    VARCHAR(32) NOT NULL,
  phase_index   INTEGER,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_block ON events(block_height);
CREATE INDEX IF NOT EXISTS idx_events_extrinsic ON events(extrinsic_id);
CREATE INDEX IF NOT EXISTS idx_events_module_event ON events(module, event);
CREATE INDEX IF NOT EXISTS idx_events_data ON events USING GIN(data);

-- Accounts table: identity and state
CREATE TABLE IF NOT EXISTS accounts (
  address         VARCHAR(66) PRIMARY KEY,
  public_key      VARCHAR(66),
  identity        JSONB,
  last_active_block BIGINT NOT NULL DEFAULT 0,
  created_at_block  BIGINT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_public_key ON accounts(public_key);
CREATE INDEX IF NOT EXISTS idx_accounts_last_active ON accounts(last_active_block);

-- Account balances snapshot (updated per finalized block)
CREATE TABLE IF NOT EXISTS account_balances (
  address       VARCHAR(66) PRIMARY KEY REFERENCES accounts(address) ON DELETE CASCADE,
  free          VARCHAR(40) NOT NULL DEFAULT '0',
  reserved      VARCHAR(40) NOT NULL DEFAULT '0',
  frozen        VARCHAR(40) NOT NULL DEFAULT '0',
  flags         VARCHAR(40) NOT NULL DEFAULT '0',
  updated_at_block BIGINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexer state tracking
CREATE TABLE IF NOT EXISTS indexer_state (
  chain_id              VARCHAR(64) PRIMARY KEY,
  last_finalized_block  BIGINT NOT NULL DEFAULT 0,
  last_best_block       BIGINT NOT NULL DEFAULT 0,
  last_spec_version     INTEGER NOT NULL DEFAULT 0,
  state                 VARCHAR(16) NOT NULL DEFAULT 'idle',
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extension migrations tracking
CREATE TABLE IF NOT EXISTS extension_migrations (
  extension_id  VARCHAR(128) NOT NULL,
  version       VARCHAR(32) NOT NULL,
  applied_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (extension_id, version)
);
