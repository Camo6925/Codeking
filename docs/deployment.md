# Deployment Checklist

## Phase A: Supabase

- [ ] Create Supabase project (region: `us-east-1`)
- [ ] Copy `DATABASE_URL` (pooler) and `DIRECT_URL` (direct) to `.env.local`
- [ ] Enable `pg_trgm` in SQL editor: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- [ ] Enable RLS on all tables
- [ ] Add policy on `saved_vehicles`: `USING (customer_id = auth.uid())`
- [ ] Run `pnpm db:migrate` against `DIRECT_URL`
- [ ] Run `pnpm tsx scripts/seed-vehicles.ts`
- [ ] Create Storage bucket `build-gallery-images` (public read, authenticated write)
- [ ] Set bucket CORS to allow uploads from Vercel domain

## Phase B: Shopify

- [ ] Create store at `ruckusrenditions.myshopify.com` (Basic plan, $39/mo)
- [ ] Install Dawn theme (checkout only — storefront redirects to Next.js)
- [ ] Create Private App → copy Admin API key + secret
- [ ] Create Storefront API token
- [ ] Set webhook secret (random 32-byte hex string)
- [ ] Register webhooks in Shopify Admin → Notifications → Webhooks:
  - `orders/paid` → `https://ruckusrenditions.com/api/webhooks/shopify/order-paid`
  - `orders/fulfilled` → `https://ruckusrenditions.com/api/webhooks/shopify/order-fulfilled`
  - `orders/cancelled` → `https://ruckusrenditions.com/api/webhooks/shopify/order-cancelled`
  - `products/update` → `https://ruckusrenditions.com/api/revalidate`
- [ ] Enable Shopify Payments
- [ ] Configure shipping zones: Continental US, Hawaii/AK surcharge rule
- [ ] Enable automatic tax calculation
- [ ] Create Collections: Wheels, Suspension, Performance, Lighting, Packages
- [ ] Add redirect rule: all `*.myshopify.com/products/*` → `ruckusrenditions.com/catalog/*`

## Phase C: Vercel

- [ ] Connect GitHub repo in Vercel dashboard
- [ ] Set root directory: `apps/web`
- [ ] Set build command: `turbo build --filter=web`
- [ ] Add all environment variables from `.env.example`
- [ ] Add custom domain `ruckusrenditions.com`
- [ ] Enable Speed Insights + Web Analytics (free)
- [ ] Enable Image Optimization

## Phase D: GitHub Actions Secrets

Add all of the following under repo Settings → Secrets → Actions:

```
DATABASE_URL
DIRECT_URL
KEYSTONE_API_KEY
KEYSTONE_ACCOUNT_NUMBER
KEYSTONE_FTP_HOST
KEYSTONE_FTP_USER
KEYSTONE_FTP_PASS
TURN14_API_KEY
TURN14_API_BASE_URL
SHOPIFY_STORE_DOMAIN
SHOPIFY_ADMIN_API_KEY
SHOPIFY_ADMIN_API_SECRET
```

- [ ] Enable `.github/workflows/catalog-sync.yml`
- [ ] Run first sync: Actions → Catalog Sync → Run workflow → mode=full, dry_run=true
- [ ] Review CatalogSyncLog in Supabase
- [ ] Run live sync: mode=full, dry_run=false

## Phase E: Domain & DNS

- [ ] Register `ruckusrenditions.com` via Cloudflare Registrar (~$10/yr)
- [ ] Set nameservers to Cloudflare
- [ ] Cloudflare proxies all traffic (DDoS protection + CDN)
- [ ] SSL auto-provisioned via Vercel + Cloudflare
- [ ] Create email routing: `support@ruckusrenditions.com` → Gmail

## Phase F: Go-Live Validation

- [ ] Lighthouse mobile audit on homepage: Performance > 85, Accessibility > 95
- [ ] Lighthouse mobile audit on PDP: Performance > 85
- [ ] End-to-end purchase in Shopify test mode
- [ ] Verify HMAC validation: tamper with `X-Shopify-Hmac-SHA256` → expect 401
- [ ] MAP enforcement: find a MAP-restricted product, attempt to display price below MAP → blocked
- [ ] Vehicle selector cascade for 5 known vehicles
- [ ] Fitment filter returns correct wheel products for 2022 Toyota Tacoma TRD Pro
- [ ] Package builder adds all components to Shopify cart
- [ ] Tracking poller end-to-end with test order
- [ ] Set Vercel alert: 5xx error rate > 1%
- [ ] Enable Supabase Point-in-Time Recovery (PITR) — requires Pro plan
