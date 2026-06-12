# AppleShirt — Engineering Reference

## Architecture

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind) — runs on host at :3000
- **Backend**: FastAPI (async, SQLAlchemy 2.0 + Alembic, Pydantic v2) — runs on host at :8000
- **DB**: PostgreSQL — runs in Docker at host port **:5433** (5432 reserved by local Postgres)
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
- Refresh token: httpOnly cookie, `secure=True` in production / `False` in dev, `samesite="lax"`, path=`/api/v1/auth`
- Access token: in memory on the frontend (never localStorage)
- Refresh tokens are opaque `secrets.token_urlsafe(32)` stored in Redis as `refresh:{token}` → user_id with TTL
- Rotated on every use: old token deleted before new one issued

### Password Hashing
Use `bcrypt` directly (not passlib — incompatible with bcrypt 4.x on Python 3.13).

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

## Seed Data
```bash
# From backend/ — idempotent, skips if categories already exist
uv run python -m app.db.seed
```

## Cart + Orders Notes
- Cart: Redis hash `cart:{user_id}` → `{product_id: quantity}`, TTL 7 days. Services in `app/services/cart.py`.
- Checkout: `SELECT FOR UPDATE` on all product rows → validate all stock → decrement → create Order + OrderItems → commit → clear cart. All in one SQLAlchemy transaction.
- `InsufficientStockError` in `app/services/order.py` carries product name, requested, and available quantities → HTTP 409.
- Order items snapshot `name` and `unit_price` at purchase time. `product_id` is `ON DELETE SET NULL`.
- Order list + detail are scoped to `current_user.id`. Wrong-user lookup returns 404 (not 403).
- Cart endpoints: `GET/DELETE /api/v1/cart`, `POST/PUT/DELETE /api/v1/cart/items/{id}`
- Order endpoints: `POST /api/v1/orders/checkout`, `GET /api/v1/orders`, `GET /api/v1/orders/{id}`

## Catalog Notes
- `Category` and `Product` models in `app/models/`
- Relationships use `lazy="raise"` — always use `selectinload()` explicitly in service queries
- Category delete returns 409 if products exist under it
- Product price is always integer cents; slug auto-generated from name if not provided
- Product images reference paths under `frontend/public/images/products/` (served by Next.js)
- Public endpoints: `GET /api/v1/catalog/categories`, `GET /api/v1/catalog/products`, `GET /api/v1/catalog/products/{id}`
- Admin endpoints: POST/PUT/DELETE on `/api/v1/catalog/categories` and `/api/v1/catalog/products` (require `is_admin=True`)

## Frontend Notes (Phase 5+)
- Framework: Next.js 14, App Router, TypeScript, Tailwind v3, `darkMode: 'class'` (driven by `next-themes`)
- Theme: `ThemeProvider` (`src/components/layout/ThemeProvider.tsx`) wraps the tree; `suppressHydrationWarning` on `<html>`. `ThemeToggle` (`src/components/ui/ThemeToggle.tsx`) uses `resolvedTheme` + `mounted` guard. Theme persists via `localStorage`, defaults to system preference.
- Font: Geist Sans via `geist` npm package + `next/font`. NOT Inter (per taste-skill)
- Icons: `@phosphor-icons/react` exclusively. Do not mix with other icon libraries.
- Motion: `motion/react` (Motion v11). Never `window.addEventListener('scroll')`. Use `useScroll` + `useMotionValueEvent` for scroll-driven state.
- Design palette: Cold Luxury — zinc-50/zinc-950 monochrome. Banned warm beige/brass family.
- `src/types/index.ts` — all backend types. Prices are `number` (integer cents). Never use `number` for a price without noting it's cents.
- `src/lib/api.ts` — typed fetch wrappers (`authApi`, `catalogApi`, `cartApi`, `ordersApi`). Uses `credentials: 'include'` for cookie; `Authorization: Bearer` header for token.
- `src/lib/auth-context.tsx` — `AuthProvider` manages in-memory access token + refresh from httpOnly cookie on mount. Access token NEVER in localStorage.
- `src/lib/utils.ts` — `cn()` (clsx), `formatPrice(cents)` (formats to USD — UI layer only, never on the number itself)
- All page sections use `min-h-[100dvh]` (never `h-screen`) for viewport stability on mobile Safari.
- `src/components/ui/Input.tsx` — reusable input (`hasError` prop). `src/components/ui/Button.tsx` — primary/ghost, `loading` prop.
- `src/hooks/use-require-auth.ts` — call in any page that needs auth. Redirects to `/login?next=<path>` when unauthenticated.
- Auth pages (`/login`, `/register`): render `null` while auth resolves to prevent form flash before redirect. Server errors distinguish 401/409 status codes.
- Logout: `useAuth().logout()` clears in-memory token + calls backend to clear refresh cookie. Navbar calls it then `router.push('/')`.
- `src/lib/cart-context.tsx` — `CartProvider`/`useCart`. Cart fetched on auth resolve; cleared on logout. Exposes `addItem`, `updateItem`, `removeItem`, `clearCart`, `refresh`.

## Frontend Notes (Phase 8 — Cart + Checkout)
- Cart page `/cart` — `useCart()` for data; local `updatingId`/`removingId` per-item to disable rows during async mutations; `AnimatePresence` for item removal; two-column layout (items / sticky summary) on desktop.
- Checkout page `/checkout` — mock payment form (pre-filled, read-only); calls `ordersApi.checkout(token)`; 409 maps to stock-error message; on success `clearCart()` then redirect to `/orders/confirmation/{id}`.
- Confirmation page `/orders/confirmation/[id]` — fetches order fresh from API (not from checkout response); spring-animated check icon; transaction ID in monospace.
- Orders list `/orders` — `ordersApi.list()` with page state; desktop grid table, mobile card list; empty + error states; pagination with prev/next.
- Order detail `/orders/[id]` — `ordersApi.get()`; `product_id` may be null (ON DELETE SET NULL) — handled gracefully; sectioned layout (Items / Payment / Summary).
- All cart/order pages call `useRequireAuth()` for auth guard.
