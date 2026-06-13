# Ruckus Renditions

**Built for fitment. Built for performance. Bring the Ruckus.**

Online automotive parts distribution — wheels, suspension, performance, and lighting — with vehicle-first UX, drop-ship fulfillment, and zero warehouse overhead.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Storefront | Next.js 14 App Router (Vercel) |
| Commerce | Shopify (cart, checkout, payments) |
| Database | Supabase PostgreSQL (Prisma ORM) |
| Monorepo | Turborepo + pnpm workspaces |
| Language | TypeScript throughout |

## Structure

```
apps/
  web/          Next.js storefront
  admin/        Internal ops dashboard
packages/
  db/           Prisma schema + migrations (single source of truth)
  supplier-adapters/   Keystone, Turn 14, Meyer adapter modules
  fitment-engine/      ACES/PIES vehicle fitment logic
services/
  catalog-sync/        Supplier catalog ingestion pipeline
  order-router/        Splits Shopify orders → supplier sub-orders
  tracking-poller/     Polls carrier tracking → updates Shopify fulfillments
scripts/
  seed-vehicles.ts     Import ACES base vehicle data
```

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 9+

pnpm install

# Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL, SHOPIFY_*, SUPABASE_* values

# Run database migrations
pnpm db:migrate

# Seed vehicle data
pnpm tsx scripts/seed-vehicles.ts

# Start storefront
pnpm --filter @rr/web dev
```

## Development

```bash
pnpm turbo build        # Build all packages
pnpm turbo type-check   # Type check all packages
pnpm turbo lint         # Lint all packages
pnpm db:studio          # Open Prisma Studio
pnpm db:migrate:dev     # Create new migration
```

## Catalog Sync

```bash
# Dry run (no DB writes)
pnpm --filter @rr/catalog-sync start -- --dry-run --full

# Live delta sync
pnpm --filter @rr/catalog-sync start -- --delta

# Live full sync
pnpm --filter @rr/catalog-sync start -- --full
```

Automated via GitHub Actions: full sync Sundays 2AM UTC, delta every 6 hours.

## Deployment

See `docs/deployment.md` for the full step-by-step checklist covering Supabase, Shopify, Vercel, and DNS setup.

## Environment Variables

All required variables are documented in `.env.example`. **Never commit `.env` or `.env.local` files.**

## Architecture

See `docs/architecture.md` for the full system diagram and data flow descriptions.
