-- Staking extension tables

CREATE TABLE IF NOT EXISTS staking_rewards (
  id              SERIAL PRIMARY KEY,
  block_height    BIGINT NOT NULL,
  era             INTEGER,
  validator       VARCHAR(66) NOT NULL,
  nominator       VARCHAR(66),
  amount          VARCHAR(40) NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staking_rewards_validator ON staking_rewards(validator);
CREATE INDEX IF NOT EXISTS idx_staking_rewards_era ON staking_rewards(era);
CREATE INDEX IF NOT EXISTS idx_staking_rewards_block ON staking_rewards(block_height);

CREATE TABLE IF NOT EXISTS staking_slashes (
  id              SERIAL PRIMARY KEY,
  block_height    BIGINT NOT NULL,
  era             INTEGER,
  validator       VARCHAR(66) NOT NULL,
  amount          VARCHAR(40) NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staking_slashes_validator ON staking_slashes(validator);

CREATE TABLE IF NOT EXISTS staking_bonds (
  id              SERIAL PRIMARY KEY,
  block_height    BIGINT NOT NULL,
  stash           VARCHAR(66) NOT NULL,
  amount          VARCHAR(40) NOT NULL,
  action          VARCHAR(16) NOT NULL, -- 'bond', 'bond_extra', 'unbond', 'withdrawn'
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staking_bonds_stash ON staking_bonds(stash);

CREATE TABLE IF NOT EXISTS staking_stats (
  era                 INTEGER PRIMARY KEY,
  total_staked        VARCHAR(40) NOT NULL DEFAULT '0',
  validator_count     INTEGER NOT NULL DEFAULT 0,
  nominator_count     INTEGER NOT NULL DEFAULT 0,
  total_reward        VARCHAR(40) NOT NULL DEFAULT '0',
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
