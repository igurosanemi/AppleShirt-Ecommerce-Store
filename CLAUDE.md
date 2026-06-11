# AppleShirt — Engineering Reference

## Architecture

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind) — runs on host at :3000
- **Backend**: FastAPI (async, SQLAlchemy 2.0 + Alembic, Pydantic v2) — runs on host at :8000
- **DB**: PostgreSQL — runs in Docker at :5432
- **Cache/Sessions**: Redis — runs in Docker at :6379

## Folder Structure

```
backend/
  app/
    api/v1/          # Route handlers
    core/            # config, security, dependencies
    db/              # session, base, redis client
    models/          # SQLAlchemy ORM models
    schemas/         # Pydantic v2 in/out schemas
    services/        # Business logic
    middleware/      # Error handler
    main.py
  alembic/
  tests/
  pyproject.toml

frontend/
  src/
    app/             # Next.js App Router pages
    components/      # ui/, layout/, shop/
    lib/             # api.ts, auth-context.tsx
    types/
  public/images/products/
```

## How to Run

```bash
# Start DB + Redis
docker-compose up -d

# Backend (from /backend)
uv run uvicorn app.main:app --reload --port 8000

# Frontend (from /frontend)
npm run dev
```

## Env Vars

See `.env.example` at repo root. Backend reads from `backend/.env`, frontend from `frontend/.env.local`.

## LOCKED CONVENTIONS (hard rules — never violate)

### Money
Store all prices/amounts as **INTEGER minor units (cents)**. Never floats. Format to currency only at the UI layer.

### API Response Shape
```
single  → { "data": { ... } }
list    → { "data": [...], "meta": { "page", "page_size", "total", "total_pages" } }
error   → { "error": { "code", "message", "details"? } }
```
Consistent on every endpoint, no exceptions.

### Auth Storage
- Refresh token: httpOnly, Secure, SameSite=strict cookie
- Access token: in memory on the frontend (never localStorage)
- Refresh tokens rotated on every use, stored in Redis

### CORS
Backend (:8000) allows frontend origin (:3000) with `credentials: true`.

### Images
Product images served from `/public/images/products/` static assets for v1. URL field on product model.

### Stock
Never oversell. Decrement stock **atomically** at checkout. Reject if insufficient. Stock cannot go negative.

### Env / Secrets
Secrets in `.env` only (gitignored). Frontend uses `NEXT_PUBLIC_API_URL`. Never commit secrets.

## Frontend Design Rule
All frontend UI work uses the **taste-skill**.
- Install: `npx skills add https://github.com/Leonxlnx/taste-skill`
- Invoke `design-taste-frontend` skill whenever building or styling pages/components.

## Tests

```bash
# From backend/
uv run pytest tests/ -v
```

## Migrations
```bash
# From backend/
alembic revision --autogenerate -m "description"
alembic upgrade head
```
