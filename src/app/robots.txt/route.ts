const BASE_URL = "https://www.watermarkcleaner.com";

export async function GET() {
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# 禁止爬取的路径
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /auth/callback
Disallow: /pay-success/
Disallow: /my-credits
Disallow: /my-orders
Disallow: /api-keys/

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

