# AI Habit Tracker

The active application is being migrated to a single Next.js App Router project. UI, API Route Handlers, and server-side data access will live in this repository; PostgreSQL is accessed through Prisma. The existing `frontend/` and `backend/` directories are retained as migration references and are not used by the root Next.js app.

## Requirements

- Node.js 22.12 or later
- PostgreSQL
- npm

## Local setup

```powershell
npm install
Copy-Item .env.example .env
```

Set `DATABASE_URL` and a generated `JWT_SECRET` in the root `.env`, then apply the migrations and start the app. If you are carrying over the Gemini setup from the legacy backend, keep `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in the root `.env`; the active Next.js app does not load `backend/.env`.

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
npm run db:migrate
npm run dev
```

Open the URL printed by `npm run dev`. Next.js uses port 3000 by default, but automatically selects another available port if 3000 is already occupied. The API health check is available at `/api/health`.

`npm run start` serves the most recent production build; it does not compile source changes. Run `npm run build` after changes before starting the production server.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Server-only signing secret for authentication |
| `JWT_EXPIRES_IN` | JWT lifetime such as `30d`, `12h`, or `60m` (default: `30d`) |
| `GEMINI_API_KEY` | Optional server-only key for AI features |
| `GEMINI_MODEL` | AI model name (default: `gemini-2.5-flash`) |

Never commit `.env` or expose these values to client-side code. `.env.example` contains placeholders only; keep real API keys in the ignored root `.env`.

## Useful commands

```powershell
npm run dev
npm test
npm run typecheck
npm run build
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:studio
```

## Production deployment

Deploy the root directory as a Node.js Next.js application using Node.js 22.12 or later. Configure the environment variables in the hosting provider's server-side environment settings; do not add secrets to `NEXT_PUBLIC_*` variables.

1. Provision PostgreSQL and set `DATABASE_URL` for the production database. Ensure the hosting environment can reach the database and that its connection limits account for the number of app instances.
2. Set `JWT_SECRET` to a unique, random value for this deployment. Set `JWT_EXPIRES_IN` only if the default 30-day session lifetime needs to change.
3. Optionally set `GEMINI_API_KEY` and `GEMINI_MODEL` to enable AI coach features. The key must remain server-side.
4. Run `npm ci`, then run `npm run db:deploy` once as a release step before routing traffic to the new application version. Do not run schema migrations independently from every app replica.
5. Build with `npm run build` and start with `npm run start`, or use the hosting provider's supported Next.js deployment integration.
6. Confirm `GET /api/health` responds with `success: true`, then validate registration, login, habit creation, and logout over HTTPS. Production session cookies are marked `Secure`.

Use `npm run db:migrate` only for local development; production environments should apply checked-in migrations with `npm run db:deploy`. Back up production data and test migrations against a staging database before releases. The health endpoint is a liveness check and does not verify database connectivity.

The login and registration limits use proxy-provided client IP headers. Configure the hosting proxy to overwrite `x-forwarded-for` or `x-real-ip`; do not trust values supplied directly by an untrusted client.

## Verification

Run the local checks before deployment:

```powershell
npm run typecheck
npm test
npm run build
npm audit
```

The automated tests cover unit and validation behavior. A live database URL is required to verify migrations and authenticated database workflows; AI provider requests additionally require a valid Gemini API key.

## Application

- `src/app/` contains the App Router pages and API Route Handlers.
- `src/lib/prisma.ts` provides the server-only Prisma client with the PostgreSQL driver adapter.
- `prisma/schema.prisma` defines users, habits, completion logs, and AI insights.
- `prisma/migrations/` contains the initial PostgreSQL migration.
- `src/server/` separates validation, authentication services, and repositories from Route Handlers.
- Authentication endpoints support registration, login, logout, current-session lookup, and profile updates. Sessions use signed JWTs in HTTP-only, SameSite cookies; credentials and profile changes are validated server-side.
- Login and registration attempt limits are stored in PostgreSQL so they are shared across app instances. IP-based limits rely on `x-forwarded-for` or `x-real-ip` from a trusted hosting proxy; configure the deployment proxy to overwrite these headers.
- The responsive UI includes a marketing landing page, login and registration pages, and authenticated dashboard views for daily habits, weekly progress, AI insights, and statistics.
- Dashboard interactions use the same-origin Route Handler APIs. Habit and completion data require a configured PostgreSQL database and applied migrations; AI insights additionally require `GEMINI_API_KEY`.

