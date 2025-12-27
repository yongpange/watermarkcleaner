import { locales } from "@/i18n/locale";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 3600; // 每小时重新生成一次

export default async function sitemap() {
  const baseUrl = "https://watermarkcleaner.com";

  // 主页 - 所有语言版本
  const homePages = locales.map((locale) => ({
    url: locale === "en" ? baseUrl : `${baseUrl}/${locale}`,
    lastModified: new Date(),
    priority: locale === "en" ? 1.0 : 0.9,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [
          l === "en" ? "en-US" : l === "zh" ? "zh-CN" : l,
          l === "en" ? baseUrl : `${baseUrl}/${l}`,
        ])
      ),
    },
  }));

  // 核心功能页面
  const corePages = [
    {
      url: `${baseUrl}/converter`,
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/showcase`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      priority: 0.6,
    },
  ];

  // 法律页面
  const legalPages = [
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      priority: 0.1,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      priority: 0.1,
    },
  ];

  // 博客文章 - 所有语言版本
  const blogPages: any[] = [];

  for (const locale of locales) {
    const posts = await getAllPosts(locale as any);

    posts.forEach((post) => {
      const url = locale === "en"
        ? `${baseUrl}/blog/${post.slug}`
        : `${baseUrl}/${locale}/blog/${post.slug}`;

      blogPages.push({
        url,
        lastModified: new Date(post.publishDate),
        priority: post.featured ? 0.8 : 0.5,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l === "en" ? "en-US" : l === "zh" ? "zh-CN" : l,
              l === "en"
                ? `${baseUrl}/blog/${post.slug}`
                : `${baseUrl}/${l}/blog/${post.slug}`,
            ])
          ),
        },
      });
    });
  }

  // 功能页面 - 所有语言版本
  const featurePages: any[] = [];
  const features = ["converter", "pricing", "blog", "showcase"];

  features.forEach((feature) => {
    locales.forEach((locale) => {
      if (locale !== "en") {
        featurePages.push({
          url: `${baseUrl}/${locale}/${feature}`,
          lastModified: new Date(),
          priority: 0.7,
        });
      }
    });
  });

  return [
    ...homePages,
    ...corePages,
    ...legalPages,
    ...blogPages,
    ...featurePages
  ];
}