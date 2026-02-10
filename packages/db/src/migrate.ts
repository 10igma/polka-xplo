import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPool, closePool, query } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findMigrationsDir(): string {
  // When run from dist/, look for src/migrations relative to the package root
  const candidates = [
    path.join(__dirname, "..", "src", "migrations"), // dist/ → package root → src/migrations
    path.join(__dirname, "migrations"), // if migrations are alongside compiled output
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error(`Migrations directory not found. Searched: ${candidates.join(", ")}`);
}

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await query<{ filename: string }>(
    `SELECT filename FROM schema_migrations ORDER BY filename`,
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function recordMigration(filename: string): Promise<void> {
  await query(`INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`, [
    filename,
  ]);
}

async function runMigrations(): Promise<void> {
  console.log("[DB] Running migrations...");
  createPool();

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const migrationsDir = findMigrationsDir();
  console.log(`[DB] Using migrations from: ${migrationsDir}`);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let newCount = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[DB] Already applied: ${file}`);
      continue;
    }
    console.log(`[DB] Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    await query(sql);
    await recordMigration(file);
    console.log(`[DB] Applied: ${file}`);
    newCount++;
  }

  console.log(
    `[DB] Migrations complete. ${newCount} new, ${files.length - newCount} already applied.`,
  );
  await closePool();
}

runMigrations().catch((err) => {
  console.error("[DB] Migration failed:", err);
  process.exit(1);
});
