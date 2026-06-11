# AppleShirt — Build Progress

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 0 | Repo Scaffold | Done |
| 1 | Backend Foundation | Done |
| 2 | Auth | Not started |
| 3 | Catalog API | Not started |
| 4 | Cart + Orders API | Not started |
| 5 | Frontend Scaffold | Not started |
| 6 | Frontend Auth Pages | Not started |
| 7 | Storefront | Not started |
| 8 | Cart + Checkout UI | Not started |
| 9 | Polish + E2E | Not started |

---

## Phase 0 — Repo Scaffold ✅

**Status**: Done

### Checklist
- [x] `docker-compose.yml` — Postgres + Redis
- [x] `CLAUDE.md` — architecture, conventions, run instructions
- [x] `PROGRESS.md` — this file
- [x] `.env.example` — all required env vars documented
- [x] `.gitignore` — covers Python, Node, env files, build artifacts
- [x] `README.md` — project overview + quickstart
- [x] Git commit: `chore: phase 0 — repo scaffold`

### Notes
- Docker runs only Postgres + Redis; backend and frontend run on host for fast dev.
- Backend will live in `/backend`, frontend in `/frontend` (created in Phase 1 and 5).

---

## Phase 1 — Backend Foundation ✅

**Status**: Done

### Checklist
- [x] `backend/pyproject.toml` — deps (FastAPI, SQLAlchemy 2.0 async, Alembic, Redis, Pydantic v2)
- [x] `app/core/config.py` — pydantic-settings from `.env`
- [x] `app/db/base.py` — SQLAlchemy `DeclarativeBase`
- [x] `app/db/session.py` — async engine + `AsyncSessionLocal` + `get_db` dep
- [x] `app/db/redis.py` — async Redis client
- [x] `app/middleware/error_handler.py` — HTTP / validation / unhandled exception handlers
- [x] `app/api/v1/health.py` — `/api/v1/health` checks DB + Redis, standard `{"data":{...}}` shape
- [x] `app/main.py` — FastAPI app, CORS, routers, exception handlers wired
- [x] `alembic/` — async env.py configured, URL from settings
- [x] `tests/test_health.py` — 3 tests (healthy, degraded, error shape) — all pass
- [x] Server boots; OpenAPI docs at `/docs`; response envelope verified
- [x] Git commit: `feat: phase 1 — backend foundation`

### Notes
- `.env` files written without BOM (PowerShell writes UTF-16 LE by default; fixed with `UTF8Encoding($false)`).
- Alembic `env.py` uses `asyncio.run(run_migrations_online())` pattern for async engines.
- All models must be imported in `app/models/__init__.py` for Alembic autogenerate to detect them.
