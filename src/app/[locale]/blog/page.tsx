// Blog pages are fully static - pre-rendered at build time
// Using force-static to ensure no runtime component is needed
export const dynamic = 'force-static';
export const dynamicParams = false;

import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllPosts, type LocalizedPostSummary } from "@/lib/blog";
import BlogClient from "./client";
import BlogJsonLd, { BreadcrumbJsonLd } from "@/components/blocks/blog/blog-jsonld";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("blog");
  const siteUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";

  return {
    title: t("title"),
    description: t("description"),
    keywords: "watermark removal, PDF tools, AI tools, document processing, image editing, blog, tutorials",
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale,
      url: `${siteUrl}/${locale}/blog`,
      siteName: "WatermarkCleaner",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      creator: "@watermarkcleaner",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/blog`,
      languages: {
        en: `${siteUrl}/en/blog`,
        zh: `${siteUrl}/zh/blog`,
      },
    },
  };
}

export default async function BlogPage() {
  const locale = (await getLocale()) as "en" | "zh";
  const t = await getTranslations("blog");
  const siteUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";

  let posts: LocalizedPostSummary[] = [];

  try {
    posts = await getAllPosts(locale);
  } catch (error) {
    // 如果读取 content 目录失败，使用空数组
    console.error("Failed to load posts from content directory:", error);
  }

  return (
    <>
      {/* SEO - JSON-LD Structured Data */}
      <BlogJsonLd
        type="website"
        title={t("title")}
        description={t("description")}
        url={`${siteUrl}/${locale}/blog`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${siteUrl}/${locale}` },
          { name: "Blog", url: `${siteUrl}/${locale}/blog` },
        ]}
      />

      <BlogClient initialPosts={posts} />
    </>
  );
}