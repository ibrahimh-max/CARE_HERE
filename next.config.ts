import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js doesn't get confused by
  // an unrelated lockfile in a parent folder outside this repo.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;