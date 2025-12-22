# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

### Root
- There is no root-level package manager or build; work inside each subproject (`frontend`, `frontend/react`, `backend/node`, `backend/python`).

### Backend: Node.js API (`backend/node`)
- Install deps:
  - `cd backend/node`
  - `npm install`
- Run dev server (Express + TypeScript via ts-node-dev):
  - `npm run dev`
  - Default port: `PORT` env (falls back to `5000`).
- Build TypeScript:
  - `npm run build`
- Run built server:
  - `npm start`
- Run the trend analysis pipeline CLI (offline ingestion + analysis over JSON datasets):
  - `npm run trends:run`
  - Optional: set `DATASETS_DIR` to point at a directory of `.json` files before running; otherwise it uses `backend/node/src/trend/datasets` heuristics.
- Health check (once dev server is running):
  - `GET http://localhost:5000/health`

Key environment variables (see `backend/node/.env.example` in README):
- `PORT`: Node API port (default `5000`).
- `MONGO_URI`: MongoDB connection string (required for anything that touches the DB, including the trend pipeline).
- `PYTHON_AI_URL`: base URL for the Python FastAPI service (e.g. `http://localhost:8000`).
- `JWT_SECRET`: optional; if unset a `dev_secret` fallback is used for auth tokens.

### Backend: Python AI service (`backend/python`)
- (Optional) create and activate a virtual environment (Windows example):
  - `cd backend/python`
  - `python -m venv .venv`
  - `.venv\Scripts\activate`
- Install deps:
  - `pip install -r requirements.txt`
- Run FastAPI service with autoreload:
  - `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Health check:
  - `GET http://localhost:8000/health`

Currently there are no Python test commands or test suites defined.

### Frontend: Next.js app (`frontend`)
This is the primary UI (App Router, Tailwind + shadcn-style components).

- Install deps:
  - `cd frontend`
  - `npm install`
- Run dev server:
  - `npm run dev`
  - Default Next dev port: `3000`.
- Build:
  - `npm run build`
- Start production server (after `build`):
  - `npm start`
- Lint:
  - `npm run lint`