The existing `frontend/` and `backend/` directories are retained as migration references. They are not used by the root Next.js app.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Product landing page |
| `/login` | Sign in |
| `/register` | Create an account |
| `/dashboard` | Today's habits and progress |
| `/dashboard/habits` | Manage habits |
| `/dashboard/weekly` | Weekly completion view |
| `/dashboard/insights` | AI coach |
| `/dashboard/stats` | Habit statistics and activity heatmap |

## Authentication API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account and start a session (`name`, `email`, `password`) |
| `POST` | `/api/auth/login` | Sign in (`email`, `password`) |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/me` | Return the authenticated user |
| `PATCH` | `/api/auth/profile` | Update profile fields; `currentPassword` is required when changing email or password |

Successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": ... }`. Passwords must be at least eight characters and at most 72 UTF-8 bytes to match bcrypt's input limit.

## Habit API

All habit routes require an authenticated session. Habit IDs come from the server; the API always scopes reads and writes to the authenticated user.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/habits` | List active habits; add `?includeArchived=true` to include archived habits |
| `POST` | `/api/habits` | Create a habit |
| `PATCH` | `/api/habits/:id` | Update habit fields |
| `DELETE` | `/api/habits/:id` | Delete a habit and its completion logs |
| `POST` | `/api/habits/:id/archive` | Toggle archive state, or set it with `{ "isArchived": true }` |
| `POST` | `/api/habits/reorder` | Set order with `{ "order": ["habit-id", ...] }` |

Habit categories are `HEALTH`, `FITNESS`, `LEARNING`, `MINDFULNESS`, `PRODUCTIVITY`, `SOCIAL`, `FINANCE`, `CREATIVE`, and `OTHER`. Frequencies are `DAILY`, `WEEKLY`, and `MONTHLY`. Optional fields use schema defaults when omitted.

## Completion and analytics API

All log routes require an authenticated session. Dates use the `YYYY-MM-DD` calendar-date format and are interpreted at UTC midnight for database storage. Completions cannot be recorded for future dates.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/logs/today` | List the signed-in user's completions for today (UTC) |
| `GET` | `/api/logs/range?start=YYYY-MM-DD&end=YYYY-MM-DD` | List completions within an inclusive range (maximum 366 days) |
| `GET` | `/api/logs/heatmap` | Return daily completion counts for the last 90 days |
| `GET` | `/api/logs/stats` | Return active-habit completion and streak summaries for the last 30 days |
| `GET` | `/api/logs/stats/:habitId` | Return one owned habit's lifetime and monthly statistics |
| `POST` | `/api/logs/:habitId` | Mark complete; optional JSON body `{ "date": "YYYY-MM-DD", "notes": "..." }`. Repeated requests are idempotent. |
| `DELETE` | `/api/logs/:habitId?date=YYYY-MM-DD` | Mark incomplete for the given date or today if omitted |
| `DELETE` | `/api/logs/:habitId/:date` | Mark incomplete for a specific date |

Log queries and mutations verify ownership through the parent habit relation. Statistics include full-history streaks; active-habit summaries exclude archived habits.

## AI coach API

AI endpoints require authentication and a server-side `GEMINI_API_KEY`. Habit names, descriptions, completion counts, and the specific text submitted for suggestions/chat are sent to Google's Gemini API to generate responses. Do not send sensitive personal information in AI prompts. If Gemini is not configured or unavailable, the API returns an explicit error rather than a fabricated fallback. Successful results are saved to the signed-in user's `AIInsight` history.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/ai/weekly-report` | Generate a report from active habits and their last 7 days |
| `POST` | `/api/ai/suggest-habits` | Suggest three habits (`goals`, `productiveTime`, and `struggles` are optional strings, max 500 characters each) |
| `POST` | `/api/ai/recovery-plan` | Generate a recovery plan for an owned habit (`habitId`) |
| `POST` | `/api/ai/chat` | Ask a question about active habits (`question`, max 500 characters) |
| `GET` | `/api/ai/morning` | Generate a morning message using active habits and full-history streaks |

Requests are limited to 8 per AI feature per 15 minutes and 30 AI requests per user per 24 hours. Suggestion output is schema-validated before it is returned or stored.
