# Smart User Activity Tracker

Full stack assignment for Elovient using Bun, Express, MongoDB, and React (TanStack Router + React Query). It includes authentication, activity logging with rate limiting, analytics, suspicious activity detection, and replay protection.

## Requirements

- Bun 1.3+
- Node 18+ (for tooling)
- MongoDB (local or Atlas)
- Redis (local or container)

## Environment

Create `apps/api/.env`:

```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/user-activity-tracker
JWT_SECRET=replace-with-a-long-secret
PORT=8000
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
```

Optional for the web app:

```
VITE_API_URL=http://localhost:8000
```

## Run the apps

From repo root:

```
bun install
bun dev
```

Or run separately:

```
cd apps/api
bun dev
```

```
cd apps/web
bun dev
```

## Run with Docker

From repo root:

```
docker compose up --build
```

Notes:

- Caddy proxies `/api/*` to the API and everything else to the web app.
- For production, set `VITE_API_URL=/api` at build time so the frontend uses the same origin.

## API Summary

### Auth

- `POST /api/auth/register` - create a user and return a JWT
- `POST /api/auth/login` - return a JWT

### Activity

- `POST /api/activity` - log an action (rate limited: 5 actions per 10s)
- `GET  /api/activity/stats` - analytics (total, most common, per-minute, most active user)
- `GET  /api/activity/suspicious` - suspicious activity detection
- `POST /api/activity/replay-check` - replay protection check

## Limitations/Future Improvements

- No password reset or email verification.
- No refresh tokens.
- Analytics and suspicious-user detection run live per request (no caching or background jobs).
