import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse, type NextRequest } from 'next/server'

// 创建 next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 处理国际化（移除 Supabase Auth）
  const intlResponse = intlMiddleware(request)
  return intlResponse
}

export const config = {
  matcher: [
    "/",
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    // 排除静态文件（包括 sitemap.xml, robots.txt 等）
    "/((?!auth/callback|privacy-policy|terms-of-service|api/|_next|_vercel|sitemap\\.xml|robots\\.txt|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
