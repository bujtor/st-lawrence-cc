import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/candidates/c', destination: '/', permanent: true },
      { source: '/candidates/c/:path*', destination: '/:path*', permanent: true },
      // Other design prototypes (a, b, d) were removed; send any old links home.
      { source: '/candidates', destination: '/', permanent: true },
      { source: '/candidates/:path*', destination: '/', permanent: true },
    ]
  },
}

export default nextConfig
