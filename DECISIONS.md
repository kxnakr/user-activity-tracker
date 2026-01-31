# Decisions

## Stack overview

Backend: Bun + Express, MongoDB (Mongoose), JWT, bcrypt for hashing, Zod for validation, Redis (ioredis) for rate limits and replay checks.

Frontend: React, TanStack Router for routing, React Query for data fetching, Tailwind CSS for styling, shadcn UI, Lucide icons.

## Redis-based throttling

Rate limiting uses Redis sorted sets to enforce a sliding 10-second window (max 5 actions). This keeps enforcement consistent across multiple API instances.

## Index strategy

ActivityLog uses:

- `{ userId: 1, createdAt: -1 }` for per-user time windows.
- `{ createdAt: -1 }` for global time windows.
- `{ userId: 1, action: 1, createdAt: -1 }` for replay checks and action-specific queries.

These indexes support analytics and suspicious-activity aggregations that run against MongoDB.

## IP handling

The server checks `x-forwarded-for` first, then falls back to `req.socket.remoteAddress`. The API also sets `trust proxy` to ensure proxy-aware behavior.

## Replay protection

Replay protection uses Redis `SET` with `NX` + `PX` (3 seconds) per user/action. This ensures a single accepted action within the 3-second window without extra DB reads.

## Error codes

- `429` for rate limit exceeded.
- `409` for replay detection.
- `400` for invalid inputs or excessive client/server drift.
