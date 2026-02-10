/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@polka-xplo/shared"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
