/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export: no server, no API routes, no runtime network calls.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ['@adequate/design-tokens', '@adequate/mock-content'],
  reactStrictMode: true,
};
export default nextConfig;
