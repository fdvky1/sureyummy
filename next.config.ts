import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // https://r2-simplepos.fdsrvr.my.id/menu/a4c46414-2b62-46c5-a878-ff4701d87522.jpg
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'r2-simplepos.fdsrvr.my.id',
      port: '',
      pathname: '/**',
    }]
  }
};

export default nextConfig;
