# Architecture

## System Topology

```
[Customer Browser (Mobile-First)]
        │
        ▼
[Next.js 14 App Router — Vercel Edge]
  /app/(shop)        ← storefront pages (RSC + ISR)
  /app/api/          ← Route Handlers (vehicle, fitment, webhooks)
        │                        │
        ▼                        ▼
[Shopify Storefront API]   [Supabase PostgreSQL]
 Cart / Checkout              Vehicles / Fitment
 Customer Accounts            Products / Catalog
 Payments / Shipping          Orders / Suppliers
        │                          │
        ▼                          ▼
[Shopify Admin Webhooks]   [GitHub Actions (cron)]
 orders/paid                  Catalog sync (6h delta, weekly full)
 orders/fulfilled             Tracking poller (every 4h)
 orders/cancelled             Review request cron
        │
        ▼
[Supplier Adapters — packages/supplier-adapters]
  keystone  → FTP ACES/PIES + REST orders
  turn14    → REST catalog + webhook tracking
  meyer     → EDI 850/856 (stub → manual fallback)
```

## Data Flows

### Catalog Ingestion
1. GitHub Actions triggers `services/catalog-sync` on schedule
2. For each supplier: adapter fetches delta or full catalog
3. `fitment-engine` parses ACES fitment applications
4. Products + fitment upserted to Supabase
5. Changed products synced to Shopify Admin API
6. `POST /api/revalidate` invalidates Next.js ISR cache for affected pages

### Purchase Flow
1. Customer selects vehicle → stored in `VehicleContext` + localStorage
2. Fitment filter queries `/api/fitment?trimId=&categorySlug=`
3. Product added to Shopify Cart via Storefront API
4. Customer redirects to Shopify-hosted checkout
5. `orders/paid` webhook → `/api/webhooks/shopify/order-paid`
6. `routeOrder()` creates Order + SupplierOrder records
7. Each SupplierOrder dispatched via supplier adapter
8. Supplier confirms with PO number

### Tracking Flow
1. GitHub Actions runs `services/tracking-poller` every 4 hours
2. Polls all `SupplierOrder` with status `CONFIRMED` or `SUBMITTED`
3. Updates `Shipment` records in database
4. Creates Shopify Fulfillment via Admin API (triggers customer email)
5. When delivered: sets `Order.deliveredAt` and `Order.status = DELIVERED`

### Review Flow
1. Daily cron scans orders delivered 7–14 days ago
2. Sends review request email via Shopify Email
3. Sets `Order.reviewRequestedAt`

## Key Design Decisions

- **Shopify for checkout** — PCI compliance, fraud detection, Shopify Payments, all handled. Zero liability risk.
- **Headless Next.js storefront** — Full design control for vehicle-first UX while Shopify handles money.
- **Prisma as ORM** — Schema as code; type-safe queries; migration history in git.
- **Supabase free tier** — $0/mo until ~400 MB DB or first paid order; then $25/mo Pro.
- **MAP at display layer** — `PriceDisplay.tsx` calls `enforceMAPCents()` before every render.
- **Manual-first order routing** — Meyer adapter stubs to error + ops alert. Automate after 30+ orders proven.
- **GitHub Actions for background jobs** — No extra hosting cost; cron syntax; secret management built-in.
