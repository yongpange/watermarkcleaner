#!/usr/bin/env node
/**
 * 博客内容预编译脚本
 * 在构建时运行，将所有博客内容编译成静态 JSON 文件
 * 这样页面组件就不需要在运行时使用 fs/path 模块
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'lib', 'blog', 'generated');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 读取博客配置
 */
function readBlogConfig() {
  const configPath = path.join(CONTENT_DIR, '_index.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return {
    categories: [],
    authors: [],
    defaultLocale: 'en',
    supportedLocales: ['en', 'zh'],
  };
}

/**
 * 获取所有文章目录
 */
function getPostDirs() {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }
  return fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
    .map(entry => entry.name);
}

/**
 * 读取文章元数据
 */
function readPostMeta(slugDir) {
  const metaPath = path.join(CONTENT_DIR, slugDir, 'index.json');
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }
  return null;
}

/**
 * 读取文章内容
 */
function readPostContent(slugDir, locale, defaultLocale) {
  const localePath = path.join(CONTENT_DIR, slugDir, `${locale}.mdx`);
  if (fs.existsSync(localePath)) {
    return fs.readFileSync(localePath, 'utf-8');
  }
  
  // Fallback to default locale
  if (locale !== defaultLocale) {
    const defaultPath = path.join(CONTENT_DIR, slugDir, `${defaultLocale}.mdx`);
    if (fs.existsSync(defaultPath)) {
      return fs.readFileSync(defaultPath, 'utf-8');
    }
  }
  
  return null;
}

/**
 * 主函数：预编译所有博客数据
 */
function prebuildBlog() {
  console.log('🔄 Pre-building blog content...');
  
  const config = readBlogConfig();
  const postDirs = getPostDirs();
  const locales = config.supportedLocales || ['en', 'zh'];
  
  // 收集所有文章数据
  const posts = {};
  const summaries = {};
  
  for (const slugDir of postDirs) {
    const meta = readPostMeta(slugDir);
    if (!meta) continue;
    
    const slug = meta.slug;
    posts[slug] = { meta, content: {} };
    
    // 读取每个语言版本的内容
    for (const locale of locales) {
      const content = readPostContent(slugDir, locale, config.defaultLocale);
      if (content) {
        posts[slug].content[locale] = content;
      }
    }
  }
  
  // 生成预编译的数据文件
  const outputData = {
    config,
    posts,
    slugs: Object.keys(posts),
    generatedAt: new Date().toISOString(),
  };
  
  // 写入 JSON 文件
  const outputPath = path.join(OUTPUT_DIR, 'blog-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  // 生成 TypeScript 导出文件
  const tsContent = `/**
 * 预编译的博客数据
 * 自动生成，请勿手动修改
 * 生成时间: ${new Date().toISOString()}
 */

import blogData from './blog-data.json';

export const blogConfig = blogData.config;
export const blogPosts = blogData.posts;
export const blogSlugs = blogData.slugs;
export const generatedAt = blogData.generatedAt;

export default blogData;
`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), tsContent);
  
  console.log(`✅ Pre-built ${Object.keys(posts).length} blog posts`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

// 运行预编译
prebuildBlog();
