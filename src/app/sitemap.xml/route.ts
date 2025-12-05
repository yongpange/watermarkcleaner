import { locales } from "@/i18n/locale";
import { getAllPostSlugs } from "@/lib/blog/loader";

const BASE_URL = "https://www.turbolearn.buzz";

// 静态页面配置
const staticPages = [
  { path: "", changeFreq: "weekly", priority: "1.0" },
  { path: "/blog", changeFreq: "weekly", priority: "0.8" },
  { path: "/convert", changeFreq: "monthly", priority: "0.9" },
  { path: "/workspace", changeFreq: "monthly", priority: "0.8" },
  { path: "/auth/signin", changeFreq: "monthly", priority: "0.5" },
  { path: "/pricing", changeFreq: "monthly", priority: "0.7" },
];

// 不需要多语言的页面
const nonLocalizedPages = [
  { path: "/privacy-policy", changeFreq: "yearly", priority: "0.3" },
  { path: "/terms-of-service", changeFreq: "yearly", priority: "0.3" },
];

function generateAlternateLinks(path: string): string {
  return locales
    .map((locale) => {
      const href =
        locale === "en" ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;
      return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${href}"/>`;
    })
    .join("\n");
}

function generateUrlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  alternates?: string
): string {
  let entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>`;
  if (alternates) {
    entry += `\n${alternates}`;
  }
  entry += `\n  </url>`;
  return entry;
}

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const urls: string[] = [];

  // 1. 多语言静态页面
  for (const page of staticPages) {
    const loc = `${BASE_URL}${page.path || "/"}`;
    const alternates = generateAlternateLinks(page.path);
    urls.push(generateUrlEntry(loc, now, page.changeFreq, page.priority, alternates));
  }

  // 2. 非多语言页面
  for (const page of nonLocalizedPages) {
    urls.push(generateUrlEntry(`${BASE_URL}${page.path}`, now, page.changeFreq, page.priority));
  }

  // 3. 博客文章
  try {
    const slugs = await getAllPostSlugs();
    for (const slug of slugs) {
      const loc = `${BASE_URL}/blog/${slug}`;
      const alternates = generateAlternateLinks(`/blog/${slug}`);
      urls.push(generateUrlEntry(loc, now, "monthly", "0.7", alternates));
    }
  } catch (error) {
    console.error("Error generating blog sitemap entries:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

