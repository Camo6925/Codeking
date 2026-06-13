import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@rr/db'

export const metadata: Metadata = {
  title: 'Build Gallery',
  description: 'Customer builds powered by Ruckus Renditions parts.',
}

export const revalidate = 60

export default async function BuildGalleryPage() {
  const builds = await prisma.build.findMany({
    where: { status: 'APPROVED' },
    orderBy: { approvedAt: 'desc' },
    take: 24,
    select: {
      id: true,
      slug: true,
      vehicleLabel: true,
      submitterName: true,
      instagramHandle: true,
      imageUrls: true,
      caption: true,
    },
  }).catch(() => [])

  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Build Gallery</h1>
            <p className="mt-1 text-gray-500">Real builds. Real customers. Real Ruckus.</p>
          </div>
          <Link
            href="/build-gallery/submit"
            className="rounded-lg bg-ruckus-red px-5 py-2 text-sm font-bold uppercase tracking-wider text-white hover:bg-ruckus-red-dark"
          >
            Submit Your Build
          </Link>
        </div>

        {builds.length === 0 ? (
          <div className="py-20 text-center text-gray-600">
            <p className="mb-4">No approved builds yet. Be the first!</p>
            <Link href="/build-gallery/submit" className="text-ruckus-red hover:underline">
              Submit your build →
            </Link>
          </div>
        ) : (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
            {builds.map((build) => (
              <Link
                key={build.id}
                href={`/build-gallery/${build.slug ?? build.id}`}
                className="group mb-4 block overflow-hidden rounded-xl bg-ruckus-gray-dark"
              >
                {build.imageUrls[0] && (
                  <div className="overflow-hidden">
                    <img
                      src={build.imageUrls[0]}
                      alt={build.vehicleLabel}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold text-ruckus-red">{build.vehicleLabel}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {build.submitterName}
                    {build.instagramHandle && ` · @${build.instagramHandle}`}
                  </p>
                  {build.caption && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{build.caption}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
