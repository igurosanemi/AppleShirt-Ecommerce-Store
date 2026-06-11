# AppleShirt

Premium men's wear and accessories e-commerce store.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind) |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| Infra (local) | Docker Compose (DB + Redis only) |

## Quickstart

### Prerequisites
- Docker Desktop
- Python 3.12+ with [uv](https://github.com/astral-sh/uv)
- Node.js 20+

### 1. Clone & configure

```bash
git clone <repo-url>
cd AppleShirt-Ecommerce-Store

# Backend env
cp .env.example backend/.env   # then edit values

# Frontend env
cp .env.example frontend/.env.local   # then edit values
```

### 2. Start Postgres + Redis

```bash
docker-compose up -d
```

### 3. Start the backend

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## Project Layout

```
backend/    FastAPI application + tests
frontend/   Next.js application
docker-compose.yml   Postgres + Redis
CLAUDE.md   Engineering conventions (read this first)
PROGRESS.md Phase tracker
```

## Key Conventions

- **Money**: stored as integer cents; formatted at the UI layer only.
- **Auth**: refresh token in httpOnly cookie; access token in memory only.
- **Stock**: atomic decrement at checkout; never negative.

See [CLAUDE.md](./CLAUDE.md) for the full ruleset.
