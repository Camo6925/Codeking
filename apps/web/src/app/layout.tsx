import type { Metadata } from 'next'
import './globals.css'
import { VehicleProvider } from '@/components/vehicle/VehicleContext'
import { CartProvider } from '@/components/cart/CartContext'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Ruckus Renditions | Built for Fitment. Built for Performance.',
    template: '%s | Ruckus Renditions',
  },
  description:
    'Wheels, suspension, performance, and lighting for your truck, SUV, or Jeep. Vehicle-first shopping — find parts that fit your exact year, make, model, and trim.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ruckusrenditions.com'),
  openGraph: {
    siteName: 'Ruckus Renditions',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VehicleProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            {children}
            <Footer />
          </CartProvider>
        </VehicleProvider>
      </body>
    </html>
  )
}
