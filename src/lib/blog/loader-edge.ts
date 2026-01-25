/**
 * Edge-compatible 博客加载器
 * 使用预编译的静态数据，不依赖 Node.js fs/path 模块
 */

import type {
  Locale,
  BlogConfig,
  LocalizedPost,
  LocalizedPostSummary,
} from "./types";

// 动态导入预编译的数据（在构建时会被内联）
let cachedBlogData: any = null;

async function getBlogData() {
  if (cachedBlogData) {
    return cachedBlogData;
  }
  
  try {
    // 使用动态 import 来加载预编译的数据
    const data = await import('./generated/blog-data.json');
    cachedBlogData = data.default || data;
    return cachedBlogData;
  } catch (error) {
    console.error('Failed to load pre-built blog data:', error);
    return {
      config: {
        categories: [],
        authors: [],
        defaultLocale: 'en',
        supportedLocales: ['en', 'zh'],
      },
      posts: {},
      slugs: [],
    };
  }
}

/**
 * 获取博客全局配置
 */
export async function getBlogConfig(): Promise<BlogConfig> {
  const data = await getBlogData();
  return data.config;
}

/**
 * 本地化文章元数据
 */
function localizePostMeta(
  meta: any,
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
    readTime: meta.readTime,
    featured: meta.featured,
    coverImage: meta.coverImage,
    tags: meta.tags[locale] || meta.tags.en,
  };
}

/**
 * 获取所有文章摘要（用于列表页）
 */
export async function getAllPosts(locale: Locale): Promise<LocalizedPostSummary[]> {
  const data = await getBlogData();
  const config = data.config;
  const posts: LocalizedPostSummary[] = [];

  for (const slug of data.slugs) {
    const post = data.posts[slug];
    if (post?.meta) {
      posts.push(localizePostMeta(post.meta, locale, config));
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
  const data = await getBlogData();
  const config = data.config;
  const post = data.posts[slug];

  if (!post?.meta) {
    return null;
  }

  // 获取内容，优先使用当前语言，fallback 到默认语言
  const content = post.content[locale] || post.content[config.defaultLocale] || post.content.en;
  
  if (!content) {
    return null;
  }

  const summary = localizePostMeta(post.meta, locale, config);
  return { ...summary, content };
}

/**
 * 获取所有文章 slugs（用于 generateStaticParams）
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const data = await getBlogData();
  return data.slugs || [];
}