API and uploads routing:
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_UPLOADS_URL` influence how `/api/*` and `/uploads/*` are rewritten in `next.config.mjs`.
- With no env overrides, Next rewrites:
  - `/api/:path* -> http://localhost:5000/api/:path*`
  - `/uploads/:path* -> http://localhost:5000/uploads/:path*`

Authentication and events in the Next app:
- API helpers in `frontend/lib/api.ts` wrap `fetch`:
  - `postJSON(path, body)` automatically attaches a `Bearer` token from `localStorage` (if present) and resolves `path` relative to `NEXT_PUBLIC_API_URL` or the Next rewrites.
  - `logEvent(eventType, metadata?)` posts to `/api/events` with the current `window.location.pathname`.
- Auth flows (`frontend/app/login/page.tsx`, `frontend/app/signup/page.tsx`):
  - Call `/api/auth/login` and `/api/auth/signup` on the Node API via `postJSON`.
  - Store `token` in `localStorage` and then navigate to `/generator`.

### Frontend: Legacy React + Vite app (`frontend/react`)
This is the original scaffolded React/Vite client; it is separate from the Next.js app.

- Install deps:
  - `cd frontend/react`
  - `npm install`
- Run dev server:
  - `npm run dev`
- Build:
  - `npm run build`
- Preview built app:
  - `npm run preview`

API base URL for this client:
- `frontend/react/src/services/api.ts` configures Axios with `baseURL`:
  - `VITE_API_URL` env or `http://localhost:5000/api` by default.

### Tests
No automated test scripts are currently defined in any `package.json` or in the Python service. To run tests or a single test file in the future, first add an appropriate test framework and scripts (e.g. Jest/Vitest for Node/React or pytest for Python) and then invoke them via `npm test` / `pytest` as configured.

## High-level architecture

### Top-level layout
- `frontend/`: Next.js app (App Router) that provides the primary AdGen UI, including login/signup and the main generator experience.
- `frontend/react/`: Separate Vite-based React client that was part of the original scaffold and talks directly to the Node API.
- `backend/node/`: TypeScript Express API layer + MongoDB/Mongoose models + offline trend analysis pipeline.
- `backend/python/`: FastAPI-based AI microservice stub intended to host heavy ML / diffusion logic.

### Request and data flow

1. **User-facing flows (Next.js app → Node API → MongoDB / Python AI)**
   - The Next.js app runs on its own dev/production port and forwards API calls:
     - All `/api/*` requests from the browser are rewritten (via `next.config.mjs`) to the Node API at `API_BASE` (default `http://localhost:5000/api`).
     - All `/uploads/*` requests are similarly rewritten to the Node server's static `/uploads` directory.
   - The Node API (`backend/node/src/app.ts`):
     - Mounts a health check at `/health`.
     - Exposes all application routes under `/api`.
     - Serves static uploaded files under `/uploads`.
     - Connects asynchronously to MongoDB via `connectDB()` in `config/db.ts`.
   - Authentication and logging:
     - `/api/auth/*` routes (`routes/auth.ts`) handle `signup` and `login` and issue JWT access tokens.
     - `/api/events` (`routes/events.ts`) accepts arbitrary event documents (optionally tied to a user via JWT) for basic product analytics.
     - The Next frontend uses `logEvent` to send usage events (e.g. generator submissions, downloads, auth events) to this endpoint.
   - The Python FastAPI service is currently a thin stub:
     - Exposes `/health` and `/generate` endpoints.
     - Expected to be called from the Node API using the `PYTHON_AI_URL` base when real generation logic is implemented.

2. **Trend analysis pipeline (Node-only offline flow)**
   - Located in `backend/node/src/trend` plus associated models and utils.
   - Primary orchestrator: `runFullTrendPipeline(datasetsDir)` in `trend/scheduler.ts`, invoked from the CLI script `src/scripts/runTrendPipeline.ts`.
   - Data sources:
     - JSON datasets in a directory (default `backend/node/src/trend/datasets`, or `DATASETS_DIR` if set).
     - Each dataset record is normalized in `ingest.ts` into a `NormalizedAd` structure (industry, platform, image path, caption, engagement metrics, etc.).
   - Image and text analysis:
     - `utils/imageAnalysis.ts` loads images via `sharp`, performs basic k-means clustering to extract dominant colors, and uses brightness/edge density heuristics to classify ad layout as one of `text-heavy`, `image-centric`, `split-layout`, or `overlay-text`.
     - `utils/textAnalysis.ts` tokenizes ad captions, removes a curated stop-word list, and produces frequency-based keyword stats.
     - `trend/classifier.ts` applies heuristic rules over captions and layout to classify creative type (`product-only`, `ugc`, `offer-based`, `testimonial`, `brand-story`).
   - Persistence and summarization:
     - Raw ads are stored in `RawAdModel` (see `models/RawAd.model.ts`).
     - `trend/analyzer.ts` selects top-performing ads per industry, aggregates colors, layouts, creative types, and keywords, and computes average engagement, writing results into `TrendProfileModel`.
     - `trend/knowledgeBase.ts` exposes `getTrendProfile(industry, datasetsDir?)` which caches trend profiles in memory via a generic `TTLCache` and lazily recomputes them using `analyzeIndustry` if missing.

3. **Legacy React client flow (`frontend/react`)**
   - Uses an Axios instance (`frontend/react/src/services/api.ts`) that talks directly to `http://localhost:5000/api` (or `VITE_API_URL`).
   - Can coexist with the Next app during migration; both share the same Node API and MongoDB backend.

### Authentication and authorization model
- Users are stored in MongoDB via `User` model (`models/User.model.ts`) with `name`, `email`, `passwordHash`, and `createdAt`.
- Passwords are hashed with `bcryptjs` and JWTs are signed with `jsonwebtoken` using `JWT_SECRET`.
- The `/api/events` endpoint decodes the JWT from the `Authorization: Bearer <token>` header when present and associates events with `userId`. If token parsing fails, events are still accepted but logged without a user.
- The Next frontend stores JWTs in `localStorage` and includes them on all `postJSON` calls; logout simply clears the token and reloads the app.

### FastAPI AI service
- FastAPI app is assembled in `backend/python/app/main.py`:
  - Enables permissive CORS for rapid local development.
  - Includes routes from `backend/python/app/routes.py`.
- `routes.py` currently defines:
  - `GET /health` → returns `{ "status": "ok" }`.
  - `POST /generate` → echoes the `GenerateRequest` payload as a placeholder for future image/text generation.
- Schemas in `schemas.py` define a minimal `GenerateRequest` with optional `prompt` and `seed` fields; this is the natural place to extend with richer generation parameters later.

### Frontend generator experience
- The main generator UI lives at `frontend/app/generator/page.tsx`.
- Today it:
  - Collects industry, platform, brand name, headline, CTA text, and a single product image.
  - Logs structured events (`generate_submitted`, `generate_completed`, `image_selected`, `download`, etc.) to the Node backend via `logEvent`.
  - Generates placeholder image URLs (pointing to `/placeholder.svg`) instead of calling the Python AI service; wiring this up will require adding a Node API route that proxies to FastAPI and updating the generator to call it.
- The same page includes a simple in-memory "history" view of past generations for the current session.

## Notes for future Warp agents
- When debugging API requests from the Next app, inspect `frontend/lib/api.ts` and `next.config.mjs` together to understand how paths and env vars combine.
- Trend-related code is intentionally decoupled from the main request/response flow; changes there can often be developed and tested via `npm run trends:run` without touching the HTTP API.
- There are no tests or CI wiring yet; if adding them, prefer to expose them via `npm` / `pip` scripts so they can be discovered automatically from the project configuration.