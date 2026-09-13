# ShenoDev Backend - Node.js Express + MongoDB

Unified backend for ShenoDev platform (`/web`, `/mobile`, `/desktop`).

## Tech Stack
- Node.js 18+, Express 4, Mongoose 8, MongoDB
- TypeScript strict, no `any`
- TDD: Jest 29 + Supertest + mongodb-memory-server

## Quick Start
```bash
cd backend
npm install
cp .env.example .env # set MONGODB_URI
npm run dev    # http://localhost:4000
npm run build && npm start
```

## TDD Workflow (rules.md)
1. Write test in `tests/` (see `health.test.ts`, `db.test.ts`)
2. Run `npm test` -> should FAIL (red)
3. Implement minimal code in `src/`
4. Re-run `npm test` -> should PASS (green)

## API
- `GET /health` - basic uptime (no DB)
- `GET /api/health` - DB status (connected/disconnected/degraded)
- `GET /api` - API index
- `POST /api/discovery` - discovery questionnaire (+ optional attachment, + meeting fields)
- `POST /api/calendly/webhook` - Calendly webhook (signed HMAC-SHA256, raw body)
- 404 handler + global error handler with stack in non-prod

## Calendly Integration (server-side)

The discovery flow schedules a call via Calendly on the client. The backend now adds a
**server-side** layer so scheduled meeting dates/times/links are authoritative, not
whatever the client captured at the moment the widget fired:

1. **Webhook** (`POST /api/calendly/webhook`) receives `invitee.created` /
   `invitee.canceled`, verifies the HMAC-SHA256 signature over the raw body, and
   persists a `ScheduledMeeting` (new MongoDB model) with the real start/end time,
   timezone and links. No email is sent here — emails still fire from the discovery
   form POST so the confirmation carries project context.
2. **Discovery POST enrichment** (`POST /api/discovery`) — when the form arrives it
   merges the authoritative meeting data from the webhook record, or fetches it from
   the Calendly API (`GET /scheduled_events/{uuid}`) via `CALENDLY_API_TOKEN`. The
   confirmation email to the user then contains the true meeting date/time/link.

Everything degrades cleanly: no token/secret configured → client-sent fields are used
as before (backwards compatible).

### Manual Configuration

**1. Create your Calendly event type**
- In Calendly, create a "Discovery Call" event type and copy its public URL
  (`https://calendly.com/<username>/<event>`).
- Set it on the frontends (`web/.env` → `NEXT_PUBLIC_CALENDLY_URL`,
  `mobile/.env` → `EXPO_PUBLIC_CALENDLY_URL`) and optionally backend `CALENDLY_URL`.
  Until you set these, the web/mobile discovery screens show a "scheduling link not
  configured" notice instead of a broken widget.

**2. API token (optional but recommended)**
- Calendly → **Integrations → API & Webhooks** → create a Personal Access Token
  (starts with `cal_...`).
- Set `CALENDLY_API_TOKEN` in `backend/.env`. Used to fetch authoritative
  start/end times for booked events.

**3. Webhook subscription**
- Calendly → **Integrations → API & Webhooks → Webhooks** → create a subscription for:
  - URL: `https://<your-api-domain>/api/calendly/webhook`
  - Events: `invitee.created`, `invitee.canceled`
- **Supply your own `signing_key`** when creating it (random secret) and store it as
  `CALENDLY_WEBHOOK_SIGNING_KEY` in `backend/.env`. The key is printed/returned on
  creation — that's the value Calendly uses to sign each request.
- Until `CALENDLY_WEBHOOK_SIGNING_KEY` is set, the endpoint returns `503` (so Calendly
  keeps retrying) rather than accepting unsigned traffic.

Programmatic alternative (API-created webhook, requires a Standard plan or higher and
your organization/user URI):
```bash
curl -X POST https://api.calendly.com/webhook_subscriptions \
  -H "Authorization: Bearer $CALENDLY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "url": "https://api.shenodev.dpdns.org/api/calendly/webhook",
        "events": ["invitee.created", "invitee.canceled"],
        "organization": "https://api.calendly.com/organizations/YOUR_ORG_UUID",
        "scope": "organization",
        "signing_key": "a-long-random-secret-you-generate"
      }'
```
List/cleanup: `GET /webhook_subscriptions?organization=...`, `DELETE /webhook_subscriptions/{uuid}`.

**Verification details (why it's built this way)**
- Header `Calendly-Webhook-Signature`: `t=<unix-seconds>,v1=<hex hmac>`.
- Signed content is `{t}.{raw body}` — middlewares must NOT JSON-parse before
  verifying, which is why the route uses `express.raw()` in `app.ts`.
- Rejects timestamps older than 180s (replay protection) and compares timing-safely.

## Project Structure
```
backend/
├── src/
│   ├── app.ts              # createApp() - Express factory for testing
│   ├── server.ts           # bootstraps DB + listens, graceful shutdown
│   ├── config/db.ts        # connectDB, disconnectDB, getConnectionState
│   ├── routes/health.ts    # /api/health
│   └── middleware/errorHandler.ts
├── tests/
│   ├── health.test.ts      # TDD: health endpoints
│   └── db.test.ts          # TDD: MongoDB connection (memory server)
├── dist/                   # compiled JS
└── package.json
```

## Environment
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/shenodev
NODE_ENV=development
```

Graceful shutdown on SIGTERM/SIGINT, degraded mode if DB unreachable.
