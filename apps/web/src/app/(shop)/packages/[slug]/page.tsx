import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@rr/db'
import { enforceMAPCents } from '@/lib/utils/map-price'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import Link from 'next/link'

interface Props { params: { slug: string } }

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pkg = await prisma.package.findUnique({ where: { slug: params.slug }, select: { name: true, description: true } })
  if (!pkg) return {}
  return { title: pkg.name, description: pkg.description?.slice(0, 160) }
}

export default async function PackagePage({ params }: Props) {
  const pkg = await prisma.package.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { orderBy: { price: 'asc' }, take: 1 },
              brand: true,
            },
          },
        },
      },
      fitment: {
        include: {
          trim: { include: { model: { include: { make: { include: { year: true } } } } } },
        },
      },
    },
  })

  if (!pkg) notFound()

  const savings = pkg.totalMsrp && pkg.totalMsrp > pkg.packagePrice
    ? pkg.totalMsrp - pkg.packagePrice
    : 0

  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="mb-6 flex gap-2 text-xs text-gray-600">
          <a href="/packages" className="hover:text-gray-400">Packages</a>
          <span>/</span>
          <span className="text-gray-400">{pkg.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Left: image + fitment */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video overflow-hidden rounded-xl bg-ruckus-gray-dark">
              {pkg.imageUrl ? (
                <img src={pkg.imageUrl} alt={pkg.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl text-gray-700">📦</div>
              )}
            </div>
            {pkg.fitment.length > 0 && (
              <div className="rounded-xl bg-ruckus-gray-dark p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Compatible Vehicles</h3>
                <ul className="space-y-1 text-sm text-gray-400">
                  {pkg.fitment.map((f) => (
                    <li key={f.id}>
                      {f.trim.model.make.year.year} {f.trim.model.make.name} {f.trim.model.name} {f.trim.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: info + components */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h1 className="text-2xl font-black uppercase leading-tight sm:text-3xl">{pkg.name}</h1>
              {pkg.description && <p className="mt-2 text-gray-400">{pkg.description}</p>}
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-ruckus-red">{formatCents(pkg.packagePrice)}</span>
              {pkg.totalMsrp && pkg.totalMsrp > pkg.packagePrice && (
                <>
                  <span className="text-xl text-gray-600 line-through">{formatCents(pkg.totalMsrp)}</span>
                  <span className="rounded bg-green-800 px-2 py-0.5 text-xs font-bold text-green-200">
                    Save {formatCents(savings)}
                  </span>
                </>
              )}
            </div>

            {/* What's included */}
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">What's Included</h2>
              <ul className="space-y-3">
                {pkg.items.map((item) => {
                  const img = item.product.images[0]
                  const variant = item.product.variants[0]
                  const price = variant
                    ? enforceMAPCents(variant.price, item.product.mapPrice ?? undefined)
                    : null

                  return (
                    <li key={item.id} className="flex items-center gap-3 rounded-lg bg-ruckus-gray-dark p-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-ruckus-gray-mid">
                        {img ? (
                          <img src={img.url} alt={item.product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-2xl text-gray-700">⚙</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/catalog/${item.product.slug}`}
                          className="text-sm font-semibold hover:text-ruckus-red line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-gray-600">{item.product.brand.name} · Qty {item.quantity}</p>
                      </div>
                      {price != null && (
                        <span className="text-sm font-bold text-ruckus-red flex-shrink-0">{formatCents(price)}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* CTA — add each variant to cart */}
            <div className="rounded-xl border border-ruckus-gray-mid p-4">
              <p className="mb-3 text-sm text-gray-500">
                This package adds {pkg.items.length} item{pkg.items.length !== 1 ? 's' : ''} to your cart.
              </p>
              {pkg.shopifyProductId ? (
                <AddToCartButton shopifyVariantId={pkg.shopifyProductId} />
              ) : (
                <p className="rounded-lg bg-ruckus-gray-mid px-4 py-3 text-center text-sm text-gray-500">
                  Package not yet available for checkout. <a href="mailto:support@ruckusrenditions.com" className="text-ruckus-red hover:underline">Contact us</a>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
