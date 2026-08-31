# Deploying 9Router on Vercel

This repository uses Vercel's native Next.js runtime for web deployment. The old Docker/CapRover host deployment path has been removed.

## What Vercel runs

- Vercel builds and runs the Next.js application directly.
- Vercel injects `VERCEL=1`; the build therefore does not generate Next.js standalone server output.
- `custom-server.js` remains for CLI/local standalone distribution. Vercel does not use it.
- Process-lifetime background token refresh is disabled on Vercel. Request-path token refresh remains available.

## Environment variables

Configure production values based on `.env.example` in Vercel Project Settings → Environment Variables.

At minimum review:

- `JWT_SECRET`
- `INITIAL_PASSWORD`
- `API_KEY_SECRET`
- `MACHINE_ID_SALT`
- `BASE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `CLOUD_URL`
- `NEXT_PUBLIC_CLOUD_URL`

Set `BASE_URL` and `NEXT_PUBLIC_BASE_URL` to the final Vercel/custom domain.

Do not set `PORT` or `HOSTNAME` for Vercel.

## Persistent state: action required

9Router currently stores application state in file-backed SQLite (`data.sqlite`).

On Vercel the application uses `/tmp/9router` to avoid read-only filesystem errors. `/tmp` is ephemeral, not a durable application volume. Provider connections, OAuth credentials, settings and usage data stored only in SQLite can disappear or differ between instances.

Do not treat the SQLite-on-`/tmp` setup as durable production storage.

Before a production rollout, migrate the database layer to an external store. Practical options:

- **Turso/libSQL** — closest to SQLite semantics and likely the smallest application refactor.
- **Supabase/Postgres** — centralized Postgres storage, but requires a broader DB/repository adapter refactor.

## Vercel runtime constraints

- Vercel Functions have a 4.5 MB request/response payload ceiling. The Vercel build defaults `proxyClientMaxBodySize` to `4mb`; CLI/local standalone builds keep `128mb`.
- Do not rely on an always-running Node process or `setInterval` scheduler. Use request-time refresh and, where truly scheduled execution is required, Vercel Cron.
- Streaming proxy responses are supported; use Fluid Compute for longer streaming workloads where appropriate.

## Deploy a preview

1. Import `d2group-co/9router` into Vercel.
2. Use the detected **Next.js** framework preset.
3. Keep Vercel's standard build/output defaults.
4. Configure the environment variables above.
5. Deploy a Preview.
6. Verify:
   - `/api/health`
   - sign-in/session flow
   - provider connection and OAuth token flow
   - `/v1` proxy routes
   - streaming responses
7. Migrate persistent SQLite state before treating the deployment as production.
