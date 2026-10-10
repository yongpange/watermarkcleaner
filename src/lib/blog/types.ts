/**
 * 博客系统类型定义
 */

export type Locale = "en" | "zh" | "es" | "ar" | "ru" | "fr" | "ko";

export interface LocalizedString {
  en: string;
  zh?: string;
  es?: string;
  ar?: string;
  ru?: string;
  fr?: string;
  ko?: string;
}

export interface LocalizedStringArray {
  en: string[];
  zh?: string[];
  es?: string[];
  ar?: string[];
  ru?: string[];
  fr?: string[];
  ko?: string[];
}

export interface Category {
  id: string;
  name: LocalizedString;
}

export interface Author {
  id: string;
  name: LocalizedString;
  avatar?: string;
}

export interface BlogConfig {
  categories: Category[];
  authors: Author[];
  defaultLocale: Locale;
  supportedLocales: Locale[];
}

export interface PostMeta {
  slug: string;
  category: string;
  author: string;
  publishDate: string;
  readTime?: number;
  readingTime?: number;
  featured?: boolean;
  coverImage?: string;
  image?: string;
  tags: LocalizedStringArray;
  title: LocalizedString;
  description: LocalizedString;
}

export interface Post {
  meta: PostMeta;
  content: string;
}

export interface LocalizedPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  author: string;
  authorName: string;
  authorAvatar?: string;
  publishDate: string;
  readTime: number;
  featured?: boolean;
  coverImage?: string;
  tags: string[];
  content: string;
}

export interface LocalizedPostSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  author: string;
  authorName: string;
  authorAvatar?: string;
  publishDate: string;
  readTime: number;
  featured?: boolean;
  coverImage?: string;
  tags: string[];
}

