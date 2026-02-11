// Blog posts use Edge Runtime with pre-compiled data
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import BlogJsonLd, { BreadcrumbJsonLd } from "@/components/blocks/blog/blog-jsonld";
import MDXRenderer from "@/components/markdown/mdx-renderer";
import { getPostBySlug, type Locale } from "@/lib/blog";
import { SmoothScroll, CopyCodeButton } from "./client-features";
import "./retro-tech-blog.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;

  const post = await getPostBySlug(slug, locale);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";
  const postUrl = `${siteUrl}/${locale}/blog/${slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags.join(", "),
    authors: [{ name: post.authorName }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: locale,
      publishedTime: post.publishDate,
      authors: [post.authorName],
      url: postUrl,
      siteName: "WatermarkCleaner",
      ...(post.coverImage && {
        images: [
          {
            url: `${siteUrl}${post.coverImage}`,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      creator: "@watermarkcleaner",
      ...(post.coverImage && {
        images: [`${siteUrl}${post.coverImage}`],
      }),
    },
    alternates: {
      canonical: postUrl,
      languages: {
        en: `${siteUrl}/en/blog/${slug}`,
        zh: `${siteUrl}/zh/blog/${slug}`,
      },
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("blog");

  // 从 content 目录获取文章
  const post = await getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Syncopate:wght@400;700&display=swap" rel="stylesheet" />

      {/* SEO - JSON-LD Structured Data */}
      <BlogJsonLd
        type="article"
        title={post.title}
        description={post.description}
        url={`${process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com"}/${locale}/blog/${slug}`}
        publishDate={post.publishDate}
        authorName={post.authorName}
        imageUrl={post.coverImage}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com"}/${locale}` },
          { name: "Blog", url: `${process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com"}/${locale}/blog` },
          { name: post.title, url: `${process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com"}/${locale}/blog/${slug}` },
        ]}
      />

      <SmoothScroll />
      <CopyCodeButton />

      <div className="retro-tech-blog">
        {/* Grid Background */}
        <div className="grid-bg"></div>

        {/* Navigation */}
        <nav>
          <div className="logo">WatermarkCleaner</div>
          <ul className="nav-links">
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/">Research</Link></li>
            <li><Link href="/">About</Link></li>
          </ul>
        </nav>

        {/* Hero Section */}
        <header className="hero">
          <div className="hero-label">Technical Research</div>
          <h1 className="hero-title">{post.title}</h1>
          <p className="hero-subtitle">{post.description}</p>

          {/* Stats Grid - 固定统计数据 */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">+9.42 dB</div>
              <div className="stat-label">PSNR Improvement</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">32.66 dB</div>
              <div className="stat-label">MPRNet Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0.959</div>
              <div className="stat-label">SSIM Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">191×191</div>
              <div className="stat-label">Max Kernel</div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="content-wrapper markdown-content">
          <MDXRenderer content={post.content} />
        </main>

        {/* Footer */}
        <footer>
          <p>© {new Date().getFullYear()} WatermarkCleaner Research. All rights reserved.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            <Link href="/blog" style={{ color: 'var(--text-muted)' }}>← Back to Blog</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
