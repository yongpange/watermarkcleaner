import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllPosts, type LocalizedPostSummary } from "@/lib/blog";
import BlogClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("blog");

  return {
    title: t("title"),
    description: t("description"),
    keywords: "AI learning, study tips, educational technology, turbo learning, flashcard app, study methods",
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale,
    },
  };
}

export default async function BlogPage() {
  const locale = (await getLocale()) as "en" | "zh";

  let posts: LocalizedPostSummary[] = [];

  try {
    posts = await getAllPosts(locale);
  } catch (error) {
    // 如果读取 content 目录失败，使用空数组
    console.error("Failed to load posts from content directory:", error);
  }

  return <BlogClient initialPosts={posts} />;
}