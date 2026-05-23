const path = require('path');

const useStandalone =
  !process.env.VERCEL &&
  !process.env.RAILWAY_ENVIRONMENT &&
  !process.env.RAILWAY;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(useStandalone ? { output: 'standalone' } : {}),
  async redirects() {
    return [
      { source: '/laripay.en', destination: '/laripay/en', permanent: false },
      { source: '/laripay.en/:path*', destination: '/laripay/en/:path*', permanent: false },
      { source: '/laripay.ka', destination: '/laripay/ka', permanent: false },
      { source: '/laripay.ka/:path*', destination: '/laripay/ka/:path*', permanent: false },
      { source: '/laripayka', destination: '/laripay/ka', permanent: false },
      { source: '/laripayka/:path*', destination: '/laripay/ka/:path*', permanent: false },
      { source: '/laripayen', destination: '/laripay/en', permanent: false },
      { source: '/laripayen/:path*', destination: '/laripay/en/:path*', permanent: false },
      { source: '/lanpay', destination: '/laripay', permanent: true },
      { source: '/lanpay/:path*', destination: '/laripay/:path*', permanent: true },
      { source: '/lari-pay', destination: '/laripay', permanent: true },
      { source: '/lari-pay/:path*', destination: '/laripay/:path*', permanent: true },
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
    serverComponentsExternalPackages: ['@shopify/shopify-api', '@prisma/client', 'bcrypt'],
    // Do not set outputFileTracingRoot on Vercel when vercel-app.sh copies .next to repo root —
    // tracing root `integrations/` makes Vercel look for shopify/georgia-pay-app/.next (ENOENT).
    // Do not use optimizePackageImports for framer-motion — breaks dev vendor-chunks (.next/server/vendor-chunks/framer-motion.js).
  },
  webpack: (config) => {
    const fs = require('fs');
    const vendoredSrc = path.join(__dirname, 'vendor/monorepo-src');
    const monorepoSrc = path.join(__dirname, '../../../src');
    const srcRoot = fs.existsSync(vendoredSrc) ? vendoredSrc : monorepoSrc;
    config.resolve.alias['@georgian-payments'] = path.join(srcRoot, 'georgian-payments.cjs');
    config.resolve.alias['@georgian-delivery'] = path.join(srcRoot, 'georgian-delivery.cjs');
    config.resolve.alias['@georgian-warehouse'] = path.join(srcRoot, 'georgian-warehouse.cjs');
    return config;
  },
};

module.exports = nextConfig;
