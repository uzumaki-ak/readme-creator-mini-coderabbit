/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['jszip'],
  
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  
  // Add this for production
  compress: true,
}

export default nextConfig