import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import "@/components/markdown/markdown.css";
import "./blog-post.css";
import BlogBreadcrumb from "@/components/blocks/blog/breadcrumb";
import TableOfContents from "@/components/blocks/blog/table-of-contents";
import RelatedPosts from "@/components/blocks/blog/related-posts";
import ShareButtons from "@/components/blocks/blog/share-buttons";
import BlogJsonLd, { BreadcrumbJsonLd } from "@/components/blocks/blog/blog-jsonld";
import MDXRenderer from "@/components/markdown/mdx-renderer";
import { getPostBySlug, getAllPostSlugs, getAllPosts, type Locale } from "@/lib/blog";
import { locales } from "@/i18n/locale";
import { ReadingProgress, BackToTop, SmoothScroll, CopyCodeButton } from "./client-features";

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  // 生成所有 locale + slug 组合以确保静态生成
  return slugs.flatMap((slug) =>
    locales.map((locale) => ({ slug, locale }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string } > }): Promise<Metadata> {
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string } > }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("blog");

  // 从 content 目录获取文章
  const post = await getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  // 根据 locale 格式化日期
  const formattedDate = new Date(post.publishDate).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  // 获取相关文章（同分类的其他文章）
  const allPosts = await getAllPosts(locale);
  const relatedPosts = allPosts.filter(p => p.category === post.category && p.slug !== slug).slice(0, 3);

  return (
    <>
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

      {/* 阅读进度条 */}
      <ReadingProgress />
      <SmoothScroll />
      <CopyCodeButton />

      <article className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background via-primary/5 to-secondary/10 relative overflow-hidden"
        style={{
          '--primary': 'hsl(var(--primary))',
          '--secondary': 'hsl(var(--secondary))',
          '--primary-foreground': 'hsl(var(--primary-foreground))'
        } as React.CSSProperties}
      >
        {/* 装饰性背景元素 */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* 面包屑导航 */}
            <div className="mb-8 animate-fade-in-up">
              <BlogBreadcrumb currentPage={post.title} />
            </div>

            {/* 文章头部信息 */}
            <div className="text-center animate-fade-in-up animation-delay-200">
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
                  {post.categoryName}
                </span>
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("min_read", { minutes: post.readTime })}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight"
                style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--primary) / 0.8, var(--primary) / 0.6)' }}
              >
                {post.title}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                {post.description}
              </p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-primary font-medium text-xs">{post.authorName.charAt(0)}</span>
                  </div>
                  <span>{t("by_author", { author: post.authorName })}</span>
                </div>
                <span className="text-muted-foreground/50">•</span>
                <time className="text-muted-foreground" dateTime={post.publishDate}>
                  {formattedDate}
                </time>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16 content-section">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <article className="prose prose-lg max-w-none">
                {/* MDX content rendering with component support */}
                <MDXRenderer content={post.content} />
              </article>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                {/* Table of Contents */}
                <div className="table-of-contents-enhanced rounded-xl p-6 shadow-sm border">
                  <TableOfContents content={post.content} />
                </div>

                {/* Article Info Card */}
                <div className="article-info-card bg-secondary/50 rounded-xl p-6 space-y-4 shadow-sm border">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Article Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <span className="text-xs">Author</span>
                        <p className="font-medium text-foreground">{post.authorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-xs">Read time</span>
                        <p className="font-medium text-foreground">{post.readTime} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <span className="text-xs">Published</span>
                        <p className="font-medium text-foreground">{formattedDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="bg-background rounded-xl p-6 shadow-sm border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share Article
                  </h3>
                  <ShareButtons
                    title={post.title}
                    url={`${process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com"}/${locale}/blog/${slug}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <RelatedPosts
        currentPostSlug={slug}
        posts={relatedPosts}
        locale={locale}
      />

      {/* Navigation */}
      <section className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Link
              href="/blog"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              {t("back_to_blog")}
            </Link>
          </div>
        </div>
      </section>
    </article>

      {/* 返回顶部按钮 */}
      <BackToTop />
    </>
  );
}