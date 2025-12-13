# DataFlowHub AI — Copilot Coding Agent Instructions

## What this repo is
- React + TypeScript + Vite frontend in `src/` and an async FastAPI backend in `backend/`.
- `my-app/` is a standalone Vite template (likely legacy/unused in CI); default to the root `src/` app unless a task explicitly targets `my-app/`.

## How to run (local)
- Frontend: `npm install` then `npm run dev` (Vite runs on port `5173`; see `vite.config.ts`).
- Backend API: `docker-compose up -d backend` (or run locally with Uvicorn if you’re already in `backend/`).
- Frontend calls backend through the Vite proxy: `/api/*` → `http://localhost:8000` (see `vite.config.ts`).

## Frontend architecture & conventions
- Routing lives in `src/main.tsx`:
  - All route pages are `lazy(() => import(...))` and wrapped in a single `<Suspense>`.
  - OAuth callback route **must** remain before the `/app` route: `/app/auth/callback` → `src/components/auth/OAuthCallback.tsx`.
  - Auth gating uses `src/components/auth/PrivateRoute.tsx`; paid features use `src/components/auth/PremiumRoute.tsx`.
- Provider order is intentional; keep it consistent with `src/main.tsx` (Auth → User → ML → Demo → Knowledge → AIChat → Notifications → Tours).

## Supabase/auth patterns (do not “simplify”)
- Supabase config guard: if `isSupabaseConfigured` is false, the app renders `SupabaseConfigError` (see `src/lib/supabase.ts` and `src/main.tsx`).
- `AuthProvider` avoids calling `supabase.auth.getSession()` on initial mount; it reads the Supabase session from localStorage key `sb-bcobpxgktvgfsffdsiog-auth-token` first (see `src/components/auth/AuthProvider.tsx`).
- On refresh-token related errors, auth clears **localStorage + IndexedDB** to recover (see `clearLocalData()` in `AuthProvider`).

## Local caching (IndexedDB)
- IndexedDB storage is via `StorageManager` in `src/lib/storage.ts`.
- `saveDataset()` uses a 3s timeout and logs failures but intentionally does **not** throw (Supabase remains the source of truth).

## Backend (FastAPI) structure
- App entrypoint: `backend/main.py` (`create_application()` with lifespan startup/shutdown).
- Middleware order matters (outermost → innermost): `ErrorHandlerMiddleware` → `PerformanceMiddleware` → `LoggingMiddleware`.
- Routes are mounted under `/api/*` via routers in `backend/routers/`.

## Services & integrations
- Full local stack is defined in `docker-compose.yml` (Postgres, Redis, Neo4j, MinIO, TimescaleDB, Kafka/Zookeeper, Prometheus/Grafana, InfluxDB, backend).
- Stripe setup script: `npm run stripe:setup` (see `scripts/README.md` and `scripts/setup-stripe-products.mjs`).

## Testing & tooling
- Unit tests: `npm run test` (Vitest). Accessibility tests: `npm run test:a11y`.
- E2E tests: `npm run test:e2e`.
  - App dev server is `http://localhost:5173` (see `vite.config.ts`).
  - Cypress is currently configured with baseUrl `http://localhost:3002` in `cypress.config.js`; if you run E2E locally, align it to `5173` (or run your dev server on `3002`).
- Bundle analysis: `npm run analyze` / `npm run build:analyze`.

## Vite/build constraints
- `vite.config.ts` intentionally keeps chunk splitting simple and suppresses LangChain circular dependency warnings; avoid reworking chunking unless the task is specifically about bundling.
