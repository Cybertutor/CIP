import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow longer timeouts for SSE streaming routes
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
