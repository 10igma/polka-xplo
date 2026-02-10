import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPool, closePool, query } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findMigrationsDir(): string {
  // When run from dist/, look for src/migrations relative to the package root
  const candidates = [
    path.join(__dirname, "..", "src", "migrations"),  // dist/ → package root → src/migrations
    path.join(__dirname, "migrations"),                // if migrations are alongside compiled output
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error(
    `Migrations directory not found. Searched: ${candidates.join(", ")}`
  );
}

async function runMigrations(): Promise<void> {
  console.log("[DB] Running migrations...");
  createPool();

  const migrationsDir = findMigrationsDir();
  console.log(`[DB] Using migrations from: ${migrationsDir}`);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`[DB] Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    await query(sql);
    console.log(`[DB] Applied: ${file}`);
  }

  console.log("[DB] All migrations applied.");
  await closePool();
}

runMigrations().catch((err) => {
  console.error("[DB] Migration failed:", err);
  process.exit(1);
});
