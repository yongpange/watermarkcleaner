import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse, type NextRequest } from 'next/server'

// 创建 next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // ✅ Canonical host redirect
  // If users land on a different host (e.g. www vs apex), Auth.js/NextAuth cookies
  // will not be shared, which looks like "login lost" across tabs.
  const host = request.headers.get('host') || '';
  if (host === 'www.watermarkcleaner.com' || host.startsWith('www.watermarkcleaner.com:')) {
    const url = request.nextUrl.clone();
    url.hostname = 'watermarkcleaner.com';
    // Keep protocol/path/query as-is; Vercel/Edge will generally already be https.
    return NextResponse.redirect(url, 308);
  }

  // Do not run locale middleware for API routes.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 处理国际化（移除 Supabase Auth）
  const intlResponse = intlMiddleware(request)
  return intlResponse
}

export const config = {
  matcher: [
    // Ensure canonical host redirect also applies to Auth.js/NextAuth endpoints
    "/api/auth/:path*",
    "/",
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    // 排除静态文件（包括 sitemap.xml, robots.txt 等）
    "/((?!auth/callback|privacy-policy|terms-of-service|api/|_next|_vercel|sitemap\\.xml|robots\\.txt|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
