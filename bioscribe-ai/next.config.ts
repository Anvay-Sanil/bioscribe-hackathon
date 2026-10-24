import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the running preview independent from production builds.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next-phase3',
  eslint: { dirs: ['src/app', 'src/lib/phase3', 'src/components/MainNavigation.tsx', 'src/components/Phase3Results.tsx', 'src/components/Phase3Workbench.tsx', 'src/components/Phase3Explorer.tsx', 'src/components/Phase3MoleculeViewer.tsx', 'src/middleware.ts'] },
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
