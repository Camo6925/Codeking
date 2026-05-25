import Link from 'next/link'

interface PackageCardProps {
  pkg: {
    id: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    packagePrice: number
    totalMsrp?: number | null
    isFeatured: boolean
    items: Array<{
      product: {
        images: Array<{ url: string; altText?: string | null }>
      }
    }>
  }
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function PackageCard({ pkg }: PackageCardProps) {
  const heroImage = pkg.imageUrl ?? pkg.items[0]?.product?.images[0]?.url
  const savings = pkg.totalMsrp && pkg.totalMsrp > pkg.packagePrice ? pkg.totalMsrp - pkg.packagePrice : 0

  return (
    <Link
      href={`/packages/${pkg.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-ruckus-gray-dark transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden bg-ruckus-gray-mid">
        {heroImage ? (
          <img
            src={heroImage}
            alt={pkg.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-gray-700">📦</div>
        )}
        {pkg.isFeatured && (
          <span className="absolute left-3 top-3 rounded bg-ruckus-red px-2 py-0.5 text-xs font-bold uppercase">
            Featured
          </span>
        )}
        {savings > 0 && (
          <span className="absolute right-3 top-3 rounded bg-green-700 px-2 py-0.5 text-xs font-bold uppercase text-white">
            Save {formatCents(savings)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="mb-1 font-bold text-white">{pkg.name}</h2>
        {pkg.description && (
          <p className="mb-3 flex-1 text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-black text-ruckus-red">{formatCents(pkg.packagePrice)}</span>
          {savings > 0 && (
            <span className="text-sm text-gray-600 line-through">{formatCents(pkg.totalMsrp!)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
