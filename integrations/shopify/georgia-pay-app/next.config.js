const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  async redirects() {
    return [
      { source: '/', destination: '/laripay', permanent: false },
      { source: '/pay', destination: '/laripay', permanent: false },
      { source: '/pay/:path*', destination: '/laripay/:path*', permanent: false },
      { source: '/payka', destination: '/laripay', permanent: true },
      { source: '/payka/:path*', destination: '/laripay/:path*', permanent: true },
      { source: '/en', destination: '/laripay/en', permanent: false },
      { source: '/ka', destination: '/laripay/ka', permanent: false },
      { source: '/api/payka/:path*', destination: '/api/laripay/:path*', permanent: true },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['@shopify/shopify-api', '@prisma/client'],
  },
  webpack: (config) => {
    const fs = require('fs');
    const vendored = path.join(__dirname, 'vendor/georgian-payments/georgian-payments.cjs');
    const monorepo = path.join(__dirname, '../../../src/georgian-payments.cjs');
    config.resolve.alias['@georgian-payments'] = fs.existsSync(vendored) ? vendored : monorepo;
    return config;
  },
};

module.exports = nextConfig;
