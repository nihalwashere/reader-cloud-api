# reader-cloud-api

Backend API server for Reader Cloud — exposes `@vakra-dev/reader` as a hosted scraping API.

## Tech Stack

- **Runtime:** Node.js (v22) + TypeScript
- **Framework:** Express
- **Database:** MongoDB
- **Scraping:** `@vakra-dev/reader`
- **Auth:** API key via `X-API-Key` header
- **Caching:** MongoDB TTL collection (24h default)

## Setup

### Prerequisites

- Node.js v22+
- MongoDB running locally or remotely

### Installation

```bash
npm install
cp .env.example .env
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/reader-cloud` | MongoDB connection string |
| `READER_POOL_SIZE` | `3` | Browser pool size |
| `RATE_LIMIT_RPM` | `60` | Requests per minute per API key |
| `CACHE_TTL_SECONDS` | `86400` | Cache expiry (default 24 hours) |
| `PROXY_DATACENTER` | | Datacenter proxy URL (e.g. `http://user:pass@host:port`) |
| `NODE_ENV` | `development` | Environment |

### Create an API Key

API keys are created manually via the seed script:

```bash
npm run seed
```

This generates a key prefixed with `rdr_` and prints it to the console.

### Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

## API

### Health Check

```
GET /health
```

Returns `{ "status": "ok" }`. No auth required.

### Scrape

```
POST /v1/scrape
```

**Headers:**

```
X-API-Key: <your-api-key>
Content-Type: application/json
```

**Request body:**

```json
{
  "url": "https://example.com",
  "formats": ["markdown"],
  "onlyMainContent": true,
  "includeTags": [],
  "excludeTags": [],
  "waitForSelector": null,
  "timeoutMs": 30000
}
```

Only `url` is required. All other fields are optional.

**Response:**

```json
{
  "success": true,
  "cached": false,
  "data": {
    "markdown": "# Page Title\n\nContent...",
    "html": "",
    "metadata": {
      "url": "https://example.com",
      "title": "Page Title",
      "description": "...",
      "duration": 1234,
      "scrapedAt": "2026-01-31T..."
    }
  }
}
```

The `cached` field indicates whether the response was served from cache or freshly scraped.

**Example:**

```bash
curl -X POST http://localhost:3001/v1/scrape \
  -H "X-API-Key: rdr_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Invalid request (missing URL, bad params) |
| `401` | Missing or invalid API key |
| `429` | Rate limit exceeded |
| `502` | Failed to reach target URL |
| `504` | Scrape timed out |
| `500` | Internal server error |

## Project Structure

```
src/
├── index.ts              # Entry point
├── config.ts             # Environment config
├── routes/
│   └── scrape.ts         # POST /v1/scrape
├── middleware/
│   ├── auth.ts           # API key validation
│   ├── rate-limit.ts     # Per-key rate limiting
│   └── error-handler.ts  # Error → HTTP status mapping
├── services/
│   ├── reader.ts         # ReaderClient singleton
│   ├── cache.ts          # URL cache (get/set)
│   └── usage.ts          # Usage logging
├── models/
│   ├── api-key.ts        # API key schema
│   ├── cache.ts          # Cache entry schema (TTL index)
│   └── usage.ts          # Usage log schema
├── scripts/
│   └── seed-key.ts       # Manual API key creation
└── utils/
    └── logger.ts         # Pino logger
```
