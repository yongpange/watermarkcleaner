import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import "@/components/markdown/markdown.css";
import BlogBreadcrumb from "@/components/blocks/blog/breadcrumb";
import { getPostBySlug, getAllPostSlugs, type Locale } from "@/lib/blog";
import { locales } from "@/i18n/locale";

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  // 生成所有 locale + slug 组合以确保静态生成
  return slugs.flatMap((slug) =>
    locales.map((locale) => ({ slug, locale }))
  );
}

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

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags.join(", "),
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: locale,
      publishedTime: post.publishDate,
      authors: [post.authorName],
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

  // 根据 locale 格式化日期
  const formattedDate = new Date(post.publishDate).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  return (
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
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              {/* MDX content rendering with image support */}
              <div
                className="markdown-content"
                data-locale={locale}
                dangerouslySetInnerHTML={{
                  __html: post.content
                    .replace(/^#\s+(.+)$/gm, '<h1 class="text-4xl font-bold mb-6 text-primary">$1</h1>')
                    .replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8 text-primary/80">$1</h2>')
                    .replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-semibold mb-3 mt-6 text-primary/70">$1</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-primary">$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em class="italic text-primary/80">$1</em>')
                    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-foreground">')
                    .replace(/^(.+)$/gm, '<p class="mb-4 leading-relaxed text-foreground">$1</p>')
                    .replace(/<p class="mb-4 leading-relaxed text-foreground"><h1/g, '<h1')
                    .replace(/<\/h1><\/p>/g, '</h1>')
                    .replace(/<p class="mb-4 leading-relaxed text-foreground"><h2/g, '<h2')
                    .replace(/<\/h2><\/p>/g, '</h2>')
                    .replace(/<p class="mb-4 leading-relaxed text-foreground"><h3/g, '<h3')
                    .replace(/<\/h3><\/p>/g, '</h3>')
                    // Handle Markdown images: ![alt text](image-url)
                    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="w-full my-6"><img src="$2" alt="$1" class="blog-image w-full h-auto max-w-[1920px] mx-auto rounded-lg shadow-md" loading="lazy" /></div>')
                }}
              />
            </div>
          </div>
        </div>
      </section>

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
  );
}