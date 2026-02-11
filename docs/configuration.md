# Configuration

All configuration is done through environment variables and the `chain-config.json` file.

## Environment Variables

Copy `.env.example` to `.env` for local development. In Docker, these are set in `docker-compose.yml` and override files.

### Indexer

| Variable               | Default                                                     | Description                                                                 |
| ---------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`         | `postgresql://polkaxplo:polkaxplo@localhost:5432/polkaxplo` | PostgreSQL connection string                                                |
| `REDIS_URL`            | `redis://localhost:6379`                                    | Redis connection string                                                     |
| `ARCHIVE_NODE_URL`     | `wss://rpc.polkadot.io`                                     | Comma-separated RPC endpoint(s) for round-robin load balancing and failover |
| `CHAIN_ID`             | `polkadot`                                                  | Chain to index (must match an entry in `chain-config.json`)                 |
| `API_PORT`             | `3001`                                                      | REST API server port                                                        |
| `BATCH_SIZE`           | `100`                                                       | Blocks per backfill batch                                                   |
| `BACKFILL_CONCURRENCY` | `10`                                                        | Parallel block processing workers during backfill                           |

### Frontend

| Variable               | Default                  | Description                                    |
| ---------------------- | ------------------------ | ---------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:3001`  | API base URL (used by the browser)             |
| `NEXT_PUBLIC_WS_URL`   | `ws://localhost:3001`    | WebSocket URL for live updates                 |
| `NEXT_PUBLIC_CHAIN_ID` | `polkadot`               | Chain ID for theming, branding, and formatting |

> **Note:** `NEXT_PUBLIC_*` variables are inlined at build time in Docker. Chain ID changes require a rebuild of the web image.

---

## Chain Configuration

The `chain-config.json` file at the project root defines all supported chains:

```json
{
  "chains": [
    {
      "id": "polkadot",
      "name": "Polkadot",
      "rpc": ["wss://rpc.polkadot.io"],
      "addressPrefix": 0,
      "tokenSymbol": "DOT",
      "tokenDecimals": 10,
      "colorTheme": "#E6007A"
    },
    {
      "id": "ajuna",
      "name": "Ajuna Network",
      "rpc": ["wss://rpc-para.ajuna.network"],
      "addressPrefix": 1328,
      "tokenSymbol": "AJUN",
      "tokenDecimals": 12,
      "colorTheme": "#F97316",
      "isParachain": true,
      "relayChain": "polkadot"
    }
  ],
  "defaultChain": "polkadot"
}
```

### Fields

| Field            | Type       | Required | Description                                        |
| ---------------- | ---------- | -------- | -------------------------------------------------- |
| `id`             | `string`   | Yes      | Unique chain identifier (used as `CHAIN_ID`)       |
| `name`           | `string`   | Yes      | Display name                                       |
| `rpc`            | `string[]` | Yes      | WebSocket RPC endpoints                            |
| `addressPrefix`  | `number`   | Yes      | SS58 address prefix                                |
| `tokenSymbol`    | `string`   | Yes      | Native token symbol (e.g., `DOT`, `KSM`, `AJUN`)  |
| `tokenDecimals`  | `number`   | Yes      | Token decimal places                               |
| `colorTheme`     | `string`   | Yes      | Hex color for UI branding                          |
| `isParachain`    | `boolean`  | No       | Whether this is a parachain                        |
| `relayChain`     | `string`   | No       | Parent relay chain ID                              |

### Adding a Custom Chain

1. Add an entry to `chain-config.json`:

```json
{
  "id": "mychain",
  "name": "My Chain",
  "rpc": ["wss://rpc.mychain.network", "wss://mychain.ibp.network"],
  "addressPrefix": 42,
  "tokenSymbol": "MYC",
  "tokenDecimals": 12,
  "colorTheme": "#FF6600",
  "isParachain": true,
  "relayChain": "polkadot"
}
```

2. Set `CHAIN_ID=mychain` and `ARCHIVE_NODE_URL=wss://rpc.mychain.network` in your environment.

### Multi-RPC Support

`ARCHIVE_NODE_URL` accepts comma-separated URLs. The indexer distributes JSON-RPC calls across all endpoints using round-robin with automatic failover:

```bash
ARCHIVE_NODE_URL=wss://rpc-para.ajuna.network,wss://ajuna.ibp.network,wss://ajuna.dotters.network
```

Monitor endpoint health via:

```bash
curl http://localhost:3001/api/rpc-health
```

---

## Docker Compose Overrides

The default `docker-compose.yml` targets Polkadot. Chain-specific overrides layer on top:

```bash
# Ajuna Network
docker compose -f docker-compose.yml -f docker-compose.ajuna.yml up -d
```

Create your own override file for other chains:

```yaml
# docker-compose.mychain.yml
services:
  explorer-indexer:
    environment:
      ARCHIVE_NODE_URL: wss://rpc.mychain.network
      CHAIN_ID: mychain
  explorer-web:
    build:
      args:
        NEXT_PUBLIC_CHAIN_ID: mychain
    environment:
      NEXT_PUBLIC_CHAIN_ID: mychain
```

Then launch:

```bash
docker compose -f docker-compose.yml -f docker-compose.mychain.yml up -d
```

---

## NPM Scripts

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `npm run build`      | Build all packages (via Turborepo)     |
| `npm run dev`        | Start all packages in dev mode         |
| `npm run lint`       | Type-check + ESLint all packages       |
| `npm run lint:fix`   | Auto-fix ESLint issues                 |
| `npm run format`     | Format all files with Prettier         |
| `npm run format:check` | Check formatting without writing     |
| `npm run test`       | Run test suite (Vitest)                |
| `npm run test:watch` | Run tests in watch mode                |
| `npm run db:migrate` | Run database migrations                |
| `npm run indexer:start` | Build and start the indexer          |
| `npm run web:dev`    | Start Next.js frontend in dev mode     |
| `npm run web:build`  | Production build of the frontend       |
| `npm run docker:up`  | Start Docker Compose services          |
| `npm run docker:down`| Stop Docker Compose services           |

---

**Next:** [API Reference](api-reference.md) · [Deployment](deployment.md) · [Development](development.md)
