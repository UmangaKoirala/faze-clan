/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Let other devices open the dev server: same-Wi-Fi IPs and Cloudflare tunnel links.
  allowedDevOrigins: ['10.*.*.*', '192.168.*.*', '*.trycloudflare.com'],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
