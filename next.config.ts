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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Fix for Server Actions in dev containers/Codespaces
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:9002',
        '*.app.github.dev',
        '*.githubpreview.dev',
        '*.preview.app.github.dev',
        'opulent-space-goldfish-9vrr6r76997fxqrr-9002.app.github.dev',
      ],
    },
  },
};

export default nextConfig;
