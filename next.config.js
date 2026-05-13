/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tpvyrvjqamkhhqlrefwg.supabase.co',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  }
};

module.exports = nextConfig;
