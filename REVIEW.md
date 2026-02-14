# Polka-Xplo — Comprehensive Code Review

**Review Date:** February 14, 2025
**Reviewer:** Automated Analysis + Manual Inspection
**Scope:** Full codebase — monorepo infrastructure, all 4 packages, 4 extensions, Docker, CI/CD, security, testing, and performance.
**Codebase Version:** Commit `9435701` on `main`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Codebase Metrics](#codebase-metrics)
4. [Findings: Critical](#-critical)
5. [Findings: High](#-high-priority)
6. [Findings: Medium](#-medium-priority)
7. [Findings: Low / Informational](#-low--informational)
8. [Previously Fixed Findings](#-previously-fixed)
9. [What's Working Well](#-whats-working-well)
10. [Scale Considerations](#-scale-considerations)
11. [Recommended Roadmap](#recommended-roadmap)

---

## Executive Summary

Polka-Xplo is an **architecturally sound** Substrate blockchain explorer built as a TypeScript monorepo. Its dual-stream ingestion pipeline, plugin-based extension system, and comprehensive REST API demonstrate professional-grade engineering. The project is **production-viable** for single-chain explorers with moderate traffic (< 10M blocks).

This review identifies **28 findings** across the full codebase:

| Severity        | Open | Previously Fixed | Total |
|-----------------|------|------------------|-------|
| 🔴 Critical     | 3    | 1                | 4     |
| 🟠 High         | 5    | 2                | 7     |
| 🟡 Medium       | 7    | 4                | 11    |
| 🟢 Low / Info   | 6    | 5                | 11    |
| **Total**       | **21** | **12**        | **28** |

**Key Strengths:**
- Dual-stream (finalized + best-head) ingestion with automatic gap repair
- Latency-weighted RPC pool with failover and exponential backoff
- Plugin system with manifest-based discovery, dispatch indexes, and historical backfill
- Comprehensive OpenAPI/Swagger-documented REST API (40+ endpoints)
- Transaction-wrapped block processing with deadlock retry
- Professional-grade observability (DbMetrics, IndexerMetrics, RPC health)

**Key Risks:**
- `server.ts` is a 2,884-line monolithic file — the largest maintainability debt
- Test coverage is minimal (5 test files / ~660 lines covering < 10% of codebase)
- Extension system has no sandboxing or manifest validation
- `@typescript-eslint/no-explicit-any` disabled globally

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Monorepo (Turborepo + npm workspaces) │
├──────────────┬──────────────┬───────────────┬────────────────┤
│ packages/    │ packages/    │ packages/     │ packages/      │
│ shared       │ db           │ indexer       │ web            │
│ Types,       │ PostgreSQL   │ Pipeline,     │ Next.js 15     │
│ Config,      │ Pool,        │ API Server,   │ React 19       │
│ SS58 utils   │ Queries,     │ RPC Pool,     │ Tailwind CSS   │
│              │ Migrations   │ Plugins       │ 33 components  │
├──────────────┴──────────────┴───────────────┴────────────────┤
│ extensions/                                                   │
│ ext-assets · ext-governance · ext-xcm · pallet-staking       │
├──────────────────────────────────────────────────────────────┤
│ Infrastructure: Docker (node:20-slim, PostgreSQL 16, Redis 7)│
└──────────────────────────────────────────────────────────────┘
```

**Dependency Graph:** `shared` → `db` → `indexer`, `shared` → `web` — no circular dependencies.

**Data Flow:**
1. **Ingestion Pipeline** subscribes to finalized + best-head block streams via PAPI
2. **Block Processor** decodes extrinsics/events, writes to PostgreSQL in a single transaction
3. **Plugin Registry** dispatches events to extension handlers via dispatch indexes
4. **Express API** serves indexed data to the frontend (40+ REST endpoints)
5. **Next.js Frontend** fetches from API via proxy route (`/indexer-api/`)

---

## Codebase Metrics

| Metric | Value |
|--------|-------|
| **Total TypeScript files** | ~80 |
| **Total lines of code** | ~12,500 |
| **Largest file** | `server.ts` — 2,884 lines |
| **Second largest** | `queries.ts` — 1,030 lines |
| **Third largest** | `ext-xcm/event-handlers.ts` — 1,016 lines |
| **Web components** | 33 files, 3,870 lines |
| **API endpoints** | 40+ (all Swagger-documented) |
| **Test files** | 5 files, ~660 lines |
| **Extensions** | 4 (assets, governance, staking, xcm) |
| **SQL migrations** | 6 files (2 core + 4 extension) |
| **Docker services** | 4 (PostgreSQL, Redis, Indexer, Web) |
| **Node.js version** | ≥ 20 (enforced via `engines`) |
| **TypeScript** | 5.7+, strict mode, ES2022 target |

---

## 🔴 Critical

### C1. `server.ts` Monolithic File — 2,884 Lines

**File:** `packages/indexer/src/api/server.ts`
**Impact:** Maintainability, code review difficulty, merge conflict risk

The entire API surface — 40+ endpoints spanning blocks, extrinsics, events, accounts, search, stats, admin, assets, governance, XCM, and schemas — resides in a single function `createApiServer()`. This is the single largest technical debt in the project.

**Problems:**
- Impossible to review or modify a single domain without touching the entire file
- Swagger JSDoc annotations are inline, making the file ~60% documentation
- Rate limiter, admin auth, CORS, and Swagger setup intermixed with business logic
- Asset/governance/XCM routes duplicate the same pagination/filter pattern repeatedly

**Recommended fix:**
```
packages/indexer/src/api/
├── server.ts           # App setup, middleware, mount routers (~100 lines)
├── middleware/
│   ├── admin.ts        # requireAdmin
│   ├── rate-limit.ts   # rate limiter
│   └── cors.ts         # CORS
└── routes/
    ├── blocks.ts
    ├── extrinsics.ts
    ├── events.ts
    ├── accounts.ts
    ├── search.ts
    ├── stats.ts
    ├── admin.ts
    ├── assets.ts
    ├── governance.ts
    └── xcm.ts
```

---

### C2. Extension Code Execution Without Sandboxing

**File:** `packages/indexer/src/plugins/registry.ts`
**Impact:** Arbitrary code execution + SQL injection via extensions

1. `await import(handlerPath)` loads JavaScript from disk with full Node.js privileges
2. `ext.getMigrationSQL()` returns raw SQL executed via `await query(sql)` — no sandboxing
3. `manifest.json` is parsed with no JSON schema validation

**Short-term fix:**
- Validate manifests against a JSON Schema (e.g., Ajv)
- Wrap migration SQL in a transaction (see C3)
- Add a config allowlist for trusted extension IDs

**Long-term:** Accept the trust model (like VS Code extensions) and document it, or consider `isolated-vm` for sandboxed execution.

---

### C3. Extension Migrations Not Transactional

**File:** `packages/indexer/src/plugins/registry.ts` → `runMigrations()`
**Impact:** Partial schema corruption on migration failure

If an extension's migration SQL partially succeeds (e.g., first table created, second fails), the `extension_migrations` record is never inserted. On retry, the registry re-runs the migration, hitting `CREATE TABLE` conflicts or `ALTER TABLE` errors.

**Fix:**
```typescript
await transaction(async (client) => {
  await client.query(sql);
  await client.query(
    `INSERT INTO extension_migrations (extension_id, version) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [ext.manifest.id, ext.manifest.version],
  );
});
```

---

### ~~C4. Race Condition in Backfill Concurrency~~ ✅ FIXED

**Status:** Fixed — replaced shared mutable index with work-stealing queue (`queue.shift()`).

---

## 🟠 High Priority

### H1. Minimal Test Coverage (~10% of Codebase)

**Impact:** Regression risk, refactoring difficulty, contributor confidence

| Area | Test Files | Lines Tested | Lines Total | Coverage |
|------|-----------|-------------|------------|----------|
| `packages/shared` | 2 | ~196 | ~450 | ~43% |
| `packages/indexer` | 2 | ~371 | ~5,300 | ~7% |
| `packages/web` | 1 | ~93 | ~4,600 | ~2% |
| `packages/db` | 0 | 0 | ~1,200 | 0% |
| `extensions/` | 0 | 0 | ~1,700 | 0% |

**Critical untested areas:**
- **XCM SCALE decoding** — 300+ lines of bit-level hex parsing (`splitHexJunctions`, `scaleCompactLen`, `networkFieldLen`) with zero tests
- **Block processor** — transaction logic, deadlock retry, extrinsic truncation
- **API endpoints** — no request/response validation tests
- **Database queries** — no integration tests for SQL correctness
- **Extension event handlers** — all 4 extensions completely untested

**Recommended priority for new tests:**
1. XCM hex parsing utilities (unit tests — highest complexity/risk ratio)
2. Block processor transaction logic (integration tests with test DB)
3. API endpoint contracts (supertest with mocked DB)
4. Extension event handler logic (unit tests with mocked `query()`)

---

### H2. `@typescript-eslint/no-explicit-any` Disabled

**File:** `eslint.config.js`
**Impact:** TypeScript strict mode undermined

The ESLint config explicitly disables `@typescript-eslint/no-explicit-any`. This allows `any` to propagate through the codebase, defeating TypeScript's primary value proposition. Found instances in API handlers, event processing, and query result mapping.

**Fix:** Re-enable the rule and address violations incrementally:
```javascript
// eslint.config.js
"@typescript-eslint/no-explicit-any": "warn", // Start as warning, promote to error
```

---

### H3. Full Page Reloads on All Navigation

**Files:** `HeaderNav.tsx`, `Pagination.tsx`, `LatestBlocksCard.tsx`, `LatestTransfersCard.tsx`
**Impact:** Poor UX — every click triggers a full page reload

All internal links use plain `<a href="...">` instead of Next.js `<Link>` component. This bypasses the App Router's client-side SPA navigation, causing:
- Full JavaScript re-evaluation on every page change
- Loss of client state (SS58 prefix selection, scroll position)
- Unnecessary network round-trips for shared layout/bundles

**Fix:** Replace `<a href>` with `import Link from "next/link"` across all 33 components.

---

### H4. `COUNT(*)` on Large Tables Without Caching

**File:** `packages/db/src/queries.ts`
**Impact:** Slow pagination at scale — O(n) sequential scan per request

Every paginated endpoint runs `SELECT COUNT(*)` in parallel. On PostgreSQL, this requires a full table scan. At production scale (5M+ blocks, 20M+ events):
- Queries take 2-10 seconds
- 20 DB pool connections can be saturated by count queries alone

**Fix options:**
1. Cache counts in Redis with 30s TTL
2. Use `pg_stat_user_tables.n_live_tup` for approximate counts
3. Switch to cursor-based pagination (keyset, no total needed)
4. Materialized views for frequently filtered counts

---

### H5. SS58 Prefix Switching Is a No-Op

**File:** `packages/web/src/lib/ss58-context.tsx`
**Impact:** Address display doesn't update when user changes SS58 prefix

The `formatAddress` function detects "already SS58" addresses and returns them unchanged. Switching the prefix selector has no visible effect on displayed addresses.

**Fix:** Always decode to raw public key, then re-encode with the current prefix.

---

### ~~H6. No Pipeline Reconnection on Stream Error~~ ✅ FIXED

**Status:** Fixed — exponential backoff reconnection (1s → 60s cap).

---

### ~~H7. `hexToBytes` Crashes on Empty Input~~ ✅ FIXED

**Status:** Fixed — added empty-input guard.

---

## 🟡 Medium Priority

### M1. Hardcoded Native Symbol in XCM Extension

**File:** `extensions/ext-xcm/indexer/event-handlers.ts`
**Impact:** Not chain-agnostic — only correct for Ajuna Network

`resolveNativeSymbol()` falls back to hardcoded `"AJUN"` when the native token symbol cannot be determined from the event data. Deploying this to Polkadot, Kusama, or any other chain produces incorrect XCM transfer labels.

**Fix:** Read the native symbol from `system_properties` (already available via `getSystemProperties()` in `chain-state.ts`) or from environment variable `CHAIN_TOKEN_SYMBOL`.

---

### M2. SQL Table Name Interpolation in Governance Extension

**File:** `extensions/ext-governance/indexer/event-handlers.ts`
**Impact:** Theoretical SQL injection vector

`handleCollectiveProposed`, `handleCollectiveVoted`, and related handlers use template literals for table names (`` `INSERT INTO ${table}` ``). While table names come from hardcoded switch cases (not user input), this pattern is inherently risky and would fail a security audit.

**Fix:** Use a whitelist constant and assert membership:
```typescript
const VALID_TABLES = ["gov_council_motions", "gov_techcomm_proposals"] as const;
type CollectiveTable = typeof VALID_TABLES[number];
function validateTable(t: string): CollectiveTable {
  if (!VALID_TABLES.includes(t as CollectiveTable)) throw new Error(`Invalid table: ${t}`);
  return t as CollectiveTable;
}
```

---

### M3. Unbounded Runtime Metadata Cache

**File:** `packages/indexer/src/runtime-parser.ts`
**Impact:** Memory leak over extended uptime

`runtimeCache` is a `Map<number, RuntimeSummary>` with no eviction. During long backfills touching many spec versions, this grows unbounded.

**Fix:** Use `lru-cache` with max ~20 entries.

---

### M4. Duplicate Block Fetching Logic

**File:** `packages/indexer/src/ingestion/pipeline.ts`
**Impact:** Maintenance burden — same logic in `fetchBlockViaPapi()` and `fetchBlockViaLegacyRpc()`

Both methods contain identical extrinsic mapping, event decoding, timestamp extraction, and enrichment code. Fixes to one path must be manually mirrored to the other.

**Fix:** Extract to a shared `buildRawBlockData()` helper.

---

### M5. No Mobile Navigation

**File:** `packages/web/src/components/HeaderNav.tsx`
**Impact:** Unusable on mobile devices

Navigation links use `hidden sm:flex` — completely hidden on screens < 640px with no hamburger menu alternative. Mobile users cannot navigate the application.

**Fix:** Add a responsive hamburger menu using `useState` toggle and a slide-out drawer.

---

### M6. No Keyboard Accessibility for Dropdown Menus

**File:** `packages/web/src/components/HeaderNav.tsx`
**Impact:** WCAG 2.1 AA compliance failure

Dropdown menus in the header navigation lack:
- `Escape` key to close
- Arrow key navigation between items
- `aria-expanded`, `aria-haspopup` attributes
- Focus trap within open dropdown

---

### M7. Accounts Stored as Hex Public Key

**File:** `packages/indexer/src/ingestion/block-processor.ts`
**Impact:** Cross-referencing with other explorers requires normalization

Accounts are stored as hex public keys (`0x1234...`). Users searching with SS58 addresses must rely on `normalizeAddress()` in the API layer. This works but is fragile and complicates cross-referencing with Subscan/Statescan.

---

### ~~M8. No Security Headers~~ ✅ FIXED
### ~~M9. Inconsistent Pagination~~ ✅ FIXED
### ~~M10. Synchronous Filesystem in Discovery~~ ✅ FIXED
### ~~M11. Inconsistent Transfers Response~~ ✅ FIXED

---

## 🟢 Low / Informational

### L1. No API Client Retry Logic

**File:** `packages/web/src/lib/api.ts`
**Impact:** Single network failure causes page-level error

The `fetchJson()` function has no retry logic, no request timeout, and uniform `revalidate: 6` caching. A single transient network failure between the Next.js server and the indexer API causes the entire page to render an error state.

**Fix:** Add exponential retry (1-2 attempts) and per-endpoint revalidation windows:
```typescript
async function fetchJson<T>(url: string, options?: { retries?: number; revalidate?: number }): Promise<T> {
  const maxRetries = options?.retries ?? 2;
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fetch(url, { next: { revalidate: options?.revalidate ?? 6 } }).then(r => r.json()); }
    catch { if (i === maxRetries) throw e; await new Promise(r => setTimeout(r, 200 * 2 ** i)); }
  }
}
```

---

### L2. Docker Images Lack HEALTHCHECK

**Files:** `Dockerfile.indexer`, `Dockerfile.web`
**Impact:** Container orchestrators cannot determine container health independently

Health checks are defined in `docker-compose.yml` but not in the Dockerfiles. Kubernetes, ECS, and other orchestrators require `HEALTHCHECK` instructions.

**Fix:**
```dockerfile
# Dockerfile.indexer
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:3001/health || exit 1

# Dockerfile.web
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:3000/ || exit 1
```

---

### L3. `noUncheckedIndexedAccess` Not Enabled

**File:** `tsconfig.base.json`
**Impact:** Potential undefined access bugs at array boundaries

The codebase accesses array elements by index without null checks (e.g., `result.rows[0].count`). Enabling `"noUncheckedIndexedAccess": true` would catch these at compile time.

---

### L4. Dark Mode Hardcoded

**File:** `packages/web/src/app/layout.tsx`
**Impact:** No light mode option for users

`className="dark"` is hardcoded on the `<html>` element. No theme toggle or `prefers-color-scheme` media query is respected.

---

### L5. Hardcoded DB Credentials in Docker Compose

**File:** `docker-compose.yml`
**Impact:** Security risk if compose file is deployed to production as-is

`POSTGRES_USER: polkaxplo` and `POSTGRES_PASSWORD: polkaxplo` are hardcoded. Redis has no password. While `.env.example` documents proper configuration, developers may deploy with defaults.

**Fix:** Use `${POSTGRES_PASSWORD:?error}` syntax to require explicit configuration.

---

### L6. Web Container Missing Health Dependency

**File:** `docker-compose.yml`
**Impact:** Web container may start before indexer API is ready

The `explorer-web` service `depends_on` the indexer but without a `condition: service_healthy` check (unlike the DB and Redis services). This can cause initial page loads to fail.

---

### ~~L7–L11. Previously Fixed~~ ✅

See [Previously Fixed section](#-previously-fixed) for details.

---

## ✅ Previously Fixed

These findings from earlier review iterations have been successfully resolved:

| ID | Finding | Fix Summary |
|----|---------|-------------|
| C4 | Race condition in `runWithConcurrency` | Work-stealing queue pattern (`queue.shift()`) |
| H6 | No pipeline reconnection on stream error | Exponential backoff (1s → 60s), retry counter resets on success |
| H7 | `hexToBytes` crashes on empty input | Guard `if (!clean) return new Uint8Array(0)` |
| M8 | No security headers on web frontend | Added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| M9 | Inconsistent pagination numbering | Standardized to 1-based: `Math.floor(offset / limit) + 1` |
| M10 | Synchronous filesystem in extension discovery | Replaced with `fs/promises` async equivalents |
| M11 | Inconsistent `/api/transfers` response | Unified to `{ data, total, page, pageSize, hasMore }` |
| L7 | Docker indexer uses Alpine | Switched to `node:20-slim` |
| L8 | Missing `export const dynamic` on pages | Added `"force-dynamic"` to all 12 data pages |
| L9 | `Pagination` uses `useCallback` incorrectly | Replaced with `useMemo` |
| L10 | No `"type": "module"` in root `package.json` | Added ESM marker |
| L11 | Dead config in `next.config.js` | Removed `experimental.serverActions` |

---

## ✅ What's Working Well

### Architecture & Design

1. **Monorepo topology** — Clean dependency graph with no circular dependencies. Turborepo properly configured with task dependencies (`^build` for dependents) and file-hash caching.

2. **Dual-stream ingestion** — Finalized + best-head streaming with automatic backfill is the textbook-correct pattern for Substrate explorers. The backfill uses configurable batch size (`BATCH_SIZE`), bounded concurrency (`BACKFILL_CONCURRENCY`), and a work-stealing queue.

3. **RPC Pool** — Latency-weighted load balancing with warm-up phase (round-robin for first 20 calls), exponential backoff suspension (5s → 120s), and automatic unsuspension when all endpoints fail. This is production-quality infrastructure.

4. **Plugin system** — Manifest-based discovery → registration → dispatch index construction → migration management → historical backfill. The `eventIndex` and `callIndex` maps provide O(1) handler lookup per event/call.

5. **Transaction-wrapped block processing** — All DB writes for a block are atomic. The deadlock retry with jitter (50ms + random * 150ms * attempt) and sorted account upserts are correct concurrency patterns.

### Database

6. **Schema design** — Proper relational design with `ON DELETE CASCADE`/`SET NULL`, composite indexes, GIN indexes on JSONB columns, and `CREATE TABLE IF NOT EXISTS` for idempotent migrations.

7. **Idempotent writes** — `ON CONFLICT DO UPDATE` / `DO NOTHING` throughout, enabling safe re-processing without data corruption.

8. **DbMetrics** — Rolling window (1,000 queries) for read/write latency percentiles (p50/p95/p99), slow query counter (>100ms), pool utilization tracking. Production-grade observability.

### API & Frontend

9. **OpenAPI documentation** — All 40+ endpoints annotated with JSDoc/Swagger tags, parameters, request/response schemas, and security requirements.

10. **Admin API security** — `requireAdmin` middleware at the prefix level (`/api/admin/`), configurable via `ADMIN_API_KEY`, disabled in production if unset.

11. **Rate limiting** — In-memory per-IP rate limiter (configurable window/max via env vars), automatic stale entry cleanup every 5 minutes.

12. **Theme system** — `NEXT_PUBLIC_CHAIN_ID` build arg resolves chain branding at Next.js build time. CSS custom property `--color-accent` enables runtime theme consistency.

13. **IndexerMetrics** — Ring buffers for throughput calculation, ETA estimation, memory tracking, and block processing time percentiles. Powers a comprehensive `/api/indexer-status` dashboard.

---

## 📊 Scale Considerations

The architecture is appropriate for chains with < 10M blocks. Beyond that:

| Component | Bottleneck | Threshold | Mitigation |
|-----------|-----------|-----------|------------|
| `COUNT(*)` queries | Sequential scan | ~5M rows | Approximate counts or Redis cache |
| `events` table | Table size | ~20M rows | [Table partitioning](https://www.postgresql.org/docs/16/ddl-partitioning.html) by block range |
| Backfill | Single-process | ~50M blocks | Worker-based horizontal scaling |
| `getAccounts` | Correlated subquery | ~500K accounts | Materialized view for extrinsic counts |
| Runtime cache | Memory growth | ~50+ spec versions | LRU cache eviction |
| `server.ts` | Cognitive load | Already exceeded | Route modularization (C1) |
| Connection pool | 20 max connections | ~100 req/s | PgBouncer or pool scaling |

---

## Recommended Roadmap

### Phase 1 — Immediate (Before Next Release)

| Priority | ID | Action |
|----------|----|--------|
| 🔴 | C1 | Split `server.ts` into route modules |
| 🔴 | C3 | Wrap extension migrations in transactions |
| 🟠 | H1 | Add tests for XCM SCALE decoding, block processor, API contracts |
| 🟠 | H3 | Replace `<a href>` with Next.js `<Link>` across all components |

### Phase 2 — Short-Term (Next Sprint)

| Priority | ID | Action |
|----------|----|--------|
| 🟠 | H2 | Re-enable `no-explicit-any` as warning, fix violations |
| 🟠 | H5 | Fix SS58 prefix re-encoding |
| 🟡 | M1 | Make XCM native symbol configurable |
| 🟡 | M2 | Whitelist governance table names |
| 🟡 | M5 | Add mobile hamburger menu |
| 🟡 | M6 | Keyboard accessibility for dropdown menus |

### Phase 3 — Medium-Term (Next Major Version)

| Priority | ID | Action |
|----------|----|--------|
| 🔴 | C2 | Validate extension manifests (JSON Schema) |
| 🟠 | H4 | Implement count caching / approximate pagination |
| 🟡 | M3 | LRU cache for runtime metadata |
| 🟡 | M4 | Extract shared block fetch logic |
| 🟢 | L1 | API client retry & timeout |
| 🟢 | L2 | HEALTHCHECK in Dockerfiles |
| 🟢 | L3 | Enable `noUncheckedIndexedAccess` |

### Phase 4 — Nice-to-Have

| Priority | ID | Action |
|----------|----|--------|
| 🟢 | L4 | Light/dark mode toggle |
| 🟢 | L5 | Externalize Docker credentials |
| 🟢 | L6 | Health condition on web container dependency |
| 🟡 | M7 | Store canonical SS58 alongside hex key |
