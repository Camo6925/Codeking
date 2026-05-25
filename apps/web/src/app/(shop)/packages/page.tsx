import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@rr/db'

export const metadata: Metadata = {
  title: 'Packages',
  description: 'Curated wheel and suspension packages matched to your vehicle.',
}

export const revalidate = 300

export default async function PackagesPage() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    include: {
      items: {
        take: 1,
        include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      },
    },
  })

  function formatCents(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
  }

  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">Packages</h1>
          <p className="mt-1 text-gray-500">Curated bundles — everything you need in one order.</p>
        </div>

        {packages.length === 0 ? (
          <div className="py-20 text-center text-gray-600">No packages available yet. Check back soon.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const heroImage = pkg.items[0]?.product?.images[0]
              const savings = pkg.totalMsrp && pkg.totalMsrp > pkg.packagePrice
                ? pkg.totalMsrp - pkg.packagePrice
                : 0

              return (
                <Link
                  key={pkg.id}
                  href={`/packages/${pkg.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl bg-ruckus-gray-dark transition-transform hover:-translate-y-1"
                >
                  <div className="relative aspect-video overflow-hidden bg-ruckus-gray-mid">
                    {pkg.imageUrl || heroImage ? (
                      <img
                        src={pkg.imageUrl ?? heroImage!.url}
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
                      <span className="absolute right-3 top-3 rounded bg-green-700 px-2 py-0.5 text-xs font-bold uppercase">
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
                      {pkg.totalMsrp && pkg.totalMsrp > pkg.packagePrice && (
                        <span className="text-sm text-gray-600 line-through">{formatCents(pkg.totalMsrp)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
