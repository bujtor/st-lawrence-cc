import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/candidates/c', destination: '/', permanent: true },
      { source: '/candidates/c/:path*', destination: '/:path*', permanent: true },
    ]
  },
}

export default nextConfig
