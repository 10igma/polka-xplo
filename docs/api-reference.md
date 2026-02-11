# API Reference

The indexer exposes a REST API on port 3001 (configurable via `API_PORT`). Interactive Swagger documentation is available at [http://localhost:3001/api-docs](http://localhost:3001/api-docs).

All paginated endpoints use **1-based** page numbering with `limit` and `page` parameters.

---

## Health & Status

### `GET /health`

Returns the indexer's operational status.

```json
{
  "status": "healthy",
  "nodeConnected": true,
  "dbConnected": true,
  "chainTip": 8250000,
  "indexedTip": 8249998,
  "syncLag": 2,
  "timestamp": 1707580800000
}
```

### `GET /api/rpc-health`

Returns health stats for all RPC endpoints in the pool.

```json
{
  "endpointCount": 3,
  "endpoints": [
    { "url": "https://rpc-para.ajuna.network", "healthy": true, "successes": 5079, "failures": 0 },
    { "url": "https://ajuna.ibp.network", "healthy": true, "successes": 4821, "failures": 0 },
    { "url": "https://ajuna.dotters.network", "healthy": true, "successes": 4756, "failures": 1 }
  ]
}
```

### `GET /api/indexer-status`

Returns real-time indexer metrics (powers the Status dashboard).

```json
{
  "blocksPerMinute": 42.5,
  "blocksPerHour": 2550,
  "totalIndexed": 1250000,
  "chainTip": 8250000,
  "estimatedCompletion": "2026-02-15T12:00:00Z",
  "errors": 0,
  "memoryUsageMB": 185,
  "databaseSizeMB": 2048,
  "uptime": 86400
}
```

---

## Blocks

### `GET /api/blocks`

Paginated list of recent blocks (newest first).

| Parameter | Type   | Default | Description        |
| --------- | ------ | ------- | ------------------ |
| `limit`   | number | 20      | Results per page   |
| `page`    | number | 1       | Page number        |

### `GET /api/blocks/:id`

Block details by height (numeric) or hash (0x-prefixed). Includes the block record, all extrinsics, and all events.

---

## Extrinsics

### `GET /api/extrinsics`

Paginated list of extrinsics.

| Parameter | Type    | Default | Description                                |
| --------- | ------- | ------- | ------------------------------------------ |
| `limit`   | number  | 25      | Results per page                           |
| `page`    | number  | 1       | Page number                                |
| `signed`  | boolean | —       | `true` to hide unsigned inherents          |

### `GET /api/extrinsics/:hash`

Extrinsic details by transaction hash. Includes decoded arguments and all correlated events.

---

## Events

### `GET /api/events`

Paginated list of events.

| Parameter | Type   | Default | Description                        |
| --------- | ------ | ------- | ---------------------------------- |
| `limit`   | number | 25      | Results per page                   |
| `page`    | number | 1       | Page number                        |
| `module`  | string | —       | Filter by module (e.g., `Balances`) |

---

## Transfers

### `GET /api/transfers`

Paginated list of `Balances.Transfer` events.

| Parameter | Type   | Default | Description      |
| --------- | ------ | ------- | ---------------- |
| `limit`   | number | 25      | Results per page |
| `page`    | number | 1       | Page number      |

Response shape:

```json
{
  "data": [...],
  "total": 12345,
  "limit": 25,
  "page": 1
}
```

---

## Accounts

### `GET /api/accounts`

Paginated, ranked list of accounts with balances and extrinsic counts.

| Parameter | Type   | Default | Description      |
| --------- | ------ | ------- | ---------------- |
| `limit`   | number | 25      | Results per page |
| `page`    | number | 1       | Page number      |

### `GET /api/accounts/:address`

Account details including identity, balance breakdown (free, reserved, frozen), and recent extrinsics. Accepts SS58 addresses of any prefix or hex public keys.

---

## Digest Logs

### `GET /api/logs`

Paginated list of block digest logs (PreRuntime, Seal, Consensus, etc.).

| Parameter | Type   | Default | Description      |
| --------- | ------ | ------- | ---------------- |
| `limit`   | number | 25      | Results per page |
| `page`    | number | 1       | Page number      |

---

## Runtime Metadata

### `GET /api/runtime`

List of all known spec versions with their block ranges.

### `GET /api/runtime/:specVersion`

Parsed pallet metadata for a specific spec version. Returns pallet name, index, and counts of storage items, calls, events, constants, and errors.

---

## Search

### `GET /api/search?q=<query>`

Smart search with heuristic input detection:

| Input Type      | Detection Rule                  | Behavior                            |
| --------------- | ------------------------------- | ----------------------------------- |
| Block number    | Numeric                         | Search blocks by height             |
| Hash            | 0x-prefixed, 66 chars           | Search blocks and extrinsics        |
| Address         | SS58 or hex public key          | Link to account page                |

---

## Extensions

### `GET /api/extensions`

Returns the list of all registered extension manifests.

---

**Next:** [Extension Guide](extension-guide.md) · [Architecture](architecture.md)
