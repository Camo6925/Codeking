import Link from 'next/link'
import { enforceMAPCents } from '@/lib/utils/map-price'
import { FitmentBadge } from '@/components/fitment/FitmentBadge'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    partNumber: string
    msrp?: number | null
    mapPrice?: number | null
    images: Array<{ url: string; altText?: string | null; isPrimary: boolean }>
    brand: { name: string; slug: string }
    variants: Array<{ price: number }>
  }
  trimId?: number | null
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function ProductCard({ product, trimId }: ProductCardProps) {
  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0]
  const lowestVariantPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : null
  const displayPrice = lowestVariantPrice != null
    ? enforceMAPCents(lowestVariantPrice, product.mapPrice ?? undefined)
    : null

  return (
    <Link
      href={`/catalog/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-ruckus-gray-dark transition-transform hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-ruckus-gray-mid">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.altText ?? product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-700">
            ⚙
          </div>
        )}
        {trimId && (
          <div className="absolute bottom-2 left-2">
            <FitmentBadge productId={product.id} trimId={trimId} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">{product.brand.name}</p>
        <h3 className="mb-2 flex-1 text-sm font-semibold leading-snug text-white line-clamp-2">
          {product.name}
        </h3>
        <p className="mb-3 text-xs text-gray-600">{product.partNumber}</p>
        {displayPrice != null ? (
          <p className="text-base font-bold text-ruckus-red">
            {lowestVariantPrice !== displayPrice && (
              <span className="mr-2 text-xs font-normal text-gray-500 line-through">
                {formatCents(lowestVariantPrice!)}
              </span>
            )}
            {formatCents(displayPrice)}
          </p>
        ) : (
          <p className="text-sm text-gray-500">Contact for price</p>
        )}
      </div>
    </Link>
  )
}
