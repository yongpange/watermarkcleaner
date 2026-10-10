/**
 * 博客内容加载器
 */

import { promises as fs } from "fs";
import path from "path";
import type {
  Locale,
  BlogConfig,
  PostMeta,
  LocalizedPost,
  LocalizedPostSummary,
} from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

let blogConfigCache: BlogConfig | null = null;

/**
 * 获取博客全局配置
 */
export async function getBlogConfig(): Promise<BlogConfig> {
  if (blogConfigCache) {
    return blogConfigCache;
  }

  try {
    const configPath = path.join(CONTENT_DIR, "_index.json");
    const content = await fs.readFile(configPath, "utf-8");
    blogConfigCache = JSON.parse(content) as BlogConfig;
    return blogConfigCache;
  } catch (error) {
    console.error("Error loading blog config:", error);

    // 返回默认配置
    const defaultConfig: BlogConfig = {
      categories: [],
      authors: [],
      defaultLocale: "en",
      supportedLocales: ["en", "zh"],
    };
    blogConfigCache = defaultConfig;
    return defaultConfig;
  }
}

/**
 * 获取所有文章目录
 */
async function getPostSlugs(): Promise<string[]> {
  try {
    const stats = await fs.stat(CONTENT_DIR);
    if (!stats.isDirectory()) {
      return [];
    }
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name);
  } catch (error) {
    // 目录不存在或无法读取，返回空数组
    return [];
  }
}

/**
 * 获取文章元数据
 */
async function getPostMeta(slugDir: string): Promise<PostMeta | null> {
  try {
    const metaPath = path.join(CONTENT_DIR, slugDir, "index.json");
    const content = await fs.readFile(metaPath, "utf-8");
    return JSON.parse(content) as PostMeta;
  } catch {
    return null;
  }
}

/**
 * 获取文章内容
 */
async function getPostContent(
  slugDir: string,
  locale: Locale,
  defaultLocale: Locale
): Promise<string | null> {
  // 尝试获取当前语言版本
  const localePath = path.join(CONTENT_DIR, slugDir, `${locale}.mdx`);
  try {
    return await fs.readFile(localePath, "utf-8");
  } catch {
    // Fallback 到默认语言
    if (locale !== defaultLocale) {
      const defaultPath = path.join(CONTENT_DIR, slugDir, `${defaultLocale}.mdx`);
      try {
        return await fs.readFile(defaultPath, "utf-8");
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 本地化文章元数据
 */
function localizePostMeta(
  meta: PostMeta,
  locale: Locale,
  config: BlogConfig
): LocalizedPostSummary {
  const category = config.categories.find((c) => c.id === meta.category);
  const author = config.authors.find((a) => a.id === meta.author);

  return {
    slug: meta.slug,
    title: meta.title[locale] || meta.title.en,
    description: meta.description[locale] || meta.description.en,
    category: meta.category,
    categoryName: category?.name[locale] || category?.name.en || meta.category,
    author: meta.author,
    authorName: author?.name[locale] || author?.name.en || meta.author,
    authorAvatar: author?.avatar,
    publishDate: meta.publishDate,
    readTime: meta.readTime || meta.readingTime || 5,
    featured: meta.featured,
    coverImage: meta.coverImage || meta.image,
    tags: meta.tags[locale] || meta.tags.en,
  };
}

/**
 * 获取所有文章摘要（用于列表页）
 */
export async function getAllPosts(locale: Locale): Promise<LocalizedPostSummary[]> {
  const config = await getBlogConfig();
  const slugDirs = await getPostSlugs();
  const posts: LocalizedPostSummary[] = [];

  for (const slugDir of slugDirs) {
    const meta = await getPostMeta(slugDir);
    if (meta) {
      posts.push(localizePostMeta(meta, locale, config));
    }
  }

  // 按发布日期降序排列
  return posts.sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
}

/**
 * 根据 slug 获取完整文章（用于详情页）
 */
export async function getPostBySlug(
  slug: string,
  locale: Locale
): Promise<LocalizedPost | null> {
  const config = await getBlogConfig();
  const slugDirs = await getPostSlugs();

  for (const slugDir of slugDirs) {
    const meta = await getPostMeta(slugDir);
    if (meta && meta.slug === slug) {
      const content = await getPostContent(slugDir, locale, config.defaultLocale as Locale);
      if (!content) return null;

      const summary = localizePostMeta(meta, locale, config);
      return { ...summary, content };
    }
  }

  return null;
}

/**
 * 获取所有文章 slugs（用于 generateStaticParams）
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const slugDirs = await getPostSlugs();
  const slugs: string[] = [];

  for (const slugDir of slugDirs) {
    const meta = await getPostMeta(slugDir);
    if (meta) {
      slugs.push(meta.slug);
    }
  }

  return slugs;
}

