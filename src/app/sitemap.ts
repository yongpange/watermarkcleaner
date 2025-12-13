import { locales } from "@/i18n/locale";

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

  return [...homePages, ...corePages, ...legalPages];
}
