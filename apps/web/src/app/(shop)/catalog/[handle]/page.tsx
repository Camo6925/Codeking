import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@rr/db'
import { enforceMAPCents } from '@/lib/utils/map-price'
import { FitmentBadge } from '@/components/fitment/FitmentBadge'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { VariantSelector } from '@/components/product/VariantSelector'

interface Props {
  params: { handle: string }
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.handle },
    select: {
      name: true,
      description: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  })
  if (!product) return {}
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { slug: params.handle, isActive: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { price: 'asc' } },
      brand: true,
      category: true,
      fitmentApplications: {
        take: 5,
        include: {
          trim: {
            include: { model: { include: { make: { include: { year: true } } } } },
          },
        },
      },
    },
  })

  if (!product) notFound()

  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0]
  const lowestPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : null
  const displayPrice = lowestPrice != null
    ? enforceMAPCents(lowestPrice, product.mapPrice ?? undefined)
    : null
  const singleVariant = product.variants.length === 1 ? product.variants[0] : null

  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex gap-2 text-xs text-gray-600">
          <a href="/" className="hover:text-gray-400">Home</a>
          <span>/</span>
          <a href={`/${product.category.slug}`} className="hover:text-gray-400">{product.category.name}</a>
          <span>/</span>
          <span className="text-gray-400 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-xl bg-ruckus-gray-dark">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.name}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl text-gray-700">⚙</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.slice(0, 6).map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.altText ?? ''}
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover border border-ruckus-gray-mid"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-1 text-sm uppercase tracking-wider text-gray-500">{product.brand.name}</p>
              <h1 className="text-2xl font-black uppercase leading-tight sm:text-3xl">{product.name}</h1>
              <p className="mt-1 text-xs text-gray-600">Part #: {product.partNumber}</p>
            </div>

            <FitmentBadge productId={product.id} />

            {displayPrice != null && (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-ruckus-red">{formatCents(displayPrice)}</span>
                {lowestPrice != null && lowestPrice !== displayPrice && (
                  <span className="text-lg text-gray-500 line-through">{formatCents(lowestPrice)}</span>
                )}
                {product.variants.length > 1 && (
                  <span className="text-sm text-gray-600">starting at</span>
                )}
              </div>
            )}

            {singleVariant ? (
              <AddToCartButton
                shopifyVariantId={singleVariant.shopifyVariantId ?? ''}
                disabled={
                  !singleVariant.shopifyVariantId ||
                  singleVariant.availabilityStatus === 'OUT_OF_STOCK'
                }
              />
            ) : product.variants.length > 1 ? (
              <VariantSelector variants={product.variants} mapPrice={product.mapPrice} />
            ) : (
              <p className="rounded-lg border border-ruckus-gray-mid p-4 text-center text-sm text-gray-500">
                No variants available. Contact us for assistance.
              </p>
            )}

            {product.description && (
              <div className="border-t border-ruckus-gray-mid pt-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">Description</h2>
                <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {product.fitmentApplications.length > 0 && (
              <div className="border-t border-ruckus-gray-mid pt-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">Compatible Vehicles</h2>
                <ul className="space-y-1 text-sm text-gray-400">
                  {product.fitmentApplications.map((app) => (
                    <li key={app.id}>
                      {app.trim.model.make.year.year} {app.trim.model.make.name} {app.trim.model.name} {app.trim.name}
                      {app.notes && <span className="ml-2 text-xs text-gray-600">({app.notes})</span>}
                    </li>
                  ))}
                  {product.fitmentApplications.length === 5 && (
                    <li className="text-gray-600 text-xs">...and more. Select your vehicle to verify fitment.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
