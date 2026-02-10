import pg from "pg";

const { Pool } = pg;

export type DbPool = pg.Pool;
export type DbClient = pg.PoolClient;

let pool: DbPool | null = null;

/** Initialize the connection pool */
export function createPool(connectionString?: string): DbPool {
  if (pool) return pool;

  pool = new Pool({
    connectionString: connectionString ?? process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on("error", (err) => {
    console.error("[DB] Unexpected pool error:", err.message);
  });

  return pool;
}

/** Get the existing pool or create one */
export function getPool(): DbPool {
  if (!pool) {
    return createPool();
  }
  return pool;
}

/** Run a query with automatic client checkout */
export async function query<T extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const p = getPool();
  return p.query<T>(text, params);
}

/** Run multiple queries in a transaction */
export async function transaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Graceful shutdown */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
