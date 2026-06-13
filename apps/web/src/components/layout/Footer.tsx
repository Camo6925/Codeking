import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-ruckus-gray-mid bg-ruckus-black px-4 py-12 text-sm text-gray-500">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 sm:grid-cols-4">
        <div>
          <p className="mb-3 font-bold uppercase tracking-wider text-white">Shop</p>
          <ul className="space-y-2">
            <li><Link href="/wheels" className="hover:text-white">Wheels</Link></li>
            <li><Link href="/suspension" className="hover:text-white">Suspension</Link></li>
            <li><Link href="/performance" className="hover:text-white">Performance</Link></li>
            <li><Link href="/lighting" className="hover:text-white">Lighting</Link></li>
            <li><Link href="/packages" className="hover:text-white">Packages</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-bold uppercase tracking-wider text-white">Community</p>
          <ul className="space-y-2">
            <li><Link href="/build-gallery" className="hover:text-white">Build Gallery</Link></li>
            <li><Link href="/garage" className="hover:text-white">My Garage</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-bold uppercase tracking-wider text-white">Support</p>
          <ul className="space-y-2">
            <li><a href="mailto:support@ruckusrenditions.com" className="hover:text-white">Contact Us</a></li>
            <li><Link href="/search" className="hover:text-white">Search</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-bold uppercase tracking-wider text-white">Ruckus</p>
          <p className="leading-relaxed">
            Vehicle-first performance parts. Drop-shipped direct to your door.
          </p>
          <p className="mt-3 font-bold uppercase tracking-widest text-ruckus-red text-xs">
            Bring the Ruckus.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-ruckus-gray-mid pt-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Ruckus Renditions. All rights reserved.
      </div>
    </footer>
  )
}
