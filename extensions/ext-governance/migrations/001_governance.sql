-- ext-governance: Democracy, Council, TechnicalCommittee, Preimage tables

-- ============================================================
-- Democracy Proposals
-- ============================================================
CREATE TABLE IF NOT EXISTS gov_democracy_proposals (
  proposal_index    INTEGER PRIMARY KEY,
  block_height      BIGINT NOT NULL,
  deposit           VARCHAR(40) NOT NULL DEFAULT '0',
  status            VARCHAR(20) NOT NULL DEFAULT 'proposed',  -- proposed, tabled, referendum
  referendum_index  INTEGER,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_dem_proposals_status ON gov_democracy_proposals(status);

-- ============================================================
-- Democracy Referenda
-- ============================================================
CREATE TABLE IF NOT EXISTS gov_democracy_referenda (
  ref_index         INTEGER PRIMARY KEY,
  block_height      BIGINT NOT NULL,
  threshold         VARCHAR(30),   -- SuperMajorityApprove, SuperMajorityAgainst, SimpleMajority
  status            VARCHAR(20) NOT NULL DEFAULT 'started',  -- started, passed, notpassed
  end_block         BIGINT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_dem_referenda_status ON gov_democracy_referenda(status);

-- ============================================================
-- Democracy Votes
-- ============================================================
CREATE TABLE IF NOT EXISTS gov_democracy_votes (
  id                SERIAL PRIMARY KEY,
  ref_index         INTEGER NOT NULL,
  block_height      BIGINT NOT NULL,
  voter             VARCHAR(66) NOT NULL,
  is_aye            BOOLEAN NOT NULL,
  conviction        INTEGER NOT NULL DEFAULT 0,
  balance           VARCHAR(40) NOT NULL DEFAULT '0',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_dem_votes_ref ON gov_democracy_votes(ref_index);
CREATE INDEX IF NOT EXISTS idx_gov_dem_votes_voter ON gov_democracy_votes(voter);

-- ============================================================
-- Council Motions
-- ============================================================
CREATE TABLE IF NOT EXISTS gov_council_motions (
  proposal_index    INTEGER PRIMARY KEY,
  proposal_hash     VARCHAR(66) NOT NULL,
  block_height      BIGINT NOT NULL,
  proposer          VARCHAR(66) NOT NULL,
  threshold         INTEGER NOT NULL DEFAULT 0,
  aye_count         INTEGER NOT NULL DEFAULT 0,
  nay_count         INTEGER NOT NULL DEFAULT 0,
  status            VARCHAR(20) NOT NULL DEFAULT 'proposed',  -- proposed, approved, disapproved, executed, closed
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_council_motions_status ON gov_council_motions(status);
CREATE INDEX IF NOT EXISTS idx_gov_council_motions_hash ON gov_council_motions(proposal_hash);

-- ============================================================
-- Council Votes
-- ============================================================
CREATE TABLE IF NOT EXISTS gov_council_votes (
  id                SERIAL PRIMARY KEY,
  proposal_hash     VARCHAR(66) NOT NULL,
  block_height      BIGINT NOT NULL,
  voter             VARCHAR(66) NOT NULL,
  is_aye            BOOLEAN NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_council_votes_hash ON gov_council_votes(proposal_hash);
CREATE INDEX IF NOT EXISTS idx_gov_council_votes_voter ON gov_council_votes(voter);

-- ============================================================
-- TechnicalCommittee Proposals
-- ============================================================
CREATE TABLE IF NOT EXISTS gov_techcomm_proposals (
  proposal_index    INTEGER PRIMARY KEY,
  proposal_hash     VARCHAR(66) NOT NULL,
  block_height      BIGINT NOT NULL,
  proposer          VARCHAR(66) NOT NULL,
  threshold         INTEGER NOT NULL DEFAULT 0,
  aye_count         INTEGER NOT NULL DEFAULT 0,
  nay_count         INTEGER NOT NULL DEFAULT 0,
  status            VARCHAR(20) NOT NULL DEFAULT 'proposed',  -- proposed, approved, disapproved, executed, closed
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_techcomm_proposals_status ON gov_techcomm_proposals(status);
CREATE INDEX IF NOT EXISTS idx_gov_techcomm_proposals_hash ON gov_techcomm_proposals(proposal_hash);

-- ============================================================
-- TechnicalCommittee Votes
-- ============================================================
CREATE TABLE IF NOT EXISTS gov_techcomm_votes (
  id                SERIAL PRIMARY KEY,
  proposal_hash     VARCHAR(66) NOT NULL,
  block_height      BIGINT NOT NULL,
  voter             VARCHAR(66) NOT NULL,
  is_aye            BOOLEAN NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_techcomm_votes_hash ON gov_techcomm_votes(proposal_hash);
CREATE INDEX IF NOT EXISTS idx_gov_techcomm_votes_voter ON gov_techcomm_votes(voter);

-- ============================================================
-- Preimages
-- ============================================================
CREATE TABLE IF NOT EXISTS gov_preimages (
  hash              VARCHAR(66) PRIMARY KEY,
  block_height      BIGINT NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'noted',  -- noted, requested, cleared
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
