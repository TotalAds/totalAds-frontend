/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during build to allow warnings
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const socialService =
      process.env.NEXT_PUBLIC_SOCIAL_SERVICE_URL || "http://localhost:3005";
    return [
      {
        source: "/api/social-media/:path*",
        destination: `${socialService.replace(/\/$/, "")}/api/v1/media/public/:path*`,
      },
    ];
  },
};

export default nextConfig;
