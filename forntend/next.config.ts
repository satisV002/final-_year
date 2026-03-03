import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Transpile leaflet for SSR compatibility */
  transpilePackages: ['leaflet', 'react-leaflet'],
};

export default nextConfig;
