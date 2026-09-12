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
- 404 handler + global error handler with stack in non-prod

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
