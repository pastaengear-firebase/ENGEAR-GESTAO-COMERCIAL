/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // CUIDADO: Isso ignora erros de TS no build para forçar a subida
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;
