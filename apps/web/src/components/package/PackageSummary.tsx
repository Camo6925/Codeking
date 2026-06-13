interface PackageItem {
  id: string
  quantity: number
  product: {
    name: string
    partNumber: string
    images: Array<{ url: string; altText?: string | null }>
    variants: Array<{ price: number }>
    brand: { name: string }
  }
}

interface PackageSummaryProps {
  items: PackageItem[]
  packagePrice: number
  totalMsrp?: number | null
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function PackageSummary({ items, packagePrice, totalMsrp }: PackageSummaryProps) {
  const savings = totalMsrp && totalMsrp > packagePrice ? totalMsrp - packagePrice : 0

  return (
    <div className="rounded-xl border border-ruckus-gray-mid bg-ruckus-gray-dark p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
        Package Includes ({items.length} items)
      </h3>
      <ul className="space-y-3">
        {items.map((item) => {
          const img = item.product.images[0]
          const price = item.product.variants[0]?.price
          return (
            <li key={item.id} className="flex items-center gap-3">
              {img && (
                <img
                  src={img.url}
                  alt={img.altText ?? item.product.name}
                  className="h-12 w-12 flex-shrink-0 rounded-lg object-cover bg-ruckus-gray-mid"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-gray-500">
                  {item.product.brand.name} · {item.product.partNumber}
                  {item.quantity > 1 && ` × ${item.quantity}`}
                </p>
              </div>
              {price && (
                <span className="flex-shrink-0 text-sm text-gray-400">
                  {formatCents(price * item.quantity)}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <div className="mt-5 border-t border-ruckus-gray-mid pt-4">
        <div className="flex items-center justify-between">
          <span className="font-bold">Package Price</span>
          <span className="text-xl font-black text-ruckus-red">{formatCents(packagePrice)}</span>
        </div>
        {savings > 0 && (
          <p className="mt-1 text-right text-sm text-green-400">
            You save {formatCents(savings)} vs buying separately
          </p>
        )}
      </div>
    </div>
  )
}
