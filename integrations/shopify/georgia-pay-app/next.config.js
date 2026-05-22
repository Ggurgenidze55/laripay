const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  async redirects() {
    return [
      { source: '/', destination: '/laripay', permanent: false },
      { source: '/payka', destination: '/laripay', permanent: true },
      { source: '/payka/:path*', destination: '/laripay/:path*', permanent: true },
      { source: '/api/payka/:path*', destination: '/api/laripay/:path*', permanent: true },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['@shopify/shopify-api', '@prisma/client'],
  },
  webpack: (config) => {
    config.resolve.alias['@georgian-payments'] = path.join(
      __dirname,
      '../../../src/georgian-payments.cjs',
    );
    return config;
  },
};

module.exports = nextConfig;
