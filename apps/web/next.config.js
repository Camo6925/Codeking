/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '**.keystoneautomotive.com',
      },
      {
        protocol: 'https',
        hostname: '**.turn14.com',
      },
    ],
  },
  // Redirect all /products requests to the storefront catalog
  async redirects() {
    return [
      {
        source: '/products/:path*',
        destination: '/catalog/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
