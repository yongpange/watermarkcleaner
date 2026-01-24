import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import mdx from "@next/mdx";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

const withMDX = mdx({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // NOTE: Database field names in generated types don't match code (e.g. userid vs user_id)
  // Need to update code to use lowercase field names or regenerate types with proper naming
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  // 确保 content 目录在构建输出中被包含（用于 Vercel 部署）
  outputFileTracingIncludes: {
    "/[locale]/blog": ["./content/blog/**/*"],
    "/[locale]/blog/[slug]": ["./content/blog/**/*"],
  },
  async redirects() {
    return [];
  },
  // 全局安全头配置
  async headers() {
    return [
      {
        // 应用于所有路径
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

// Make sure experimental mdx flag is enabled
const configWithMDX = {
  ...nextConfig,
  // 需要 Node.js API 的包列表，这些包不应该在 Edge Runtime 中使用
  serverExternalPackages: [
    '@supabase/supabase-js',
    '@supabase/realtime-js',
    '@supabase/ssr',
    '@supabase/auth-helpers-nextjs',
  ],
  experimental: {
    mdxRs: true,
  },
  webpack: (config, { isServer }) => {
    // 配置 resolve alias 以避免 Edge Runtime 警告
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default withBundleAnalyzer(withNextIntl(withMDX(configWithMDX)));
