import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@rr/db'
import Link from 'next/link'

interface Props { params: { buildId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const build = await prisma.build.findFirst({
    where: {
      OR: [{ slug: params.buildId }, { id: params.buildId }],
      status: 'APPROVED',
    },
    select: { vehicleLabel: true, submitterName: true },
  })
  if (!build) return {}
  return { title: `${build.vehicleLabel} — ${build.submitterName}'s Build` }
}

export default async function BuildPage({ params }: Props) {
  const build = await prisma.build.findFirst({
    where: {
      OR: [{ slug: params.buildId }, { id: params.buildId }],
      status: 'APPROVED',
    },
  })

  if (!build) notFound()

  const featured = (build.featuredProducts as Array<{ productId: string; partNumber: string; name: string }> | null) ?? []

  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/build-gallery" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white">
          ← Back to Gallery
        </Link>

        <h1 className="mb-1 text-2xl font-black uppercase">{build.vehicleLabel}</h1>
        <p className="mb-6 text-sm text-gray-500">
          Build by {build.submitterName}
          {build.instagramHandle && (
            <a
              href={`https://instagram.com/${build.instagramHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-ruckus-red hover:underline"
            >
              @{build.instagramHandle.replace('@', '')}
            </a>
          )}
        </p>

        {/* Images */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {build.imageUrls.map((url, i) => (
            <div key={i} className={`overflow-hidden rounded-xl ${i === 0 ? 'sm:col-span-2' : ''}`}>
              <img src={url} alt={`${build.vehicleLabel} build photo ${i + 1}`} className="w-full object-cover" />
            </div>
          ))}
        </div>

        {/* Caption */}
        {build.caption && (
          <div className="mb-8 rounded-xl bg-ruckus-gray-dark p-6">
            <p className="leading-relaxed text-gray-300">{build.caption}</p>
          </div>
        )}

        {/* Featured products */}
        {featured.length > 0 && (
          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Parts on This Build</h2>
            <ul className="space-y-2">
              {featured.map((p) => (
                <li key={p.productId}>
                  <Link
                    href={`/catalog/${p.productId}`}
                    className="flex items-center justify-between rounded-lg bg-ruckus-gray-dark px-4 py-3 hover:bg-ruckus-gray-mid"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-gray-600">{p.partNumber}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
