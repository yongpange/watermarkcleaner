import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import "@/components/markdown/markdown.css";
import BlogBreadcrumb from "@/components/blocks/blog/breadcrumb";
import TableOfContents from "@/components/blocks/blog/table-of-contents";
import RelatedPosts from "@/components/blocks/blog/related-posts";
import ShareButtons from "@/components/blocks/blog/share-buttons";
import BlogJsonLd, { BreadcrumbJsonLd } from "@/components/blocks/blog/blog-jsonld";
import MDXRenderer from "@/components/markdown/mdx-renderer";
import { getPostBySlug, getAllPostSlugs, getAllPosts, type Locale } from "@/lib/blog";
import { locales } from "@/i18n/locale";

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

      <article className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        {/* Hero Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* 面包屑导航 */}
            <BlogBreadcrumb currentPage={post.title} />

            {/* 文章头部信息 */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {post.categoryName}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t("min_read", { minutes: post.readTime })}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {post.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {post.description}
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>{t("by_author", { author: post.authorName })}</span>
                <span>•</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
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
                <TableOfContents content={post.content} />

                {/* Article Info Card */}
                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Article Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Author:</span>
                      <span>{post.authorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Read time:</span>
                      <span>{post.readTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published:</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Share Buttons */}
                <ShareButtons
                  title={post.title}
                  url={`${process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com"}/${locale}/blog/${slug}`}
                />
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
    </>
  );
}