/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
    outputFileTracingIncludes: {
      "/**": ["./trust-hub.db"],
    },
  },
};

module.exports = nextConfig;
