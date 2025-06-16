
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Adicionado para permitir imagens do Google Storage
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
    // unoptimized: true, // Removida a desotimização global
  },
  allowedDevOrigins: ['https://6000-firebase-studio-1747639280840.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev'],
};

export default nextConfig;
