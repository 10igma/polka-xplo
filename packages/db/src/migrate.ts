import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPool, closePool, query } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations(): Promise<void> {
  console.log("[DB] Running migrations...");
  createPool();

  const migrationsDir = path.join(__dirname, "..", "src", "migrations");
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
