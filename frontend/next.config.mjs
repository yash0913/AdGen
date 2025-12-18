/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const UPLOADS_BASE = process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:5000/uploads'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_BASE}/:path*` },
      { source: '/uploads/:path*', destination: `${UPLOADS_BASE}/:path*` },
    ]
  },
}

export default nextConfig
