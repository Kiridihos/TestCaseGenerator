import type {NextConfig} from 'next';
import {config} from 'dotenv';
import path from 'path';

// This line ensures that environment variables from 'workspace/.env' are loaded for the Next.js app.
config({path: path.resolve(process.cwd(), 'workspace/.env')});

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
    ],
  },
};

export default nextConfig;
