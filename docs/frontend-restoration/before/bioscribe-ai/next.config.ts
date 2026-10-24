import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next-phase3',
  eslint: { dirs: ['src/app', 'src/lib/phase3', 'src/components/Phase3Results.tsx', 'src/components/Phase3Workbench.tsx', 'src/middleware.ts'] },
  // Ensure static files are served properly
  async headers() {
    return [
      {
        source: '/3dmol-min.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
