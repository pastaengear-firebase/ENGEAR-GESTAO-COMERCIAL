/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*.web.app', '*.firebaseapp.com'],
    },
  },
}

module.exports = nextConfig
